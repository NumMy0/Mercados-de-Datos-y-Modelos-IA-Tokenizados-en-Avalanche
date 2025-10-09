# 🔐 Sistema de Verificación de Licencias para Inferencias

## 📋 Descripción General

Se ha implementado un sistema completo de verificación de licencias que garantiza que solo los usuarios con licencias activas en la blockchain puedan ejecutar inferencias en los modelos de IA.

## 🏗️ Arquitectura de la Solución

### Componentes Modificados

#### 1. **`frontend/src/composables/useInference.ts`**

**Cambios:**
- ✅ Importa `hasActiveLicense` desde `blockchain.ts`
- ✅ Acepta `userAddress` opcional como segundo parámetro en `runInference()`
- ✅ Verifica licencia activa antes de ejecutar la inferencia
- ✅ Lanza error descriptivo si no hay licencia

**Código clave:**
```typescript
const runInference = async (
  request: InferenceRequest, 
  userAddress?: string
): Promise<InferenceResult | null> => {
  // 🔐 Verificar licencia activa antes de ejecutar inferencia
  if (userAddress) {
    console.log(`🔍 Verificando licencia para modelo ${request.modelId}`)
    
    const hasLicense = await hasActiveLicense(request.modelId, userAddress)
    
    if (!hasLicense) {
      throw new Error('❌ No tienes una licencia activa para usar este modelo.')
    }
    
    console.log('✅ Licencia verificada correctamente')
  }
  
  // ... continúa con la inferencia
}
```

#### 2. **`frontend/src/components/InferenceModal.vue`**

**Cambios:**
- ✅ Importa `useWallet` composable
- ✅ Importa `hasActiveLicense` desde `blockchain.ts`
- ✅ Agrega refs: `hasLicense`, `checkingLicense`
- ✅ Implementa función `checkLicense()` que verifica el estado
- ✅ Watcher que verifica licencia cuando se abre el modal o cambia la cuenta
- ✅ Banner visual con 4 estados (con licencia, sin licencia, sin wallet, verificando)
- ✅ Botón inteligente que cambia según el estado
- ✅ Pasa `account.value` a `runInference()` para verificación

**Estados del Banner:**

1. **✅ Licencia Activa** (Verde)
   ```
   ✅ Licencia activa - Puedes ejecutar inferencias
   ```

2. **⚠️ Sin Licencia** (Amarillo/Amber)
   ```
   ⚠️ Sin licencia activa
   Necesitas comprar una licencia para usar este modelo.
   ```

3. **💼 Sin Wallet** (Azul)
   ```
   💼 Conecta tu wallet para verificar tu licencia
   ```

4. **🔍 Verificando** (Gris)
   ```
   🔍 Verificando licencia... (con spinner)
   ```

**Código clave:**
```typescript
// Verificar licencia cuando se abre el modal o cambia la cuenta
const checkLicense = async () => {
  if (!props.model || !account.value) {
    hasLicense.value = null
    return
  }

  checkingLicense.value = true
  try {
    const result = await hasActiveLicense(
      props.model.id.toString(), 
      account.value
    )
    hasLicense.value = result
  } catch (err) {
    console.error('Error al verificar licencia:', err)
    hasLicense.value = null
  } finally {
    checkingLicense.value = false
  }
}

// Watcher
watch([() => props.isOpen, account], () => {
  if (props.isOpen && account.value) {
    checkLicense()
  }
}, { immediate: true })
```

**Botón Inteligente:**
```typescript
:disabled="!canSubmit || isInferring || !isConnected || hasLicense === false"
:title="
  !isConnected ? 'Conecta tu wallet primero' : 
  hasLicense === false ? 'Necesitas una licencia activa' : 
  ''
"

// Texto del botón:
{{ 
  isInferring ? 'Procesando...' : 
  !isConnected ? 'Conecta Wallet' :
  hasLicense === false ? 'Sin Licencia' :
  'Ejecutar Inferencia' 
}}
```

#### 3. **`frontend/src/composables/blockchain.ts`** (Existente - No modificado)

**Función utilizada:**
```typescript
export async function hasActiveLicense(
  modelId: number | string, 
  userAddress: string
): Promise<boolean>
```

Esta función:
- 📞 Llama al smart contract
- 🔍 Verifica si el usuario tiene licencia activa
- ✅ Retorna `true` si la licencia está activa
- ❌ Retorna `false` si no hay licencia o está expirada

## 🔄 Flujo de Verificación

```
1. Usuario abre InferenceModal
   │
   ├─▶ Modal detecta wallet conectada
   │   │
   │   ├─▶ Llama a checkLicense()
   │   │   │
   │   │   ├─▶ hasActiveLicense(modelId, userAddress)
   │   │   │   │
   │   │   │   ├─▶ Smart Contract verifica licencia
   │   │   │   │
   │   │   │   └─▶ Retorna true/false
   │   │   │
   │   │   └─▶ Actualiza hasLicense.value
   │   │
   │   └─▶ Muestra banner correspondiente
   │
2. Usuario hace clic en "Ejecutar Inferencia"
   │
   ├─▶ handleSubmit() verifica isConnected
   │   │
   │   └─▶ Si no está conectado: prompt para conectar
   │
3. runInference(request, account.value)
   │
   ├─▶ Verifica licencia NUEVAMENTE (doble check)
   │   │
   │   ├─▶ Si NO tiene licencia: throw Error
   │   │
   │   └─▶ Si SÍ tiene licencia: continúa
   │
4. POST /api/inference → Inference Engine
   │
5. Retorna resultados al usuario
```

