# 💻 Frontend - Documentación Detallada

## Stack Tecnológico

- **Vue 3** (Composition API) - Framework reactivo
- **TypeScript** - Type safety
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Utility-first styling
- **ethers.js v6** - Interacción con blockchain
- **Vue Router** - Navegación SPA

## Estructura de Componentes

```
src/
├── views/
│   ├── WelcomePage.vue        # Landing page
│   ├── ModelsPage.vue         # Marketplace de modelos
│   ├── ProfilePage.vue        # Dashboard del usuario
│   └── About.vue              # Información del proyecto
│
├── components/
│   ├── cards/
│   │   ├── ModelCard.vue      # Card de modelo en grid
│   │   └── LicensePlanCard.vue # Card de plan de licencia
│   │
│   ├── modals/
│   │   ├── UploadModelModal.vue    # Subir nuevo modelo
│   │   ├── BuyModelModal.vue       # Comprar NFT
│   │   ├── ModelDetailsModal.vue   # Detalles del modelo
│   │   ├── InferenceModal.vue      # Ejecutar inferencia
│   │   ├── RenewLicenseModal.vue   # Renovar licencia
│   │   └── WithdrawModal.vue       # Retirar fondos
│   │
│   ├── layout/
│   │   ├── Header.vue          # Navbar con wallet connect
│   │   └── ProfileHeader.vue   # Header del perfil
│   │
│   └── feedback/
│       └── NotificationContainer.vue # Sistema de toast
│
└── composables/
    ├── useWallet.ts            # Conexión wallet
    ├── useModels.ts            # Estado de modelos
    ├── useModelActions.ts      # Acciones (buy, sell, etc)
    ├── useInference.ts         # Ejecutar inferencias
    ├── useNotifications.ts     # Sistema de notificaciones
    └── blockchain.ts           # Interacción con contrato
```

## Integración con Blockchain

### Conexión con Smart Contract

```typescript
// composables/blockchain.ts
import { ethers } from 'ethers';
import AIMarketABI from '@/AIMarketABI.json';

const CONTRACT_ADDRESS = '0x...';

// Conectar wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Instanciar contrato
const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  AIMarketABI,
  signer
);
```

### Ejemplo: Comprar Licencia

```typescript
async function buyLicense(modelId: number, planId: number) {
  // Obtener precio del plan
  const plan = await contract.modelLicensePlans(modelId, planId);
  
  // Ejecutar transacción
  const tx = await contract.buyLicense(modelId, planId, {
    value: plan.price // Enviar AVAX
  });
  
  // Esperar confirmación
  await tx.wait();
  
  showSuccess('¡Licencia adquirida exitosamente! 🎉');
}
```

## Comunicación con el Motor de Inferencia

### useInference Composable

```typescript
// composables/useInference.ts
import { ref } from 'vue';

export function useInference() {
  const result = ref(null);
  const isInferring = ref(false);
  const error = ref(null);

  async function executeInference(modelId: string, imageFile: File) {
    isInferring.value = true;
    error.value = null;

    try {
      // 1. Convertir imagen a Base64
      const base64 = await fileToBase64(imageFile);

      // 2. Preparar payload
      const payload = {
        model_id: modelId,
        execution_mode: 'sync',
        input_data: {
          format: 'base64_jpeg',
          content: base64
        },
        options: {
          top_k: 5,
          threshold: 0.1
        }
      };

      // 3. Enviar request al motor
      const response = await fetch(
        'http://localhost:3000/api/inference/execute',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      // 4. Procesar respuesta
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Inference failed');
      }

      const data = await response.json();
      result.value = data;

    } catch (err) {
      error.value = err.message;
      console.error('Inference error:', err);
    } finally {
      isInferring.value = false;
    }
  }

  return {
    result,
    isInferring,
    error,
    executeInference
  };
}
```

## Flujo de Usuario: Ejecutar Inferencia

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario abre InferenceModal                              │
│    - Selecciona modelo desde ModelCard                      │
│    - Modal verifica licencia (hasValidLicense)              │
└────────────────┬────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Usuario sube imagen                                      │
│    - Input file o drag & drop                               │
│    - Preview de imagen                                       │
│    - Validación: max 10MB, formato JPEG/PNG                 │
└────────────────┬────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Click en "Ejecutar Inferencia"                           │
│    - Convertir File a Base64                                │
│    - POST a /api/inference/execute                          │
│    - Loading state (spinner)                                 │
└────────────────┬────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Motor procesa (~66ms con caché)                          │
└────────────────┬────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Mostrar resultados                                       │
│    ┌───────────────────────────────────────────────────┐    │
│    │ 🎯 Predicciones:                                 │   │
│    │  1. Golden Retriever   92.34%  ████████████      │    │
│    │  2. Labrador Retriever  5.43%  ███                │   │
│    │  3. Cocker Spaniel      1.23%  ██                 │   │
│    │                                                   │   │
│    │ ⏱ Métricas:                                      │   │
│    │  • Tiempo total: 66ms                             │   │
│    │  • Confianza top-1: 92.34%                        │   │
│    └───────────────────────────────────────────────────┘   │
│                                                             │
│    [🔄 Nueva Inferencia]  [Cerrar]                         │
└─────────────────────────────────────────────────────────────┘
```

## Sistema de Notificaciones

```typescript
// composables/useNotifications.ts
export function useNotifications() {
  function showSuccess(message: string) {
    // Toast verde con checkmark
  }

  function showError(message: string) {
    // Toast rojo con X
  }

  function showInfo(message: string) {
    // Toast azul con info icon
  }

  return { showSuccess, showError, showInfo };
}

// Uso en componentes
const { showSuccess, showError } = useNotifications();

// Después de comprar licencia exitosa
await buyLicense(modelId, planId);
showSuccess('¡Licencia adquirida exitosamente! 🎉');
```

## Sistema de Modales

Todos los modales implementan un sistema de scroll locking:

```typescript
// En cada modal
import { onMounted, onUnmounted } from 'vue';

function lockBodyScroll() {
  document.body.classList.add('modal-open');
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
}

onMounted(() => {
  if (props.isOpen) {
    lockBodyScroll();
  }
});

onUnmounted(() => {
  unlockBodyScroll();
});
```

## Manejo de Errores Blockchain

```typescript
// composables/useBlockchainErrorHandler.ts
export function useBlockchainErrorHandler() {
  const { showError } = useNotifications();

  function handleError(error: any) {
    console.error('Blockchain error:', error);

    // User rejected transaction
    if (error.code === 'ACTION_REJECTED') {
      showError('Transacción cancelada por el usuario');
      return;
    }

    // Insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS') {
      showError('Fondos insuficientes para completar la transacción');
      return;
    }

    // Network error
    if (error.code === 'NETWORK_ERROR') {
      showError('Error de red. Verifica tu conexión');
      return;
    }

    // Generic error
    showError(error.message || 'Error en la transacción');
  }

  return { handleError };
}
```

## Configuración

### Variables de Entorno

```bash
# .env
VITE_CONTRACT_ADDRESS=0x...  # Dirección del smart contract
VITE_CHAIN_ID=43113          # Avalanche Fuji Testnet
VITE_INFERENCE_ENGINE_URL=http://localhost:3000
```

### Tailwind Config

```javascript
// tailwind.config.js
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Colores personalizados
      }
    }
  }
}
```

## Testing

```bash
# Tests unitarios (composables)
npm run test:unit

# Tests e2e (Cypress)
npm run test:e2e

# Coverage
npm run test:coverage
```
