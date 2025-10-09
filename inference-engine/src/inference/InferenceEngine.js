const ort = require('onnxruntime-node');
const logger = require('../utils/logger');

class InferenceEngine {
  constructor(config) {
    this.config = config;
    this.defaultTimeout = config.inferenceTimeout || 30000; // 30 segundos
    this.inferenceCount = 0;
    this.totalInferenceTime = 0;
  }

  /**
   * Ejecuta inferencia sobre un modelo cargado
   * @param {Object} modelData - Datos del modelo (session, metadata)
   * @param {Float32Array} inputTensor - Tensor de entrada procesado
   * @param {Object} options - Opciones de inferencia
   * @returns {Promise<Object>} Resultados de la inferencia
   */
  async infer(modelData, inputTensor, options = {}) {
    const startTime = Date.now();
    const timeout = options.timeout || this.defaultTimeout;

    try {
      // Validar modelo y tensor
      this.validateInput(modelData, inputTensor);

      // Crear tensor de ONNX Runtime
      const tensorShape = this.getTensorShape(modelData.metadata.input_shape);
      const inputName = modelData.session.inputNames[0];

      const tensor = new ort.Tensor('float32', inputTensor, tensorShape);

      // Preparar feeds
      const feeds = { [inputName]: tensor };

      // Ejecutar inferencia con timeout
      const results = await this.runWithTimeout(
        modelData.session,
        feeds,
        timeout
      );

      // Extraer output
      const outputName = modelData.session.outputNames[0];
      const outputTensor = results[outputName];

      // Actualizar métricas
      const executionTime = Date.now() - startTime;
      this.updateMetrics(executionTime);

      logger.debug(`Inference completed in ${executionTime}ms`);

      return {
        output: outputTensor.data,
        shape: outputTensor.dims,
        type: outputTensor.type,
        executionTime,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Inference failed after ${executionTime}ms:`, error);
      
      // Clasificar tipo de error
      if (error.name === 'TimeoutError') {
        throw new Error(`Inference timeout after ${timeout}ms`);
      }
      if (error.message.includes('shape')) {
        throw new Error(`Tensor shape mismatch: ${error.message}`);
      }
      
      throw new Error(`Inference execution failed: ${error.message}`);
    }
  }

  /**
   * Ejecuta inferencia con timeout
   */
  async runWithTimeout(session, feeds, timeout) {
    return Promise.race([
      session.run(feeds),
      new Promise((_, reject) => 
        setTimeout(() => {
          const error = new Error('Inference timeout');
          error.name = 'TimeoutError';
          reject(error);
        }, timeout)
      ),
    ]);
  }

  /**
   * Valida entrada antes de inferencia
   */
  validateInput(modelData, inputTensor) {
    if (!modelData || !modelData.session) {
      throw new Error('Invalid model data: session not found');
    }

    if (!inputTensor || !(inputTensor instanceof Float32Array)) {
      throw new Error('Invalid input tensor: must be Float32Array');
    }

    const expectedShape = this.getTensorShape(modelData.metadata.input_shape);
    const expectedSize = expectedShape.reduce((a, b) => a * b, 1);

    if (inputTensor.length !== expectedSize) {
      throw new Error(
        `Tensor size mismatch: expected ${expectedSize}, got ${inputTensor.length}`
      );
    }
  }

  /**
   * Convierte input_shape a formato esperado por ONNX
   */
  getTensorShape(inputShape) {
    // Si ya es formato NCHW [batch, channels, height, width]
    if (inputShape.length === 4) {
      return inputShape;
    }
    
    // Si es HWC [height, width, channels], convertir a NCHW
    if (inputShape.length === 3) {
      return [1, inputShape[2], inputShape[0], inputShape[1]];
    }

    throw new Error(`Unsupported input shape format: ${inputShape}`);
  }

  /**
   * Inferencia en batch (múltiples inputs)
   */
  async inferBatch(modelData, inputTensors, options = {}) {
    const results = [];
    const startTime = Date.now();

    try {
      for (const tensor of inputTensors) {
        const result = await this.infer(modelData, tensor, options);
        results.push(result);
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / inputTensors.length;

      logger.info(`Batch inference completed: ${inputTensors.length} items in ${totalTime}ms (avg: ${avgTime}ms/item)`);

      return {
        results,
        totalTime,
        avgTime,
        count: inputTensors.length,
      };

    } catch (error) {
      logger.error('Batch inference failed:', error);
      throw new Error(`Batch inference failed: ${error.message}`);
    }
  }

  /**
   * Warm-up: ejecuta inferencia dummy para preparar el modelo
   */
  async warmUp(modelData) {
    try {
      logger.info('Warming up model...');
      
      const inputShape = this.getTensorShape(modelData.metadata.input_shape);
      const tensorSize = inputShape.reduce((a, b) => a * b, 1);
      const dummyTensor = new Float32Array(tensorSize).fill(0.5);

      // Ejecutar 3 inferencias de warm-up
      for (let i = 0; i < 3; i++) {
        await this.infer(modelData, dummyTensor, { timeout: 10000 });
      }

      logger.info('Model warm-up completed');
    } catch (error) {
      logger.warn('Warm-up failed (non-critical):', error.message);
    }
  }

  /**
   * Obtiene información del modelo
   */
  getModelInfo(modelData) {
    const session = modelData.session;
    
    return {
      inputNames: session.inputNames,
      outputNames: session.outputNames,
      metadata: modelData.metadata,
      inputShapes: this.getInputShapes(session),
      outputShapes: this.getOutputShapes(session),
    };
  }

  getInputShapes(session) {
    const shapes = {};
    for (const name of session.inputNames) {
      // ONNX Runtime no expone shapes directamente de forma fácil
      // Por eso usamos metadata del modelo
      shapes[name] = 'See model metadata';
    }
    return shapes;
  }

  getOutputShapes(session) {
    const shapes = {};
    for (const name of session.outputNames) {
      shapes[name] = 'See model metadata';
    }
    return shapes;
  }

  /**
   * Actualiza métricas de performance
   */
  updateMetrics(executionTime) {
    this.inferenceCount++;
    this.totalInferenceTime += executionTime;
  }

  /**
   * Obtiene estadísticas de inferencia
   */
  getStats() {
    const avgTime = this.inferenceCount > 0 
      ? Math.round(this.totalInferenceTime / this.inferenceCount)
      : 0;

    return {
      totalInferences: this.inferenceCount,
      totalTime: this.totalInferenceTime,
      avgInferenceTime: avgTime,
      throughput: this.calculateThroughput(),
    };
  }

  calculateThroughput() {
    if (this.inferenceCount === 0) return 0;
    
    const totalSeconds = this.totalInferenceTime / 1000;
    return Math.round((this.inferenceCount / totalSeconds) * 100) / 100;
  }

  /**
   * Reset de estadísticas
   */
  resetStats() {
    this.inferenceCount = 0;
    this.totalInferenceTime = 0;
    logger.info('Inference statistics reset');
  }

  /**
   * Manejo de errores específicos de ONNX Runtime
   */
  handleOnnxError(error) {
    const errorPatterns = {
      'out of memory': 'Insufficient memory for inference',
      'invalid shape': 'Input tensor shape does not match model requirements',
      'unsupported operator': 'Model contains unsupported operations',
      'corrupted model': 'Model file is corrupted or invalid',
      'execution provider': 'Execution provider (CPU/GPU) initialization failed',
    };

    for (const [pattern, message] of Object.entries(errorPatterns)) {
      if (error.message.toLowerCase().includes(pattern)) {
        return new Error(message);
      }
    }

    return error;
  }
}

module.exports = InferenceEngine;