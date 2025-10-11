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

  // CONFIGURACIÓN IPFS MEJORADA CON TU GATEWAY PERSONAL
  ipfs: {
    // Tu gateway principal (Pinata)
    // Se admite leer la configuración desde variables de entorno del backend
    // (`IPFS_GATEWAY_PRIMARY`) o desde la .env del frontend (`VITE_PINATA_GATEWAY`).
    primaryGateway:
      "https://gateway.pinata.cloud/ipfs/",

    // Gateways de respaldo en orden de prioridad
    fallbackGateways: [
      process.env.IPFS_GATEWAY_FALLBACK_1 || process.env.VITE_PINATA_GATEWAY ||
        "https://gateway.pinata.cloud/ipfs/",
      process.env.IPFS_GATEWAY_FALLBACK_2 || "https://ipfs.io/ipfs/",
      process.env.IPFS_GATEWAY_FALLBACK_3 || "https://dweb.link/ipfs/",
      process.env.IPFS_GATEWAY_FALLBACK_4 ||
        "https://cloudflare-ipfs.com/ipfs/",
      process.env.IPFS_GATEWAY_FALLBACK_5 || "https://4everland.io/ipfs/",
    ],

    // Configuraciones específicas por gateway
    gatewayConfig: {
      "magenta-used-firefly-552.mypinata.cloud": {
        timeout: 30000,
        retries: 3,
        headers: {
          "User-Agent": "AI-Model-Inference-Engine/1.0",
        },
      },
      "gateway.pinata.cloud": {
        timeout: 30000,
        retries: 3,
        headers: {
          "User-Agent": "AI-Model-Inference-Engine/1.0",
        },
      },
    },

    maxDownloadSizeMB: parseInt(process.env.MAX_DOWNLOAD_SIZE_MB) || 150,
    downloadTimeout: parseInt(process.env.DOWNLOAD_TIMEOUT_MS) || 60000,

    // Configuración de autenticación para Pinata (opcional)
  // Soporta PINATA_JWT (servidor) o VITE_PINATA_JWT (copiado del frontend .env)
  pinataJWT: process.env.PINATA_JWT || process.env.VITE_PINATA_JWT || null,
  },
};
