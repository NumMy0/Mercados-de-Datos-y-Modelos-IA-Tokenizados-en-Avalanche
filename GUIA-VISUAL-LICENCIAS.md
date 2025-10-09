# 🎨 Guía Visual: Sistema de Verificación de Licencias

## 📱 Estados del Modal de Inferencia

### Estado 1: ✅ Licencia Activa (Verde)

```
┌────────────────────────────────────────────────────┐
│  ⚡ Ejecutar Inferencia             [X]            │
│  ResNet18 - Image Classification                   │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ 🛡️ ✅ Licencia activa - Puedes ejecutar     │ │
│  │     inferencias                               │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  Tipo de Entrada                                   │
│  ┌──────────┐ ┌──────────┐                        │
│  │📸 Imagen │ │📝 Texto  │                        │
│  └──────────┘ └──────────┘                        │
│                                                     │
│  Seleccionar Imagen                                │
│  ┌────────────────────────────────────────────┐   │
│  │                                             │   │
│  │         📤                                  │   │
│  │  Click para seleccionar una imagen         │   │
│  │  PNG, JPG, GIF hasta 10MB                  │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
├────────────────────────────────────────────────────┤
│                    [Cancelar]  [⚡ Ejecutar Inferencia] │
│                                   ↑                 │
│                              HABILITADO            │
└────────────────────────────────────────────────────┘
```

### Estado 2: ⚠️ Sin Licencia (Amarillo)

```
┌────────────────────────────────────────────────────┐
│  ⚡ Ejecutar Inferencia             [X]            │
│  ResNet18 - Image Classification                   │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ ⚠️ ⚠️ Sin licencia activa                    │ │
│  │                                               │ │
│  │ Necesitas comprar una licencia para usar     │ │
│  │ este modelo. Ve a los detalles del modelo    │ │
│  │ para adquirir una.                            │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  Tipo de Entrada                                   │
│  ┌──────────┐ ┌──────────┐                        │
│  │📸 Imagen │ │📝 Texto  │                        │
│  └──────────┘ └──────────┘                        │
│                                                     │
│  Seleccionar Imagen                                │
│  ┌────────────────────────────────────────────┐   │
│  │                                             │   │
│  │         📤                                  │   │
│  │  Click para seleccionar una imagen         │   │
│  │  PNG, JPG, GIF hasta 10MB                  │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
├────────────────────────────────────────────────────┤
│                    [Cancelar]  [🔒 Sin Licencia]   │
│                                   ↑                 │
│                              DESHABILITADO         │
└────────────────────────────────────────────────────┘
```

### Estado 3: 💼 Sin Wallet Conectada (Azul)

```
┌────────────────────────────────────────────────────┐
│  ⚡ Ejecutar Inferencia             [X]            │
│  ResNet18 - Image Classification                   │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ ℹ️ 💼 Conecta tu wallet para verificar tu   │ │
│  │     licencia                                  │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  Tipo de Entrada                                   │
│  ┌──────────┐ ┌──────────┐                        │
│  │📸 Imagen │ │📝 Texto  │                        │
│  └──────────┘ └──────────┘                        │
│                                                     │
│  Seleccionar Imagen                                │
│  ┌────────────────────────────────────────────┐   │
│  │                                             │   │
│  │         📤                                  │   │
│  │  Click para seleccionar una imagen         │   │
│  │  PNG, JPG, GIF hasta 10MB                  │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
├────────────────────────────────────────────────────┤
│                    [Cancelar]  [💼 Conecta Wallet] │
│                                   ↑                 │
│                              DESHABILITADO         │
│                        (click → conecta wallet)    │
└────────────────────────────────────────────────────┘
```

### Estado 4: 🔍 Verificando Licencia (Gris)

```
┌────────────────────────────────────────────────────┐
│  ⚡ Ejecutar Inferencia             [X]            │
│  ResNet18 - Image Classification                   │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ ⚙️ 🔍 Verificando licencia...                │ │
│  │     (spinner animado)                         │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  ...resto del contenido...                         │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Estado 5: ⚡ Ejecutando Inferencia (Azul)

```
┌────────────────────────────────────────────────────┐
│  ⚡ Ejecutar Inferencia             [X]            │
│  ResNet18 - Image Classification                   │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ 🛡️ ✅ Licencia activa - Puedes ejecutar     │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  ...entrada seleccionada...                        │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │                                               │ │
│  │   ⚙️ Procesando...                           │ │
│  │                                               │ │
│  │   El modelo está analizando tu entrada       │ │
│  │                                               │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
├────────────────────────────────────────────────────┤
│                    [Cancelar]  [⚙️ Procesando...]  │
│                                   ↑                 │
│                              DESHABILITADO         │
└────────────────────────────────────────────────────┘
```

### Estado 6: ✅ Resultado Exitoso (Verde)

```
┌────────────────────────────────────────────────────┐
│  ⚡ Ejecutar Inferencia             [X]            │
│  ResNet18 - Image Classification                   │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ 🛡️ ✅ Licencia activa - Puedes ejecutar     │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  ...entrada que fue procesada...                   │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ ✅ Resultado de Inferencia                   │ │
│  │                                               │ │
│  │ ┌──────────────────────────────────────────┐ │ │
│  │ │ {                                         │ │ │
│  │ │   "predictions": [                        │ │ │
│  │ │     {"class": "cat", "confidence": 0.95}, │ │ │
│  │ │     {"class": "dog", "confidence": 0.03}  │ │ │
│  │ │   ]                                       │ │ │
│  │ │ }                                         │ │ │
│  │ └──────────────────────────────────────────┘ │ │
│  │                                               │ │
│  │ ⏱️ Tiempo: 234ms    📦 ResNet18             │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
├────────────────────────────────────────────────────┤
│                                     [Cerrar]        │
└────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Transiciones de Estado

