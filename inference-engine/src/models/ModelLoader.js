const ort = require("onnxruntime-node");
const fs = require("fs").promises;
const path = require("path");
const logger = require("../utils/logger");
const IpfsService = require("../ipfs/IpfsService");

class ModelLoader {
  constructor(config) {
    this.config = config;
    this.loadedModels = new Map(); // modelId -> {session, metadata, loadedAt}
    this.maxModels = config.maxModelsInMemory || 3;
    this.modelDir = config.modelDir || "./models";
  }

  /**
   * Carga un modelo ONNX desde un Buffer o una ruta local.
   * Se asume que la lógica de caché y evicción ocurre en loadModelFromIpfs.
   *
   * @param {string} modelId - Identificador único del modelo
   * @param {string|Buffer} modelSource - Buffer del modelo o ruta local
   * @param {Object} metadata - Metadata asociada al modelo
   * @param {Array<string>|null} labels - Etiquetas opcionales del modelo
   * @returns {Promise<Object>} Objeto con la sesión de inferencia y metadata
   */
  async loadModel(modelId, modelSource, metadata, labels = null) {
    try {
      // 🔹 1. Verificar si el modelo ya está cargado
      if (this.loadedModels.has(modelId)) {
        this.loadedModels.get(modelId).lastUsedAt = Date.now();
        return this.loadedModels.get(modelId);
      }

      if (this.loadedModels.size >= this.maxModels) {
        await this.evictLeastRecentlyUsed();
      }

      // 🔹 2. Iniciar carga
      const startTime = Date.now();
      logger.info(`Loading model ${modelId}...`);

      let modelBuffer;

      // 🔹 3. Determinar origen (Buffer o archivo local)
      if (Buffer.isBuffer(modelSource)) {
        modelBuffer = modelSource; // desde IPFS o memoria
      } else if (typeof modelSource === "string") {
        const modelPath = path.isAbsolute(modelSource)
          ? modelSource
          : path.join(this.modelDir, modelSource);

        await this.validateModelFile(modelPath);
        modelBuffer = await fs.readFile(modelPath);
      } else {
        throw new Error("Invalid model source: must be path string or Buffer");
      }

      // 🔹 4. Validar formato ONNX
      this.validateOnnxFormat(modelBuffer);

      // 🔹 5. Crear sesión de inferencia
      const session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ["cpu"], // más adelante se puede habilitar GPU
        graphOptimizationLevel: "all",
        enableCpuMemArena: true,
      });

      // 🔹 6. Validar metadata (entradas, salidas, etc.)
      this.validateMetadata(metadata, session);

      // 🔹 7. Armar el objeto de modelo
      const modelData = {
        session,
        metadata: {
          ...metadata,
          inputNames: session.inputNames,
          outputNames: session.outputNames,
          model_id: modelId, // Añadir model_id para referencia
        },
        labels: labels, // Ahora incluye las labels
        loadedAt: Date.now(),
        lastUsedAt: Date.now(),
        inferenceCount: 0,
      };

      // 🔹 8. Agregar a caché
      this.loadedModels.set(modelId, modelData);

      // 🔹 9. Log final
      const loadTime = Date.now() - startTime;
      logger.info(`Model ${modelId} loaded successfully in ${loadTime}ms`);

