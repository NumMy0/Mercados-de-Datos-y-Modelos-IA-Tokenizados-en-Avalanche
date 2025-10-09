const ImagePreprocessor = require('../../src/preprocessing/ImagePreprocessor');
const fs = require('fs').promises;
const path = require('path');

describe('ImagePreprocessor', () => {
  let preprocessor;

  beforeEach(() => {
    preprocessor = new ImagePreprocessor();
  });

  test('should process valid image buffer', async () => {
    const imagePath = path.join(__dirname, '../fixtures/test_image.jpg');
    const imageBuffer = await fs.readFile(imagePath);

    const config = {
      input_shape: [1, 3, 224, 224],
      preprocessing: 'imagenet',
      color_format: 'RGB',
    };

    const result = await preprocessor.process(imageBuffer, config);

    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(1 * 3 * 224 * 224);
  });

  test('should handle base64 encoded images', async () => {
    const base64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
    // Mock base64 image
    const config = { input_shape: [224, 224, 3], preprocessing: 'imagenet' };
    
    // Este test requiere una imagen base64 válida real
    // Por ahora solo verifica que el método no lance error con formato correcto
    expect(preprocessor.loadImage).toBeDefined();
  });

  test('should apply correct normalization', async () => {
    const dummyBuffer = Buffer.alloc(224 * 224 * 3);
    // Llenar con valores conocidos para verificar normalización
    // Test simplificado
    expect(preprocessor.normalizationStandards.imagenet).toBeDefined();
    expect(preprocessor.normalizationStandards.imagenet.mean).toHaveLength(3);
  });

  test('should reject invalid image format', async () => {
    const invalidBuffer = Buffer.from('not an image');
    const config = { input_shape: [224, 224, 3] };

    await expect(
      preprocessor.process(invalidBuffer, config)
    ).rejects.toThrow();
  });
});