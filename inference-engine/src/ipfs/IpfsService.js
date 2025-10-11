// src/ipfs/IpfsService.js (Constructor Corregido)

const axios = require("axios");
// Importamos la librería. La variable 'retry' ahora es el objeto módulo completo.
const axiosRetry = require("axios-retry");
const crypto = require("crypto");
const MetadataParser = require("./MetadataParser");
const config = require("../config/config");

// 🚨 CORRECCIÓN CLAVE: Accedemos a la función principal anidada
// Si existe .default, lo usamos. Si no, usamos la variable directamente (fallback).
const retryFunction = axiosRetry.default || axiosRetry;

class IpfsService {
  constructor() {
    // Usar la nueva configuración IPFS
    const ipfsConfig = config.ipfs;
    this.primaryGateway = ipfsConfig.primaryGateway;
    this.gateways = [ipfsConfig.primaryGateway, ...ipfsConfig.fallbackGateways];
    this.downloadTimeout = ipfsConfig.downloadTimeout;
    this.maxDownloadSizeMB = ipfsConfig.maxDownloadSizeMB;
    this.pinataJWT = ipfsConfig.pinataJWT;

    // Inicializar el cliente Axios base
    this.axiosInstance = axios.create({
      timeout: this.downloadTimeout,
      maxContentLength: this.maxDownloadSizeMB * 1024 * 1024,
      headers: {
        "User-Agent": "AI-Model-Inference-Engine/1.0",
      },
    });

    // 🚨 CONFIGURACIÓN DE RETRY PARA ERRORES DE GATEWAY
    retryFunction(this.axiosInstance, {
      retries: 2,
      retryDelay: (retryCount) => {
        return retryFunction.exponentialDelay(retryCount);
      },
      retryCondition: (error) => {
        const status = error.response ? error.response.status : null;
        return (
          retryFunction.isNetworkError(error) ||
          status === 500 ||
          status === 502 ||
          status === 503 ||
          status === 504
        );
      },
    });
  }

  /**
   * Recupera un archivo de IPFS dada su CID con fallback entre múltiples gateways.
   * @param {string} cid - El Content ID del archivo.
   * @param {boolean} isBinary - Si el archivo debe ser tratado como un Buffer (modelo/imagen).
   * @returns {Promise<Buffer|string>} Buffer para binarios, string para texto (JSON).
   */
  async fetchFile(cid, isBinary = false) {
    const maxSizeBytes = this.maxDownloadSizeMB * 1024 * 1024;

    // Intentar con cada gateway en orden
    const gatewaysToTry = [
      this.primaryGateway,
      ...this.gateways.filter((g) => g !== this.primaryGateway),
    ];

    let lastError = null;

    for (let i = 0; i < gatewaysToTry.length; i++) {
      const gateway = gatewaysToTry[i];
      const url = `${gateway}${cid}`;

      try {
        console.log(
          `🌐 Intentando descargar ${cid} desde ${gateway} (intento ${i + 1}/${
            gatewaysToTry.length
          })`
        );

        // Preparar headers específicos para el gateway
        const headers = {
          "User-Agent": "AI-Model-Inference-Engine/1.0",
          ...(i > 0 ? { "Cache-Control": "no-cache", Pragma: "no-cache" } : {}),
        };

        // Agregar autenticación para Pinata si está disponible
        if (gateway.includes("pinata.cloud") && this.pinataJWT) {
          headers["Authorization"] = `Bearer ${this.pinataJWT}`;
        }

        const response = await this.axiosInstance({
          method: "get",
          url: url,
          responseType: isBinary ? "arraybuffer" : "text",
          maxContentLength: maxSizeBytes,
          timeout: isBinary ? this.downloadTimeout * 3 : this.downloadTimeout,
          headers,
          maxRedirects: 5,
          ...(isBinary && { responseEncoding: null }),
        });

        if (response.status !== 200) {
          throw new Error(`Estado HTTP ${response.status}`);
        }

        // Verificar tamaño
        const sizeBytes = isBinary
          ? response.data.byteLength
          : Buffer.byteLength(response.data, "utf8");
        const sizeMB = Math.round(sizeBytes / 1024 / 1024);

        if (sizeBytes > maxSizeBytes) {
          throw new Error(
            `Archivo excede el límite de ${this.maxDownloadSizeMB}MB (${sizeMB}MB)`
          );
        }

        console.log(`✅ Descarga exitosa desde ${gateway} (${sizeMB}MB)`);

        if (isBinary) {
          return Buffer.from(response.data);
        }

        return response.data;
      } catch (error) {
        const errorMsg = error.response
          ? `HTTP ${error.response.status}: ${error.response.statusText}`
          : error.message;

        console.warn(`⚠️ Fallo en ${gateway}: ${errorMsg}`);
        lastError = error;

        // Si es un error 404, no intentar otros gateways (el CID no existe)
        if (error.response && error.response.status === 404) {
          throw new Error(`CID no encontrado: ${cid}`);
        }

        // Para rate limiting (429), continuar con el siguiente gateway
        if (error.response && error.response.status === 429) {
          console.log(
            `🔄 Rate limit en ${gateway}, probando siguiente gateway...`
          );
          continue;
        }

        // Si es el último gateway, lanzar el error
        if (i === gatewaysToTry.length - 1) {
          break;
        }

        // Pausa más larga para archivos grandes
        await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
      }
    }

    // Si llegamos aquí, todos los gateways fallaron
    const errorMsg = lastError?.response
      ? `${lastError.response.status}: ${lastError.response.statusText}`
      : lastError?.message || "Error desconocido";

    throw new Error(
      `Fallo en todos los gateways IPFS para CID ${cid}. Último error: ${errorMsg}`
    );
  }

