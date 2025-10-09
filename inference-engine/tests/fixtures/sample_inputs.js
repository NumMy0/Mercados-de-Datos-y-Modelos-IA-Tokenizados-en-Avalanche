module.exports = {
  validImageRequest: {
    model_id: 'resnet18',
    input: {
      type: 'image',
      data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    },
    options: {
      top_k: 5,
      threshold: 0.1,
    },
  },

  validBatchRequest: {
    model_id: 'resnet18',
    inputs: [
      { type: 'image', data: 'data:image/jpeg;base64,...' },
      { type: 'image', data: 'data:image/jpeg;base64,...' },
    ],
    options: { top_k: 3 },
  },

  preloadRequest: {
    model_id: 'mobilenet',
    model_path: './models/mobilenet.onnx',
    metadata: {
      model_type: 'image_classification',
      input_shape: [1, 3, 224, 224],
      preprocessing: 'imagenet',
    },
    warmup: true,
  },
};
