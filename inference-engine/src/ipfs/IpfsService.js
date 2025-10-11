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
    // Accedemos a la variable 'config' importada
    this.gateways = config.IPFS_GATEWAYS;
    this.primaryGateway = config.IPFS_GATEWAY_URL;
    this.downloadTimeout = config.IPFS_DOWNLOAD_TIMEOUT;
    this.maxDownloadSizeMB = config.MAX_DOWNLOAD_SIZE_MB;

    // Inicializar el cliente Axios base (sin gateway específico)
    this.axiosInstance = axios.create({
      timeout: this.downloadTimeout,
    });

    // 🚨 CONFIGURACIÓN DE RETRY PARA ERRORES DE GATEWAY (429 y 403)
    retryFunction(this.axiosInstance, {
      retries: 2, // Reducido para permitir fallback entre gateways
      retryDelay: (retryCount) => {
        return retryFunction.exponentialDelay(retryCount);
      },

      retryCondition: (error) => {
        const status = error.response ? error.response.status : null;
        return (
          retryFunction.isNetworkError(error) ||
          status === 500 || // Solo retry en errores 500, no en 429
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

        const response = await this.axiosInstance({
          method: "get",
          url: url,
          responseType: isBinary ? "arraybuffer" : "text",
          maxContentLength: maxSizeBytes,
          // Aumentar timeout para archivos grandes
          timeout: isBinary ? this.downloadTimeout * 3 : this.downloadTimeout,
          // Agregar headers para evitar cache en caso de errores previos
          headers: {
            ...(i > 0
              ? { "Cache-Control": "no-cache", Pragma: "no-cache" }
              : {}),
            "User-Agent": "AI-Model-Inference-Engine/1.0",
          },
          // Configurar para manejar archivos grandes
          maxRedirects: 5,
          // Forzar streaming para archivos grandes
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
   * @param {string} metadataCid - El CID del archivo JSON de metadatos.
   * @returns {Promise<Object>} El objeto de metadatos validado.
   */
  async getMetadata(metadataCid) {
    const rawJson = await this.fetchFile(metadataCid, false);
    return MetadataParser.parse(rawJson);
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
