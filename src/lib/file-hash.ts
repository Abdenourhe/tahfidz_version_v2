// src/lib/file-hash.ts
// Helper client pour calculer le hash SHA-256 d'un fichier.

/**
 * Calcule le hash SHA-256 d'un File/Blob sous forme de chaîne hexadécimale.
 */
export async function computeFileHash(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
