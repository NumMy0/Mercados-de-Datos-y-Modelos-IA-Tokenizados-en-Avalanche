const request = require('supertest');
const app = require('../../src/server');
const path = require('path');
const fs = require('fs').promises;

describe('Inference API Integration Tests', () => {
  
  // Setup: precargar un modelo de prueba
  beforeAll(async () => {
    const modelPath = path.join(__dirname, '../../models/resnet18.onnx');
    const metadata = {
      model_type: 'image_classification',
      input_shape: [1, 3, 224, 224],
      preprocessing: 'imagenet',
    };

    await request(app)
      .post('/api/inference/preload')
      .send({
        model_id: 'test_resnet18',
        model_path: modelPath,
        metadata,
        warmup: true,
      });
  });

  test('GET / - should return service info', async () => {
    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBeDefined();
  });

  test('GET /health - should return health status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.memory).toBeDefined();
  });

  test('GET /api/inference/status - should return service status', async () => {
    const response = await request(app).get('/api/inference/status');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe('operational');
    expect(response.body.models).toBeDefined();
  });

  test('GET /api/inference/models/loaded - should list loaded models', async () => {
    const response = await request(app).get('/api/inference/models/loaded');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.models).toBeInstanceOf(Array);
    expect(response.body.count).toBeGreaterThanOrEqual(0);
  });

  test('POST /api/inference/execute - should execute inference with image', async () => {
    // Cargar imagen de prueba
    const imagePath = path.join(__dirname, '../../data/test_images/cat.jpg');
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await request(app)
      .post('/api/inference/execute')
      .send({
        model_id: 'test_resnet18',
        input: {
          type: 'image',
          data: `data:image/jpeg;base64,${base64Image}`,
        },
        options: {
          top_k: 5,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.predictions).toBeInstanceOf(Array);
    expect(response.body.predictions.length).toBeLessThanOrEqual(5);
    expect(response.body.execution_time_ms).toBeDefined();
    
    // Verificar estructura de predicción
    const firstPrediction = response.body.predictions[0];
    expect(firstPrediction.label).toBeDefined();
    expect(firstPrediction.confidence).toBeDefined();
    expect(firstPrediction.confidence).toBeGreaterThanOrEqual(0);
    expect(firstPrediction.confidence).toBeLessThanOrEqual(1);
  });

  test('POST /api/inference/execute - should fail with missing model_id', async () => {
    const response = await request(app)
      .post('/api/inference/execute')
      .send({
        input: {
          type: 'image',
          data: 'base64...',
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('model_id');
  });

  test('POST /api/inference/execute - should fail with invalid input', async () => {
    const response = await request(app)
      .post('/api/inference/execute')
      .send({
        model_id: 'test_resnet18',
        input: {
          type: 'invalid_type',
          data: 'data',
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('POST /api/inference/execute - should fail with unloaded model', async () => {
    const response = await request(app)
      .post('/api/inference/execute')
      .send({
        model_id: 'nonexistent_model',
        input: {
          type: 'image',
          data: 'base64...',
        },
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('not loaded');
  });

  test('POST /api/inference/batch - should handle batch inference', async () => {
    const imagePath = path.join(__dirname, '../../data/test_images/cat.jpg');
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await request(app)
      .post('/api/inference/batch')
      .send({
        model_id: 'test_resnet18',
        inputs: [
          { type: 'image', data: `data:image/jpeg;base64,${base64Image}` },
          { type: 'image', data: `data:image/jpeg;base64,${base64Image}` },
        ],
        options: { top_k: 3 },
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.predictions).toHaveLength(2);
    expect(response.body.batch_size).toBe(2);
    expect(response.body.avg_time_ms).toBeDefined();
  });

  test('POST /api/inference/batch - should fail with too large batch', async () => {
    const largeInputs = Array(15).fill({
      type: 'image',
      data: 'base64...',
    });

    const response = await request(app)
      .post('/api/inference/batch')
      .send({
        model_id: 'test_resnet18',
        inputs: largeInputs,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('too large');
  });
});
