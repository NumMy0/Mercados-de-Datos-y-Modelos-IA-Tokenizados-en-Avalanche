// src/config/config.js (ACTUALIZADO)
module.exports = {
  // Configuración de modelos
  modelDir: process.env.MODEL_DIR || "./models",
  dataDir: process.env.DATA_DIR || "./data",
  maxModelsInMemory: parseInt(process.env.MAX_MODELS_IN_MEMORY) || 3,

  // Configuración de inferencia
  inferenceTimeout: parseInt(process.env.INFERENCE_TIMEOUT) || 30000,

  // Configuración de servidor
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || "0.0.0.0",
    cors: {
      enabled: true,
      origins: process.env.CORS_ORIGINS?.split(",") || [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
      ],
    },
  },

  nodeEnv: process.env.NODE_ENV || "development",

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",

  // NUEVA CONFIGURACIÓN IPFS CON MÚLTIPLES GATEWAYS
  IPFS_GATEWAYS: process.env.IPFS_GATEWAYS?.split(",") || [
    "https://ipfs.io/ipfs/",
    "https://dweb.link/ipfs/",
    "https://gateway.ipfs.io/ipfs/",
    "https://4everland.io/ipfs/",
    "https://w3s.link/ipfs/",
  ],
  IPFS_GATEWAY_URL: process.env.IPFS_GATEWAY_URL || "https://ipfs.io/ipfs/",
  IPFS_DOWNLOAD_TIMEOUT: parseInt(process.env.IPFS_DOWNLOAD_TIMEOUT) || 60000, // Aumentado a 60s
  MAX_DOWNLOAD_SIZE_MB: parseInt(process.env.MAX_DOWNLOAD_SIZE_MB) || 150, // Aumentado a 150MB
};
