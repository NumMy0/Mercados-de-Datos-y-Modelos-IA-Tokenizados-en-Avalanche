const ClassificationPostprocessor = require('../../src/postprocessing/ClassificationPostprocessor');

describe('ClassificationPostprocessor', () => {
  let postprocessor;

  beforeEach(() => {
    const labels = ['cat', 'dog', 'bird', 'fish', 'horse'];
    postprocessor = new ClassificationPostprocessor(labels);
  });

  test('should apply softmax correctly', () => {
    const logits = new Float32Array([1.0, 2.0, 3.0]);
    const probabilities = postprocessor.softmax(logits);

    // Verificar que suman 1
    const sum = probabilities.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);

    // Verificar orden (mayor logit = mayor probabilidad)
    expect(probabilities[2]).toBeGreaterThan(probabilities[1]);
    expect(probabilities[1]).toBeGreaterThan(probabilities[0]);
  });

  test('should return top-K predictions', () => {
    const output = new Float32Array([0.1, 0.5, 0.2, 0.05, 0.15]);
    const predictions = postprocessor.process(output, { top_k: 3 });

    expect(predictions).toHaveLength(3);
    expect(predictions[0].label).toBe('dog'); // índice 1, mayor valor
    expect(predictions[0].confidence).toBeGreaterThan(0);
    expect(predictions[1].label).toBe('bird'); // índice 2, segundo mayor
  });

  test('should filter by threshold', () => {
    const output = new Float32Array([0.8, 0.15, 0.03, 0.01, 0.01]);
    const predictions = postprocessor.process(output, {
      top_k: 5,
      threshold: 0.1,
    });

    // Solo 2 predicciones sobre 0.1
    expect(predictions.length).toBeLessThanOrEqual(2);
  });

  test('should calculate metrics correctly', () => {
    const predictions = [
      { label: 'cat', confidence: 0.8, index: 0 },
      { label: 'dog', confidence: 0.15, index: 1 },
      { label: 'bird', confidence: 0.05, index: 2 },
    ];

    const metrics = postprocessor.calculateMetrics(predictions);

    expect(metrics.topConfidence).toBe(0.8);
    expect(metrics.avgConfidence).toBeGreaterThan(0);
    expect(metrics.entropy).toBeDefined();
    expect(metrics.uncertainty).toMatch(/low|medium|high/);
  });
});