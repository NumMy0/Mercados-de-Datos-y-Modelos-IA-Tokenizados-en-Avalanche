# ✅ Checklist de Testing: Sistema de Verificación de Licencias

## 🎯 Pre-requisitos

- [ ] Ambos servicios ejecutándose (`npm run dev`)
- [ ] Frontend: http://localhost:5173
- [ ] Inference Engine: http://localhost:3001
- [ ] Wallet instalada (Core Wallet o MetaMask)
- [ ] Smart Contract desplegado en Avalanche
- [ ] Al menos un modelo subido a la blockchain
- [ ] Al menos una cuenta con AVAX para pruebas

## 🧪 Tests Funcionales

### Test 1: Sin Wallet Conectada

**Objetivo**: Verificar que el sistema solicita conexión de wallet

**Pasos**:
1. [ ] Asegurar que wallet NO está conectada
2. [ ] Navegar a un modelo
3. [ ] Click en "Ver Detalles"
4. [ ] Click en "Ejecutar Inferencia con este Modelo"

**Resultado Esperado**:
- [ ] Modal se abre correctamente
- [ ] Banner AZUL aparece: "💼 Conecta tu wallet para verificar tu licencia"
- [ ] Botón muestra: "Conecta Wallet"
- [ ] Botón está DESHABILITADO
- [ ] Click en botón ejecutar muestra prompt para conectar
- [ ] No hay errores en consola

### Test 2: Wallet Conectada - Sin Licencia

**Objetivo**: Verificar bloqueo para usuarios sin licencia

**Pasos**:
1. [ ] Conectar wallet a la aplicación
2. [ ] Asegurar que NO tienes licencia para el modelo de prueba
3. [ ] Navegar a ese modelo
4. [ ] Click en "Ver Detalles"
5. [ ] Click en "Ejecutar Inferencia con este Modelo"

**Resultado Esperado**:
- [ ] Modal se abre correctamente
- [ ] Aparece mensaje: "🔍 Verificando licencia..." (breve)
- [ ] Banner AMARILLO aparece: "⚠️ Sin licencia activa"
- [ ] Mensaje incluye: "Necesitas comprar una licencia..."
- [ ] Botón muestra: "Sin Licencia"
- [ ] Botón está DESHABILITADO
- [ ] Tooltip muestra: "Necesitas una licencia activa"
- [ ] Consola muestra: "⚠️ Licencia no encontrada o expirada"

### Test 3: Wallet Conectada - Con Licencia

**Objetivo**: Verificar acceso completo para usuarios con licencia

**Pre-requisito**: Comprar licencia para un modelo

**Pasos**:
1. [ ] Conectar wallet
2. [ ] Comprar licencia para un modelo (desde la pestaña Licencias)
3. [ ] Esperar confirmación de transacción
4. [ ] Navegar al modelo con licencia
5. [ ] Click en "Ver Detalles"
6. [ ] Click en "Ejecutar Inferencia con este Modelo"

**Resultado Esperado**:
- [ ] Modal se abre correctamente
- [ ] Aparece mensaje: "🔍 Verificando licencia..." (breve)
- [ ] Banner VERDE aparece: "✅ Licencia activa - Puedes ejecutar inferencias"
- [ ] Botón muestra: "Ejecutar Inferencia"
- [ ] Botón está HABILITADO
- [ ] Icono de rayo visible en botón
- [ ] Consola muestra: "✅ Licencia verificada correctamente"

### Test 4: Ejecución de Inferencia Exitosa

**Objetivo**: Verificar flujo completo de inferencia

**Pre-requisito**: Test 3 completado (con licencia)

**Pasos**:
1. [ ] Abrir modal (con licencia activa)
2. [ ] Seleccionar tipo de entrada (imagen o texto)
3. [ ] Si es imagen: seleccionar archivo de prueba
4. [ ] Si es texto: escribir texto de prueba
5. [ ] Click en "Ejecutar Inferencia"
6. [ ] Esperar resultado

**Resultado Esperado**:
- [ ] Botón cambia a "Procesando..." con spinner
- [ ] Banner azul aparece: "Procesando..."
- [ ] Mensaje: "El modelo está analizando tu entrada"
- [ ] Botón se deshabilita durante procesamiento
- [ ] Consola muestra: "✅ Licencia verificada correctamente" (doble check)
- [ ] Resultado aparece en banner VERDE
- [ ] JSON formateado visible
- [ ] Tiempo de procesamiento mostrado (ej: "234ms")
- [ ] Botón "Ejecutar Inferencia" desaparece
- [ ] Botón "Cerrar" permanece
- [ ] No hay errores en consola

