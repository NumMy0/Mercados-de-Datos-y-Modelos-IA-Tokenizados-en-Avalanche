const logger = require("../utils/logger");

/**
 * Preprocessor para datos de texto
 * Maneja tokenización, encoding y conversión a tensores para modelos NLP
 */
class TextPreprocessor {
  constructor() {
    // Vocabulario básico para tokenización simple
    this.basicVocab = new Map();
    this.maxSequenceLength = 512; // Default max length
    this.padToken = "[PAD]";
    this.unkToken = "[UNK]";
    this.startToken = "[CLS]";
    this.endToken = "[SEP]";
  }

  /**
   * Procesa texto y lo convierte a tensor
   * @param {string} textInput - Texto de entrada
   * @param {Object} config - Configuración del modelo
   * @returns {Promise<Float32Array>} Tensor procesado
   */
  async process(textInput, config) {
    try {
      const startTime = Date.now();

      // Validar entrada
      if (typeof textInput !== "string") {
        throw new Error("Text input must be a string");
      }

      if (textInput.trim().length === 0) {
        throw new Error("Text input cannot be empty");
      }

      // Extraer configuración
      const inputShape = config.input_shape;
      const processingType = config.preprocessing || "basic_tokenization";
      const maxLength = config.max_length || this.maxSequenceLength;

      // Procesar según el tipo
      let processedTensor;

      switch (processingType) {
        case "basic_tokenization":
          processedTensor = await this.basicTokenization(
            textInput,
            inputShape,
            maxLength
          );
          break;

        case "char_encoding":
          processedTensor = await this.characterEncoding(
            textInput,
            inputShape,
            maxLength
          );
          break;

        case "word_embedding":
          processedTensor = await this.wordEmbedding(
            textInput,
            inputShape,
            maxLength
          );
          break;

        default:
          throw new Error(
            `Unsupported text preprocessing type: ${processingType}`
          );
      }

      const processTime = Date.now() - startTime;
      logger.debug(`Text preprocessed in ${processTime}ms`);

      return processedTensor;
    } catch (error) {
      logger.error("Text preprocessing failed:", error);
      throw new Error(`Text preprocessing failed: ${error.message}`);
    }
  }

  /**
   * Tokenización básica con vocabulario simple
   */
  async basicTokenization(text, inputShape, maxLength) {
    // Limpiar y tokenizar
    const cleanText = this.cleanText(text);
    const tokens = this.tokenize(cleanText);

    // Convertir tokens a IDs (simulado)
    const tokenIds = tokens.map((token) => this.getTokenId(token));

    // Padding/truncation
    const paddedIds = this.padOrTruncate(tokenIds, maxLength);

    // Convertir a tensor según input_shape
    return this.convertToTensor(paddedIds, inputShape);
  }

  /**
   * Encoding a nivel de caracteres
   */
  async characterEncoding(text, inputShape, maxLength) {
    const chars = text.split("").map((char) => char.charCodeAt(0));
    const paddedChars = this.padOrTruncate(chars, maxLength);

    // Normalizar valores (0-255 -> 0-1)
    const normalized = paddedChars.map((charCode) => charCode / 255.0);

    return this.convertToTensor(normalized, inputShape);
  }

  /**
   * Word embedding básico (placeholder)
   */
  async wordEmbedding(text, inputShape, maxLength) {
    // Implementación básica - en producción usarías embeddings pre-entrenados
    const words = text.toLowerCase().split(/\s+/);
    const embeddings = words.map((word) => this.getWordEmbedding(word));

    const paddedEmbeddings = this.padOrTruncateEmbeddings(
      embeddings,
      maxLength
    );

    return this.convertToTensor(paddedEmbeddings.flat(), inputShape);
  }

  /**
   * Limpia el texto de entrada
   */
  cleanText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Remover puntuación
      .replace(/\s+/g, " ") // Normalizar espacios
      .trim();
  }

  /**
   * Tokenización simple por espacios
   */
  tokenize(text) {
    return text.split(" ").filter((token) => token.length > 0);
  }

  /**
   * Obtiene ID de token (simulado)
   */
  getTokenId(token) {
    if (!this.basicVocab.has(token)) {
      // Asignar ID basado en hash simple
      const id = this.simpleHash(token) % 10000; // Vocabulario de 10k tokens
      this.basicVocab.set(token, id);
    }
    return this.basicVocab.get(token);
  }

  /**
   * Hash simple para generar IDs consistentes
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Padding o truncation de secuencias
   */
  padOrTruncate(sequence, maxLength) {
    if (sequence.length > maxLength) {
      return sequence.slice(0, maxLength);
    }

    while (sequence.length < maxLength) {
      sequence.push(0); // Pad con 0
    }

    return sequence;
  }

  /**
   * Padding para embeddings 2D
   */
  padOrTruncateEmbeddings(embeddings, maxLength) {
    const embeddingSize = embeddings.length > 0 ? embeddings[0].length : 128;

    // Truncar si es necesario
    if (embeddings.length > maxLength) {
      return embeddings.slice(0, maxLength);
    }

    // Pad con vectors cero
    while (embeddings.length < maxLength) {
      embeddings.push(new Array(embeddingSize).fill(0));
    }

    return embeddings;
  }

  /**
   * Embedding básico de palabras (placeholder)
   */
  getWordEmbedding(word) {
    // Embedding simulado de 128 dimensiones
    const embeddingSize = 128;
    const embedding = new Array(embeddingSize);

    // Generar embedding basado en hash de la palabra
    const hash = this.simpleHash(word);
    for (let i = 0; i < embeddingSize; i++) {
      embedding[i] = Math.sin((hash + i) * 0.01); // Valores entre -1 y 1
    }

    return embedding;
  }

  /**
   * Convierte array a tensor según input_shape
   */
  convertToTensor(data, inputShape) {
    // Validar que los datos coincidan con el shape esperado
    const expectedSize = inputShape.reduce((a, b) => a * b, 1);

    if (data.length !== expectedSize) {
      // Ajustar tamaño si es necesario
      if (data.length < expectedSize) {
        // Pad con ceros
        while (data.length < expectedSize) {
          data.push(0);
        }
      } else {
        // Truncar
        data = data.slice(0, expectedSize);
      }
    }

    return new Float32Array(data);
  }

  /**
   * Valida configuración de texto
   */
  validateConfig(config) {
    const required = ["input_shape"];
    const missing = required.filter((field) => !config[field]);

    if (missing.length > 0) {
      throw new Error(`Missing text config fields: ${missing.join(", ")}`);
    }

    if (!Array.isArray(config.input_shape)) {
      throw new Error("input_shape must be an array");
    }
  }

  /**
   * Obtiene información sobre capacidades de procesamiento
   */
  getProcessingInfo() {
    return {
      supported_types: [
        "basic_tokenization",
        "char_encoding",
        "word_embedding",
      ],
      max_sequence_length: this.maxSequenceLength,
      vocabulary_size: this.basicVocab.size,
      special_tokens: {
        pad: this.padToken,
        unknown: this.unkToken,
        start: this.startToken,
        end: this.endToken,
      },
    };
  }

  /**
   * Reset del vocabulario (para testing)
   */
  resetVocabulary() {
    this.basicVocab.clear();
    logger.info("Text preprocessor vocabulary reset");
  }
}

module.exports = TextPreprocessor;
