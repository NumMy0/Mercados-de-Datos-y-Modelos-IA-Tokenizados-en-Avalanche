# 🧠 Motor de Inferencia - Documentación Detallada

## Arquitectura Interna

```
Inference Engine (Node.js + Express)
│
├── 📦 Model Loader
│   ├── IPFS Service (descarga modelos)
│   ├── Metadata Parser (valida formato)
│   ├── LRU Cache (3 modelos en memoria)
│   └── Model Registry (índice de modelos)
│
├── 🔄 Preprocessing Pipeline
│   ├── Image Preprocessor (Sharp)
│   │   ├── Resize (224x224, 299x299)
│   │   ├── Normalize (ImageNet, Inception)
│   │   └── Color conversion (RGB/BGR)
│   └── Preprocessor Factory (extensible)
│
├── ⚡ Inference Engine
│   ├── ONNX Runtime (CPU/GPU)
│   ├── Session Manager
│   └── Warmup System
│
└── 📊 Postprocessing Pipeline
    ├── Classification Postprocessor
    │   ├── Softmax
    │   ├── Top-K predictions
    │   └── Confidence scores
    └── Postprocessor Factory (extensible)
```

## Caché LRU de Modelos

El motor implementa un sistema de caché LRU (Least Recently Used) que mantiene hasta **3 modelos** en memoria:

```javascript
// Ejemplo de funcionamiento del caché
// Estado inicial: []
loadModel("resnet18")     → Cache: [resnet18]
loadModel("mobilenet")    → Cache: [resnet18, mobilenet]
loadModel("efficientnet") → Cache: [resnet18, mobilenet, efficientnet]
loadModel("vgg16")        → Cache: [mobilenet, efficientnet, vgg16]
//                          ↑ resnet18 fue removido (LRU)
```

**Beneficios**:
- ✅ Inferencias subsecuentes ~60-80ms (sin carga de modelo)
- ✅ Primera inferencia incluye warm-up automático
- ✅ Uso eficiente de memoria RAM

## Pipeline Completo de Procesamiento

```
┌─────────────────────────────────────────────────────────┐
│ 1. RECEPCIÓN                                            │
│    - Request HTTP POST /api/inference/execute           │
│    - Validación de payload                              │
│    - Extracción de model_id e input_data                │
└───────────────────┬─────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 2. VERIFICACIÓN DE LICENCIA                             │
│    - Query a Smart Contract: hasValidLicense()          │
│    - Si no tiene licencia → Error 403                   │
│    - Si tiene licencia → Continuar                      │
└───────────────────┬─────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 3. CARGA DE MODELO                                      │
│    - Verificar caché LRU                                │
│    - Si está en caché → Usar sesión ONNX existente      │
│    - Si no está en caché:                               │
│      └─→ Descargar desde IPFS (usando metadata CID)     │
│      └─→ Parsear metadata.json                          │
│      └─→ Cargar en ONNX Runtime                         │
│      └─→ Guardar en caché (remover LRU si está lleno)   │
└───────────────────┬─────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 4. PREPROCESSING                                        │
│    - Detectar tipo de input (base64_jpeg, url, etc)     │
│    - Decodificar imagen con Sharp                       │
│    - Aplicar pipeline según metadata:                   │
│      • ImageNet: resize(224,224) + normalize([0.485,    │
│        0.456, 0.406], [0.229, 0.224, 0.225])            │
│      • Inception: resize(299,299) + normalize([0.5,     │
│        0.5, 0.5], [0.5, 0.5, 0.5])                      │
│    - Convertir a tensor Float32Array                    │
│    - Reshape a [1, 3, H, W] (NCHW format)               │
└───────────────────┬─────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 5. INFERENCIA (ONNX Runtime)                            │
│    - Ejecutar session.run(tensor)                       │
│    - Output: Float32Array con logits [1, num_classes]   │
│    - Tiempo típico: 40-50ms (ResNet-18 en CPU)          │
└───────────────────┬─────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 6. POSTPROCESSING                                       │
│    - Aplicar softmax a logits → probabilidades          │
│    - Ordenar por confianza (desc)                       │
│    - Tomar Top-K (ej. top_k=5)                          │
│    - Mapear índices a labels usando labels.json         │
│    - Calcular métricas (confidence, entropy)            │
└───────────────────┬─────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 7. RESPUESTA                                            │
│    {                                                    │
│      "predictions": [...],                              │
│      "metrics": {...},                                  │
│      "metadata": {...}                                  │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints

### POST `/api/inference/execute`

Ejecuta una inferencia con un modelo específico.

**Request Body**:
```json
{
  "model_id": "resnet18_cache",
  "execution_mode": "sync",
  "input_data": {
    "format": "base64_jpeg",
    "content": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA..."
  },
  "options": {
    "top_k": 5,
    "threshold": 0.1,
    "timeout": 30000
  }
}
```

**Response** (Success 200):
```json
{
  "success": true,
  "model_id": "resnet18_cache",
  "predictions": [
    {
      "class": "golden_retriever",
      "confidence": 0.9234,
      "class_id": 207
    },
    {
      "class": "labrador_retriever",
      "confidence": 0.0543,
      "class_id": 208
    }
  ],
  "metrics": {
    "inference_time_ms": 45,
    "preprocessing_time_ms": 18,
    "postprocessing_time_ms": 3,
    "total_time_ms": 66
  }
}
```

**Errores Comunes**:
```json
// 403 - Sin licencia válida
{
  "error": "No valid license",
  "message": "You need an active license to use this model"
}

