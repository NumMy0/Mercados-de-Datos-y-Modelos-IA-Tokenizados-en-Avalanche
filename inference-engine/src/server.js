require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const inferenceRoutes = require('./routes/inference.routes');
const logger = require('./utils/logger');
const config = require('./config/config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad y utilidad
app.use(helmet());
app.use(cors());
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Parsing de JSON con límite de tamaño
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Inference Engine',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
    },
    uptime: Math.round(process.uptime()) + ' seconds',
  });
});

// Rutas de inferencia
app.use('/api/inference', inferenceRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  // No revelar stack trace en producción
  const errorResponse = {
    success: false,
    error: err.message || 'Internal server error',
  };

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  res.status(err.statusCode || 500).json(errorResponse);
});

// Manejo de señales de terminación
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  logger.info('Shutdown signal received, closing server...');
  
  // Cerrar servidor HTTP
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Limpiar recursos (modelos en memoria, etc.)
  try {
    // Aquí se limpiarían los modelos cargados
    logger.info('Resources cleaned up');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  logger.info(`🚀 Inference Engine started on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`💾 Max models in memory: ${config.maxModelsInMemory}`);
  logger.info(`⏱️  Inference timeout: ${config.inferenceTimeout}ms`);
});

module.exports = app;