# 🚀 Guía de Conexión Frontend - Inference Engine

Esta guía explica cómo ejecutar ambos servicios (frontend y inference-engine) de manera conjunta.

## 📋 Prerequisitos

- Node.js >= 18.0.0
- npm o pnpm
- MetaMask instalado en el navegador

## 🔧 Instalación

### Opción 1: Instalación Automática (Recomendado)

Desde el directorio raíz del proyecto:

```bash
npm install
npm run install:all
```

### Opción 2: Instalación Manual

```bash
# Instalar dependencias del root (concurrently)
npm install

# Instalar dependencias del frontend
cd frontend
npm install

# Instalar dependencias del inference-engine
cd ../inference-engine
npm install
```

## ⚙️ Configuración

### Frontend (.env)

El archivo `frontend/.env` ya está configurado con:

```env
# Inference Engine API
VITE_INFERENCE_API_URL=http://localhost:3001/api
```

### Inference Engine (.env)

El archivo `inference-engine/.env` ya está configurado con:

```env
PORT=3001
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000
```

## 🚀 Ejecución

### Opción 1: Ejecutar Ambos Servicios Juntos (Recomendado)

Desde el directorio raíz:

```bash
npm run dev
```

Esto iniciará:
- ✅ Frontend en `http://localhost:5173`
- ✅ Inference Engine en `http://localhost:3001`

### Opción 2: Ejecutar Servicios por Separado

#### Terminal 1 - Frontend:
```bash
cd frontend
npm run dev
```

#### Terminal 2 - Inference Engine:
```bash
cd inference-engine
npm run dev
```

## 🧪 Verificar la Conexión

1. **Health Check del Inference Engine:**
   ```bash
   curl http://localhost:3001/health
   ```
   
   Deberías recibir:
   ```json
   {
     "status": "healthy",
     "memory": {...},
     "uptime": "..."
   }
   ```

2. **Desde el Frontend:**
   - Abre `http://localhost:5173`
   - Navega a un modelo
   - Haz clic en "Ver Detalles"
   - Haz clic en "Ejecutar Inferencia con este Modelo"
   - Selecciona una imagen o texto
   - Haz clic en "Ejecutar Inferencia"

## 📡 Endpoints del Inference Engine

### Health Check
- **GET** `http://localhost:3001/health`
- Verifica que el servicio esté funcionando

### Ejecutar Inferencia
- **POST** `http://localhost:3001/api/inference`
- Body:
  ```json
  {
    "modelId": "1",
    "ipfsHash": "QmXxx...",
    "input": {
      "type": "image",
      "data": "data:image/jpeg;base64,..."
    }
  }
  ```

### Cargar Modelo desde IPFS
- **POST** `http://localhost:3001/api/models/load`
- Body:
  ```json
  {
    "ipfsHash": "QmXxx..."
  }
  ```

### Obtener Metadata de Modelo
- **GET** `http://localhost:3001/api/models/metadata/{ipfsHash}`

## 🎯 Flujo de Inferencia Completo

```
1. Usuario → Frontend → Selecciona modelo
                ↓
2. Usuario → Frontend → Abre "Ejecutar Inferencia"
                ↓
3. Usuario → Frontend → Sube imagen/texto
                ↓
4. Frontend → POST /api/inference → Inference Engine
                ↓
5. Inference Engine → Carga modelo desde IPFS (si es necesario)
                ↓
6. Inference Engine → Preprocesa entrada
                ↓
7. Inference Engine → Ejecuta inferencia ONNX
                ↓
8. Inference Engine → Posprocesa resultados
                ↓
9. Inference Engine → JSON Response → Frontend
                ↓
10. Frontend → Muestra resultados al usuario
```

## 🔍 Debugging

### Verificar CORS

Si ves errores de CORS en la consola del navegador:

1. Verifica que el Inference Engine esté corriendo en el puerto 3001
2. Verifica los orígenes permitidos en `inference-engine/.env`:
   ```env
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

### Verificar Conexión

Si el frontend no puede conectar con el inference engine:

1. Verifica que ambos servicios estén corriendo
2. Verifica la URL en `frontend/.env`:
   ```env
   VITE_INFERENCE_API_URL=http://localhost:3001/api
   ```

### Ver Logs

Los logs del inference engine aparecerán en la terminal donde lo ejecutaste.
Busca mensajes como:

```
🚀 Inference Engine started on http://0.0.0.0:3001
✅ CORS enabled for: http://localhost:5173, http://localhost:3000
📊 Environment: development
```

## 📦 Estructura de Archivos Clave

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InferenceModal.vue       # Modal de inferencia
│   │   │   └── ModelDetailsModal.vue    # Integra InferenceModal
│   │   └── composables/
│   │       └── useInference.ts          # Lógica de conexión con API
│   └── .env                             # Configuración frontend
│
├── inference-engine/
│   ├── src/
│   │   ├── server.js                    # Servidor Express
│   │   ├── config/
│   │   │   └── config.js                # Configuración CORS
│   │   └── routes/
│   │       ├── inference.routes.js      # Rutas de inferencia
│   │       └── model.routes.js          # Rutas de modelos
│   └── .env                             # Configuración inference engine
│
└── package.json                         # Scripts para ejecutar ambos
```

## 🛠️ Solución de Problemas Comunes

### Error: "Cannot connect to inference engine"

- **Causa:** El inference engine no está corriendo
- **Solución:** Ejecuta `npm run dev` desde el directorio raíz

### Error: "CORS policy blocked"

- **Causa:** Orígenes no configurados correctamente
- **Solución:** Verifica `CORS_ORIGINS` en `inference-engine/.env`

### Error: "Model not found"

- **Causa:** El modelo no se pudo cargar desde IPFS
- **Solución:** Verifica que el `ipfsHash` sea correcto

### Error: "Timeout"

- **Causa:** La inferencia tardó demasiado
- **Solución:** Aumenta `INFERENCE_TIMEOUT` en `inference-engine/.env`

## 📚 Recursos Adicionales

- [Documentación de la API de Inferencia](./inference-engine/docs/API.md)
- [Configuración de Modelos](./inference-engine/src/config/model-configs.js)
- [Ejemplos de Uso](./inference-engine/tests/fixtures/sample_inputs.js)

## ✨ Funcionalidades Implementadas

- ✅ Conexión Frontend ↔ Inference Engine
- ✅ CORS configurado correctamente
- ✅ Modal de inferencia interactivo
- ✅ Soporte para imágenes y texto
- ✅ Validación de licencias (preparado)
- ✅ Carga de modelos desde IPFS
- ✅ Procesamiento en tiempo real
- ✅ Manejo de errores
- ✅ Logs detallados

## 🎉 ¡Listo!

Ahora tienes un marketplace de IA completamente funcional con capacidades de inferencia en tiempo real.
