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
     * Detecta si el contenido descargado es un archivo de modelo (.onnx) en lugar de metadatos JSON
     * @param {string|Buffer} content - Contenido descargado de IPFS
     * @returns {boolean} true si es un archivo de modelo, false si es JSON
     */
    static isModelFile(content) {
        try {
            console.log(`🔍 isModelFile - Tipo de contenido: ${typeof content}`);
            console.log(`🔍 isModelFile - Longitud: ${content?.length}`);
            
            // Si es Buffer, es definitivamente un archivo binario
            if (Buffer.isBuffer(content)) {
                console.log(`🔍 isModelFile - Es Buffer, es archivo de modelo`);
                return true;
            }
            
            // Si es string, verificar si contiene caracteres binarios
            if (typeof content === 'string') {
                console.log(`🔍 isModelFile - Es string, verificando contenido...`);
                console.log(`🔍 isModelFile - Primeros 50 chars:`, content.substring(0, 50));
                
                // Si contiene caracteres no-ASCII o bytes nulos, es binario
                if (content.includes('\x00') || content.includes('\xFF') || /[\x00-\x08\x0E-\x1F\x7F-\xFF]/.test(content)) {
                    console.log(`🔍 isModelFile - Contiene caracteres binarios, es archivo de modelo`);
                    return true;
                }
                
                // Intentar parsear como JSON
                try {
                    const parsed = JSON.parse(content);
                    console.log(`🔍 isModelFile - JSON válido parseado:`, Object.keys(parsed));
                    
                    // Si es JSON pero no tiene estructura de metadatos, podría ser un modelo serializado en JSON
                    if (!parsed.model_id && !parsed.inference_config && !parsed.model_cid) {
                        console.log(`🔍 isModelFile - JSON sin estructura de metadatos, probablemente modelo`);
                        return true;
                    }
                    
                    console.log(`🔍 isModelFile - Es JSON de metadatos válido`);
                    return false; // Es JSON de metadatos válido
                } catch (jsonError) {
                    console.log(`🔍 isModelFile - Error parseando JSON:`, jsonError.message);
                    console.log(`🔍 isModelFile - No es JSON válido, es archivo de modelo`);
                    return true; // No es JSON válido, es archivo de modelo
                }
            }
            
            console.log(`🔍 isModelFile - Tipo desconocido, asumiendo archivo de modelo`);
            return true; // Default: asumir que es archivo de modelo
        } catch (err) {
            console.error(`❌ Error en isModelFile:`, err);
            // Si hay error, asumir que es archivo de modelo para usar fallback
            return true;
        }
    }

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
        
        // 🔧 Validación de tipos más flexible
        if (typeof metadata.model_cid !== 'string') {
            throw new Error('Metadatos inválidos: model_cid debe ser una cadena.');
        }
        
        // 🔧 Permitir diferentes formatos de CID (no solo bafy)
        const isValidCid = metadata.model_cid.startsWith('bafy') || 
                           metadata.model_cid.startsWith('Qm') || 
                           metadata.model_cid.startsWith('bafk') ||
                           metadata.model_cid.startsWith('bafz') ||
                           metadata.model_cid.length >= 32; // CID mínimo válido
        
        if (!isValidCid) {
            throw new Error(`Metadatos inválidos: model_cid '${metadata.model_cid}' no es un CID válido.`);
        }
        
        // 🔧 Permitir hash "unknown" para metadatos de fallback
        if (typeof metadata.model_hash !== 'string') {
            throw new Error('Metadatos inválidos: model_hash debe ser una cadena.');
        }
        
        if (metadata.model_hash !== "unknown" && metadata.model_hash.length < 32) {
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