```
Usuario abre modal
        │
        ▼
┌───────────────────┐
│ Sin Wallet?       │──── Sí ───▶ [Estado 3: Sin Wallet]
└───────────────────┘
        │ No
        ▼
┌───────────────────┐
│ Verificando...    │────────────▶ [Estado 4: Verificando]
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ ¿Tiene licencia?  │
└───────────────────┘
    │           │
    Sí         No
    │           │
    ▼           ▼
[Estado 1]  [Estado 2]
Habilitado  Deshabilitado
    │
    │ Usuario ejecuta
    ▼
[Estado 5]
Procesando
    │
    ▼
[Estado 6]
Resultado
```

## 🎯 Colores por Estado

| Estado | Color Principal | Icono | Acción del Botón |
|--------|-----------------|-------|------------------|
| ✅ Con Licencia | Verde (`green-600`) | 🛡️ | Ejecutar |
| ⚠️ Sin Licencia | Amarillo (`amber-600`) | ⚠️ | Bloqueado |
| 💼 Sin Wallet | Azul (`blue-600`) | ℹ️ | Conectar |
| 🔍 Verificando | Gris (`gray-600`) | ⚙️ | Esperando |
| ⚡ Procesando | Azul claro (`blue-500`) | ⚙️ | Esperando |
| ✅ Completado | Verde (`green-600`) | ✅ | Cerrar |

## 📊 Matriz de Estados del Botón

| Condición | Texto Botón | Estado | Color | Tooltip |
|-----------|-------------|--------|-------|---------|
| `!isConnected` | "Conecta Wallet" | Deshabilitado | Gris | "Conecta tu wallet primero" |
| `hasLicense === false` | "Sin Licencia" | Deshabilitado | Gris | "Necesitas una licencia activa" |
| `isInferring` | "Procesando..." | Deshabilitado | Gris | - |
| `!canSubmit` | "Ejecutar Inferencia" | Deshabilitado | Gris | - |
| **Todo OK** | "Ejecutar Inferencia" | **Habilitado** | **Gradiente** | - |

## 🔍 Ejemplo de Logs en Consola

### Escenario: Usuario CON licencia

```javascript
// Al abrir modal
🔍 Verificando licencia para modelo 1 y usuario 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
✅ Licencia verificada correctamente

// Al ejecutar inferencia
🔍 Verificando licencia para modelo 1 y usuario 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
✅ Licencia verificada correctamente
⏳ Enviando request de inferencia...
✅ Resultado recibido en 234ms
```

### Escenario: Usuario SIN licencia

```javascript
// Al abrir modal
🔍 Verificando licencia para modelo 1 y usuario 0x123456789...
⚠️ Licencia no encontrada o expirada

// Si intenta ejecutar (no debería poder)
🔍 Verificando licencia para modelo 1 y usuario 0x123456789...
❌ Error: No tienes una licencia activa para usar este modelo. Por favor, compra una licencia primero.
```

## 🎨 Paleta de Colores Usada

```css
/* Banner Verde - Licencia Activa */
background: green-50 (light) / green-900/20 (dark)
border: green-200 / green-800
text: green-800 / green-300

/* Banner Amarillo - Sin Licencia */
background: amber-50 / amber-900/20
border: amber-200 / amber-800
text: amber-800 / amber-300

/* Banner Azul - Sin Wallet */
background: blue-50 / blue-900/20
border: blue-200 / blue-800
text: blue-800 / blue-300

/* Banner Gris - Verificando */
background: gray-50 / gray-800
border: gray-200 / gray-700
text: gray-600 / gray-400

/* Botón Principal */
background: gradient purple-600 → pink-600
hover: purple-700 → pink-700
disabled: opacity-50
```

## 💡 Tips de UX

1. **Verificación Inmediata**: El modal verifica la licencia apenas se abre
2. **Feedback Visual**: El usuario siempre sabe por qué no puede ejecutar
3. **Acción Sugerida**: Los mensajes indican qué hacer (conectar wallet, comprar licencia)
4. **Reactividad**: Si cambia de cuenta en MetaMask, el estado se actualiza automáticamente
5. **Sin Sorpresas**: No se permite iniciar una inferencia que va a fallar

## 🚀 Accesibilidad

- ✅ Tooltips en botones deshabilitados
- ✅ Iconos descriptivos con emojis
- ✅ Mensajes claros y concisos
- ✅ Colores con suficiente contraste
- ✅ Estados visuales distintos y obvios

---

**Fecha:** Octubre 9, 2025  
**Archivo:** GUIA-VISUAL-LICENCIAS.md
