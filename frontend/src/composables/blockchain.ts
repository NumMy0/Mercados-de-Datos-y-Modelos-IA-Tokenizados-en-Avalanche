
import { ethers } from "ethers";
import contractABI from "../../AIMarketABI.json"; // Asegúrate de tener este ABI (archivo en la raíz del frontend)

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const RPC_URL = import.meta.env.VITE_RPC_URL;

// ---- Helpers para evitar código repetido ----
/**
 * Convierte BigNumber/hex/bigint a string seguro
 */
export function toStr(v: any) {
    if (v === null || v === undefined) return null
    try {
        if (typeof v === 'bigint') return v.toString()
        if ((v as any)._hex) return (v as any).toString()
        return String(v)
    } catch (e) { return String(v) }
}

/**
 * Devuelve un provider de lectura: prioriza RPC_URL (JsonRpcProvider) y hace fallback a BrowserProvider
 */
export function getReadProvider(): any {
    let provider: any = null
    if (RPC_URL) {
        try { provider = new (ethers as any).JsonRpcProvider(RPC_URL) } catch (e) { provider = null }
    }
    if (!provider && typeof window !== 'undefined' && (window as any).ethereum) {
        provider = new (ethers as any).BrowserProvider((window as any).ethereum)
    }
    return provider
}

/**
 * Crea un signer desde MetaMask y la instancia del contrato conectada al signer
 */
export async function getSignerAndContract() {
    if (!window.ethereum) throw new Error('MetaMask no detectado')
    const provider = new (ethers as any).BrowserProvider((window as any).ethereum)
    const signer = await provider.getSigner()
    const contract = new (ethers as any).Contract(CONTRACT_ADDRESS, contractABI, signer)
    return { provider, signer, contract }
}

/**
 * Crea una instancia del contrato usando un provider o signer existente
 */
export function getContractWith(providerOrSigner: any) {
    return new (ethers as any).Contract(CONTRACT_ADDRESS, contractABI, providerOrSigner)
}

/**
 * Intenta formatear wei a Ether legible, retorna null si falla
 */
export function formatWei(v: any): string | null {
    try {
        if (v == null) return null
        return (ethers as any).formatEther(v)
    } catch (e) {
        return null
    }
}

// ---- fin helpers ----

export async function connectContract() {
    try {
        // 1️⃣ Crear provider desde MetaMask
        if (!window.ethereum) {
            throw new Error("MetaMask no está instalado");
        }
        await window.ethereum.request({ method: "eth_requestAccounts" });

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // 2️⃣ Instanciar el contrato
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

        // 3️⃣ Verificar que el contrato existe en la red
        const network = await provider.getNetwork();
        console.log("Conectado a red:", network.name, "ID:", Number(network.chainId));

        const owner = await (contract as any).owner();
        console.log("Contrato conectado correctamente ✅");
        console.log("Owner del contrato:", owner);

    return { contract, signer, provider };
    } catch (error) {
        console.error("Error al conectar con el contrato:", error);
        throw error;
    }
}

/**
 * 🔹 Registrar modelo en la blockchain
 */

/**
 * uploadModelBlockchain
 * @param name Nombre del modelo
 * @param ipfsHash CID del archivo en IPFS
 * @param basePrice Valor en wei (bigint o string) o número — se recomienda pasar wei (usar parseEther en el llamador)
 * @param tokenURI Metadatos/tokenURI del modelo
 */
export async function uploadModelBlockchain(name: string, ipfsHash: string, basePrice: string | number | bigint, tokenURI: string) {
    console.log('subiendo a block');
    const { contract } = await getSignerAndContract()

    // Safety: asegurarnos de que la función existe en el contrato (evita errores de tipo en tiempo de compilación)
    if (typeof (contract as any).uploadModel !== 'function') {
        throw new Error('La función uploadModel no está disponible en el contrato. Revisa tu ABI y la dirección del contrato.');
    }

    const tx = await (contract as any).uploadModel(name, ipfsHash, basePrice, tokenURI);
    console.log("⏳ Enviando transacción...");
    const receipt = await tx.wait();
    console.log("✅ Modelo subido:", receipt);

    return receipt;
}


/**
 * createLicensePlan
 * Crea un nuevo plan de licencia para un modelo (solo owner puede llamar en el contrato).
 * @param modelId id del modelo
 * @param name nombre del plan
 * @param priceWei precio en wei (string|number|bigint). Si deseas pasar AVAX legible, conviértelo con ethers.parseEther en el llamador.
 * @param duration duración en segundos (o en la unidad que tu contrato espere)
 */
