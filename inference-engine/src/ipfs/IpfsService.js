// src/ipfs/IpfsService.js (Constructor Corregido)

const axios = require('axios');
// Importamos la librería. La variable 'retry' ahora es el objeto módulo completo.
const axiosRetry = require('axios-retry'); 
const crypto = require('crypto');
const MetadataParser = require('./MetadataParser'); 
const config = require('../config/config'); 

// 🚨 CORRECCIÓN CLAVE: Accedemos a la función principal anidada
// Si existe .default, lo usamos. Si no, usamos la variable directamente (fallback).
const retryFunction = axiosRetry.default || axiosRetry;

class IpfsService {
    constructor() { 
        // Accedemos a la variable 'config' importada
        this.gatewayUrl = config.IPFS_GATEWAY_URL; 
        this.downloadTimeout = config.IPFS_DOWNLOAD_TIMEOUT;
        this.maxDownloadSizeMB = config.MAX_DOWNLOAD_SIZE_MB;
        
        // Inicializar el cliente Axios
        this.axiosInstance = axios.create({
            baseURL: this.gatewayUrl,
            timeout: this.downloadTimeout
        });

        // 🚨 CONFIGURACIÓN DE RETRY PARA ERRORES DE GATEWAY (429 y 403)
        retryFunction(this.axiosInstance, {
            retries: 3, // Máximo 3 intentos
            retryDelay: (retryCount) => {
                // CORREGIDO: Llamamos a exponentialDelay usando la función de reintento válida.
                return retryFunction.exponentialDelay(retryCount); 
            },
            
            retryCondition: (error) => {
                const status = error.response ? error.response.status : null;
                // CORREGIDO: Llamamos a isNetworkError usando la función de reintento válida.
                return retryFunction.isNetworkError(error) || 
                       status === 429 || // Pinata Rate Limit
                       status === 403 || // Prohibición (A veces es temporal)
                       status >= 500; 
            },
        });
    }

    /**
     * Recupera un archivo de IPFS dada su CID.
     * @param {string} cid - El Content ID del archivo.
     * @param {boolean} isBinary - Si el archivo debe ser tratado como un Buffer (modelo/imagen).
     * @returns {Promise<Buffer|string>} Buffer para binarios, string para texto (JSON).
     */
    async fetchFile(cid, isBinary = false) {
        // ... (Tu implementación existente de fetchFile)
        const url = `${this.gatewayUrl}${cid}`;
        
        try {
            const response = await axios({
                method: 'get',
                url: url,
                timeout: this.timeout,
                responseType: isBinary ? 'arraybuffer' : 'text',
                maxContentLength: this.maxSizeMB * 1024 * 1024
            });

            if (response.status !== 200) {
                throw new Error(`Error al descargar ${cid}: Estado ${response.status}`);
            }

            if (isBinary) {
                const sizeBytes = response.data.length;
                if (sizeBytes > (this.maxSizeMB * 1024 * 1024)) {
                    throw new Error(`Archivo excede el límite de ${this.maxSizeMB}MB.`);
                }
                return Buffer.from(response.data);
            }
            
            return response.data;

        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                throw new Error(`Timeout de descarga (${this.timeout}ms) para CID: ${cid}`);
            }
            if (error.response && error.response.status === 404) {
                 throw new Error(`CID inválido o no encontrado en el gateway: ${cid}`);
            }
            throw new Error(`Fallo en fetchFile: ${error.message}`);
        }
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
        // ... (Tu implementación existente de verifyHash)
        // Ya que usamos crypto, asegurémonos de requerirlo aquí o arriba si no lo tienes.
        // const crypto = require('crypto'); // Ya incluido en mi base, pero si lo quitaste, añádelo.
        const currentHash = crypto.createHash('sha256').update(buffer).digest('hex');
        
        return currentHash.toLowerCase() === expectedHash.toLowerCase();
    }
}

// Exportar una instancia singleton
module.exports = new IpfsService();