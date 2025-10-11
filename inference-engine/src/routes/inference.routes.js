const express = require("express");
const router = express.Router();
const ModelLoader = require("../models/ModelLoader");
const InferenceEngine = require("../inference/InferenceEngine");
const PreprocessorFactory = require("../preprocessing/PreprocessorFactory");
const ClassificationPostprocessor = require("../postprocessing/ClassificationPostprocessor");
const logger = require("../utils/logger");

// Inicializar componentes
const config = require("../config/config");
const modelLoader = new ModelLoader(config);
const inferenceEngine = new InferenceEngine(config);
const preprocessorFactory = new PreprocessorFactory();

/**
 * POST /api/inference/execute
 * Ejecuta inferencia con el nuevo formato de payload estándar:
 * {
 *   "model_id": "mi_mobilenet_cache",
 *   "execution_mode": "sync",
 *   "input_data": {
 *     "format": "base64_jpeg",
 *     "content": "/9j/4AAQSkZJ..."
 *   },
 *   "options": {
 *     "top_k": 5,
 *     "threshold": 0.5,
 *     "timeout": 30000
 *   }
 * }
 */
router.post("/execute", async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      model_id,
      execution_mode = "sync",
      input_data,
      options = {},
    } = req.body;

    // Validación del payload
    if (!model_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: model_id",
        required_format: "model_id debe ser el alias cargado en caché",
      });
    }

    if (!input_data) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: input_data",
        required_format: {
          input_data: {
            format: "base64_jpeg|raw_text|base64_wav|etc",
            content: "data_content",
          },
        },
      });
    }

    // Validar estructura de input_data
    const validation = preprocessorFactory.validateInputData(input_data);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid input_data format",
        details: validation.errors,
        supported_formats: preprocessorFactory.getSupportedFormats(),
      });
    }

    // Verificar modo de ejecución (futuro: async)
    if (execution_mode !== "sync") {
      return res.status(400).json({
        success: false,
        error: "Only sync execution_mode is currently supported",
        supported_modes: ["sync"],
      });
    }

    // 1. Obtener modelo cargado (Cache Hit/Miss)
    let modelData = modelLoader.getModel(model_id);

    if (!modelData) {
      return res.status(404).json({
        success: false,
        error: `Model ${model_id} not loaded in cache`,
        suggestion: "Use /api/models/load endpoint first to fetch it from IPFS",
        model_id,
      });
    }

    // 2. Preprocessing usando el nuevo factory
    let processedTensor;

    try {
      processedTensor = await preprocessorFactory.process(
        input_data,
        modelData.metadata
      );
    } catch (preprocessError) {
      return res.status(400).json({
        success: false,
        error: "Preprocessing failed",
        details: preprocessError.message,
        input_format: input_data.format,
      });
    }

    // 3. Ejecutar inferencia
    const inferenceOptions = {
      timeout: options.timeout || 30000,
    };

    const inferenceResult = await inferenceEngine.infer(
      modelData,
      processedTensor,
      inferenceOptions
    );

    // 4. Postprocessing
    const labels = modelData.labels;
    const postprocessor = new ClassificationPostprocessor(labels);

    const predictions = postprocessor.process(inferenceResult.output, {
      top_k: options.top_k || 5,
      threshold: options.threshold || 0,
    });

    // 5. Calcular métricas adicionales
    const metrics = postprocessor.calculateMetrics(predictions);
    const totalTime = Date.now() - startTime;

    // 6. Respuesta en formato estándar
    res.json({
      success: true,
      model_id,
      execution_mode,
      results: {
        predictions,
        metrics,
      },
      performance: {
        total_time_ms: totalTime,
        inference_time_ms: inferenceResult.executionTime,
        preprocessing_time_ms: totalTime - inferenceResult.executionTime,
      },
      metadata: {
        input_format: input_data.format,
        model_type: modelData.metadata.model_type,
        timestamp: new Date().toISOString(),
      },
    });

    logger.info(
      `Inference completed for ${model_id}: ${totalTime}ms (format: ${input_data.format})`
    );
  } catch (error) {
    logger.error("Inference request failed:", error);

    const totalTime = Date.now() - startTime;

    res.status(500).json({
      success: false,
      error: "Internal inference error",
      details: error.message,
      execution_time_ms: totalTime,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/inference/formats
 * Obtiene información sobre formatos de entrada soportados
 */
router.get("/formats", (req, res) => {
  try {
    const supportedFormats = preprocessorFactory.getSupportedFormats();

    res.json({
      success: true,
      supported_formats: supportedFormats,
      payload_example: {
        model_id: "mi_mobilenet_cache",
        execution_mode: "sync",
        input_data: {
          format: "base64_jpeg",
          content: "/9j/4AAQSkZJ...",
        },
        options: {
          top_k: 5,
          threshold: 0.5,
          timeout: 30000,
        },
      },
      description:
        "Use POST /api/inference/execute with the payload_example format",
    });
  } catch (error) {
    logger.error("Failed to get supported formats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/inference/models/loaded
 * Lista modelos actualmente cargados en memoria
 */
router.get("/models/loaded", (req, res) => {
  try {
    const loadedModels = modelLoader.getLoadedModels();
    const memoryStats = modelLoader.getMemoryStats();

    res.json({
      success: true,
      models: loadedModels,
      count: loadedModels.length,
      memory: memoryStats,
    });
  } catch (error) {
    logger.error("Failed to get loaded models:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/inference/preload
 * MODIFICADO para usar la lógica IPFS (se recomienda usar /api/models/load)
 */
router.post("/preload", async (req, res) => {
  try {
    // Reemplaza model_path y metadata por tokenId y metadataCid
    const { tokenId, metadataCid, warmup = false } = req.body;

    if (!tokenId || !metadataCid) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: tokenId and metadataCid",
      });
    }

    const startTime = Date.now();
    // Usa el nuevo método de IPFS
    const modelData = await modelLoader.loadModelFromIpfs(tokenId, metadataCid);

    // Opcional: warm-up
    if (warmup) {
      await inferenceEngine.warmUp(modelData); // Asumo que warmUp existe en InferenceEngine
    }

    const loadTime = Date.now() - startTime;

    res.json({
      success: true,
      message: `Model ${tokenId} preloaded from IPFS and cached successfully`,
      load_time_ms: loadTime,
      model_id: tokenId,
    });
  } catch (error) {
    logger.error("Preload failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/inference/models/:model_id
 * Descarga un modelo de memoria
 */
router.delete("/models/:model_id", async (req, res) => {
  try {
    const { model_id } = req.params;

    const unloaded = await modelLoader.unloadModel(model_id);

    if (unloaded) {
      res.json({
        success: true,
        message: `Model ${model_id} unloaded successfully`,
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Model ${model_id} not found`,
      });
    }
  } catch (error) {
    logger.error("Unload failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/inference/status
 * Estado general del servicio
 */
router.get("/status", (req, res) => {
  try {
    const memoryStats = modelLoader.getMemoryStats();
    const inferenceStats = inferenceEngine.getStats();
    const loadedModels = modelLoader.getLoadedModels();

    res.json({
      success: true,
      status: "operational",
      uptime: process.uptime(),
      memory: memoryStats,
      inference: inferenceStats,
      models: {
        loaded: loadedModels.length,
        max_capacity: config.maxModelsInMemory,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Status check failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/inference/batch
 * Inferencia en batch (múltiples inputs) con formato estándar
 * {
 *   "model_id": "mi_mobilenet_cache",
 *   "execution_mode": "sync",
 *   "input_data_list": [
 *     { "format": "base64_jpeg", "content": "..." },
 *     { "format": "base64_png", "content": "..." }
 *   ],
 *   "options": { "top_k": 5 }
 * }
 */
router.post("/batch", async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      model_id,
      execution_mode = "sync",
      input_data_list,
      options = {},
    } = req.body;

    // Validaciones básicas
    if (!model_id || !input_data_list || !Array.isArray(input_data_list)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid fields: model_id, input_data_list (array)",
        required_format: {
          model_id: "string",
          input_data_list: [{ format: "base64_jpeg", content: "..." }],
        },
      });
    }

    // Límite de batch
    if (input_data_list.length > 10) {
      return res.status(400).json({
        success: false,
        error: "Batch size too large (max 10)",
        provided_size: input_data_list.length,
      });
    }

    if (execution_mode !== "sync") {
      return res.status(400).json({
        success: false,
        error: "Only sync execution_mode is currently supported",
      });
    }

    // Validar que el modelo esté cargado
    const modelData = modelLoader.getModel(model_id);
    if (!modelData) {
      return res.status(404).json({
        success: false,
        error: `Model ${model_id} not loaded in cache`,
      });
    }

    // Procesar cada input_data
    const processedTensors = [];
    const processingErrors = [];

    for (let i = 0; i < input_data_list.length; i++) {
      const inputData = input_data_list[i];

      try {
        // Validar estructura de cada input_data
        const validation = preprocessorFactory.validateInputData(inputData);
        if (!validation.isValid) {
          processingErrors.push({
            index: i,
            errors: validation.errors,
          });
          continue;
        }

        const tensor = await preprocessorFactory.process(
          inputData,
          modelData.metadata
        );
        processedTensors.push({ index: i, tensor, format: inputData.format });
      } catch (error) {
        processingErrors.push({
          index: i,
          error: error.message,
          format: inputData.format,
        });
      }
    }

    // Si hay errores de preprocessing, reportarlos
    if (processingErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Preprocessing failed for some inputs",
        processing_errors: processingErrors,
        successful_count: processedTensors.length,
        failed_count: processingErrors.length,
      });
    }

    // Inferencia en batch
    const tensorList = processedTensors.map((item) => item.tensor);
    const batchResult = await inferenceEngine.inferBatch(
      modelData,
      tensorList,
      { timeout: options.timeout }
    );

    // Postprocessing de cada resultado
    const labels = modelData.labels;
    const postprocessor = new ClassificationPostprocessor(labels);

    const allPredictions = batchResult.results.map((result, index) => ({
      index: processedTensors[index].index,
      format: processedTensors[index].format,
      predictions: postprocessor.process(result.output, {
        top_k: options.top_k || 5,
        threshold: options.threshold || 0,
      }),
      inference_time_ms: result.executionTime,
    }));

    const totalTime = Date.now() - startTime;

    res.json({
      success: true,
      model_id,
      execution_mode,
      results: allPredictions,
      performance: {
        total_time_ms: totalTime,
        batch_size: input_data_list.length,
        avg_time_per_item_ms: Math.round(totalTime / input_data_list.length),
        inference_time_ms: batchResult.totalTime,
      },
      metadata: {
        successful_count: processedTensors.length,
        model_type: modelData.metadata.model_type,
        timestamp: new Date().toISOString(),
      },
    });

    logger.info(
      `Batch inference completed for ${model_id}: ${input_data_list.length} items in ${totalTime}ms`
    );
  } catch (error) {
    logger.error("Batch inference failed:", error);
    const totalTime = Date.now() - startTime;

    res.status(500).json({
      success: false,
      error: "Batch inference failed",
      details: error.message,
      execution_time_ms: totalTime,
    });
  }
});

// Se mantienen /models/loaded, /status, /batch, y DELETE /models/:model_id
// Se eliminan los helpers loadLabels y loadMetadata obsoletos.

module.exports = { router, modelLoader }; // Exportar el loader para el nuevo archivo de rutas
