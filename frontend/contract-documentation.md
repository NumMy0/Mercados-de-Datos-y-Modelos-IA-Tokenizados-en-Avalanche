## Documentación del contrato: AIModelMarketplace (AIMarket.sol)

direccion-del-contrato(alojado en avalanche-fuji): 0x32ddc28858e2bF318A8b25fECdc8729b78301A97

Este documento explica cómo usar e integrar el contrato `AIModelMarketplace` definido en `AIMarket.sol`. Está pensado para desarrolladores backend y frontend: incluye la descripción de funciones, parámetros, eventos, flujos recomendados y ejemplos con ethers.js.

## Resumen

AIModelMarketplace es un marketplace de modelos de IA tokenizados como NFTs (ERC-721). Permite a los autores subir modelos (mint), crear planes de licencia, vender/transferir NFTs y a los usuarios comprar licencias o comprar el NFT completo. El contrato sigue el patrón "pull payments" para retiradas.

Principales conceptos:
- Model (NFT): representa un modelo IA almacenado en IPFS. Cada modelo tiene un autor, precio base, planes de licencia y estado de venta.
- LicensePlan: plan asociado a un modelo que define precio y duración.
- License: licencia adquirida por un usuario con fecha de expiración.
- pendingWithdrawals: saldos que los vendedores/autores retiran manualmente (pull pattern).

## Estructuras y almacenamiento

- Model: { id, author, name, ipfsHash, basePrice, planIds, forSale, salePrice }
- LicensePlan: { price, duration, name, active }
- License: { expiresAt, planId }

Mapeos relevantes:
- models[modelId] => Model
- modelLicensePlans[modelId][planId] => LicensePlan
- nextPlanIdForModel[modelId] => next plan id incremental por modelo
- licenses[modelId][user] => License
- pendingWithdrawals[address] => uint256
- allModelIds[] => lista de todos los IDs mintados

## Eventos

Los eventos se emiten para que frontends y servicios backend puedan reaccionar de forma asíncrona.

- ModelUploaded(address indexed author, uint256 indexed modelId)
	- Emitido cuando se hace mint de un nuevo modelo.
	- Datos: quien subió y el id generado.

- LicensePlanCreated(uint256 indexed modelId, uint256 indexed planId, string name, uint256 price, uint256 duration)
	- Emitido cuando el owner del NFT crea un plan de licencia.

- LicensePurchased(address indexed buyer, uint256 indexed modelId, uint256 indexed planId, uint256 expiresAt)
	- Emitido cuando un comprador adquiere una licencia. Contiene la expiración calculada.

- ModelForSale(uint256 indexed modelId, uint256 price)
	- Emitido cuando el owner pone el modelo a la venta.

- ModelSaleCancelled(uint256 indexed modelId)
	- Emitido cuando el owner cancela la venta.

- ModelSold(uint256 indexed modelId, address indexed seller, address indexed buyer, uint256 price)
	- Emitido cuando un comprador paga y el NFT se transfiere (venta completa).

- ModelTransferred(address indexed from, address indexed to, uint256 indexed modelId)
	- Emitido para transferencias (incluye ventas y regalos).

- Withdrawal(address indexed to, uint256 amount)
	- Emitido cuando un usuario retira fondos acumulados.

## Lista de funciones públicas / externas

Nota: se indican parámetros, comportamiento esperado, condiciones (require) y eventos emitidos.

1) uploadModel(string _name, string _ipfsHash, uint256 _basePrice, string _tokenURI) external
	 - Acciones:
		 - Mint del NFT al msg.sender con un nuevo modelId (autoincremental).
		 - Guarda metadata del modelo (nombre, CID IPFS, precio base, tokenURI).
		 - Añade modelId a allModelIds.
	 - Requisitos: ninguno explícito (cualquier cuenta puede subir).
	 - Eventos: ModelUploaded(author, modelId)
	 - Uso típico (backend/frontend): crear metadata JSON en IPFS, luego llamar a esta función con tokenURI apuntando al JSON.

