// src/lib/blockchain.js
import { ethers } from "ethers";
import contractABI from "../../AIMarketABI.json"; // Asegúrate de tener este ABI (archivo en la raíz del frontend)

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const RPC_URL = import.meta.env.VITE_RPC_URL;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

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

export async function uploadToIPFS(file: any) {
    if (!PINATA_JWT) throw new Error('Missing PINATA_JWT (VITE_PINATA_JWT) environment variable.');

    // Verificar que el archivo es un Blob/File
    if (!file || (typeof File !== 'undefined' && !(file instanceof File)) && !(file instanceof Blob)) {
        throw new Error('Invalid file provided to uploadToIPFS. Expected a File or Blob.');
    }

    const formData = new FormData();
    formData.append("file", file);

    let res: Response;
    try {
        res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`,
                // NOTE: don't set Content-Type; browser will set the multipart boundary
            },
            body: formData,
        });
    } catch (err) {
        throw new Error(`Network error uploading to Pinata: ${String(err)}`);
    }

    const text = await res.text();
    if (!res.ok) {
        // Intentar parsear JSON si es posible
        let body = text;
        try { body = JSON.parse(text); } catch (e) { /* keep text */ }
        throw new Error(`Pinata upload failed: ${res.status} ${res.statusText} - ${JSON.stringify(body)}`);
    }

    // Si la respuesta fue JSON válido, parsearlo
    let data: any;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
    console.log("Archivo subido a IPFS:", data);
    return data.IpfsHash; // el CID del archivo
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
    if (!window.ethereum) throw new Error("MetaMask no detectado");
    console.log('subiendo a block');

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

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
 * getModels
 * Recupera información de varios modelos llamando a `getModelsInfo` del contrato.
 * Devuelve un array de objetos con campos legibles (id y precios como strings).
 * @param modelIds Array de ids (number o string)
 */
export async function getModels(modelIds: Array<number | string>) {
    if (!modelIds || modelIds.length === 0) return [];

    // elegir provider: prioridad a RPC_URL (lecturas públicas), sino MetaMask
    let provider: any;
    if (RPC_URL) {
        try {
            provider = new (ethers as any).JsonRpcProvider(RPC_URL);
        } catch (err) {
            console.warn('No se pudo crear JsonRpcProvider, usaremos window.ethereum si está disponible', err);
        }
    }
    if (!provider) {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            provider = new (ethers as any).BrowserProvider((window as any).ethereum);
        } else {
            throw new Error('No hay proveedor RPC disponible (define VITE_RPC_URL o conecta MetaMask)');
        }
    }

    const contract = new (ethers as any).Contract(CONTRACT_ADDRESS, contractABI, provider);

    // Llamada al contrato: getModelsInfo devuelve arrays paralelos
    const raw = await (contract as any).getModelsInfo(modelIds);

    // Esperamos la forma: [ids, authors, names, forSaleStatuses, salePrices]
    const [ids, authors, names, forSaleStatuses, salePrices] = raw;

    const toStr = (v: any) => {
        if (v === null || v === undefined) return null;
        try {
            if (typeof v === 'bigint') return v.toString();
            if (v._hex) return (v as any).toString();
            return String(v);
        } catch (e) { return String(v); }
    };

    const result = (ids || []).map((id: any, i: number) => {
        const salePriceWei = salePrices?.[i] ?? null
        let salePriceReadable: string | null = null
        try {
            if (salePriceWei != null) {
                salePriceReadable = (ethers as any).formatEther(salePriceWei)
            }
        } catch (e) {
            salePriceReadable = null
        }

        return {
            id: toStr(id),
            author: authors?.[i] ?? null,
            name: names?.[i] ?? null,
            forSale: Boolean(forSaleStatuses?.[i]),
            salePriceWei: toStr(salePriceWei),
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
    // provider: usar RPC_URL si está disponible para lecturas
    let provider: any
    if (RPC_URL) {
        try {
            provider = new (ethers as any).JsonRpcProvider(RPC_URL)
        } catch (err) {
            console.warn('Error creando JsonRpcProvider, fallback a window.ethereum', err)
        }
    }
    if (!provider) {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            provider = new (ethers as any).BrowserProvider((window as any).ethereum)
        } else {
            throw new Error('No hay proveedor RPC disponible (define VITE_RPC_URL o conecta MetaMask)')
        }
    }
    await console.log("Using contract address:", CONTRACT_ADDRESS);
    const contract = new (ethers as any).Contract(CONTRACT_ADDRESS, contractABI, provider)
    
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

    // provider: usar RPC_URL si está disponible para lecturas
    let provider: any
    if (RPC_URL) {
        try {
            provider = new (ethers as any).JsonRpcProvider(RPC_URL)
        } catch (err) {
            console.warn('Error creando JsonRpcProvider, fallback a window.ethereum', err)
        }
    }
    if (!provider) {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            provider = new (ethers as any).BrowserProvider((window as any).ethereum)
        } else {
            throw new Error('No hay proveedor RPC disponible (define VITE_RPC_URL o conecta MetaMask)')
        }
    }

    const contract = new (ethers as any).Contract(CONTRACT_ADDRESS, contractABI, provider)

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
    try { if (basePriceWei != null) basePriceReadable = (ethers as any).formatEther(basePriceWei) } catch (e) { basePriceReadable = null }
    try { if (salePriceWei != null) salePriceReadable = (ethers as any).formatEther(salePriceWei) } catch (e) { salePriceReadable = null }

    // Intentar obtener planes si la función existe
    let plans: any[] | null = null
    try {
        if (typeof (contract as any).getPlans === 'function') {
            const rawPlans = await (contract as any).getPlans(modelId)
            // rawPlans es un array de structs; mapeamos
            plans = (rawPlans || []).map((p: any) => {
                const priceWei = p?.price ?? null
                let priceReadable: string | null = null
                try { if (priceWei != null) priceReadable = (ethers as any).formatEther(priceWei) } catch (e) { priceReadable = null }
                return {
                    name: p.name ?? null,
                    priceWei: toStr(priceWei),
                    price: priceReadable,
                    duration: p.duration ?? null,
                    active: p.active ?? null
                }
            })
        }
    } catch (e) {
        console.debug('No se pudieron obtener planes:', e)
        plans = null
    }

    return {
        id: toStr(id),
        author: author ?? null,
        name: name ?? null,
        ipfsHash: ipfsHash ?? null,
        basePriceWei: toStr(basePriceWei),
        basePrice: basePriceReadable,
        forSale: Boolean(forSale),
        salePriceWei: toStr(salePriceWei),
        salePrice: salePriceReadable,
        plansCount: plansCount ?? null,
        plans
    }
}






