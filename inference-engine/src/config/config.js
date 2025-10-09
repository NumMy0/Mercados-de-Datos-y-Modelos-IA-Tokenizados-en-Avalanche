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
};