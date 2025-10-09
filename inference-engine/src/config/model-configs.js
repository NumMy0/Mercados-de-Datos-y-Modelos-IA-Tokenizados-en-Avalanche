module.exports = {
  // Configuraciones predefinidas para tipos de modelos comunes
  presets: {
    resnet: {
      input_shape: [1, 3, 224, 224],
      model_type: 'image_classification',
      preprocessing: 'imagenet',
      color_format: 'RGB',
    },
    mobilenet: {
      input_shape: [1, 3, 224, 224],
      model_type: 'image_classification',
      preprocessing: 'imagenet',
      color_format: 'RGB',
    },
    efficientnet: {
      input_shape: [1, 3, 224, 224],
      model_type: 'image_classification',
      preprocessing: 'imagenet',
      color_format: 'RGB',
    },
  },
  
  // Standards de normalización
  normalizationStandards: {
    imagenet: {
      mean: [0.485, 0.456, 0.406],
      std: [0.229, 0.224, 0.225],
    },
    inception: {
      mean: [0.5, 0.5, 0.5],
      std: [0.5, 0.5, 0.5],
    },
  },
};