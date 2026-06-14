// src/lib/library-upload.ts
// Flux client unifié pour uploader un fichier sur R2 avec déduplication par hash.

import { computeFileHash } from "./file-hash"

export interface UploadResult {
  key: string
  url: string
  isDuplicate: boolean
}

export interface UploadOptions {
  file: File
  prefix: string
  onError?: (message: string) => void
}

/**
 * Vérifie si un fichier existe déjà par son hash SHA-256.
 */
export async function checkDuplicateFile(hash: string): Promise<UploadResult | null> {
  const res = await fetch("/api/library/check-duplicate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash }),
  })
  const data: any = res.ok ? await res.json() : { error: await res.text() || "Erreur" }
  if (!res.ok || data.error) {
    throw new Error(data.error || "Erreur lors de la vérification du doublon")
  }
  if (data.duplicate) {
    return { key: data.key, url: data.url, isDuplicate: true }
  }
  return null
}

/**
 * Demande une URL d'upload signée et uploie le fichier sur R2.
 */
async function uploadToR2(file: File, prefix: string): Promise<{ key: string; uploadUrl: string }> {
  const metaRes = await fetch("/api/library/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
      prefix,
    }),
  })
  const meta: any = metaRes.ok ? await metaRes.json() : { error: await metaRes.text() || "Erreur" }
  if (!metaRes.ok || meta.error) {
    throw new Error(meta.error || "Erreur lors de la demande d'upload")
  }

  const uploadRes = await fetch(meta.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  })
  if (!uploadRes.ok) {
    throw new Error("Échec de l'upload sur le stockage")
  }

  return { key: meta.key, uploadUrl: meta.uploadUrl }
}

/**
 * Enregistre un fichier fraîchement uploadé dans la table de déduplication.
 */
async function registerUploadedFile(
  file: File,
  key: string,
  hash: string
): Promise<void> {
  const res = await fetch("/api/library/register-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hash,
      key,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "Erreur")
    console.error("[REGISTER FILE]", text)
    // On ne bloque pas le flux si l'enregistrement échoue.
  }
}

/**
 * Upload un fichier avec déduplication automatique.
 * Retourne la clé R2 et l'URL r2:// associée.
 */
export async function uploadFileWithDedup(
  options: UploadOptions
): Promise<UploadResult> {
  const { file, prefix } = options
  const hash = await computeFileHash(file)

  // 1. Vérifier le doublon
  const duplicate = await checkDuplicateFile(hash)
  if (duplicate) {
    return duplicate
  }

  // 2. Uploader sur R2
  const { key } = await uploadToR2(file, prefix)
  const url = `r2://${key}`

  // 3. Enregistrer le fichier pour les futures déduplications
  await registerUploadedFile(file, key, hash)

  return { key, url, isDuplicate: false }
}
