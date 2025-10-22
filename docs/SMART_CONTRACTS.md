# 📜 Smart Contracts - Documentación Detallada

## AIModelMarketplace.sol

Contrato principal que gestiona todo el marketplace de modelos IA tokenizados.

## Funciones Principales

### 1. Crear Modelo (Mint NFT)

```solidity
function createModel(
    string memory name,
    string memory ipfsHash,
    uint256 basePrice
) external returns (uint256 modelId)
```

**Descripción**: Crea un nuevo modelo como NFT y lo registra en el marketplace.

**Parámetros**:
- `name`: Nombre del modelo
- `ipfsHash`: CID de IPFS donde está almacenado el modelo
- `basePrice`: Precio base sugerido (en wei)

**Retorna**: ID del modelo creado

**Eventos**: `ModelCreated`

### 2. Crear Plan de Licencia

```solidity
function createLicensePlan(
    uint256 modelId,
    uint256 price,      // En wei
    uint256 duration,   // En segundos
    string memory name
) external returns (uint256 planId)
```

**Descripción**: Crea un plan de licencia para un modelo específico.

**Requisitos**: Debe ser el owner del modelo

**Ejemplo**:
```javascript
// Plan diario: 0.1 AVAX, 1 día
await contract.createLicensePlan(
  modelId,
  ethers.parseEther("0.1"),
  86400, // 24 horas
  "Daily Plan"
);
```

### 3. Comprar Licencia

```solidity
function buyLicense(
    uint256 modelId,
    uint256 planId
) external payable
```

**Descripción**: Compra una licencia temporal para usar un modelo.

**Requisitos**: 
- El plan debe estar activo
- Enviar el precio exacto del plan
- El modelo debe existir

**Efectos**:
- Transfiere AVAX al owner del modelo
- Registra la licencia con fecha de expiración
- Emite evento `LicensePurchased`

### 4. Verificar Licencia

```solidity
function hasValidLicense(
    uint256 modelId,
    address user
) external view returns (bool)
```

**Descripción**: Verifica si un usuario tiene una licencia válida para un modelo.

**Uso**: El Inference Engine llama esta función antes de ejecutar inferencias.

**Retorna**: `true` si la licencia es válida y no ha expirado, `false` en caso contrario.

### 5. Poner Modelo en Venta

```solidity
function setModelForSale(
    uint256 modelId,
    uint256 price
) external
```

**Descripción**: Pone el NFT del modelo en venta.

**Requisitos**: Debe ser el owner del modelo

**Efectos**:
- Marca el modelo como `forSale = true`
- Establece el precio de venta

### 6. Comprar Modelo (NFT completo)

```solidity
function buyModel(uint256 modelId) external payable
```

**Descripción**: Compra el NFT completo del modelo, transfiriendo la propiedad.

**Requisitos**:
- El modelo debe estar en venta
- Enviar el precio exacto

**Efectos**:
- Transfiere el NFT al comprador
- Transfiere AVAX al vendedor
- Los planes de licencia se mantienen
- Futuras compras de licencias benefician al nuevo owner

### 7. Renovar Licencia

```solidity
function renewLicense(
    uint256 modelId,
    uint256 planId
) external payable
```

**Descripción**: Renueva una licencia existente, extendiendo su duración.

**Efectos**: Suma la duración del plan a la fecha de expiración actual.

### 8. Retirar Fondos

```solidity
function withdraw() external nonReentrant
```

**Descripción**: Permite retirar las ganancias acumuladas por ventas de licencias.

**Seguridad**: 
- Protected por `ReentrancyGuard`
- Implementa pull payment pattern
- Verifica saldo antes de transferir

## Eventos Principales

```solidity
event ModelCreated(
    uint256 indexed modelId,
    address indexed author,
    string name,
    string ipfsHash
);

event LicensePlanCreated(
    uint256 indexed modelId,
    uint256 indexed planId,
    uint256 price,
    uint256 duration,
    string name
);

event LicensePurchased(
    uint256 indexed modelId,
    uint256 indexed planId,
    address indexed buyer,
    uint256 expiresAt
);

event LicenseRenewed(
    uint256 indexed modelId,
    address indexed user,
    uint256 newExpiresAt
);

event ModelSold(
    uint256 indexed modelId,
    address indexed from,
    address indexed to,
    uint256 price
);

event Withdrawal(
    address indexed user,
    uint256 amount
);
```

