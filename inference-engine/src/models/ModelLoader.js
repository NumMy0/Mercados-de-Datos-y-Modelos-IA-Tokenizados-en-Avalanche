const ort = require('onnxruntime-node');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class ModelLoader {
  constructor(config) {
    this.config = config;
    this.loadedModels = new Map(); // modelId -> {session, metadata, loadedAt}
    this.maxModels = config.maxModelsInMemory || 3;
    this.modelDir = config.modelDir || './models';
  }

  /**
   * Carga un modelo desde archivo o buffer
   * @param {string} modelId - Identificador único del modelo
   * @param {string|Buffer} modelSource - Ruta al archivo o buffer del modelo
   * @param {Object} metadata - Metadata del modelo
   * @returns {Promise<Object>} Sesión de inferencia cargada
   */
  async loadModel(modelId, modelSource, metadata) {
    try {
      // Verificar si ya está cargado
      if (this.loadedModels.has(modelId)) {
        logger.info(`Model ${modelId} already loaded, returning cached version`);
        return this.loadedModels.get(modelId);
      }

      // Verificar límite de modelos
      if (this.loadedModels.size >= this.maxModels) {
        await this.evictLeastRecentlyUsed();
      }

      const startTime = Date.now();
      logger.info(`Loading model ${modelId}...`);

      // Cargar modelo según tipo de source
      let modelBuffer;
      if (Buffer.isBuffer(modelSource)) {
        modelBuffer = modelSource;
      } else if (typeof modelSource === 'string') {
        const modelPath = path.isAbsolute(modelSource) 
          ? modelSource 
          : path.join(this.modelDir, modelSource);
        
        // Validar existencia del archivo
        await this.validateModelFile(modelPath);
        modelBuffer = await fs.readFile(modelPath);
      } else {
        throw new Error('Invalid model source: must be path string or Buffer');
      }

      // Validar formato ONNX
      this.validateOnnxFormat(modelBuffer);

      // Crear sesión de inferencia
      const session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['cpu'], // Por ahora solo CPU
        graphOptimizationLevel: 'all',
        enableCpuMemArena: true,
      });

      // Validar metadata del modelo
      this.validateMetadata(metadata, session);

      // Guardar en caché
      const modelData = {
        session,
        metadata: {
          ...metadata,
          inputNames: session.inputNames,
          outputNames: session.outputNames,
        },
        loadedAt: Date.now(),
        lastUsedAt: Date.now(),
        inferenceCount: 0,
      };

      this.loadedModels.set(modelId, modelData);

      const loadTime = Date.now() - startTime;
      logger.info(`Model ${modelId} loaded successfully in ${loadTime}ms`);

      return modelData;

    } catch (error) {
      logger.error(`Failed to load model ${modelId}:`, error);
      throw new Error(`Model loading failed: ${error.message}`);
    }
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
  async clearAll() {
    logger.info('Clearing all models from memory...');
    const modelIds = Array.from(this.loadedModels.keys());
    
    for (const modelId of modelIds) {
      await this.unloadModel(modelId);
    }
    
    logger.info('All models cleared');
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
      throw new Error('Invalid ONNX file: file too small');
    }
  }

  validateMetadata(metadata, session) {
    const required = ['model_type', 'input_shape'];
    for (const field of required) {
      if (!metadata[field]) {
        throw new Error(`Missing required metadata field: ${field}`);
      }
    }

    // Validar que input shape coincida con el modelo
    const modelInputs = session.inputNames;
    if (modelInputs.length === 0) {
      throw new Error('Model has no inputs defined');
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
      heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(used.external / 1024 / 1024) + ' MB',
    };
  }
}

module.exports = ModelLoader;