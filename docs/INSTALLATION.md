# 🚀 Guía de Instalación Completa

## Prerrequisitos

- **Node.js** >= 18.0.0
- **npm** o **pnpm**
- **Metamask** u otro wallet Web3
- **AVAX** en testnet (Fuji) o mainnet
- **Git** para clonar el repositorio

## Instalación Paso a Paso

### 1. Clonar Repositorio

```bash
git clone https://github.com/NumMy0/Mercados-de-Datos-y-Modelos-IA-Tokenizados-en-Avalanche.git
cd Mercados-de-Datos-y-Modelos-IA-Tokenizados-en-Avalanche
```

### 2. Configurar Inference Engine

#### Instalar Dependencias

```bash
cd inference-engine
npm install
```

#### Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuración
nano .env  # o usar tu editor preferido
```

**Contenido del .env**:
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Model Configuration
MODEL_DIR=./models
DATA_DIR=./data
MAX_MODELS_IN_MEMORY=3

# Inference Configuration
INFERENCE_TIMEOUT=30000

# Logging
LOG_LEVEL=info

# Blockchain (opcional para verificación de licencias)
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
CONTRACT_ADDRESS=0x...  # Tu dirección de contrato
```

#### Iniciar Servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

El motor estará disponible en `http://localhost:3000`

**Verificar funcionamiento**:
```bash
curl http://localhost:3000/health
```

### 3. Configurar Frontend

#### Instalar Dependencias

```bash
cd ../frontend

# Con pnpm (recomendado)
pnpm install

# O con npm
npm install
```

#### Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuración
nano .env
```

**Contenido del .env**:
```bash
# Smart Contract
VITE_CONTRACT_ADDRESS=0x...  # Dirección del contrato desplegado

# Network
VITE_CHAIN_ID=43113  # Avalanche Fuji Testnet (43114 para mainnet)

# Inference Engine
VITE_INFERENCE_ENGINE_URL=http://localhost:3000

# IPFS (opcional)
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

#### Iniciar Servidor de Desarrollo

```bash
# Con pnpm
pnpm dev

# O con npm
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### 4. Configurar Wallet (Metamask)

#### Agregar Red Avalanche Fuji Testnet

Abrir Metamask y agregar red con los siguientes parámetros:

- **Network Name**: Avalanche Fuji C-Chain
- **RPC URL**: https://api.avax-test.network/ext/bc/C/rpc
- **Chain ID**: 43113
- **Currency Symbol**: AVAX
- **Block Explorer**: https://testnet.snowtrace.io/

#### Obtener AVAX de Testnet

Visita el faucet oficial de Avalanche:
- https://faucet.avax.network/

Pasos:
1. Conectar tu wallet
2. Seleccionar "C-Chain"
3. Solicitar AVAX (recibirás ~2 AVAX)

### 5. Desplegar Smart Contract (Opcional)

Si quieres desplegar tu propia instancia del contrato:

#### Instalar Hardhat

```bash
cd frontend
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

#### Configurar Hardhat

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [process.env.PRIVATE_KEY] // Tu private key
    }
  }
};
```

#### Crear Script de Deployment

```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const AIMarketplace = await hre.ethers.getContractFactory("AIModelMarketplace");
  const marketplace = await AIMarketplace.deploy();
  await marketplace.deployed();
  
  console.log("AIModelMarketplace deployed to:", marketplace.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

#### Desplegar

```bash
# Compilar contrato
npx hardhat compile

# Desplegar en Fuji Testnet
npx hardhat run scripts/deploy.js --network fuji

# Verificar en Snowtrace
npx hardhat verify --network fuji CONTRACT_ADDRESS
```

### 6. Configuración Avanzada (Opcional)

#### PM2 para Producción (Inference Engine)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar con PM2
cd inference-engine
pm2 start src/server.js --name inference-engine

# Ver logs
pm2 logs inference-engine

# Auto-start on reboot
pm2 startup
pm2 save
```

#### Nginx como Reverse Proxy

```nginx
# /etc/nginx/sites-available/ai-marketplace
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Inference Engine API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        
        # Timeouts para inferencias
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Límite de tamaño
        client_max_body_size 10M;
    }
}
```

#### Docker Compose (Opción Avanzada)

```yaml
# docker-compose.yml
version: '3.8'

services:
  inference-engine:
    build: ./inference-engine
    ports:
      - "3000:3000"
    volumes:
      - ./inference-engine/models:/app/models
      - ./inference-engine/data:/app/data
    environment:
      - NODE_ENV=production
      - MAX_MODELS_IN_MEMORY=3
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - inference-engine
    environment:
      - VITE_INFERENCE_ENGINE_URL=http://inference-engine:3000
    restart: unless-stopped
```

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

## Troubleshooting

### Problema: npm install falla con onnxruntime-node

**Solución**:
```bash
# Linux/Ubuntu
sudo apt-get install build-essential python3

# macOS
xcode-select --install

# Reinstalar
npm rebuild onnxruntime-node
```

### Problema: Sharp falla al instalar

**Solución**:
```bash
# Linux
sudo apt-get install libvips-dev

# macOS
brew install vips

# Reinstalar
npm rebuild sharp
```

### Problema: Metamask no conecta

**Verificar**:
1. Red correcta seleccionada (Fuji Testnet)
2. Chain ID correcto en .env (43113)
3. Wallet desbloqueada
4. Suficiente AVAX para gas fees

### Problema: Inference Engine retorna 404

**Verificar**:
1. Servidor corriendo en puerto 3000
2. CORS configurado correctamente
3. URL correcta en .env del frontend
4. Firewall no bloqueando puerto

## Verificación de Instalación

### Checklist Final

- [ ] Inference Engine responde en `http://localhost:3000/health`
- [ ] Frontend carga en `http://localhost:5173`
- [ ] Metamask conectado a Fuji Testnet
- [ ] AVAX en wallet (>0.1 AVAX)
- [ ] Puede conectar wallet al frontend
- [ ] Puede ver modelos en el marketplace

### Test de Integración Completa

1. **Conectar Wallet** en el frontend
2. **Crear un modelo de prueba** (si eres owner)
3. **Explorar marketplace** de modelos
4. **Comprar una licencia** de prueba
5. **Ejecutar una inferencia** con el modal

Si todos estos pasos funcionan, ¡la instalación está completa! 🎉

## Próximos Pasos

- Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para entender la arquitectura
- Ver [INFERENCE_ENGINE.md](./INFERENCE_ENGINE.md) para detalles del motor
- Ver [SMART_CONTRACTS.md](./SMART_CONTRACTS.md) para contratos
- Ver [FRONTEND.md](./FRONTEND.md) para desarrollo frontend