export async function createLicensePlan(modelId: number | string, name: string, priceWei: string | number | bigint, duration: number) {
    const { contract } = await getSignerAndContract()

    if (typeof (contract as any).createLicensePlan !== 'function') {
        throw new Error('La función createLicensePlan no está disponible en el contrato. Revisa tu ABI y la dirección del contrato.')
    }

    // Ejecutar la transacción
    const tx = await (contract as any).createLicensePlan(modelId, name, priceWei, duration)
    const receipt = await tx.wait()
    return receipt
}

/**
 * setModelForSale
 * Marca un modelo como disponible para la venta y establece su precio (solo owner puede llamar).
 * @param modelId id del modelo
 * @param priceWei precio en wei (string|number|bigint)
 */
export async function setModelForSale(modelId: number | string, priceWei: string | number | bigint) {
    const { contract } = await getSignerAndContract()

    if (typeof (contract as any).setModelForSale !== 'function') {
        throw new Error('La función setModelForSale no está disponible en el contrato. Revisa tu ABI y la dirección del contrato.')
    }

    const tx = await (contract as any).setModelForSale(modelId, priceWei)
    const receipt = await tx.wait()
    return receipt
}

/**
 * buyModel
 * Compra el NFT completo (transacción con value). El caller paga el precio y recibe el NFT.
 * @param modelId id del modelo
 * @param priceWei precio en wei (string|number|bigint)
 */
export async function buyModel(modelId: number | string, priceWei: string | number | bigint) {
    const { contract } = await getSignerAndContract()

    if (typeof (contract as any).buyModel !== 'function') {
        throw new Error('La función buyModel no está disponible en el contrato. Revisa tu ABI y la dirección del contrato.')
    }

    // Ejecutar la transacción enviando el valor (priceWei)
    const tx = await (contract as any).buyModel(modelId, { value: priceWei })
    const receipt = await tx.wait()
    return receipt
}

export async function buyLicense(modelId: number | string, planIndex: number, priceWei: string | number | bigint) {
    const { contract } = await getSignerAndContract()
    if (typeof (contract as any).buyLicense !== 'function') {
        throw new Error('La función buyLicense no está disponible en el contrato. Revisa tu ABI y la dirección del contrato.')
    }
    // Ejecutar la transacción enviando el valor (priceWei)
    const tx = await (contract as any).buyLicense(modelId, planIndex, { value: priceWei })
    const receipt = await tx.wait()
    return receipt
}

/**
 * cancelSale
 * Cancela la venta de un modelo (solo owner puede llamar).
 * @param modelId id del modelo
 */
export async function cancelSale(modelId: number | string) {
    const { contract } = await getSignerAndContract()

    if (typeof (contract as any).cancelSale !== 'function') {
        throw new Error('La función cancelSale no está disponible en el contrato. Revisa tu ABI y la dirección del contrato.')
    }

    const tx = await (contract as any).cancelSale(modelId)
    const receipt = await tx.wait()
    return receipt
}

/**
 * transferModel
 * Transfiere la propiedad de un modelo NFT a otra dirección usando la función personalizada del contrato.
 * @param toAddress - Dirección del destinatario
 * @param modelId - ID del modelo a transferir
 * @returns TransactionReceipt
 */
export async function transferModel(toAddress: string, modelId: number | string) {
    const { contract } = await getSignerAndContract()

    // Validar que la dirección sea válida
    if (!toAddress || typeof toAddress !== 'string') {
        throw new Error('Dirección de destino inválida')
    }

    if (typeof (contract as any).transferModel !== 'function') {
        throw new Error('La función transferModel no está disponible en el contrato. Revisa tu ABI y la dirección del contrato.')
    }

    // Llamar a la función personalizada transferModel(address _to, uint256 _modelId)
    const tx = await (contract as any).transferModel(toAddress, modelId)
    const receipt = await tx.wait()
    return receipt
}

/**
 * setPlanActive
 * Activa o desactiva un plan de licencia de un modelo.
 * @param modelId - ID del modelo
 * @param planIndex - Índice del plan de licencia (planId)
 * @param active - true para activar, false para desactivar
 * @returns TransactionReceipt
 */
export async function setPlanActive(modelId: number | string, planIndex: number, active: boolean) {
    const { contract } = await getSignerAndContract()

    if (typeof (contract as any).setPlanActive !== 'function') {
        throw new Error('La función setPlanActive no está disponible en el contrato. Revisa tu ABI y la dirección del contrato.')
    }

    // Llamar a setPlanActive(uint256 _modelId, uint256 _planId, bool _active)
    const tx = await (contract as any).setPlanActive(modelId, planIndex, active)
    const receipt = await tx.wait()
    return receipt
}

/**
 * withdraw
 * Llama a la función on-chain `withdraw()` para que el caller retire su balance pendiente.
 * @returns TransactionReceipt
 */
