const ImagePreprocessor = require("./ImagePreprocessor");
const TextPreprocessor = require("./TextPreprocessor");
const logger = require("../utils/logger");

/**
 * Factory para crear preprocessors apropiados según el formato de datos
 * Maneja el nuevo formato de payload estándar:
 * {
 *   "input_data": {
 *     "format": "base64_jpeg|raw_text|base64_wav|etc",
 *     "content": "..."
 *   }
 * }
 */
class PreprocessorFactory {
  constructor() {
    this.imagePreprocessor = new ImagePreprocessor();
    this.textPreprocessor = new TextPreprocessor();

    // Mapeo de formatos soportados
    this.supportedFormats = {
      // Formatos de imagen
      base64_jpeg: { type: "image", preprocessor: "image" },
      base64_png: { type: "image", preprocessor: "image" },
      base64_webp: { type: "image", preprocessor: "image" },
      base64_gif: { type: "image", preprocessor: "image" },
      binary_jpeg: { type: "image", preprocessor: "image" },
      binary_png: { type: "image", preprocessor: "image" },

      // Formatos de texto
      raw_text: { type: "text", preprocessor: "text" },
      base64_text: { type: "text", preprocessor: "text" },
      json_text: { type: "text", preprocessor: "text" },

      // Formatos de audio (futuro)
      base64_wav: { type: "audio", preprocessor: "audio" },
      base64_mp3: { type: "audio", preprocessor: "audio" },

      // Formatos de tensor directo
      raw_tensor: { type: "tensor", preprocessor: "tensor" },
      base64_tensor: { type: "tensor", preprocessor: "tensor" },
    };
  }

  /**
   * Procesa input_data según su formato y devuelve el tensor procesado
   * @param {Object} inputData - Objeto con format y content
   * @param {Object} modelMetadata - Metadata del modelo para preprocessing
   * @returns {Promise<Float32Array>} Tensor procesado listo para inferencia
   */
  async process(inputData, modelMetadata) {
    try {
      const { format, content } = inputData;

      // Validar formato
      if (!format || !content) {
        throw new Error(
          'input_data must contain both "format" and "content" fields'
        );
      }

      const formatInfo = this.supportedFormats[format];
      if (!formatInfo) {
        throw new Error(
          `Unsupported input format: ${format}. Supported formats: ${Object.keys(
            this.supportedFormats
          ).join(", ")}`
        );
      }

      logger.debug(`Processing input with format: ${format}`);

      // Procesar según el tipo
      switch (formatInfo.preprocessor) {
        case "image":
          return await this.processImage(format, content, modelMetadata);

        case "text":
          return await this.processText(format, content, modelMetadata);

        case "audio":
          throw new Error("Audio preprocessing not implemented yet");

        case "tensor":
          return await this.processTensor(format, content, modelMetadata);

        default:
          throw new Error(
            `Unknown preprocessor type: ${formatInfo.preprocessor}`
          );
      }
    } catch (error) {
      logger.error("Preprocessing failed:", error);
      throw new Error(`Preprocessing failed: ${error.message}`);
    }
  }

