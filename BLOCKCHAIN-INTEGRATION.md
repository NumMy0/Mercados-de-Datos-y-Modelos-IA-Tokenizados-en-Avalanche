# Integración Blockchain - Documentación Completa

## 📋 Resumen de Implementación

Se completó la integración de todas las funciones blockchain necesarias para el marketplace de modelos IA. Este documento detalla las funciones implementadas, cómo probarlas, y los resultados esperados.

---

## ✅ Funciones Implementadas

### 1. **blockchain.ts** - Funciones Nuevas

#### `transferModel(toAddress: string, modelId: number | string)`
**Ubicación:** `frontend/src/composables/blockchain.ts` (línea ~214)

**Descripción:** Transfiere la propiedad de un modelo NFT a otra dirección usando la función personalizada del contrato.

**Parámetros:**
- `toAddress`: Dirección Ethereum del destinatario
- `modelId`: ID del modelo a transferir

**Smart Contract:** Usa `transferModel(address _to, uint256 _modelId)` del contrato

**Ejemplo de uso:**
```typescript
import { transferModel } from './blockchain'
const receipt = await transferModel('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 5)
```

---

#### `setPlanActive(modelId: number | string, planIndex: number, active: boolean)`
**Ubicación:** `frontend/src/composables/blockchain.ts` (línea ~235)

**Descripción:** Activa o desactiva un plan de licencia de un modelo.

**Parámetros:**
- `modelId`: ID del modelo
- `planIndex`: Índice del plan de licencia (planId)
- `active`: `true` para activar, `false` para desactivar

**Smart Contract:** Usa `setPlanActive(uint256 _modelId, uint256 _planId, bool _active)` del contrato

**Ejemplo de uso:**
```typescript
import { setPlanActive } from './blockchain'
// Desactivar plan 0 del modelo 5
const receipt = await setPlanActive(5, 0, false)
```

---

### 2. **useModelActions.ts** - Funciones Actualizadas

Todas las funciones `TODO` fueron reemplazadas con implementaciones reales:

#### ✅ `setModelForSale(modelId, price)`
- **Estado anterior:** `console.log` + placeholder
- **Estado actual:** Llama `setForSaleBlockchain(modelId, priceWei)`
- **Conversión:** Convierte precio de AVAX a Wei automáticamente
- **Retorna:** `{ success, receipt, message, updates }`

#### ✅ `cancelModelSale(modelId)`
- **Estado anterior:** `console.log` + placeholder
- **Estado actual:** Llama `cancelSaleBlockchain(modelId)`
- **Retorna:** `{ success, receipt, message, updates }`

#### ✅ `transferModel(modelId, toAddress)`
- **Estado anterior:** `console.log` + placeholder
- **Estado actual:** Llama `transferModelBlockchain(toAddress, modelId)`
- **Validación:** Verifica que `toAddress` sea una dirección Ethereum válida
- **Retorna:** `{ success, receipt, message, updates }`

#### ✅ `createLicensePlan(modelId, planData)`
- **Estado anterior:** `console.log` + placeholder
- **Estado actual:** Llama `createLicensePlanBlockchain(modelId, name, priceWei, duration)`
- **Conversión:** Convierte `planData.price` de AVAX a Wei automáticamente
- **Parámetros esperados en `planData`:**
  - `name`: string
  - `price`: string (en AVAX, ej: "0.5")
  - `duration`: number (en segundos)

#### ✅ `setPlanActive(modelId, planId, active)`
- **Estado anterior:** `console.log` + placeholder (solo planId, active)
- **Estado actual:** Llama `setPlanActiveBlockchain(modelId, planId, active)`
- **⚠️ Cambio de firma:** Ahora requiere `modelId` como primer parámetro
- **Retorna:** `{ success, receipt, message }`

#### ✅ `buyLicense(modelId, planId, price?)`
- **Estado anterior:** `console.log` + placeholder
- **Estado actual:** Llama `buyLicenseBlockchain(modelId, planId, priceWei)`
- **Parámetro `price`:** Opcional. Si no se provee, asume que la transacción ya fue ejecutada
- **Conversión:** Acepta precio en AVAX (string) o Wei (bigint)
- **Retorna:** `{ success, receipt, message }`

---

### 3. **Actualizaciones en Componentes Vista**

#### ModelsPage.vue
**Cambio en `handleSetPlanActive`:**
```typescript
// ANTES:
async function handleSetPlanActive(planId: number, active: boolean) {
  const result = await setPlanActive(planId, active)
  alert(result.message)
}

// AHORA:
async function handleSetPlanActive(planId: number, active: boolean) {
  if (!selectedModel.value) return
  const result = await setPlanActive(selectedModel.value.id, planId, active)
  alert(result.message)
}
```

