# 🚀 Motor de Inferencia - Formato de Payload Estándar

## 📋 Resumen

El motor de inferencia ahora utiliza un **formato de payload estándar** que soporta múltiples tipos de datos de entrada de manera unificada y extensible.

## 🎯 Formato de Payload Principal

### POST `/api/inference/execute`

```json
{
  "model_id": "mi_mobilenet_cache",     // La clave para buscar en la caché
  "execution_mode": "sync",             // Opcional: define si la llamada es síncrona/asíncrona
  "input_data": {                       // El campo contenedor de datos genérico
    "format": "base64_jpeg",            // Describe el tipo de codificación
    "content": "/9j/4AAQSkZJ..."        // Los datos de entrada
  },
  "options": {                          // Opciones de procesamiento
    "top_k": 5,                         // Opcional: Sobreescribe el topk de la metadata
    "threshold": 0.5,                   // Opcional: Umbral de confianza
    "timeout": 30000                    // Opcional: Timeout en milisegundos
  }
}
```

## 📊 Formatos Soportados

### 🖼️ Imágenes
- `base64_jpeg` - Imagen JPEG codificada en base64
- `base64_png` - Imagen PNG codificada en base64
- `base64_webp` - Imagen WebP codificada en base64
- `base64_gif` - Imagen GIF codificada en base64
- `binary_jpeg` - Datos binarios JPEG directos
- `binary_png` - Datos binarios PNG directos

### 📝 Texto
- `raw_text` - Texto plano sin codificar
- `base64_text` - Texto codificado en base64
- `json_text` - Texto estructurado en formato JSON

### 🎵 Audio (Futuro)
- `base64_wav` - Audio WAV codificado en base64
- `base64_mp3` - Audio MP3 codificado en base64

### 🧮 Tensores Directos (Avanzado)
- `raw_tensor` - Array de números (Float32Array)
- `base64_tensor` - Tensor serializado en base64

## 📝 Ejemplos de Uso

### Imagen en Base64
```json
{
  "model_id": "resnet18_cache",
  "execution_mode": "sync",
  "input_data": {
    "format": "base64_jpeg",
    "content": "/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"
  },
  "options": {
    "top_k": 3,
    "threshold": 0.1
  }
}
```

### Texto Plano
```json
{
  "model_id": "bert_sentiment_cache",
  "execution_mode": "sync",
  "input_data": {
    "format": "raw_text",
    "content": "Este es un ejemplo de texto para análisis de sentimientos"
  },
  "options": {
    "top_k": 2
  }
}
```

### Texto JSON Estructurado
```json
{
  "model_id": "nlp_model_cache",
  "execution_mode": "sync",
  "input_data": {
    "format": "json_text",
    "content": "{\"text\": \"Analizar este texto\", \"metadata\": {\"lang\": \"es\"}}"
  },
  "options": {
    "threshold": 0.7
  }
}
```

## 📤 Formato de Respuesta

```json
{
  "success": true,
  "model_id": "mi_mobilenet_cache",
  "execution_mode": "sync",
  "results": {
    "predictions": [
      {
        "class": "Gato",
        "confidence": 0.95,
        "index": 281
      },
      {
        "class": "Perro",
        "confidence": 0.03,
        "index": 243
      }
    ],
    "metrics": {
      "total_confidence": 0.98,
      "top_confidence": 0.95,
      "entropy": 0.12
    }
  },
  "performance": {
    "total_time_ms": 1450,
    "inference_time_ms": 1200,
    "preprocessing_time_ms": 250
  },
  "metadata": {
    "input_format": "base64_jpeg",
    "model_type": "image_classification",
    "timestamp": "2025-10-11T01:30:00.000Z"
  }
}
```

## 🔄 Procesamiento por Lotes

### POST `/api/inference/batch`

```json
{
  "model_id": "mi_mobilenet_cache",
  "execution_mode": "sync",
  "input_data_list": [
    {
      "format": "base64_jpeg",
      "content": "/9j/4AAQSkZJ..."
    },
    {
      "format": "base64_png", 
      "content": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
  ],
  "options": {
    "top_k": 5,
    "threshold": 0.1
  }
}
```

## 🔍 Obtener Formatos Soportados

### GET `/api/inference/formats`

Retorna la lista completa de formatos soportados y un ejemplo de payload.

## ⚙️ Configuración de Modelos

Los modelos deben incluir metadata de preprocessing en su configuración:

```json
{
  "model_id": "resnet18",
  "inference_config": {
    "model_type": "image_classification",
    "input_shape": [1, 3, 224, 224],
    "preprocessing": "imagenet",
    "color_format": "RGB"
  }
}
```

Para texto:
```json
{
  "model_id": "bert_base",
  "inference_config": {
    "model_type": "text_classification", 
    "input_shape": [1, 512],
    "preprocessing": "basic_tokenization",
    "max_length": 512
  }
}
```

## 🛠️ Manejo de Errores

### Errores de Validación
```json
{
  "success": false,
  "error": "Invalid input_data format",
  "details": ["input_data.format is required"],
  "supported_formats": {
    "formats": ["base64_jpeg", "raw_text", ...],
    "categories": {...}
  }
}
```

### Modelo No Cargado
```json
{
  "success": false,
  "error": "Model mi_model not loaded in cache",
  "suggestion": "Use /api/models/load endpoint first to fetch it from IPFS",
  "model_id": "mi_model"
}
```

### Error de Preprocessing
```json
{
  "success": false,
  "error": "Preprocessing failed",
  "details": "Image processing failed: Invalid image format",
  "input_format": "base64_jpeg"
}
```

## 🔧 Migración desde Formato Anterior

### Antes (Formato Antiguo)
```json
{
  "model_id": "resnet18",
  "input": {
    "type": "image",
    "data": "base64_string..."
  },
  "options": {
    "top_k": 5
  }
}
```

### Ahora (Formato Nuevo)
```json
{
  "model_id": "resnet18",
  "execution_mode": "sync",
  "input_data": {
    "format": "base64_jpeg",
    "content": "base64_string..."
  },
  "options": {
    "top_k": 5
  }
}
```

## 🎯 Características Principales

- ✅ **Formato Unificado**: Un solo formato para todos los tipos de datos
- ✅ **Extensible**: Fácil agregar nuevos formatos sin romper compatibilidad
- ✅ **Auto-detección**: El motor detecta automáticamente cómo procesar cada formato
- ✅ **Validación Robusta**: Validación completa de estructura y formatos
- ✅ **Errores Descriptivos**: Mensajes de error claros con sugerencias
- ✅ **Metadata Rica**: Información detallada en respuestas
- ✅ **Performance**: Métricas de tiempo detalladas
- ✅ **Batch Processing**: Soporte para procesamiento por lotes
- ✅ **Backward Compatible**: Preparado para funcionalidades futuras

## 🔮 Funcionalidades Futuras

- 🔄 **Modo Asíncrono**: `execution_mode: "async"` para inferencias largas
- 🎵 **Soporte de Audio**: Implementación completa de formatos de audio
- 🎥 **Video**: Soporte para análisis de video frame por frame
- 📊 **Streaming**: Inferencia en tiempo real con streams de datos
- 🔀 **Pipeline**: Cadenas de modelos para procesamiento complejo

---

*El motor de inferencia está ahora preparado para manejar cualquier tipo de dato de entrada de manera escalable y mantenible.*