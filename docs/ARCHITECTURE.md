# 🏗️ Arquitectura del Sistema

## Componentes Principales

El sistema está compuesto por tres componentes principales que trabajan en conjunto:

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vue.js)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Marketplace │  │ User Profile │  │  Inference Modal │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
└────────────┬──────────────┬──────────────────┬──────────────┘
             │              │                  │
             │              │                  │
        [Web3]         [Web3]             [HTTP API]
             │              │                  │
             ▼              ▼                  ▼
┌────────────────────────────────┐  ┌─────────────────────────┐
│   SMART CONTRACT (Avalanche)   │  │   INFERENCE ENGINE      │
│  ┌──────────────────────────┐  │  │  ┌──────────────────┐   │
│  │  AIModelMarketplace.sol  │  │  │  │  Model Loader    │   │
│  │  - createModel()         │  │  │  │  - IPFS Fetch    │   │
│  │  - createLicensePlan()   │  │  │  │  - LRU Cache     │   │
│  │  - buyLicense()          │  │  │  └──────────────────┘   │
│  │  - buyModel()            │  │  │  ┌──────────────────┐   │
│  │  - hasValidLicense()     │  │  │  │ Inference Engine │   │
│  └──────────────────────────┘  │  │  │ - ONNX Runtime   │   │
│                                │  │  │ - Preprocessing  │   │
│  ┌──────────────────────────┐  │  │  │ - Postprocessing │   │
│  │      IPFS Storage        │  │  │  └──────────────────┘   │
│  │  - Model Files (.onnx)   │  │  │                         │
│  │  - Metadata JSON         │  │  │  Express API Server     │
│  │  - Labels/Categories     │  │  │  - /api/models/load     │
│  └──────────────────────────┘  │  │  - /api/inference/exec  │
└────────────────────────────────┘  └─────────────────────────┘
```

## Flujo de Datos

### 1. Subida de Modelo
```
Usuario → Frontend → IPFS (upload) → Smart Contract (mint NFT)
```

### 2. Compra de Licencia
```
Usuario → Frontend → Smart Contract (buyLicense) → Actualización on-chain
```

### 3. Ejecución de Inferencia
```
Usuario → Frontend → Inference Engine (HTTP)
                          ↓
                    Smart Contract (verificar licencia)
                          ↓
                    IPFS (descargar modelo si no está en caché)
                          ↓
                    ONNX Runtime (ejecutar)
                          ↓
                    Frontend (mostrar resultados)
```

## Tecnologías por Componente

### Frontend
- **Vue 3** con Composition API
- **TypeScript** para type safety
- **Vite** como build tool
- **Tailwind CSS** para estilos
- **ethers.js v6** para Web3
- **Vue Router** para navegación

### Smart Contract
- **Solidity ^0.8.20**
- **OpenZeppelin** (ERC-721, Ownable, ReentrancyGuard)
- **Avalanche C-Chain**
- **Hardhat** para deployment

### Inference Engine
- **Node.js + Express**
- **ONNX Runtime** para inferencias
- **Sharp** para procesamiento de imágenes
- **Axios** para comunicación con IPFS
- **Winston** para logging

## Patrones de Diseño

### Frontend
- **Composition API Pattern**: Lógica reutilizable en composables
- **Modal System**: Sistema centralizado de modales con scroll locking
- **Reactive State**: Estado reactivo con Vue 3 refs y computed

### Backend
- **Factory Pattern**: PreprocessorFactory, PostprocessorFactory
- **Singleton Pattern**: ModelLoader con caché LRU
- **Middleware Pattern**: Validación, error handling, timeouts
- **Repository Pattern**: ModelRegistry para gestión de modelos

### Smart Contract
- **Access Control**: Ownable para funciones administrativas
- **Reentrancy Guard**: Protección contra ataques de reentrada
- **Pull Payment Pattern**: Sistema de withdrawals seguros

## Seguridad

### Smart Contract
- ✅ ReentrancyGuard en funciones con transferencias
- ✅ Validaciones de ownership
- ✅ Checks-Effects-Interactions pattern
- ✅ OpenZeppelin battle-tested contracts

### Inference Engine
- ✅ Verificación de licencias on-chain
- ✅ Timeouts para prevenir DoS
- ✅ Rate limiting (configurable)
- ✅ Input validation
- ✅ Error handling robusto

### Frontend
- ✅ Validación de inputs del usuario
- ✅ Manejo seguro de wallets (nunca exponer private keys)
- ✅ CORS configurado correctamente
- ✅ Sanitización de outputs

## Escalabilidad

### Actual
- **Modelos en caché**: 3 simultáneos (LRU)
- **Throughput**: ~15 req/s por modelo cacheado
- **Latencia**: 66ms (warm), 1.5s (cold)

### Mejoras Futuras
- **Redis Cache**: Para caché distribuido
- **Queue System**: Bull/BullMQ para gestión de colas
- **Load Balancer**: Nginx para múltiples instancias
- **GPU Support**: ONNX Runtime GPU para inferencias más rápidas
- **CDN**: Para servir modelos frecuentes