#### ProfilePage.vue
**Cambio en `handleSetPlanActive`:**
```typescript
// ANTES:
async function handleSetPlanActive(planId: number, active: boolean) {
  const result = await setPlanActive(planId, active)
  alert(result.message)
}

// AHORA:
async function handleSetPlanActive(planId: number, active: boolean) {
  if (!selectedModel.value) return
  const result = await setPlanActive(selectedModel.value.id, planId, active)
  alert(result.message)
}
```

---

## 🧪 Guía de Pruebas

### Prerrequisitos
1. ✅ MetaMask instalado y configurado
2. ✅ Conectado a Avalanche Fuji Testnet (C-Chain)
3. ✅ Tener AVAX de testnet (obtener de [faucet](https://faucet.avax.network/))
4. ✅ Smart contract deployado en la red
5. ✅ Tener al menos un modelo subido al marketplace

### Configuración de Pruebas
```bash
# Iniciar servidor de desarrollo
cd frontend
npm run dev

# Abrir en navegador
http://localhost:5174
```

---

## 📝 Checklist de Pruebas Funcionales

### ✅ Test 1: Crear Plan de Licencia
**Ruta:** Perfil → Mis Modelos → Ver Detalles → Pestaña "Licencias"

1. Seleccionar un modelo que te pertenece
2. Ir a la pestaña "Gestión de Licencias"
3. Completar formulario:
   - **Nombre del Plan:** "Plan Básico"
   - **Precio:** "0.5" (AVAX)
   - **Duración:** "2592000" (30 días en segundos)
4. Clic en "Crear Plan"

**Resultado Esperado:**
- ✅ MetaMask se abre con popup de transacción
- ✅ Función: `createLicensePlan`
- ✅ Gas estimado correctamente
- ✅ Al confirmar: transacción enviada
- ✅ Mensaje: "Plan de licencia 'Plan Básico' creado exitosamente!"
- ✅ Plan aparece en la lista de planes del modelo

**Consola esperada:**
```
createLicensePlan: { name: "Plan Básico", price: "0.5", duration: 2592000 }
Plan de licencia creado, receipt: {...}
```

---

### ✅ Test 2: Activar/Desactivar Plan de Licencia
**Ruta:** Perfil → Mis Modelos → Ver Detalles → Pestaña "Licencias"

1. En la lista de planes, localizar un plan activo
2. Clic en botón "Desactivar" (toggle)
3. Confirmar en MetaMask

**Resultado Esperado:**
- ✅ MetaMask se abre con popup de transacción
- ✅ Función: `setPlanActive(modelId, planId, false)`
- ✅ Al confirmar: transacción enviada
- ✅ Mensaje: "Plan desactivado exitosamente!"
- ✅ Plan muestra estado "Inactivo" en la UI
- ✅ Plan NO puede ser comprado por otros usuarios

**Consola esperada:**
```
setPlanActive: { modelId: 5, planId: 0, active: false }
Plan actualizado, receipt: {...}
```

4. **Reactivar el plan:**
   - Clic en "Activar"
   - Confirmar en MetaMask
   - Verificar que el plan vuelve a estado "Activo"

---

### ✅ Test 3: Poner Modelo en Venta
**Ruta:** Perfil → Mis Modelos → Ver Detalles → Pestaña "Gestión de Venta"

1. Seleccionar un modelo que NO esté en venta
2. Ir a pestaña "Gestión de Venta"
3. Ingresar precio: "1.5" (AVAX)
4. Clic en "Poner en Venta"

**Resultado Esperado:**
- ✅ MetaMask se abre con popup de transacción
- ✅ Función: `setModelForSale(modelId, priceWei)`
- ✅ Precio convertido correctamente a Wei
- ✅ Al confirmar: transacción enviada
- ✅ Mensaje: "Modelo puesto en venta por 1.5 AVAX"
- ✅ En Marketplace: modelo aparece con badge "En Venta"
- ✅ Precio visible: "1.5 AVAX"

**Consola esperada:**
```
setModelForSale: { modelId: 5, price: "1.5" }
Modelo puesto en venta, receipt: {...}
```

---

### ✅ Test 4: Cancelar Venta
**Ruta:** Perfil → Mis Modelos → Ver Detalles → Pestaña "Gestión de Venta"

1. Seleccionar un modelo que SÍ esté en venta
2. Ir a pestaña "Gestión de Venta"
3. Clic en "Cancelar Venta"

**Resultado Esperado:**
- ✅ MetaMask se abre con popup de transacción
- ✅ Función: `cancelSale(modelId)`
- ✅ Al confirmar: transacción enviada
- ✅ Mensaje: "Venta cancelada exitosamente!"
- ✅ En Marketplace: modelo YA NO aparece con badge "En Venta"
- ✅ Modelo NO puede ser comprado por otros

**Consola esperada:**
```
cancelSale: 5
Venta cancelada, receipt: {...}
```

---

### ✅ Test 5: Comprar Modelo (NFT Transfer)
**Ruta:** Marketplace → Ver Detalles (modelo en venta)

⚠️ **Importante:** Usar una CUENTA DIFERENTE a la del propietario

1. Cambiar cuenta en MetaMask (Account 2)
2. En Marketplace, seleccionar un modelo en venta
3. Clic en "Comprar Modelo"
4. Confirmar compra

**Resultado Esperado:**
- ✅ MetaMask se abre con popup de transacción
- ✅ **Valor de transacción:** Precio del modelo (ej: 1.5 AVAX)
- ✅ Función: `buyModel(modelId, priceWei)`
- ✅ Al confirmar: transacción enviada
- ✅ Mensaje: "Modelo 'NombreModelo' comprado exitosamente por 1.5 AVAX!"
- ✅ Modelo cambia de propietario (verificar en Perfil)
- ✅ Modelo YA NO está en venta
- ✅ **Saldo anterior propietario:** aumenta `priceWei - platformFee`
- ✅ **Saldo nuevo propietario:** disminuye `priceWei`

**Consola esperada:**
```
buyModel: 5
Modelo comprado, receipt: {...}
```

**Verificación adicional:**
- Ir a Perfil → Mis Modelos
- El modelo debe aparecer en "Mis Modelos" del nuevo propietario
- El modelo NO debe aparecer en "Mis Modelos" del antiguo propietario

---

### ✅ Test 6: Transferir Modelo (Gift/Transfer)
**Ruta:** Perfil → Mis Modelos → Ver Detalles → Pestaña "Transferir"

1. Seleccionar un modelo que te pertenece
2. Ir a pestaña "Transferir Modelo"
3. Ingresar dirección Ethereum válida (Account 3 de MetaMask)
4. Clic en "Transferir Modelo"

**Resultado Esperado:**
- ✅ MetaMask se abre con popup de transacción
- ✅ Función: `transferModel(toAddress, modelId)`
- ✅ **Sin valor de AVAX** (solo gas fee)
- ✅ Al confirmar: transacción enviada
- ✅ Mensaje: "Modelo transferido a 0x742d35..."
- ✅ Modelo cambia de propietario (verificar en blockchain)
- ✅ En Perfil: modelo desaparece de "Mis Modelos"
- ✅ En cuenta destino: modelo aparece en "Mis Modelos"

**Consola esperada:**
```
transferModel: { to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", modelId: 5 }
Modelo transferido, receipt: {...}
```

**Validaciones automáticas:**
- Si dirección inválida: "Dirección Ethereum inválida"
- Si no eres propietario: Error de MetaMask "execution reverted"

---

### ✅ Test 7: Comprar Licencia
**Ruta:** Marketplace → Ver Detalles → Pestaña "Licencias"

⚠️ **Importante:** Usar una CUENTA DIFERENTE a la del propietario del modelo

1. Cambiar cuenta en MetaMask (Account 2)
2. En Marketplace, seleccionar un modelo con planes de licencia
3. Ir a pestaña "Gestión de Licencias"
4. Seleccionar un plan ACTIVO
5. Clic en "Comprar Licencia"

**Resultado Esperado:**
- ✅ MetaMask se abre con popup de transacción
- ✅ **Valor de transacción:** Precio del plan (ej: 0.5 AVAX)
- ✅ Función: `buyLicense(modelId, planId, priceWei)`
- ✅ Al confirmar: transacción enviada
- ✅ Mensaje: "Licencia comprada exitosamente!"
- ✅ En Perfil → Mis Licencias: licencia aparece en lista
- ✅ Fecha de expiración calculada correctamente
- ✅ Estado: "Activa"

**Consola esperada (desde ModelDetailsModal):**
```
buyLicense receipt: {...}
```

**Verificación adicional:**
- Ir a Perfil → Mis Licencias
- La licencia debe aparecer con:
  - Nombre del modelo
  - Nombre del plan
  - Fecha de expiración
  - Estado: "Activa"

---

## 🔍 Pruebas de Validación y Errores

### Test de Validaciones
1. **Dirección Inválida (Transfer):**
   - Ingresar: "0xinvalido"
   - Resultado: "Dirección Ethereum inválida"

2. **Precio Inválido (Set for Sale):**
   - Ingresar precio negativo o letras
   - Resultado: Error de validación

3. **No Propietario (Set for Sale):**
   - Intentar poner en venta modelo de otro usuario
   - Resultado: MetaMask error "execution reverted"

4. **Plan Inactivo (Buy License):**
   - Intentar comprar licencia de plan desactivado
   - Resultado: Botón "Comprar" deshabilitado o error del contrato

5. **Fondos Insuficientes:**
   - Intentar comprar con balance menor al precio
   - Resultado: MetaMask error "insufficient funds"

### Test de Transacciones Rechazadas
1. Iniciar cualquier operación
2. En MetaMask, clic en "Reject"
3. **Resultado esperado:**
   - No se ejecuta la transacción
   - UI muestra mensaje de error
   - Estado de la aplicación NO cambia
   - Consola muestra: "Error al [operación]"

---

## 📊 Estructura de Respuestas

Todas las funciones en `useModelActions.ts` retornan el mismo formato:

### Respuesta Exitosa
```typescript
{
  success: true,
  receipt: TransactionReceipt,
  message: "Operación exitosa!",
  updates?: {
    forSale?: boolean,
    owner?: string,
    salePriceRaw?: string
  }
}
```

### Respuesta de Error
```typescript
{
  success: false,
  error: Error,
  message: "Error al ejecutar operación. Revisa la consola."
}
```

---

## 🛠️ Troubleshooting

### Error: "La función X no está disponible en el contrato"
**Causa:** El ABI del contrato no incluye la función
**Solución:**
1. Verificar que `AIMarketABI.json` esté actualizado
2. Verificar que el contrato deployado incluye todas las funciones
3. Revisar la dirección del contrato en `blockchain.ts`

### Error: "Network mismatch"
**Causa:** MetaMask conectado a red diferente a la configurada
**Solución:**
1. Cambiar MetaMask a Avalanche Fuji Testnet
2. Verificar Chain ID: 43113

### Error: "Nonce too high"
**Causa:** Transacciones pendientes o cache de MetaMask
**Solución:**
1. MetaMask → Settings → Advanced → Reset Account
2. Refrescar página

### Transacción no se refleja en UI
**Causa:** UI no se actualiza después de la transacción
**Solución temporal:**
1. Refrescar página (F5)
2. Recargar modelos manualmente

**Solución permanente (TODO):**
- Implementar listeners de eventos del contrato
- Auto-refresh después de transacciones exitosas

---

## 📈 Métricas de Éxito

### Implementación Completada
- ✅ 2 funciones nuevas en `blockchain.ts`
- ✅ 6 funciones actualizadas en `useModelActions.ts`
- ✅ 2 componentes actualizados (ModelsPage, ProfilePage)
- ✅ 0 errores de compilación TypeScript
- ✅ Todas las funciones con manejo de errores

### Cobertura de Funcionalidad
- ✅ Compra/Venta de modelos NFT
- ✅ Transferencia de modelos
- ✅ Gestión de planes de licencia (crear, activar, desactivar)
- ✅ Compra de licencias
- ✅ Conversión automática AVAX ↔ Wei
- ✅ Validación de direcciones Ethereum

---

## 🔄 Próximos Pasos Recomendados

1. **Testing Automatizado:**
   - Implementar tests unitarios para `useModelActions.ts`
   - Tests de integración con contrato mock
   - Tests E2E con Cypress/Playwright

2. **Mejoras de UX:**
   - Loading spinners durante transacciones
   - Toast notifications en lugar de `alert()`
   - Confirmación visual de transacciones exitosas
   - Progress indicators para transacciones blockchain

3. **Optimizaciones:**
   - Cache de datos del contrato
   - Batch loading de múltiples modelos
   - Event listeners para auto-refresh
   - Optimistic UI updates

4. **Seguridad:**
   - Rate limiting de llamadas blockchain
   - Validación adicional de inputs
   - Sanitización de direcciones Ethereum
   - Gas limit optimization

---

## 📚 Referencias

- **Smart Contract ABI:** `frontend/AIMarketABI.json`
- **Blockchain Functions:** `frontend/src/composables/blockchain.ts`
- **Action Functions:** `frontend/src/composables/useModelActions.ts`
- **View Components:** `frontend/src/views/ModelsPage.vue`, `ProfilePage.vue`
- **Avalanche Docs:** https://docs.avax.network/
- **Ethers.js Docs:** https://docs.ethers.org/v6/

---

## 👥 Contribuciones

Para reportar issues o proponer mejoras en la integración blockchain:
1. Verificar que el issue no esté duplicado
2. Incluir logs de consola
3. Incluir hash de transacción si aplica
4. Especificar versión de MetaMask y navegador

---

**Última Actualización:** [Fecha actual]
**Versión:** 1.0.0
**Estado:** ✅ Producción Ready
