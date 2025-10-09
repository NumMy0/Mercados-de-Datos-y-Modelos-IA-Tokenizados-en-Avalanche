// src/config/config.js (ACTUALIZADO)
module.exports = {
  // Configuración de modelos
  modelDir: process.env.MODEL_DIR || './models',
  dataDir: process.env.DATA_DIR || './data',
  maxModelsInMemory: parseInt(process.env.MAX_MODELS_IN_MEMORY) || 3,
  
  // Configuración de inferencia
  inferenceTimeout: parseInt(process.env.INFERENCE_TIMEOUT) || 30000,
  
  // Configuración de servidor
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // NUEVA CONFIGURACIÓN IPFS
  IPFS_GATEWAY_URL: process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/',
  IPFS_DOWNLOAD_TIMEOUT: parseInt(process.env.IPFS_DOWNLOAD_TIMEOUT) || 30000,
  MAX_DOWNLOAD_SIZE_MB: parseInt(process.env.MAX_DOWNLOAD_SIZE_MB) || 50,
};