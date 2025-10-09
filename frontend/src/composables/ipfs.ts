import { getModelById } from './blockchain';
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;


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
 * unpinFromIPFS
 * Elimina (unpin) un CID de Pinata usando la API y el JWT configurado en VITE_PINATA_JWT.
 * Devuelve true si se removió correctamente.
 */
export async function unpinFromIPFS(cid: string) {
    if (!PINATA_JWT) throw new Error('Missing PINATA_JWT (VITE_PINATA_JWT) environment variable.');
    if (!cid) throw new Error('CID is required to unpin');

    const url = `https://api.pinata.cloud/pinning/unpin/${cid}`;
    let res: Response;
    try {
        res = await fetch(url, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`,
            }
        });
    } catch (err) {
        throw new Error(`Network error while unpinning ${cid}: ${String(err)}`);
    }

    const text = await res.text();
    if (!res.ok) {
        let body = text;
        try { body = JSON.parse(text); } catch (e) { /* keep text */ }
        throw new Error(`Pinata unpin failed for ${cid}: ${res.status} ${res.statusText} - ${JSON.stringify(body)}`);
    }

    return true;
}

/**
 * Convierte un tokenURI o CID a una URL HTTP usable por fetch.
 * - Soporta tokenURI que empiezan por ipfs://
 * - Soporta CIDs puros (Qm... o bafk...)
 * - Si ya es una URL HTTP(S), la devuelve tal cual
 */
export function ipfsToHttp(uriOrCid: string | null | undefined) {
    if (!uriOrCid) return null
    const s = String(uriOrCid)
    if (s.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${s.slice(7)}`
    if (s.startsWith('http://') || s.startsWith('https://')) return s
    // heurística CID (Qm... o baf...)
    if (/^[A-Za-z0-9]+$/.test(s)) return `https://ipfs.io/ipfs/${s}`
    return s
}

/**
 * fetchMetadata
 * Obtiene la metadata JSON asociada a un modelId. Primero obtiene getModelById,
 * luego intenta usar tokenURI (si existe) o ipfsHash para construir la URL y hacer fetch.
 */
export async function fetchMetadata(modelId: number | string) {
  const model = await getModelById(modelId);

  // Ahora sólo usamos tokenURI (si getModelById lo trajo) o ipfsHash.
  const source = (model as any).tokenURI || model.ipfsHash;
  const url = ipfsToHttp(source);
  if (!url) throw new Error('No tokenURI/ipfsHash disponible para este modelo');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error fetching metadata: ${res.status} ${res.statusText}`);
  return await res.json();
}