2) createLicensePlan(uint256 _modelId, string _name, uint256 _price, uint256 _duration) external
	 - Solo el owner del NFT puede llamar (ownerOf(_modelId) == msg.sender).
	 - Crea un nuevo plan con planId incremental por modelo (nextPlanIdForModel).
	 - Guarda planId en models[_modelId].planIds.
	 - Requisitos: modelo existe, duration > 0.
	 - Eventos: LicensePlanCreated(modelId, planId, name, price, duration)

3) setPlanActive(uint256 _modelId, uint256 _planId, bool _active) external
	 - Solo owner del NFT.
	 - Activa/desactiva el plan (no emite evento actualmente).

4) buyLicense(uint256 _modelId, uint256 _planId) external payable nonReentrant
	 - Compra de licencia:
		 - Verifica que el plan exista y esté activo.
		 - Requiere msg.value >= plan.price.
		 - Si msg.value > plan.price, devuelve el excedente inmediatamente (call refund).
		 - Acredita plan.price en pendingWithdrawals[author] (owner del NFT) — pull pattern.
		 - Calcula expiración: si ya tenía licencia activa extiende desde el expiry actual; si no, desde ahora.
		 - Guarda licenses[_modelId][buyer] = { expiresAt: newExpiry, planId }
	 - Eventos: LicensePurchased(buyer, modelId, planId, newExpiry)
	 - Errores comunes: "Insufficient payment", "Plan inactive or not exist".

5) hasActiveLicense(uint256 _modelId, address _user) public view returns (bool)
	 - Retorna true si licenses[_modelId][_user].expiresAt > block.timestamp.

6) getLicenseExpiry(uint256 _modelId, address _user) external view returns (uint256)
	 - Devuelve timestamp de expiración (0 si no existe).

7) getPlans(uint256 _modelId) external view returns (LicensePlan[] memory)
	 - Retorna todos los planes (structs) asociados al modelo en el orden de creación.

8) setModelForSale(uint256 _modelId, uint256 _price) external
	 - Solo owner puede llamar.
	 - Marca models[_modelId].forSale = true y salePrice = _price.
	 - Requisitos: price > 0.
	 - Eventos: ModelForSale(modelId, price)

9) cancelSale(uint256 _modelId) external
	 - Solo owner.
	 - Pone forSale = false y salePrice = 0.
	 - Eventos: ModelSaleCancelled(modelId)

10) buyModel(uint256 _modelId) external payable nonReentrant
		- Compra del NFT completo:
			- Requiere que el modelo esté forSale.
			- Requiere msg.value >= salePrice.
			- Si msg.value > salePrice, se reembolsa la diferencia.
			- Transfiere NFT al comprador (_transfer).
			- Actualiza models[_modelId].author = msg.sender.
			- Acredita salePrice a pendingWithdrawals[seller].
			- Cancela el estado de venta.
		- Eventos: ModelSold(modelId, seller, buyer, price) y ModelTransferred(seller, buyer, modelId)
		- Errores: "Model not for sale", "Insufficient payment".

11) transferModel(address _to, uint256 _modelId) external
		- Transferencia segura (_safeTransfer) sin pago (regalo/donación).
		- Solo owner puede llamar.
		- Actualiza models.author si el author coincidía con el sender.
		- Cancela venta si estaba en venta.
		- Eventos: ModelTransferred(from, to, modelId)

12) withdraw() external nonReentrant
		- Retira fondos acumulados en pendingWithdrawals[msg.sender].
		- Usa call{value: amount} y pone a 0 el saldo antes de enviar (pull pattern).
		- Eventos: Withdrawal(to, amount)
		- Requisitos: amount > 0.

13) getModel(uint256 _modelId) external view returns (...)
		- Devuelve información básica: id, author, name, ipfsHash, basePrice, forSale, salePrice, plansCount.

14) getAllModelIds() external view returns (uint256[] memory)
		- Retorna el arreglo `allModelIds` para paginación o listados.

15) checkUserLicense(uint256 _modelId, address _user) external view returns (bool)
		- Alias público para hasActiveLicense.

16) getTotalModels() external view returns (uint256)
		- Retorna el total de modelos mintados (nextModelId - 1).