export async function withdraw() {
    const { contract } = await getSignerAndContract()

    if (typeof (contract as any).withdraw !== 'function') {
        throw new Error('La función withdraw no está disponible en el contrato. Revisa tu ABI y la dirección del contrato.')
    }

    const tx = await (contract as any).withdraw()
    const receipt = await tx.wait()
    return receipt
}

/**
 * hasActiveLicense
 * Consulta si un usuario tiene licencia activa para un modelo.
 * @param modelId id del modelo
 * @param userAddress dirección del usuario
 */
export async function hasActiveLicense(modelId: number | string, userAddress: string) {
    // provider para lecturas
    const provider = getReadProvider()
    if (!provider) throw new Error('No hay proveedor RPC disponible')
    const contract = getContractWith(provider)
    if (typeof (contract as any).hasActiveLicense !== 'function' && typeof (contract as any).checkUserLicense !== 'function') {
        throw new Error('La función hasActiveLicense/checkUserLicense no está disponible en el contrato.')
    }

    try {
        if (typeof (contract as any).hasActiveLicense === 'function') {
            return await (contract as any).hasActiveLicense(modelId, userAddress)
        }
        return await (contract as any).checkUserLicense(modelId, userAddress)
    } catch (e) {
        console.error('Error en hasActiveLicense:', e)
        return false
    }
}

/**
 * getLicenseExpiry
 * Retorna el timestamp de expiración (segundos) o 0
 */
export async function getLicenseExpiry(modelId: number | string, userAddress: string) {
    const provider = getReadProvider()
    if (!provider) throw new Error('No hay proveedor RPC disponible')
    const contract = getContractWith(provider)
    if (typeof (contract as any).getLicenseExpiry !== 'function') {
        throw new Error('La función getLicenseExpiry no está disponible en el contrato.')
    }

    try {
        const t: any = await (contract as any).getLicenseExpiry(modelId, userAddress)
        // t puede ser BigNumber
        try { return (t as any).toNumber ? (t as any).toNumber() : Number(t) } catch (e) { return Number(t) }
    } catch (e) {
        console.error('Error en getLicenseExpiry:', e)
        return 0
    }
}

/**
 * getPendingWithdrawal
 * Lee el mapping público `pendingWithdrawals(address)` del contrato y retorna el valor en wei y formateado.
 * @param userAddress dirección del usuario
 * @returns { wei: string, readable: string | null }
 */
export async function getPendingWithdrawal(userAddress: string) {
    if (!userAddress) throw new Error('userAddress is required')

    // elegir provider: prioridad a RPC_URL (lecturas públicas), sino MetaMask
    const provider = getReadProvider()
    if (!provider) throw new Error('No hay proveedor RPC disponible (define VITE_RPC_URL o conecta MetaMask)')
    const contract = getContractWith(provider)
    if (typeof (contract as any).pendingWithdrawals !== 'function') {
        throw new Error('El getter pendingWithdrawals no está disponible en el contrato. Revisa tu ABI.')
    }

    try {
        const raw: any = await (contract as any).pendingWithdrawals(userAddress)
        const wei = raw ? ((raw as any).toString ? (raw as any).toString() : String(raw)) : '0'
        let readable: string | null = null
    readable = formatWei(raw)
        return { wei, readable }
    } catch (e) {
        console.error('Error en getPendingWithdrawal:', e)
        return { wei: '0', readable: '0' }
    }
}


/**
 * getModels
 * Recupera información de varios modelos llamando a `getModelsInfo` del contrato.
 * Devuelve un array de objetos con campos legibles (id y precios como strings).
 * @param modelIds Array de ids (number o string)
 */
export async function getModels(modelIds: Array<number | string>) {
    if (!modelIds || modelIds.length === 0) return [];

    // elegir provider: prioridad a RPC_URL (lecturas públicas), sino MetaMask
    const provider = getReadProvider()
    if (!provider) throw new Error('No hay proveedor RPC disponible (define VITE_RPC_URL o conecta MetaMask)')
    const contract = getContractWith(provider)

    // Llamada al contrato: getModelsInfo devuelve arrays paralelos
    const raw = await (contract as any).getModelsInfo(modelIds);

    // Esperamos la forma: [ids, authors, names, forSaleStatuses, salePrices]
    const [ids, authors, names, forSaleStatuses, salePrices] = raw;

    const toStrLocal = toStr

    const result = (ids || []).map((id: any, i: number) => {
        const salePriceWei = salePrices?.[i] ?? null
        let salePriceReadable: string | null = null
        salePriceReadable = formatWei(salePriceWei)

        return {
            id: toStrLocal(id),
            author: authors?.[i] ?? null,
            name: names?.[i] ?? null,
            forSale: Boolean(forSaleStatuses?.[i]),
            salePriceWei: toStrLocal(salePriceWei),
            salePrice: salePriceReadable
        }
    });

    return result;
}

/**
 * getAllModelIds
 * Retorna un array con todos los modelIds desde el contrato (getAllModelIds)
 */
