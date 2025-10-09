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