17) getModelsInfo(uint256[] calldata _modelIds) external view returns (...)
		- Retorna arrays paralelos de información (id, author, name, forSale, salePrice) para un lote de IDs (útil para frontend).

## Firmas / Tipos (resumen rápido)

- uploadModel(string,string,uint256,string)
- createLicensePlan(uint256,string,uint256,uint256)
- setPlanActive(uint256,uint256,bool)
- buyLicense(uint256,uint256) payable
- hasActiveLicense(uint256,address) view returns (bool)
- getLicenseExpiry(uint256,address) view returns (uint256)
- getPlans(uint256) view returns (LicensePlan[])
- setModelForSale(uint256,uint256)
- cancelSale(uint256)
- buyModel(uint256) payable
- transferModel(address,uint256)
- withdraw()
- getModel(uint256) view returns (...)
- getAllModelIds() view returns (uint256[])
- getModelsInfo(uint256[] calldata) view returns (...)

## Flujos recomendados y ejemplos con ethers.js

Antes de los ejemplos: asume que ya tienes un provider y signer configurados (por ejemplo con ethers v5/v6). `contract` es una instancia de ethers.Contract apuntando a la dirección desplegada y con la ABI correcta.

1) Subir un modelo (autor)

Backend/Frontend (ethers):

```js
// metadata ya subida a IPFS -> tokenURI
const tx = await contract.connect(signer).uploadModel(name, ipfsHash, basePriceWei, tokenURI);
const receipt = await tx.wait();
// Escuchar ModelUploaded event en el receipt o con un listener global
```

Notas:
- tokenURI debe apuntar a un JSON con la metadata (name, description, image, etc.).

2) Crear un plan de licencia (owner del modelo)

```js
const tx = await contract.connect(ownerSigner).createLicensePlan(modelId, planName, priceWei, durationSeconds);
await tx.wait();
```

3) Comprar una licencia (usuario)

```js
const tx = await contract.connect(buyerSigner).buyLicense(modelId, planId, { value: priceWei });
await tx.wait();
// El backend puede verificar expiración con getLicenseExpiry(modelId, buyerAddress)
```

4) Poner un modelo a la venta y comprarlo

Owner:
```js
await contract.connect(ownerSigner).setModelForSale(modelId, salePriceWei);
```

Buyer:
```js
const tx = await contract.connect(buyerSigner).buyModel(modelId, { value: salePriceWei });
await tx.wait();
```

5) Retirar fondos (seller/author)

```js
await contract.connect(userSigner).withdraw();
```

6) Escuchar eventos en el frontend (ejemplo con ethers)

```js
contract.on('ModelUploaded', (author, modelId, event) => {
	// actualizar UI: nuevo modelo disponible
});

contract.on('LicensePurchased', (buyer, modelId, planId, expiresAt, event) => {
	// notificar compra de licencia
});

contract.on('ModelSold', (modelId, seller, buyer, price, event) => {
	// actualizar listado y balances
});

contract.on('Withdrawal', (to, amount, event) => {
	// opcional: confirmar retiro
});
```

Consejos:
- Usa filtros por indexed fields para escuchar eventos solo de interés: e.g., contract.filters.ModelUploaded(null, modelId)
- Para reproducibilidad, usa receipt.events en el backend después de await tx.wait() para procesar el evento específico asociado a esa transacción.

## Lectura de structs/arrays desde frontend

- `getPlans(modelId)` devuelve un array de structs. En ethers esto suele recibirse como array de tuples; mapea cada entrada a un objeto con { price: plan.price.toString(), duration: plan.duration.toNumber(), name: plan.name, active: plan.active }.
- `getModelsInfo([ids])` devuelve arrays paralelos; mapea por índice para construir objetos de modelo.

Ejemplo para procesar getModelsInfo:

```js
const [ids, authors, names, forSaleStatuses, salePrices] = await contract.getModelsInfo(modelIds);
const models = ids.map((id, i) => ({ id: id.toNumber(), author: authors[i], name: names[i], forSale: forSaleStatuses[i], salePrice: salePrices[i].toString() }));
```

## Manejo de errores y edge-cases (recomendado)