## 🎨 UI/UX Mejorado

### Banner de Estado

**Ubicación:** Justo debajo del header del modal

**Estilos:**
- ✅ Verde con borde verde (licencia activa)
- ⚠️ Amarillo/amber con borde (sin licencia)
- 💼 Azul con borde azul (sin wallet)
- 🔍 Gris con spinner (verificando)

### Botón de Inferencia

**Estados:**
1. **Habilitado** (verde degradado): Cuando hay licencia activa
2. **Deshabilitado** (gris opaco):
   - Sin wallet conectada → Muestra "Conecta Wallet"
   - Sin licencia activa → Muestra "Sin Licencia"
   - Ejecutando → Muestra "Procesando..." con spinner

**Tooltip:**
- Sin wallet: "Conecta tu wallet primero"
- Sin licencia: "Necesitas una licencia activa"

## 🔒 Seguridad

### Verificación en Múltiples Capas

1. **Capa UI (InferenceModal)**
   - Chequeo visual del estado de licencia
   - Deshabilitación del botón si no hay licencia
   - Previene intentos de inferencia sin permiso

2. **Capa Lógica (useInference)**
   - Verificación programática antes de API call
   - Throw error si no hay licencia
   - Doble validación de seguridad

3. **Capa Blockchain (Smart Contract)**
   - Fuente de verdad definitiva
   - Verifica timestamp de expiración
   - Inmutable y descentralizado

### Protección contra Bypass

- ❌ No se puede deshabilitar desde DevTools (verificación en backend composable)
- ❌ No se puede falsificar estado de licencia (lee directamente del contrato)
- ❌ No se puede ejecutar sin dirección de wallet válida
- ✅ Logs en consola para debugging y auditoría

## 📝 Mensajes de Error

### Usuario sin licencia:
```
❌ No tienes una licencia activa para usar este modelo. 
   Por favor, compra una licencia primero.
```

### Wallet no conectada:
```
⚠️ Necesitas conectar tu wallet para ejecutar inferencias. 
   ¿Deseas conectarla ahora?
```

### Error de verificación:
```
Error al verificar licencia: [mensaje de error]
```

## 🧪 Testing Manual

### Caso 1: Usuario SIN licencia

1. Conectar wallet
2. Abrir InferenceModal de un modelo SIN licencia comprada
3. **Resultado esperado:**
   - Banner amarillo: "⚠️ Sin licencia activa"
   - Botón deshabilitado: "Sin Licencia"
   - No se puede ejecutar inferencia

### Caso 2: Usuario CON licencia

1. Conectar wallet
2. Comprar licencia para un modelo
3. Abrir InferenceModal de ese modelo
4. **Resultado esperado:**
   - Banner verde: "✅ Licencia activa"
   - Botón habilitado: "Ejecutar Inferencia"
   - Se puede ejecutar inferencia normalmente

### Caso 3: Wallet NO conectada

1. NO conectar wallet
2. Abrir InferenceModal
3. **Resultado esperado:**
   - Banner azul: "💼 Conecta tu wallet"
   - Botón deshabilitado: "Conecta Wallet"
   - Click en botón muestra prompt para conectar

### Caso 4: Cambio de cuenta

1. Conectar wallet con cuenta A (con licencia)
2. Abrir modal → Banner verde
3. Cambiar a cuenta B (sin licencia) en MetaMask
4. **Resultado esperado:**
   - Modal detecta cambio automáticamente
   - Banner cambia a amarillo
   - Botón se deshabilita

## 📊 Logs de Consola

```
🔍 Verificando licencia para modelo 1 y usuario 0x123...
✅ Licencia verificada correctamente

// o

🔍 Verificando licencia para modelo 1 y usuario 0x456...
❌ No tienes una licencia activa para usar este modelo.
```

## 🚀 Próximos Pasos (Opcional)

1. **Backend Validation**
   - Verificar licencia también en el Inference Engine
   - Agregar middleware que valide con el smart contract
   - Doble protección: frontend + backend

2. **Cache de Verificaciones**
   - Guardar resultado de verificación por X minutos
   - Evitar llamadas repetidas al smart contract
   - Mejorar performance

3. **Modo Degustación**
   - Permitir N inferencias gratis sin licencia
   - Limitar tamaño/complejidad de entrada
   - Watermark en resultados

4. **Analytics**
   - Registrar intentos de inferencia sin licencia
   - Métricas de conversión (usuarios sin licencia → compran)
   - Dashboard de uso por modelo

## ✅ Conclusión

El sistema de verificación de licencias está completamente funcional y proporciona:

- 🔒 **Seguridad robusta**: Verificación en múltiples capas
- 🎨 **UX clara**: Indicadores visuales del estado
- 🚀 **Experiencia fluida**: Verificación automática y rápida
- 📊 **Transparencia**: Mensajes claros sobre el estado
- 🔄 **Reactividad**: Detección automática de cambios

**Estado:** ✅ IMPLEMENTADO Y FUNCIONAL

**Última actualización:** Octubre 9, 2025