// 404 - Modelo no encontrado
{
  "error": "Model not found",
  "suggestion": "Use /api/models/load endpoint first"
}
```

### POST `/api/models/load`

Carga un modelo desde IPFS y lo guarda en caché.

**Request Body**:
```json
{
  "tokenId": "1",
  "metadataCid": "QmXxx...abc",
  "warmup": true
}
```

**Response** (Success 200):
```json
{
  "success": true,
  "model_id": "resnet18_cache",
  "message": "Modelo cargado y en caché",
  "load_time_ms": 1243,
  "cacheStatus": {
    "current_size": 2,
    "max_size": 3,
    "models_in_cache": ["mobilenet_cache", "resnet18_cache"]
  }
}
```

### GET `/api/inference/formats`

Obtiene los formatos de entrada soportados.

### GET `/health`

Health check del servicio.

## Escenarios de Inferencia

### Escenario 1: Primera Inferencia (Cold Start)

```
Usuario → Frontend → Inference Engine
                           │
                           ├─→ Verificar licencia (Smart Contract) ✅
                           ├─→ Buscar en caché ❌ NOT FOUND
                           ├─→ Descargar desde IPFS ⏱ ~1200ms
                           ├─→ Cargar en ONNX Runtime ⏱ ~300ms
                           ├─→ Preprocessing ⏱ ~18ms
                           ├─→ Inferencia ⏱ ~45ms
                           ├─→ Postprocessing ⏱ ~3ms
                           └─→ Respuesta
                                   Total: ~1566ms
```

### Escenario 2: Inferencias Subsecuentes (Warm State)

```
Usuario → Frontend → Inference Engine
                           │
                           ├─→ Verificar licencia ✅
                           ├─→ Buscar en caché ✅ FOUND!
                           ├─→ Preprocessing ⏱ ~18ms
                           ├─→ Inferencia (sesión cacheada) ⏱ ~45ms
                           ├─→ Postprocessing ⏱ ~3ms
                           └─→ Respuesta
                                   Total: ~66ms ⚡
```

## Performance Benchmarks

| Operación | Tiempo | Notas |
|-----------|--------|-------|
| Carga desde IPFS | ~1200ms | Primera vez |
| Warm-up ONNX | ~300ms | Incluido en carga |
| Hit de caché | ~0ms | Instantáneo |
| Preprocessing (224x224) | 15-25ms | Sharp optimizado |
| Inferencia ResNet-18 | 40-50ms | CPU Intel i7 |
| Postprocessing | 2-5ms | Softmax + Top-K |
| **Total (cold)** | **~1566ms** | Con descarga IPFS |
| **Total (warm)** | **~66ms** | Modelo en caché ⚡ |

## Configuración

### Variables de Entorno

```bash
# .env
PORT=3000
NODE_ENV=development
MODEL_DIR=./models
DATA_DIR=./data
MAX_MODELS_IN_MEMORY=3
INFERENCE_TIMEOUT=30000
LOG_LEVEL=info

# Blockchain
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
CONTRACT_ADDRESS=0x...
```

## Extensibilidad

### Agregar Nuevo Tipo de Modelo

1. Crear Preprocessor:
```javascript
// src/preprocessing/ObjectDetectionPreprocessor.js
class ObjectDetectionPreprocessor {
  async preprocess(input, metadata) {
    // Lógica específica
  }
}
```

2. Crear Postprocessor:
```javascript
// src/postprocessing/ObjectDetectionPostprocessor.js
class ObjectDetectionPostprocessor {
  process(output, options) {
    // Lógica de bounding boxes
  }
}
```

3. Registrar en Factory:
```javascript
// src/preprocessing/PreprocessorFactory.js
if (metadata.model_type === 'object_detection') {
  return new ObjectDetectionPreprocessor();
}
```