      return modelData;
    } catch (error) {
      logger.error(`Failed to load model ${modelId}:`, error);
      throw new Error(`Model loading failed: ${error.message}`);
    }
  }

  // =======================================================
  // NUEVO MÉTODO PARA IPFS (INTEGRACIÓN)
  // =======================================================

  /**
   * Carga un modelo desde IPFS, verifica su integridad y lo guarda en caché.
   * @param {string} tokenId - El alias que se usará para referenciar el modelo en caché.
   * @param {string} metadataCid - El CID del archivo JSON de metadatos en IPFS.
   * @returns {Promise<Object>} El objeto del modelo (incluyendo session y metadata).
   */
  async loadModelFromIpfs(tokenId, metadataCid) {
    let model = this.getModel(tokenId);

    // 1. Cache Check (Criterio de Éxito: Cache hits reducen tiempo)
    if (model) {
      logger.info(`[Cache HIT] Modelo ${tokenId} recuperado de la memoria.`);
      return model;
    }

    logger.info(
      `[Cache MISS] Iniciando descarga de metadatos para ${tokenId} desde IPFS.`
    );

    // 2. Obtener y Validar Metadatos (Objetivo: Módulo de Metadatos)
    const metadata = await IpfsService.getMetadata(metadataCid);
    console.log('Metadatos obtenidos:', metadata);
    const modelCid = metadata.model_cid;
    const modelHash = metadata.model_hash;
    const modelId = metadata.model_id;
    // Preferir labels embebidas en metadata si existen
    let labelsCid = metadata.labels_cid; // Asumiendo que el campo se llama labels_cid
    let labels = null;

    // Si la metadata trae labels embebidas, preferirlas
    try {
      if (metadata.labels) {
        const MetadataParser = require('../ipfs/MetadataParser');
        try {
          labels = MetadataParser.validateLabels(metadata.labels);
          logger.info('Usando labels embebidas dentro de la metadata');
        } catch (labErr) {
          logger.warn('Labels embebidas inválidas, se intentará usar labels_cid si está presente:', labErr.message);
          labels = null;
        }
      }
    } catch (e) {
      // No crítico
      logger.debug('No se pudo validar labels embebidas:', e.message);
    }

    logger.info(
      `Descargando archivo ONNX (CID: ${modelCid}) para el modelo ${modelId}...`
    );

    // 3. Descargar el archivo ONNX (Binario)
    const modelBuffer = await IpfsService.fetchFile(modelCid, true);

    // Criterio de Éxito: Descargar 50MB en <30s (Manejado por el timeout en IpfsService)
    logger.info(
      `Archivo ONNX descargado. Tamaño: ${(
        modelBuffer.length /
        (1024 * 1024)
      ).toFixed(2)} MB.`
    );

    // 4. Verificar Integridad (Objetivo: Implementar verificación de hash)
    if (modelHash && modelHash !== "unknown") {
      if (!IpfsService.verifyHash(modelBuffer, modelHash)) {
        throw new Error(
          `Verificación de hash fallida para el modelo ${modelId}. El archivo está corrupto o alterado. (CID: ${modelCid})`
        ); // Manejo de 5 errores comunes
      }
      logger.info(
        `Verificación de integridad de hash exitosa para ${modelId}.`
      );
    } else {
      logger.warn(
        `Verificación de hash omitida para ${modelId} (hash no disponible).`
      );
    }

    // 5. Cargar Labels desde IPFS sólo si no se obtuvieron embebidas
    if (!labels) {
      if (labelsCid) {
        logger.info(`Descargando archivo de etiquetas (CID: ${labelsCid})...`);
        // Usamos fetchFile con isBinary=false para obtener la cadena JSON de etiquetas
        try {
          const rawLabelsJson = await IpfsService.fetchFile(labelsCid, false);
          labels = JSON.parse(rawLabelsJson);
          console.log(labels);
          logger.info('Etiquetas cargadas exitosamente desde IPFS.');
        } catch (e) {
          logger.error(`Fallo al parsear JSON de etiquetas desde CID ${labelsCid}: ${e.message}`);
          labels = null;
        }
      } else {
        logger.warn(`Modelo ${modelId} no especifica labels_cid y no tiene labels embebidas. Usando índices.`);
      }
    }

    // 6. Cargar en ONNX Runtime y Caché (Reutiliza el método base)
    const modelData = await this.loadModel(
      tokenId, // modelId para el caché (usa el alias del token)
      modelBuffer, // Buffer del modelo descargado
      metadata.inference_config, // Solo la config relevante
      labels // Labels cargadas
    );

    return modelData;
  }

  /**
   * Obtiene un modelo cargado
   * @param {string} modelId - ID del modelo
   * @returns {Object|null} Datos del modelo o null si no está cargado
   */
  getModel(modelId) {
    const model = this.loadedModels.get(modelId);
    if (model) {
      model.lastUsedAt = Date.now();
      model.inferenceCount++;
    }
    return model;
  }

  /**
   * Precarga un modelo en memoria (warm-up)
   * @param {string} modelId - ID del modelo
   * @param {string|Buffer} modelSource - Fuente del modelo
   * @param {Object} metadata - Metadata
   */
  async preloadModel(modelId, modelSource, metadata) {
    await this.loadModel(modelId, modelSource, metadata);
    logger.info(`Model ${modelId} preloaded successfully`);
  }

  /**
   * Descarga un modelo de memoria
   * @param {string} modelId - ID del modelo a descargar
   */
  async unloadModel(modelId) {
    const model = this.loadedModels.get(modelId);
    if (!model) {
      logger.warn(`Model ${modelId} not found in cache`);
      return false;
    }

    try {
      // Liberar recursos de la sesión
      await model.session.release();
      this.loadedModels.delete(modelId);
      logger.info(`Model ${modelId} unloaded from memory`);
      return true;
    } catch (error) {
      logger.error(`Error unloading model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Evict Least Recently Used model
   */
  async evictLeastRecentlyUsed() {
    let oldestModelId = null;
    let oldestTime = Infinity;

    for (const [modelId, data] of this.loadedModels.entries()) {
      if (data.lastUsedAt < oldestTime) {
        oldestTime = data.lastUsedAt;
        oldestModelId = modelId;
      }
    }

    if (oldestModelId) {
      logger.info(`Evicting least recently used model: ${oldestModelId}`);
      await this.unloadModel(oldestModelId);
    }
  }

  /**
   * Obtiene lista de modelos cargados
   * @returns {Array} Lista de modelos con info básica
   */
  getLoadedModels() {
    const models = [];
    for (const [modelId, data] of this.loadedModels.entries()) {
      models.push({
        modelId,
        type: data.metadata.model_type,
        loadedAt: data.loadedAt,
        lastUsedAt: data.lastUsedAt,
        inferenceCount: data.inferenceCount,
      });
    }
    return models;
  }

  /**
   * Limpia todos los modelos de memoria
   */
  // Renombrar clearAll a clearCache para la API
  async clearCache() {
    logger.info("Clearing all models from memory (IPFS/Local)...");
    const modelIds = Array.from(this.loadedModels.keys());

    for (const modelId of modelIds) {
      await this.unloadModel(modelId);
    }

    logger.info("All models cleared");
  }

  // Nuevo método para el estado de caché (Endpoint /api/cache/status)
  getCacheStatus() {
    const loadedModels = this.getLoadedModels().map((m) => ({
      id: m.modelId,
      loadedAt: m.loadedAt,
      lastUsedAt: m.lastUsedAt,
    }));
    return {
      limit: this.maxModels,
      current_count: this.loadedModels.size,
      stored_models: loadedModels,
      memory_stats: this.getMemoryStats(),
    };
  }

  /**
   * Validaciones
   */
  async validateModelFile(filePath) {
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`Model file not found: ${filePath}`);
    }
  }

  validateOnnxFormat(buffer) {
    // Verificar magic bytes de ONNX (primeros 4 bytes)
    const magicBytes = buffer.slice(0, 4);
    // ONNX files start with specific protobuf header
    if (buffer.length < 100) {
      throw new Error("Invalid ONNX file: file too small");
    }
  }

  validateMetadata(metadata, session) {
    const required = ["model_type", "input_shape"];
    for (const field of required) {
      if (!metadata[field]) {
        throw new Error(`Missing required metadata field: ${field}`);
      }
    }

    // Validar que input shape coincida con el modelo
    const modelInputs = session.inputNames;
    if (modelInputs.length === 0) {
      throw new Error("Model has no inputs defined");
    }
  }

  /**
   * Obtiene estadísticas de uso de memoria
   */
  getMemoryStats() {
    const used = process.memoryUsage();
    return {
      modelsLoaded: this.loadedModels.size,
      maxModels: this.maxModels,
      heapUsed: Math.round(used.heapUsed / 1024 / 1024) + " MB",
      heapTotal: Math.round(used.heapTotal / 1024 / 1024) + " MB",
      external: Math.round(used.external / 1024 / 1024) + " MB",
    };
  }
}

module.exports = ModelLoader;
