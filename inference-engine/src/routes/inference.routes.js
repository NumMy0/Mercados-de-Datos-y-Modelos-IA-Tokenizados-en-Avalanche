const express = require('express');
const router = express.Router();
const ModelLoader = require('../models/ModelLoader');
const InferenceEngine = require('../inference/InferenceEngine');
const ImagePreprocessor = require('../preprocessing/ImagePreprocessor');
const ClassificationPostprocessor = require('../postprocessing/ClassificationPostprocessor');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

// Inicializar componentes
const config = require('../config/config');
const modelLoader = new ModelLoader(config);
const inferenceEngine = new InferenceEngine(config);
const imagePreprocessor = new ImagePreprocessor();

/**
 * POST /api/inference/execute
 * Ejecuta inferencia sobre un modelo
 */
router.post('/execute', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { model_id, input, options = {} } = req.body;

    // Validación de entrada
    if (!model_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: model_id',
      });
    }

    if (!input || !input.type || !input.data) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid input field',
      });
    }

    // 1. Obtener modelo cargado
    let modelData = modelLoader.getModel(model_id);
    
    if (!modelData) {
      return res.status(404).json({
        success: false,
        error: `Model ${model_id} not loaded. Use /preload endpoint first.`,
      });
    }

    // 2. Preprocessing según tipo de input
    let processedTensor;
    
    if (input.type === 'image') {
      processedTensor = await imagePreprocessor.process(
        input.data,
        modelData.metadata
      );
    } else if (input.type === 'text') {
      return res.status(400).json({
        success: false,
        error: 'Text input not yet implemented',
      });
    } else {
      return res.status(400).json({
        success: false,
        error: `Unsupported input type: ${input.type}`,
      });
    }

    // 3. Ejecutar inferencia
    const inferenceResult = await inferenceEngine.infer(
      modelData,
      processedTensor,
      { timeout: options.timeout }
    );

    // 4. Postprocessing
    const labels = await loadLabels(model_id);
    const postprocessor = new ClassificationPostprocessor(labels);
    
    const predictions = postprocessor.process(inferenceResult.output, {
      top_k: options.top_k || 5,
      threshold: options.threshold || 0,
    });

    // 5. Calcular métricas adicionales
    const metrics = postprocessor.calculateMetrics(predictions);

    const totalTime = Date.now() - startTime;

    // 6. Responder
    res.json({
      success: true,
      predictions,
      execution_time_ms: totalTime,
      inference_time_ms: inferenceResult.executionTime,
      model_id,
      metrics,
    });

    logger.info(`Inference completed for ${model_id}: ${totalTime}ms`);

  } catch (error) {
    logger.error('Inference request failed:', error);
    
    const totalTime = Date.now() - startTime;
    
    res.status(500).json({
      success: false,
      error: error.message,
      execution_time_ms: totalTime,
    });
  }
});

/**
 * GET /api/inference/models/loaded
 * Lista modelos actualmente cargados en memoria
 */
router.get('/models/loaded', (req, res) => {
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
    logger.error('Failed to get loaded models:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/inference/preload
 * Precarga un modelo en memoria
 */
router.post('/preload', async (req, res) => {
  try {
    const { model_id, model_path, metadata } = req.body;

    if (!model_id || !model_path) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: model_id, model_path',
      });
    }

    // Cargar metadata si no se provee
    let modelMetadata = metadata;
    if (!modelMetadata) {
      modelMetadata = await loadMetadata(model_id);
    }

    // Precargar modelo
    const startTime = Date.now();
    await modelLoader.preloadModel(model_id, model_path, modelMetadata);
    const loadTime = Date.now() - startTime;

    // Opcional: warm-up
    if (req.body.warmup) {
      const modelData = modelLoader.getModel(model_id);
      await inferenceEngine.warmUp(modelData);
    }

    res.json({
      success: true,
      message: `Model ${model_id} preloaded successfully`,
      load_time_ms: loadTime,
      model_id,
    });

  } catch (error) {
    logger.error('Preload failed:', error);
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
router.delete('/models/:model_id', async (req, res) => {
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
    logger.error('Unload failed:', error);
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
router.get('/status', (req, res) => {
  try {
    const memoryStats = modelLoader.getMemoryStats();
    const inferenceStats = inferenceEngine.getStats();
    const loadedModels = modelLoader.getLoadedModels();

    res.json({
      success: true,
      status: 'operational',
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
    logger.error('Status check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/inference/batch
 * Inferencia en batch (múltiples inputs)
 */
router.post('/batch', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { model_id, inputs, options = {} } = req.body;

    if (!model_id || !inputs || !Array.isArray(inputs)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid fields: model_id, inputs (array)',
      });
    }

    // Límite de batch
    if (inputs.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Batch size too large (max 10)',
      });
    }

    const modelData = modelLoader.getModel(model_id);
    if (!modelData) {
      return res.status(404).json({
        success: false,
        error: `Model ${model_id} not loaded`,
      });
    }

    // Procesar cada input
    const processedTensors = [];
    for (const input of inputs) {
      const tensor = await imagePreprocessor.process(
        input.data,
        modelData.metadata
      );
      processedTensors.push(tensor);
    }

    // Inferencia en batch
    const batchResult = await inferenceEngine.inferBatch(
      modelData,
      processedTensors,
      options
    );

    // Postprocessing de cada resultado
    const labels = await loadLabels(model_id);
    const postprocessor = new ClassificationPostprocessor(labels);
    
    const allPredictions = batchResult.results.map(result =>
      postprocessor.process(result.output, {
        top_k: options.top_k || 5,
      })
    );

    const totalTime = Date.now() - startTime;

    res.json({
      success: true,
      predictions: allPredictions,
      batch_size: inputs.length,
      total_time_ms: totalTime,
      avg_time_ms: Math.round(totalTime / inputs.length),
      model_id,
    });

  } catch (error) {
    logger.error('Batch inference failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Helper: Cargar labels de un modelo
 */
async function loadLabels(modelId) {
  try {
    const labelsPath = path.join(
      config.dataDir || './data',
      'labels',
      `${modelId}_labels.json`
    );
    
    const labelsData = await fs.readFile(labelsPath, 'utf-8');
    return JSON.parse(labelsData);
  } catch (error) {
    // Si no hay labels, retornar null
    logger.warn(`Labels not found for ${modelId}, using indices`);
    return null;
  }
}

/**
 * Helper: Cargar metadata de un modelo
 */
async function loadMetadata(modelId) {
  try {
    const metadataPath = path.join(
      config.modelDir || './models',
      'metadata',
      `${modelId}.json`
    );
    
    const metadataData = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(metadataData);
  } catch (error) {
    throw new Error(`Metadata not found for model ${modelId}`);
  }
}

module.exports = router;