  /**
   * Procesa datos de imagen
   */
  async processImage(format, content, modelMetadata) {
    try {
      let imageBuffer;

      // Decodificar según el formato específico
      switch (format) {
        case "base64_jpeg":
        case "base64_png":
        case "base64_webp":
        case "base64_gif":
          // Remover header de data URL si existe
          const base64Data = content.includes(",")
            ? content.split(",")[1]
            : content;
          imageBuffer = Buffer.from(base64Data, "base64");
          break;

        case "binary_jpeg":
        case "binary_png":
          // Asumir que content ya es un Buffer (para requests con binary data)
          imageBuffer = Buffer.isBuffer(content)
            ? content
            : Buffer.from(content);
          break;

        default:
          throw new Error(`Image format ${format} not implemented`);
      }

      // Usar el preprocessor de imágenes existente
      return await this.imagePreprocessor.process(imageBuffer, modelMetadata);
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Procesa datos de texto
   */
  async processText(format, content, modelMetadata) {
    try {
      let textData;

      // Decodificar según el formato
      switch (format) {
        case "raw_text":
          textData = content;
          break;

        case "base64_text":
          textData = Buffer.from(content, "base64").toString("utf-8");
          break;

        case "json_text":
          const parsedJson = JSON.parse(content);
          textData =
            parsedJson.text || parsedJson.content || JSON.stringify(parsedJson);
          break;

        default:
          throw new Error(`Text format ${format} not implemented`);
      }

      // Usar el preprocessor de texto
      return await this.textPreprocessor.process(textData, modelMetadata);
    } catch (error) {
      throw new Error(`Text processing failed: ${error.message}`);
    }
  }

  /**
   * Procesa tensores directos (formato avanzado)
   */
  async processTensor(format, content, modelMetadata) {
    try {
      let tensorData;

      switch (format) {
        case "raw_tensor":
          // Asumir que content es un array de números
          tensorData = Array.isArray(content) ? content : JSON.parse(content);
          break;

        case "base64_tensor":
          // Decodificar tensor serializado en base64
          const decodedBuffer = Buffer.from(content, "base64");
          // Asumir formato Float32Array serializado
          tensorData = new Float32Array(decodedBuffer.buffer);
          break;

        default:
          throw new Error(`Tensor format ${format} not implemented`);
      }

      // Validar dimensiones contra metadata del modelo
      const expectedShape = modelMetadata.input_shape;
      const expectedSize = expectedShape.reduce((a, b) => a * b, 1);

      if (tensorData.length !== expectedSize) {
        throw new Error(
          `Tensor size mismatch: expected ${expectedSize}, got ${tensorData.length}`
        );
      }

      // Convertir a Float32Array si no lo es ya
      return tensorData instanceof Float32Array
        ? tensorData
        : new Float32Array(tensorData);
    } catch (error) {
      throw new Error(`Tensor processing failed: ${error.message}`);
    }
  }

  /**
   * Detecta automáticamente el formato basado en el contenido
   * @param {string} content - Contenido a analizar
   * @returns {string} Formato detectado
   */
  autoDetectFormat(content) {
    try {
      // Detectar base64 con header
      if (content.startsWith("data:image/")) {
        const mimeType = content.split(";")[0].split("/")[1];
        return `base64_${mimeType}`;
      }

      // Detectar base64 puro (imagen)
      if (/^[A-Za-z0-9+/=]+$/.test(content) && content.length > 100) {
        // Intento heurístico: si es muy largo, probablemente sea imagen
        return "base64_jpeg"; // Default fallback
      }

      // Detectar JSON
      if (content.trim().startsWith("{") || content.trim().startsWith("[")) {
        try {
          JSON.parse(content);
          return "json_text";
        } catch (e) {
          // No es JSON válido, tratarlo como texto
        }
      }

      // Default: texto plano
      return "raw_text";
    } catch (error) {
      logger.warn("Auto-detection failed, defaulting to raw_text:", error);
      return "raw_text";
    }
  }

  /**
   * Obtiene información sobre los formatos soportados
   */
  getSupportedFormats() {
    return {
      formats: Object.keys(this.supportedFormats),
      categories: {
        image: Object.keys(this.supportedFormats).filter(
          (f) => this.supportedFormats[f].type === "image"
        ),
        text: Object.keys(this.supportedFormats).filter(
          (f) => this.supportedFormats[f].type === "text"
        ),
        audio: Object.keys(this.supportedFormats).filter(
          (f) => this.supportedFormats[f].type === "audio"
        ),
        tensor: Object.keys(this.supportedFormats).filter(
          (f) => this.supportedFormats[f].type === "tensor"
        ),
      },
    };
  }

  /**
   * Valida el payload de input_data
   */
  validateInputData(inputData) {
    const errors = [];

    if (!inputData || typeof inputData !== "object") {
      errors.push("input_data must be an object");
    } else {
      if (!inputData.format) {
        errors.push("input_data.format is required");
      }
      if (!inputData.content) {
        errors.push("input_data.content is required");
      }
      if (inputData.format && !this.supportedFormats[inputData.format]) {
        errors.push(`Unsupported format: ${inputData.format}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = PreprocessorFactory;
