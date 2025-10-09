// src/routes/model.routes.js (NUEVO)

const express = require('express');
const router = express.Router();
const IpfsService = require('../ipfs/IpfsService');
const logger = require('../utils/logger');
// Importar la misma instancia de ModelLoader desde el módulo de rutas de inferencia
const { modelLoader } = require('./inference.routes'); 

/**
 * POST /api/models/load
 * Carga el modelo desde IPFS, lo verifica y lo cachea. (Objetivo: Endpoints a Desarrollar)
 */
router.post('/load', async (req, res) => {
    try {
        const { tokenId, metadataCid, warmup = false } = req.body;

        if (!tokenId || !metadataCid) {
            return res.status(400).json({ error: 'Faltan tokenId o metadataCid.' });
        }
        
        const startTime = Date.now();
        // Carga/Hit/Descarga/Verificación/Caché
        const modelData = await modelLoader.loadModelFromIpfs(tokenId, metadataCid);
        
        // Warm-up (Se mueve aquí si lo requiere el llamador)
        if (warmup) {
            // Asume que el motor de inferencia puede calentar el modelo
            // const inferenceEngine = require('../inference/InferenceEngine');
            // await inferenceEngine.warmUp(modelData); 
            logger.info(`Warm-up solicitado para ${tokenId}`);
        }
        
        const loadTime = Date.now() - startTime;

        res.json({
            success: true,
            model_id: modelData.metadata.model_id,
            message: `Modelo '${tokenId}' cargado, verificado y en caché.`,
            load_time_ms: loadTime,
            cacheStatus: modelLoader.getCacheStatus()
        });
    } catch (error) {
        logger.error(`Error al cargar modelo desde IPFS: ${error.message}`);
        res.status(500).json({
             success: false,
             error: error.message,
             details: "Verifique el CID de metadatos, el hash o la conexión al gateway IPFS." // Manejo de 5 errores comunes
        });
    }
});

/**
 * GET /api/models/:metadataCid/metadata
 * Obtiene metadatos desde IPFS. (Objetivo: Endpoints a Desarrollar)
 */
router.get('/:metadataCid/metadata', async (req, res) => {
    try {
        const { metadataCid } = req.params;
        const metadata = await IpfsService.getMetadata(metadataCid);

        res.json({
            success: true,
            model_id: metadata.model_id,
            config: metadata.inference_config
        });
    } catch (error) {
        logger.error(`Error al obtener metadatos: ${error.message}`);
        res.status(404).json({
             success: false,
             error: error.message,
             details: "CID de metadatos no encontrado o inválido."
        });
    }
});

/**
 * GET /api/models/:metadataCid/verify
 * Verifica integridad del modelo. (Objetivo: Endpoints a Desarrollar)
 */
router.get('/:metadataCid/verify', async (req, res) => {
    try {
        const { metadataCid } = req.params;
        const metadata = await IpfsService.getMetadata(metadataCid);

        const modelCid = metadata.model_cid;
        const modelHash = metadata.model_hash;

        const modelBuffer = await IpfsService.fetchFile(modelCid, true);
        const verified = IpfsService.verifyHash(modelBuffer, modelHash);

        res.json({
            success: true,
            model_id: metadata.model_id,
            verified: verified,
            message: verified ? 'Integridad verificada.' : 'Advertencia: El hash no coincide.'
        });

    } catch (error) {
        logger.error(`Error durante la verificación: ${error.message}`);
        res.status(500).json({
             success: false,
             error: error.message,
             details: "Fallo durante la descarga o validación."
        });
    }
});


/**
 * GET /api/cache/status
 * Estado del caché. (Objetivo: Endpoints a Desarrollar)
 */
router.get('/cache/status', (req, res) => {
    const status = modelLoader.getCacheStatus();
    res.json({
        success: true,
        status: status
    });
});

/**
 * DELETE /api/cache/clear
 * Limpia caché. (Objetivo: Endpoints a Desarrollar)
 */
router.delete('/cache/clear', async (req, res) => {
    try {
        await modelLoader.clearCache();
        res.json({
            success: true,
            message: 'Caché de modelos limpiado correctamente.',
            status: modelLoader.getCacheStatus()
        });
    } catch (error) {
         logger.error(`Error al limpiar caché: ${error.message}`);
         res.status(500).json({
              success: false,
              error: error.message
         });
    }
});

module.exports = router;