  /**
   * Obtiene y valida los metadatos de un modelo desde IPFS.
   * Maneja el caso donde el CID puede apuntar a un archivo de modelo en lugar de metadatos.
   * @param {string} metadataCid - El CID del archivo JSON de metadatos (o modelo como fallback).
   * @returns {Promise<Object>} El objeto de metadatos validado.
   */
  async getMetadata(metadataCid) {
    console.log(`🔍 getMetadata llamado con CID: ${metadataCid}`);
    console.log(`🔍 Tipo de CID: ${typeof metadataCid}, Longitud: ${metadataCid?.length}`);
    
    try {
      // Intentar descargar como texto (JSON)
      console.log(`📥 Descargando contenido desde IPFS...`);
      const rawContent = await this.fetchFile(metadataCid, false);
      console.log(`📥 Contenido descargado, tipo: ${typeof rawContent}, longitud: ${rawContent?.length}`);
      console.log(`📥 Primeros 100 caracteres:`, rawContent?.substring(0, 100));
      
      // Verificar si el contenido es un archivo de modelo binario
      if (MetadataParser.isModelFile(rawContent)) {
        console.warn(`⚠️ ADVERTENCIA: El CID ${metadataCid} apunta a un archivo de modelo, no a metadatos.`);
        console.warn(`⚠️ Creando metadatos de fallback para compatibilidad.`);
        
        // Crear metadatos de fallback basados en configuración por defecto
        return this.createFallbackMetadata(metadataCid);
      }
      
      console.log(`✅ El CID ${metadataCid} apunta a metadatos JSON válidos`);
      
      // Es un archivo JSON válido, parsearlo normalmente
      const metadata = MetadataParser.parse(rawContent);
      console.log(`✅ Metadatos parseados exitosamente:`, metadata);
      
      return metadata;
      
    } catch (error) {
      console.error(`❌ Error en getMetadata para CID ${metadataCid}:`, error);
      
      // Si falla el parseo JSON, probablemente es un archivo binario
      if (error.message.includes('JSON') || error.message.includes('formato JSON')) {
        console.warn(`⚠️ El archivo en CID ${metadataCid} no es JSON válido, creando metadatos de fallback.`);
        return this.createFallbackMetadata(metadataCid);
      }
      
      // Re-lanzar otros errores
      throw error;
    }
  }

  /**
   * Crea metadatos de fallback cuando el CID apunta a un archivo de modelo.
   * @param {string} modelCid - El CID del archivo de modelo.
   * @returns {Object} Objeto de metadatos de fallback.
   */
  createFallbackMetadata(modelCid) {
    console.log(`⚠️ Creando metadatos de fallback para CID: ${modelCid}`);
    console.log(`🔍 CID tipo: ${typeof modelCid}, longitud: ${modelCid?.length}`);
    
    const fallbackMetadata = {
      model_id: `fallback_model_${Date.now()}`,
      version: "1.0.0",
      model_cid: modelCid,  // Usar el CID real del modelo
      model_hash: "unknown", // Hash desconocido para modelos legacy
      labels_cid: null,
      description: "Modelo legacy sin metadatos específicos",
      inference_config: {
        model_type: "image_classification",
        input_shape: [1, 3, 224, 224],
        preprocessing: "imagenet",
        color_format: "RGB",
        output_config: {
          type: "softmax",
          topk: 5
        }
      },
      // Metadata de compatibilidad
      name: "Modelo Legacy",
      author: "Desconocido",
      license: "Unknown",
      created_at: new Date().toISOString(),
      framework: "ONNX",
      is_fallback: true // Flag para identificar metadatos de fallback
    };
    
    console.log(`✅ Metadatos de fallback creados:`, fallbackMetadata);
    return fallbackMetadata;
  }

  /**
   * Verifica la integridad de un Buffer comparando su hash.
   * @param {Buffer} buffer - El buffer del archivo descargado.
   * @param {string} expectedHash - El hash esperado (ej. un valor sha256).
   * @returns {boolean} True si el hash coincide.
   */
  verifyHash(buffer, expectedHash) {
    const currentHash = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    // Limpiar el hash esperado para remover prefijos como "sha256:"
    const cleanExpectedHash = expectedHash
      .replace(/^sha256:/, "")
      .toLowerCase();

    return currentHash.toLowerCase() === cleanExpectedHash;
  }
}

// Exportar una instancia singleton
module.exports = new IpfsService();
