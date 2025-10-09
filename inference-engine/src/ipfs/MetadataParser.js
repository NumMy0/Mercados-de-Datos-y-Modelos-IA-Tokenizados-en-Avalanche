// src/ipfs/MetadataParser.js

/**
 * Clase para parsear y validar la estructura del JSON de metadatos de un modelo IPFS.
 * Estructura esperada:
 * {
 * "model_id": "resnet18",
 * "version": "1.0.0",
 * "model_cid": "bafybeig5j...", // CID del archivo .onnx
 * "model_hash": "a1b2c3d4e5...", // Hash para verificación de integridad
 * "metadata_cid": "bafybeih...", // CID de este mismo archivo
 * "inference_config": {
 * "model_type": "image_classification",
 * "input_shape": [1, 3, 224, 224],
 * "preprocessing": "imagenet"
 * }
 * }
 */
class MetadataParser {
    
    /**
     * Valida la estructura básica del objeto de metadatos.
     * @param {Object} metadata - Objeto JSON de metadatos.
     * @throws {Error} Si el objeto carece de campos esenciales o tiene un formato incorrecto.
     * @returns {Object} El objeto de metadatos validado.
     */
    static validate(metadata) {
        if (!metadata || typeof metadata !== 'object') {
            throw new Error('Metadatos de IPFS inválidos: el contenido no es un objeto JSON.');
        }

        const requiredFields = ['model_id', 'model_cid', 'model_hash', 'inference_config'];
        
        for (const field of requiredFields) {
            if (!(field in metadata)) {
                throw new Error(`Metadatos de IPFS incompletos: falta el campo '${field}'.`);
            }
        }

        // Validación de campos internos de configuración de inferencia
        const config = metadata.inference_config;
        const requiredInferenceFields = ['model_type', 'input_shape', 'preprocessing'];
        for (const field of requiredInferenceFields) {
            if (!(field in config)) {
                throw new Error(`Metadatos de IPFS incompletos: falta el campo de configuración de inferencia '${field}'.`);
            }
        }
        
        // Validación de tipos
        if (typeof metadata.model_cid !== 'string' || !metadata.model_cid.startsWith('bafy')) {
             throw new Error('Metadatos inválidos: model_cid no es un CID válido.');
        }
        if (typeof metadata.model_hash !== 'string' || metadata.model_hash.length < 32) {
             throw new Error('Metadatos inválidos: model_hash no válido para verificación.');
        }
        
        return metadata;
    }

    /**
     * Parsea la cadena JSON descargada y la valida.
     * @param {string} rawJson - La cadena de texto JSON descargada de IPFS.
     * @returns {Object} El objeto de metadatos validado.
     */
    static parse(rawJson) {
        let metadata;
        try {
            metadata = JSON.parse(rawJson);
        } catch (e) {
            throw new Error('Error de formato JSON: La cadena descargada no es un JSON válido.');
        }
        
        return MetadataParser.validate(metadata);
    }
}

module.exports = MetadataParser;