### Test 5: Cambio de Cuenta (Switch Account)

**Objetivo**: Verificar que el sistema detecta cambios de cuenta

**Pasos**:
1. [ ] Conectar wallet con Cuenta A (CON licencia)
2. [ ] Abrir modal de inferencia
3. [ ] Verificar banner verde (licencia activa)
4. [ ] SIN CERRAR EL MODAL, cambiar a Cuenta B (SIN licencia) en MetaMask
5. [ ] Observar cambios en el modal

**Resultado Esperado**:
- [ ] Modal detecta cambio automáticamente
- [ ] Banner cambia de VERDE a GRIS (verificando)
- [ ] Banner cambia de GRIS a AMARILLO (sin licencia)
- [ ] Botón se deshabilita automáticamente
- [ ] Texto del botón cambia a "Sin Licencia"
- [ ] Consola muestra nueva verificación
- [ ] No hay errores en consola

### Test 6: Intentar Bypass (Seguridad)

**Objetivo**: Verificar que no se puede ejecutar sin licencia

**Pasos**:
1. [ ] Conectar wallet SIN licencia
2. [ ] Abrir modal
3. [ ] Verificar que botón está deshabilitado
4. [ ] Intentar forzar click (DevTools o hack)
5. [ ] Observar comportamiento

**Resultado Esperado**:
- [ ] Botón permanece deshabilitado (no se puede clickear)
- [ ] Si se intenta forzar via código, `runInference()` rechaza
- [ ] Error en consola: "❌ No tienes una licencia activa..."
- [ ] NO se envía request al inference engine
- [ ] Modal muestra error apropiadamente

### Test 7: Manejo de Errores de Red

**Objetivo**: Verificar comportamiento ante problemas de conexión

**Pasos**:
1. [ ] Conectar wallet con licencia
2. [ ] DETENER el inference engine (`Ctrl+C` en terminal)
3. [ ] Intentar ejecutar inferencia
4. [ ] Observar comportamiento

**Resultado Esperado**:
- [ ] Verificación de licencia funciona (usa RPC, no inference engine)
- [ ] Botón permanece habilitado (licencia OK)
- [ ] Al ejecutar: error de red aparece
- [ ] Banner ROJO de error se muestra
- [ ] Mensaje de error descriptivo
- [ ] Botón vuelve a estado normal (no queda en "Procesando...")
- [ ] Usuario puede cerrar modal o reintentar

### Test 8: Licencia Expirada

**Objetivo**: Verificar detección de licencia expirada

**Pre-requisito**: Tener una licencia expirada (o simular con contrato de prueba)

**Pasos**:
1. [ ] Conectar wallet con licencia expirada
2. [ ] Abrir modal de inferencia
3. [ ] Observar estado

**Resultado Esperado**:
- [ ] Banner AMARILLO: "⚠️ Sin licencia activa"
- [ ] Botón deshabilitado: "Sin Licencia"
- [ ] Consola muestra que licencia expiró
- [ ] Mensaje sugiere comprar nueva licencia

### Test 9: Múltiples Inferencias Consecutivas

**Objetivo**: Verificar estabilidad con uso repetido

**Pasos**:
1. [ ] Conectar wallet con licencia
2. [ ] Ejecutar inferencia #1
3. [ ] Esperar resultado
4. [ ] Cerrar modal
5. [ ] Reabrir modal
6. [ ] Ejecutar inferencia #2
7. [ ] Repetir 3-5 veces

**Resultado Esperado**:
- [ ] Cada verificación de licencia funciona correctamente
- [ ] No hay degradación de performance
- [ ] No hay memory leaks visibles
- [ ] Cada resultado se muestra correctamente
- [ ] Modal se resetea correctamente entre usos
- [ ] No hay errores acumulados en consola

### Test 10: Responsive Design

**Objetivo**: Verificar UI en diferentes tamaños

**Pasos**:
1. [ ] Abrir modal en pantalla completa (desktop)
2. [ ] Reducir ancho del navegador (tablet)
3. [ ] Reducir más (mobile)
4. [ ] Verificar que todo se ve correctamente

