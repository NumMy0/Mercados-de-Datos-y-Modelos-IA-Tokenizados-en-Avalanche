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

    const owner = await contract.owner();
    console.log("Contrato conectado correctamente ✅");
    console.log("Owner del contrato:", owner);

    return { contract, signer, provider };
    } catch (error) {
        console.error("Error al conectar con el contrato:", error);
        throw error;
    }
}

export async function uploadToIPFS(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: formData,
    });

    const data = await res.json();
    return data.IpfsHash; // el CID del archivo
}

/**
 * 🔹 Registrar modelo en la blockchain
 */

export async function uploadModelBlockchain(name, ipfsHash, basePrice, tokenURI) {
    if (!window.ethereum) throw new Error("MetaMask no detectado");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

    const tx = await contract.uploadModel(name, ipfsHash, basePrice, tokenURI);
    console.log("⏳ Enviando transacción...");
    const receipt = await tx.wait();
    console.log("✅ Modelo subido:", receipt);

    return receipt;
}