export async function getAllModelIds() {
    const provider = getReadProvider()
    if (!provider) throw new Error('No hay proveedor RPC disponible (define VITE_RPC_URL o conecta MetaMask)')
    const contract = getContractWith(provider)

    const raw: any = await (contract as any).getAllModelIds()
    // raw expected to be array of BigNumbers
    return (raw || []).map((v: any) => {
        try { return (v as any).toString() } catch (e) { return String(v) }
    })
}

/**
 * getModelById
 * Recupera la información completa de un modelo llamando a `getModel(modelId)` y opcionalmente `getPlans(modelId)`.
 * Normaliza precios (wei y legible) y retorna un objeto listo para el frontend.
 * @param modelId id del modelo
 */
export async function getModelById(modelId: number | string) {
    if (modelId === null || modelId === undefined) throw new Error('modelId is required')


    const provider = getReadProvider()
    if (!provider) throw new Error('No hay proveedor RPC disponible (define VITE_RPC_URL o conecta MetaMask)')
    const contract = getContractWith(provider)

    // Llamada principal
    const raw = await (contract as any).getModel(modelId)

    // raw puede ser un objeto o un array/tuple. Normalizamos.
    let id: any, author: any, name: any, ipfsHash: any, basePriceWei: any, forSale: any, salePriceWei: any, plansCount: any

    if (raw && typeof raw === 'object') {
        // Si es un array-like (tupla) con índices numéricos
        if (Array.isArray(raw)) {
            id = raw[0]
            author = raw[1]
            name = raw[2]
            ipfsHash = raw[3]
            basePriceWei = raw[4]
            forSale = raw[5]
            salePriceWei = raw[6]
            plansCount = raw[7]
        } else {
            // Objeto con propiedades nombradas
            id = raw.id ?? raw._id
            author = raw.author
            name = raw.name
            ipfsHash = raw.ipfsHash
            basePriceWei = raw.basePrice
            forSale = raw.forSale
            salePriceWei = raw.salePrice
            plansCount = raw.plansCount ?? raw.planCount
        }
    }

    const toStr = (v: any) => {
        if (v === null || v === undefined) return null
        try {
            if (typeof v === 'bigint') return v.toString()
            if ((v as any)._hex) return (v as any).toString()
            return String(v)
        } catch (e) { return String(v) }
    }

    let basePriceReadable: string | null = null
    let salePriceReadable: string | null = null
    basePriceReadable = formatWei(basePriceWei)
    salePriceReadable = formatWei(salePriceWei)

    // Intentar obtener planes si la función existe
    let plans: any[] | null = null
    try {
        if (typeof (contract as any).getPlans === 'function') {
            const rawPlans = await (contract as any).getPlans(modelId)
            // rawPlans es un array de structs; mapeamos
            plans = (rawPlans || []).map((p: any) => {
                const priceWei = p?.price ?? null
                let priceReadable: string | null = null
                priceReadable = formatWei(priceWei)

                // duration del contrato viene en segundos; convertir a días para la UI
                let durationDays: number | null = null
                try {
                    const rawDur = p?.duration ?? null
                    if (rawDur != null) {
                        // Si es BigNumber con toNumber, use toNumber(), si no intente Number()
                        const seconds = (typeof rawDur.toNumber === 'function') ? rawDur.toNumber() : Number(rawDur)
                        if (!Number.isNaN(seconds)) {
                            durationDays = Math.max(0, Math.floor(seconds / (24 * 60 * 60)))
                        }
                    }
                } catch (e) {
                    durationDays = null
                }

                return {
                    name: p.name ?? null,
                    priceWei: toStr(priceWei),
                    price: priceReadable,
                    duration: durationDays,
                    active: p.active ?? null
                }
            })
        }
    } catch (e) {
        console.debug('No se pudieron obtener planes:', e)
        plans = null
    }

    // Intentar leer tokenURI si el contrato implementa ERC721 tokenURI
    let tokenURI: string | null = null
    try {
        if (typeof (contract as any).tokenURI === 'function') {
            tokenURI = await (contract as any).tokenURI(modelId)
        }
    } catch (e) {
        // no crítico; el contrato puede no exponer tokenURI o la llamada puede fallar en algunos providers
        console.debug('No se pudo leer tokenURI desde el contrato en getModelById:', e)
        tokenURI = null
    }

    return {
        id: toStr(id),
        author: author ?? null,
        name: name ?? null,
        ipfsHash: ipfsHash ?? null,
        tokenURI: tokenURI,
        basePriceWei: toStr(basePriceWei),
        basePrice: basePriceReadable,
        forSale: Boolean(forSale),
        salePriceWei: toStr(salePriceWei),
        salePrice: salePriceReadable,
        plansCount: plansCount ?? null,
        plans
    }
}