**Resultado Esperado**:
- [ ] Banners se adaptan al ancho
- [ ] Texto no se corta o desborda
- [ ] Botones permanecen accesibles
- [ ] Modal no excede viewport
- [ ] Scroll funciona si es necesario

## 🎨 Tests de UI/UX

### Validación Visual

- [ ] Todos los iconos cargan correctamente (🛡️, ⚠️, ℹ️, ⚙️)
- [ ] Colores son consistentes con el diseño
- [ ] Animaciones son suaves (spinner, transiciones)
- [ ] Banners tienen bordes y paddings correctos
- [ ] Textos son legibles en modo claro Y oscuro
- [ ] Gradientes del botón se ven correctamente
- [ ] Sombras y hover effects funcionan

### Accesibilidad

- [ ] Tooltips aparecen al hacer hover
- [ ] Tab navigation funciona
- [ ] Contraste de colores es suficiente
- [ ] Mensajes de error son claros
- [ ] Estados disabled son obvios visualmente

## 🔍 Tests de Consola

### Logs Esperados

**Abriendo modal (con licencia)**:
```
✅ Debe aparecer:
🔍 Verificando licencia para modelo X y usuario 0x...
✅ Licencia verificada correctamente
```

**Abriendo modal (sin licencia)**:
```
✅ Debe aparecer:
🔍 Verificando licencia para modelo X y usuario 0x...
⚠️ Licencia no encontrada o expirada
```

**Ejecutando inferencia (con licencia)**:
```
✅ Debe aparecer:
🔍 Verificando licencia para modelo X y usuario 0x...
✅ Licencia verificada correctamente
[Logs del inference engine...]
```

**Intentando ejecutar (sin licencia)**:
```
✅ Debe aparecer:
Error: ❌ No tienes una licencia activa para usar este modelo.
```

### Errores NO Esperados

❌ NO debe aparecer:
- `Cannot read property 'value' of undefined`
- `hasActiveLicense is not a function`
- `Maximum call stack size exceeded`
- `Network error` (excepto si inference engine está caído)
- `CORS error` (si ambos servicios están corriendo)
- Warnings de Vue sobre refs no reactivas

## 📊 Resumen de Verificación

### Criterios de Aprobación

Para que el sistema se considere funcional, TODOS estos deben ser ✅:

- [ ] **Seguridad**: No se puede ejecutar inferencia sin licencia
- [ ] **UX**: Estados visuales claros y distintos
- [ ] **Performance**: Verificación rápida (< 2 segundos)
- [ ] **Reactividad**: Detecta cambios de cuenta automáticamente
- [ ] **Estabilidad**: No hay errores en consola en flujo normal
- [ ] **Robustez**: Maneja errores de red gracefully
- [ ] **Consistencia**: Funciona igual en todos los navegadores compatibles

### Navegadores a Probar

- [ ] Chrome/Edge (con MetaMask)
- [ ] Firefox (con MetaMask)
- [ ] Brave (con built-in wallet o MetaMask)
- [ ] Safari (si aplica, con MetaMask)

### Dispositivos a Probar

- [ ] Desktop (1920x1080 o mayor)
- [ ] Laptop (1366x768)
- [ ] Tablet (768px width)
- [ ] Mobile (375px width)

## 🐛 Registro de Bugs Encontrados

| # | Descripción | Severidad | Estado | Notas |
|---|-------------|-----------|--------|-------|
| 1 |             |           |        |       |
| 2 |             |           |        |       |
| 3 |             |           |        |       |

**Severidades**:
- 🔴 Crítico: Bloquea funcionalidad principal
- 🟡 Mayor: Afecta UX significativamente
- 🟢 Menor: Issue cosmético o edge case

## ✅ Firma de Aprobación

- [ ] Todos los tests funcionales pasaron
- [ ] Todos los tests de UI/UX pasaron
- [ ] Todos los tests de consola pasaron
- [ ] No hay bugs críticos pendientes
- [ ] Documentación revisada y actualizada

**Testeado por**: _________________  
**Fecha**: _________________  
**Versión**: 1.0.0  
**Estado**: ⬜ En Testing | ⬜ Aprobado | ⬜ Rechazado

---

**Archivo**: TESTING-CHECKLIST.md  
**Fecha creación**: Octubre 9, 2025
