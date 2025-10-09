const sharp = require('sharp');
const logger = require('../utils/logger');

class ImagePreprocessor {
  constructor() {
    // Constantes de normalización para diferentes estándares
    this.normalizationStandards = {
      imagenet: {
        mean: [0.485, 0.456, 0.406],
        std: [0.229, 0.224, 0.225],
      },
      inception: {
        mean: [0.5, 0.5, 0.5],
        std: [0.5, 0.5, 0.5],
      },
      none: {
        mean: [0, 0, 0],
        std: [1, 1, 1],
      },
    };
  }

  /**
   * Pipeline completo de preprocessing para imágenes
   * @param {Buffer|string} imageInput - Buffer de imagen o base64 string
   * @param {Object} config - Configuración del modelo
   * @returns {Promise<Float32Array>} Tensor de imagen procesado
   */
  async process(imageInput, config) {
    try {
      const startTime = Date.now();

      // 1. Cargar y decodificar imagen
      let imageBuffer = await this.loadImage(imageInput);

      // 2. Extraer configuración
      const inputShape = config.input_shape; // [height, width, channels] o [batch, channels, height, width]
      const normalization = config.preprocessing || 'imagenet';
      const colorFormat = config.color_format || 'RGB';

      // Determinar dimensiones target
      let targetHeight, targetWidth, channels;
      if (inputShape.length === 4) {
        // NCHW format: [batch, channels, height, width]
        channels = inputShape[1];
        targetHeight = inputShape[2];
        targetWidth = inputShape[3];
      } else if (inputShape.length === 3) {
        // HWC format: [height, width, channels]
        targetHeight = inputShape[0];
        targetWidth = inputShape[1];
        channels = inputShape[2];
      } else {
        throw new Error(`Invalid input_shape format: ${inputShape}`);
      }

      // 3. Redimensionar imagen
      imageBuffer = await this.resize(imageBuffer, targetWidth, targetHeight);

      // 4. Convertir a array de píxeles
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

      // 5. Validar dimensiones
      if (info.width !== targetWidth || info.height !== targetHeight) {
        throw new Error('Image resize failed: dimensions mismatch');
      }

      // 6. Convertir a Float32Array y normalizar
      const pixelArray = new Uint8Array(data);
      const floatArray = await this.normalize(
        pixelArray,
        targetWidth,
        targetHeight,
        channels,
        normalization,
        colorFormat
      );

      const processTime = Date.now() - startTime;
      logger.debug(`Image preprocessed in ${processTime}ms`);

      return floatArray;

    } catch (error) {
      logger.error('Image preprocessing failed:', error);
      throw new Error(`Preprocessing failed: ${error.message}`);
    }
  }

  /**
   * Carga imagen desde diferentes fuentes
   */
  async loadImage(input) {
    try {
      if (Buffer.isBuffer(input)) {
        return input;
      }

      if (typeof input === 'string') {
        // Base64
        if (input.startsWith('data:image')) {
          const base64Data = input.split(',')[1];
          return Buffer.from(base64Data, 'base64');
        }
        // Base64 puro
        if (input.match(/^[A-Za-z0-9+/=]+$/)) {
          return Buffer.from(input, 'base64');
        }
        // URL (podría extenderse para descargar)
        throw new Error('URL image loading not implemented yet');
      }

      throw new Error('Invalid image input format');
    } catch (error) {
      throw new Error(`Image loading failed: ${error.message}`);
    }
  }

  /**
   * Redimensiona imagen manteniendo aspecto o forzando dimensiones
   */
  async resize(imageBuffer, width, height) {
    try {
      return await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'fill', // Forzar dimensiones exactas
          kernel: sharp.kernel.lanczos3,
        })
        .toBuffer();
    } catch (error) {
      throw new Error(`Image resize failed: ${error.message}`);
    }
  }

  /**
   * Normaliza píxeles y convierte a formato de tensor
   */
  async normalize(pixelArray, width, height, channels, standard, colorFormat) {
    const totalPixels = width * height;
    const floatArray = new Float32Array(totalPixels * channels);

    // Obtener parámetros de normalización
    const norm = this.normalizationStandards[standard] || this.normalizationStandards.imagenet;
    const { mean, std } = norm;

    // Convertir y normalizar
    for (let i = 0; i < totalPixels; i++) {
      for (let c = 0; c < channels; c++) {
        const pixelIndex = i * channels + c;
        const pixelValue = pixelArray[pixelIndex];

        // Normalizar: (pixel/255 - mean) / std
        let normalized = (pixelValue / 255.0 - mean[c]) / std[c];

        // Convertir RGB a BGR si es necesario
        let channelIndex = c;
        if (colorFormat === 'BGR' && channels === 3) {
          channelIndex = 2 - c; // Invertir orden de canales
        }

        // Formato NCHW: [batch, channels, height, width]
        // Reorganizar de HWC a CHW
        const tensorIndex = channelIndex * totalPixels + i;
        floatArray[tensorIndex] = normalized;
      }
    }

    return floatArray;
  }

  /**
   * Valida que la imagen sea procesable
   */
  async validateImage(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image: missing dimensions');
      }

      const supportedFormats = ['jpeg', 'png', 'webp', 'gif', 'tiff'];
      if (!supportedFormats.includes(metadata.format)) {
        throw new Error(`Unsupported image format: ${metadata.format}`);
      }

      // Verificar tamaño razonable (max 10MB)
      if (imageBuffer.length > 10 * 1024 * 1024) {
        throw new Error('Image too large (max 10MB)');
      }

      return metadata;

    } catch (error) {
      throw new Error(`Image validation failed: ${error.message}`);
    }
  }

  /**
   * Preprocessing específico para modelos de detección de objetos
   */
  async processForDetection(imageInput, config) {
    // Mantener aspect ratio, padding si es necesario
    // Implementación futura
    throw new Error('Object detection preprocessing not implemented yet');
  }

  /**
   * Convierte tensor de vuelta a imagen (para debugging)
   */
  async tensorToImage(tensor, width, height, channels) {
    const pixelArray = new Uint8Array(width * height * channels);

    for (let i = 0; i < width * height; i++) {
      for (let c = 0; c < channels; c++) {
        const tensorIndex = c * width * height + i;
        const pixelIndex = i * channels + c;
        // Desnormalizar (simplificado)
        pixelArray[pixelIndex] = Math.round(tensor[tensorIndex] * 255);
      }
    }

    return await sharp(Buffer.from(pixelArray), {
      raw: {
        width,
        height,
        channels,
      },
    })
      .png()
      .toBuffer();
  }
}

module.exports = ImagePreprocessor;