# Estructura de Componentes

Esta carpeta está organizada por funcionalidad para mejorar la mantenibilidad y escalabilidad del proyecto.

## 📁 Estructura Actual

```
components/
├── 🪟 modals/                 # Ventanas modales y diálogos
│   ├── BuyModelModal.vue      # Modal para comprar modelos
│   ├── InferenceModal.vue     # Modal para realizar inferencias
│   ├── ModelDetailsModal.vue  # Modal con detalles del modelo
│   ├── RenewLicenseModal.vue  # Modal para renovar licencias
│   ├── UploadModelModal.vue   # Modal para subir modelos
│   └── WithdrawModal.vue      # Modal para retirar fondos
│
├── 🃏 cards/                  # Componentes de tarjetas
│   ├── LicensePlanCard.vue    # Tarjeta de plan de licencia
│   ├── ModelCard.vue          # Tarjeta de modelo
│   └── WelcomeCard.vue        # Tarjeta de bienvenida
│
├── 📋 lists/                  # Listas y grids de elementos
│   ├── LicensesList.vue       # Lista de licencias del usuario
│   └── ModelsGrid.vue         # Grid de modelos
│
├── 📝 forms/                  # Campos y elementos de formulario
│   └── ModelInfoField.vue     # Campo de información del modelo
│
├── 🏗️ layout/                 # Componentes de estructura y layout
│   ├── header.vue             # Header principal de la aplicación
│   └── ProfileHeader.vue      # Header específico del perfil
│
├── 💬 feedback/               # Notificaciones y mensajes
│   └── NotificationContainer.vue # Contenedor de notificaciones
│
└── 📑 tabs/                   # Pestañas y navegación
    ├── LicenseManagementTab.vue   # Pestaña de gestión de licencias
    ├── ModelDetailsTab.vue        # Pestaña de detalles del modelo
    ├── SaleManagementTab.vue      # Pestaña de gestión de ventas
    └── TransferTab.vue            # Pestaña de transferencias
```

## 🎯 Principios de Organización

### 1. **Por Funcionalidad**
- Los componentes se agrupan según su propósito principal
- Facilita encontrar componentes relacionados

### 2. **Por Tipo de UI**
- Modales en `modals/`
- Tarjetas en `cards/`
- Listas en `lists/`
- Elementos de formulario en `forms/`

### 3. **Por Responsabilidad**
- Componentes de layout en `layout/`
- Componentes de feedback en `feedback/`
- Navegación en `tabs/`

## 📖 Guías de Uso

### Imports
Actualiza tus imports siguiendo la nueva estructura:

```typescript
// ✅ Correcto
import BuyModelModal from '../components/modals/BuyModelModal.vue'
import ModelCard from '../components/cards/ModelCard.vue'
import LicensesList from '../components/lists/LicensesList.vue'

// ❌ Incorrecto (estructura antigua)
import BuyModelModal from '../components/BuyModelModal.vue'
import ModelCard from '../components/ui/ModelCard.vue'
```

### Añadir Nuevos Componentes

1. **Modales**: `modals/` → Para ventanas emergentes y diálogos
2. **Tarjetas**: `cards/` → Para elementos tipo card/panel
3. **Listas**: `lists/` → Para grids, listas, tablas
4. **Formularios**: `forms/` → Para inputs, campos, validadores
5. **Layout**: `layout/` → Para headers, sidebars, navegación principal
6. **Feedback**: `feedback/` → Para notificaciones, alertas, mensajes
7. **Tabs**: `tabs/` → Para pestañas y navegación interna

## 🔧 Beneficios

- ✅ **Mejor organización**: Fácil encontrar componentes relacionados
- ✅ **Escalabilidad**: Estructura preparada para crecimiento
- ✅ **Mantenibilidad**: Separación clara de responsabilidades
- ✅ **Reutilización**: Componentes agrupados por tipo facilitan reutilización
- ✅ **Onboarding**: Nuevos desarrolladores entienden la estructura rápidamente

## 📝 Notas

- Todos los imports han sido actualizados a la nueva estructura
- Los composables mantienen sus rutas relativas `../../composables/`
- La carpeta `ui/` anterior fue eliminada y sus componentes redistribuidos


## TODOS:

- Subir una licencia hay un bug en donde aparece que la licencia no se pudo crear pero si se crea y después sale la alerta de aceptación. 