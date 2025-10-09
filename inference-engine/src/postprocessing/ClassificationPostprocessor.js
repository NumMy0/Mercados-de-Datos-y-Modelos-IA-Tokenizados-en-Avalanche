const logger = require('../utils/logger');

class ClassificationPostprocessor {
  constructor(labels = null) {
    this.labels = labels;
  }

  /**
   * Procesa output de modelo de clasificación
   * @param {Float32Array} output - Output raw del modelo (logits)
   * @param {Object} options - Opciones de procesamiento
   * @returns {Array} Array de predicciones con label y confidence
   */
  process(output, options = {}) {
    try {
      const topK = options.top_k || 5;
      const threshold = options.threshold || 0.0;

      // 1. Aplicar softmax para convertir logits a probabilidades
      const probabilities = this.softmax(output);

      // 2. Obtener top-K predicciones
      const topPredictions = this.getTopK(probabilities, topK);

      // 3. Filtrar por threshold si se especifica
      const filtered = threshold > 0
        ? topPredictions.filter(p => p.confidence >= threshold)
        : topPredictions;

      // 4. Mapear a labels si están disponibles
      const predictions = this.mapToLabels(filtered);

      logger.debug(`Postprocessing completed: ${predictions.length} predictions`);

      return predictions;

    } catch (error) {
      logger.error('Postprocessing failed:', error);
      throw new Error(`Postprocessing failed: ${error.message}`);
    }
  }

  /**
   * Aplica función softmax a logits
   * Convierte valores crudos a probabilidades que suman 1
   */
  softmax(logits) {
    const maxLogit = Math.max(...logits);
    const expValues = Array.from(logits).map(x => Math.exp(x - maxLogit));
    const sumExp = expValues.reduce((a, b) => a + b, 0);
    return expValues.map(x => x / sumExp);
  }

  /**
   * Obtiene las top-K predicciones ordenadas por confianza
   */
  getTopK(probabilities, k) {
    // Crear array de índices con sus probabilidades
    const indexed = probabilities.map((prob, idx) => ({
      index: idx,
      confidence: prob,
    }));

    // Ordenar por confianza descendente
    indexed.sort((a, b) => b.confidence - a.confidence);

    // Tomar top-K
    return indexed.slice(0, Math.min(k, indexed.length));
  }

  /**
   * Mapea índices a labels legibles
   */
  mapToLabels(predictions) {
    return predictions.map(pred => {
      const result = {
        confidence: Math.round(pred.confidence * 10000) / 10000, // 4 decimales
        index: pred.index,
      };

      // Agregar label si está disponible
      if (this.labels && this.labels[pred.index]) {
        result.label = this.labels[pred.index];
      } else {
        result.label = `class_${pred.index}`;
      }

      return result;
    });
  }

  /**
   * Carga labels desde archivo o array
   */
  loadLabels(labelsSource) {
    if (Array.isArray(labelsSource)) {
      this.labels = labelsSource;
    } else if (typeof labelsSource === 'object') {
      // Si es un objeto con índices como keys
      const maxIndex = Math.max(...Object.keys(labelsSource).map(Number));
      this.labels = new Array(maxIndex + 1);
      for (const [idx, label] of Object.entries(labelsSource)) {
        this.labels[Number(idx)] = label;
      }
    } else {
      throw new Error('Invalid labels format');
    }

    logger.info(`Loaded ${this.labels.length} class labels`);
  }

  /**
   * Formatea respuesta en formato estándar de API
   */
  formatResponse(predictions, metadata = {}) {
    return {
      success: true,
      predictions,
      metadata: {
        total_classes: this.labels ? this.labels.length : null,
        top_k: predictions.length,
        ...metadata,
      },
    };
  }

  /**
   * Calcula métricas adicionales sobre las predicciones
   */
  calculateMetrics(predictions) {
    if (predictions.length === 0) {
      return null;
    }

    const confidences = predictions.map(p => p.confidence);
    const topConfidence = confidences[0];
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    
    // Entropía (mide incertidumbre de la predicción)
    const entropy = -confidences.reduce((sum, p) => {
      return sum + (p > 0 ? p * Math.log2(p) : 0);
    }, 0);

    return {
      topConfidence,
      avgConfidence: Math.round(avgConfidence * 10000) / 10000,
      entropy: Math.round(entropy * 100) / 100,
      uncertainty: entropy > 2 ? 'high' : entropy > 1 ? 'medium' : 'low',
    };
  }

  /**
   * Valida que la suma de probabilidades sea ~1
   */
  validateProbabilities(probabilities) {
    const sum = probabilities.reduce((a, b) => a + b, 0);
    const tolerance = 0.01;

    if (Math.abs(sum - 1.0) > tolerance) {
      logger.warn(`Probability sum validation failed: ${sum} (expected 1.0)`);
      return false;
    }

    return true;
  }
}

module.exports = ClassificationPostprocessor;