## Estructuras de Datos

```solidity
struct Model {
    uint256 id;
    address author;     // Owner actual del NFT
    string name;
    string ipfsHash;    // CID del modelo en IPFS
    uint256 basePrice;  // Precio base sugerido
    uint256[] planIds;  // IDs de planes asociados
    bool forSale;       // Si está a la venta
    uint256 salePrice;  // Precio de venta
}

struct LicensePlan {
    uint256 price;      // Precio en wei
    uint256 duration;   // Duración en segundos
    string name;        // Nombre del plan
    bool active;        // Si el plan está activo
}

struct License {
    uint256 expiresAt;  // Timestamp de expiración
    uint256 planId;     // ID del plan usado
}
```

## Diagrama de Estados

```
┌─────────────────────────────────────────────────────────┐
│                   CICLO DE VIDA DEL MODELO              │
└─────────────────────────────────────────────────────────┘

1. CREACIÓN
   createModel()
   └─→ NFT minted (ERC-721)
       • Owner: creator address
       • IPFS Hash guardado
       • forSale = false

2. CONFIGURACIÓN DE LICENCIAS
   createLicensePlan() (múltiples veces)
   └─→ Planes disponibles
       • Plan 1: 0.1 AVAX / día
       • Plan 2: 2.5 AVAX / mes
       • Plan 3: 25 AVAX / año

3. VENTA DE LICENCIAS
   buyLicense()
   └─→ Usuario adquiere acceso temporal
       • Pago en AVAX
       • Licencia activa por duración
       • Owner del modelo recibe pago

4. (OPCIONAL) VENTA DEL NFT
   setModelForSale() → buyModel()
   └─→ Transferencia completa
       • Nuevo owner del NFT
       • Todos los ingresos futuros al nuevo owner
       • Planes de licencia se mantienen

5. RENOVACIÓN
   renewLicense()
   └─→ Extender licencia existente
       • Pago adicional
       • Nueva fecha de expiración = actual + duración
```

## Seguridad

### Protecciones Implementadas

1. **ReentrancyGuard**: Protección contra ataques de reentrada en `withdraw()` y `buyModel()`

2. **Access Control**: 
   - Solo el owner puede crear planes de licencia
   - Solo el owner puede poner el modelo en venta
   - Solo el owner puede desactivar planes

3. **Checks-Effects-Interactions**: 
   - Verificaciones antes de transferencias
   - Cambios de estado antes de llamadas externas

4. **Pull Payment Pattern**: 
   - Fondos se acumulan en `pendingWithdrawals`
   - Usuario retira cuando quiera (no push payments)

### Validaciones

```solidity
// Ejemplo de validaciones en buyLicense
require(models[modelId].id != 0, "Model does not exist");
require(plan.active, "Plan is not active");
require(msg.value == plan.price, "Incorrect payment amount");
```

## Deployment

### Testnet (Avalanche Fuji)

```bash
npx hardhat run scripts/deploy.js --network fuji
```

### Mainnet (Avalanche C-Chain)

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

### Verificación en Snowtrace

```bash
npx hardhat verify --network fuji CONTRACT_ADDRESS
```

## Interacción desde Frontend

Ver ejemplos completos en [FRONTEND.md](./FRONTEND.md)

```typescript
// Ejemplo rápido
const contract = new ethers.Contract(address, abi, signer);

// Crear modelo
const tx = await contract.createModel(
  "ResNet-18",
  "QmXxx...abc",
  ethers.parseEther("10")
);
await tx.wait();

// Comprar licencia
const tx2 = await contract.buyLicense(1, 0, {
  value: ethers.parseEther("0.1")
});
await tx2.wait();
```

## Gas Costs Estimados

| Función | Gas Estimado | Costo en AVAX* |
|---------|--------------|----------------|
| createModel | ~150,000 | ~0.004 AVAX |
| createLicensePlan | ~100,000 | ~0.003 AVAX |
| buyLicense | ~80,000 | ~0.002 AVAX |
| buyModel | ~120,000 | ~0.003 AVAX |
| withdraw | ~50,000 | ~0.001 AVAX |

*Asumiendo 25 nAVAX/gas (puede variar)