- Reembolsos: el contrato intenta reembolsar cualquier exceso de pago inmediatamente con call. Por tanto, cuando envíes exactamente el precio evita reembolsos adicionales.
- Race conditions: siempre confirma el receipt antes de actualizar tu backend o UI como si la compra se hubiera completado.
- Licencias encadenadas: si el usuario compra el mismo plan de nuevo antes de expiración, el contrato extiende la expiración (no crea múltiples entradas).
- Retiro de fondos: los saldos se acumulan en `pendingWithdrawals`; requiere que el usuario llame a `withdraw()` para transferir. El backend no debe asumir transferencias automáticas.

## Seguridad y buenas prácticas

- Validaciones en backend: no confíes ciegamente en eventos; confirma siempre con llamadas de lectura (p.ej., ownerOf, getModel, getLicenseExpiry) cuando sea necesario.
- Evita mandar más ETH del precio exacto (salvo si quieres permitir reembolso). Si ocurre, el contrato intenta devolver el exceso.
- Usa `nonReentrant` y patrón pull en frontend/backend: espera al receipt antes de considerar la acción completada.
- Manejo de IPFS: la metadata en tokenURI debe contener información suficiente para el UI (descripciones, enlaces de demo, requerimientos, etc.).

## Integración backend (sugerencias concretas)

- Worker/listener para eventos: ejecuta un servicio que escuche ModelUploaded, ModelForSale, ModelSold y LicensePurchased para actualizar una base de datos local. Usa filtros por contrato y confirma con `tx.wait()` o verificando logs reproducidos.
- Indexación: para listados, usa `getAllModelIds()` y luego `getModelsInfo` por lotes para poblar tu catálogo. Evita pedir `getPlans` en masa si hay muchos planes; pide bajo demanda.
- Pagos y contabilidad: no intentes retirar en nombre de otros; el propietario debe llamar a `withdraw`. Solo marca en tu DB que existe saldo pendiente según eventos y `pendingWithdrawals` lectura.

## Ejemplos de verificación en backend

- Verificar que un comprador realmente tiene licencia antes de permitir acceso a la descarga/uso:

```js
const has = await contract.hasActiveLicense(modelId, userAddress);
if (!has) throw new Error('No license');
// permitir acceso
```

- Obtener metadata del modelo:

```js
const model = await contract.getModel(modelId);
// model.ipfsHash -> recuperar desde IPFS
```

## Mapeo de eventos a acciones frontend/backend (quick reference)

- ModelUploaded -> actualizar catálogo, notificar a followers del autor
- LicensePlanCreated -> actualizar planes del modelo en la UI de administración del owner
- LicensePurchased -> emitir notificación al comprador, actualizar fecha de expiración en backend
- ModelForSale / ModelSaleCancelled -> actualizar estado de listings
- ModelSold -> actualizar propiedad, transferir permisos en backend, notificar vendedor y comprador
- ModelTransferred -> actualizar propietary en DB
- Withdrawal -> registrar movimiento contable

## Resumen de errores revertibles (mensajes require)

- "Model not found" — modelo inválido o id no existe
- "Only model owner can add plans" / "Only model owner" — llamada permitida solo al owner
- "Duration must be positive" — duración inválida al crear plan
- "Plan inactive or not exist" — plan no válido o desactivado
- "Insufficient payment" — pago menor al requerido
- "Price must be greater than 0" — precio de venta inválido
- "Invalid seller" — comprador intenta comprar a seller inválido
- "No funds to withdraw" — withdraw sin saldo

## Notas finales

Este documento cubre las operaciones principales para integrar `AIModelMarketplace`. Para mayores garantías:
- Incluye tests e2e que reproduzcan flujos críticos (compra licencia, compra modelo, retirada).
- Documenta en el frontend qué metadata IPFS se espera (campos JSON) y políticas de cache.

Si quieres, puedo generar ejemplos de scripts completos (Node.js) para:
- indexar modelos en una DB (Postgres/Mongo)
- listeners de eventos (con reconciliación por receipts)
- scripts de despliegue/minteo y pruebas unitarias.

---
Archivo fuente: `docs/contract/AIMarket.sol` (basado en el código entregado).

