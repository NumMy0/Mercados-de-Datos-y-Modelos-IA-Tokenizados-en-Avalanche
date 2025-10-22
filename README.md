# 🧠 Mercado de Modelos IA Tokenizados en Avalanche

<div align="center">

![Blockchain](https://img.shields.io/badge/Blockchain-Avalanche-E84142?style=for-the-badge&logo=avalanche)
![Smart Contracts](https://img.shields.io/badge/Smart_Contracts-Solidity-363636?style=for-the-badge&logo=solidity)
![Frontend](https://img.shields.io/badge/Frontend-Vue.js-4FC08D?style=for-the-badge&logo=vue.js)
![AI Engine](https://img.shields.io/badge/AI_Engine-ONNX-005CED?style=for-the-badge)

**🥈 Segundo Lugar - Hackathon Blockchain & IA**

*Marketplace descentralizado para compra, venta y ejecución de modelos de IA tokenizados como NFTs*

</div>

---

## 👥 Equipo de Desarrollo

- **Juan Alejandro Salgado** - Blockchain & Smart Contracts
- **Juan Esteban Agudelo** - Motor de Inferencia & Backend
- **Santiago Rodríguez** - Frontend & Integración

> 🏆 Este proyecto obtuvo el **segundo lugar** en una hackathon de Blockchain e IA, destacando por su innovadora combinación de tokenización de modelos de IA con ejecución descentralizada verificada on-chain

---

## 🚀 Descripción del Proyecto

**Mercado de Modelos IA Tokenizados** es una plataforma descentralizada que revoluciona la forma en que los modelos de inteligencia artificial se comparten, comercializan y ejecutan.

### Características Clave

- 🎨 **Tokenización de Modelos**: Modelos IA como NFTs (ERC-721) en Avalanche
- 💰 **Monetización Flexible**: Sistema de licencias temporales personalizables
- ⚡ **Ejecución Verificada**: Motor de inferencia con validación on-chain
- 🔐 **Propiedad Garantizada**: Autoría verificable mediante blockchain
- 🌐 **Almacenamiento Distribuido**: Modelos en IPFS, metadata en blockchain

### Problema que Resuelve

Los modelos de IA son difíciles de monetizar, verificar su autoría y distribuir de forma segura. Nuestra solución:

1. **Propiedad Verificable** → Cada modelo es un NFT único
2. **Monetización Simple** → Planes de licencia flexibles (día/mes/año)
3. **Ejecución Confiable** → Verificación de licencias on-chain
4. **Distribución Segura** → IPFS + Blockchain

---

## ✨ Funcionalidades

| Para Creadores | Para Compradores | Para Desarrolladores |
|----------------|------------------|---------------------|
| ✅ Subir modelos ONNX | ✅ Explorar marketplace | ✅ API REST completa |
| ✅ Crear planes de licencia | ✅ Comprar licencias temporales | ✅ Integración Web3 |
| ✅ Vender NFTs | ✅ Comprar NFTs completos | ✅ ONNX Runtime |
| ✅ Retirar ganancias | ✅ Ejecutar inferencias | ✅ Sistema extensible |
| ✅ Dashboard personal | ✅ Renovar licencias | ✅ Documentación API |

---

## 🏗️ Arquitectura

```
┌─────────────────┐      ┌────────────────────┐      ┌─────────────────┐
│  Frontend       │      │  Smart Contract    │      │ Inference Engine│
│  (Vue.js)       │◄────►│  (Avalanche)       │◄────►│  (Node.js)      │
│                 │ Web3 │                    │ HTTP │                 │
│  - Marketplace  │      │  - NFTs (ERC-721)  │      │  - ONNX Runtime │
│  - Wallet UI    │      │  - Licencias       │      │  - LRU Cache    │
│  - Inference UI │      │  - IPFS Hash       │      │  - Preprocessing│
└─────────────────┘      └────────────────────┘      └─────────────────┘
         │                        │                           │
         └────────────────────────┴───────────────────────────┘
                              IPFS Storage
                         (Modelos + Metadata)
```

**Flujo Principal**:
1. Usuario sube modelo → IPFS → Smart Contract (mint NFT)
2. Usuario compra licencia → Smart Contract (pago + registro)
3. Usuario ejecuta inferencia → Engine verifica licencia → Ejecuta modelo

> 📖 **Documentación Detallada**: [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## 🚀 Instalación Rápida

### Prerrequisitos
- Node.js >= 18.0.0
- Metamask con AVAX (testnet o mainnet)
- npm o pnpm

### 1. Clonar e Instalar

```bash
# Clonar repositorio
git clone https://github.com/NumMy0/Mercados-de-Datos-y-Modelos-IA-Tokenizados-en-Avalanche.git
cd Mercados-de-Datos-y-Modelos-IA-Tokenizados-en-Avalanche

# Inference Engine
cd inference-engine
npm install
cp .env.example .env
npm run dev  # Puerto 3000

# Frontend (en otra terminal)
cd ../frontend
pnpm install
cp .env.example .env
pnpm dev  # Puerto 5173
```

### 2. Configurar Metamask

- **Red**: Avalanche Fuji Testnet
- **RPC**: https://api.avax-test.network/ext/bc/C/rpc
- **Chain ID**: 43113
- **Faucet**: https://faucet.avax.network/

### 3. Acceder

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`
- Health Check: `http://localhost:3000/health`

> 📖 **Guía Completa**: [INSTALLATION.md](./docs/INSTALLATION.md)

---

## 🧠 Motor de Inferencia

Motor optimizado de inferencia con ONNX Runtime que valida licencias on-chain antes de ejecutar.

### Características

- ⚡ **Performance**: ~66ms con modelo en caché, ~1.5s cold start
- 🔄 **Caché LRU**: 3 modelos simultáneos en memoria
- 🔐 **Seguro**: Verifica licencias en Smart Contract
- 📦 **Extensible**: Factory pattern para nuevos tipos de modelos
- 🎯 **Optimizado**: Preprocessing con Sharp, postprocessing con Softmax

### API Principal

```bash
# Ejecutar inferencia
POST /api/inference/execute
{
  "model_id": "resnet18_cache",
  "input_data": {
    "format": "base64_jpeg",
    "content": "..."
  },
  "options": { "top_k": 5 }
}

# Cargar modelo desde IPFS
POST /api/models/load
{
  "tokenId": "1",
  "metadataCid": "QmXxx...",
  "warmup": true
}
```

> 📖 **Documentación Completa**: [INFERENCE_ENGINE.md](./docs/INFERENCE_ENGINE.md)

---

## � Frontend

Aplicación Vue.js con integración Web3 completa y sistema de modales optimizado.

### Stack
- Vue 3 + TypeScript + Vite
- Tailwind CSS para estilos
- ethers.js v6 para Web3
- Vue Router para navegación

### Componentes Principales
- **Marketplace**: Grid de modelos con filtros
- **Profile**: Dashboard de modelos propios y licencias
- **Modales**: Upload, Buy, Inference, Withdraw
- **Wallet**: Conexión y gestión de wallet

> 📖 **Documentación Completa**: [FRONTEND.md](./docs/FRONTEND.md)

---

## 📜 Smart Contracts

Contrato `AIModelMarketplace.sol` que gestiona:
- NFTs de modelos (ERC-721)
- Planes de licencia flexibles
- Sistema de compra/venta
- Verificación de licencias
- Withdrawals seguros (ReentrancyGuard)

### Funciones Principales

```solidity
createModel(name, ipfsHash, price) → modelId
createLicensePlan(modelId, price, duration, name) → planId
buyLicense(modelId, planId) payable
hasValidLicense(modelId, user) → bool
buyModel(modelId) payable
withdraw()
```

> 📖 **Documentación Completa**: [SMART_CONTRACTS.md](./docs/SMART_CONTRACTS.md)

---

## 🎯 Casos de Uso

### 1. Investigador Monetiza su Modelo
- Entrena ResNet-18 custom
- Sube a plataforma (IPFS + mint NFT)
- Crea planes: 0.1 AVAX/día, 2.5 AVAX/mes
- Genera ingresos pasivos

### 2. Startup Compra Licencia
- Explora marketplace
- Prueba con inferencia
- Compra licencia anual (25 AVAX)
- Integra en producción vía API

### 3. Empresa Compra NFT Completo
- Identifica modelo crítico
- Compra NFT por 1000 AVAX
- Recibe todos los ingresos futuros
- Puede revender o modificar precios

---

## 📊 Métricas del Proyecto

- 🥈 **2º Lugar** en Hackathon Blockchain & IA
- ⚡ **<100ms** inferencias con caché
- 🔐 **100%** descentralizado (IPFS + Avalanche)
- 📝 **392 líneas** de Solidity
- 🎨 **15+ componentes** Vue
- ✅ **>75% coverage** en tests

---

## 🔮 Roadmap

- ✅ MVP con clasificación de imágenes
- ✅ Sistema de licencias flexible
- ✅ Marketplace completo
- 🚧 Object Detection (YOLO)
- 🚧 Text Generation (GPT-like)
- 📋 Sistema de ratings/reviews
- 📋 Multi-chain support
- 📋 Mobile app

---

## 📖 Documentación

- [🏗️ Arquitectura del Sistema](./docs/ARCHITECTURE.md)
- [🧠 Motor de Inferencia](./docs/INFERENCE_ENGINE.md)
- [💻 Frontend](./docs/FRONTEND.md)
- [📜 Smart Contracts](./docs/SMART_CONTRACTS.md)
- [🚀 Guía de Instalación](./docs/INSTALLATION.md)

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing`)
3. Commit cambios (`git commit -m 'Add feature'`)
4. Push (`git push origin feature/amazing`)
5. Abre un Pull Request

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE)

---

## 📞 Contacto

**Repositorio**: https://github.com/NumMy0/Mercados-de-Datos-y-Modelos-IA-Tokenizados-en-Avalanche

**Equipo**:
- Juan Alejandro Salgado (Blockchain)
- Juan Esteban Agudelo (Backend)
- Santiago Rodríguez (Frontend)

---

<div align="center">

**⭐ Si te gustó el proyecto, danos una estrella en GitHub ⭐**

Made with ❤️ during the Blockchain & AI Hackathon

</div>


