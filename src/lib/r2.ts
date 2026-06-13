// src/lib/r2.ts
// Client Cloudflare R2 et helpers pour les URLs signées

import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_ENDPOINT = process.env.R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "")

function getClient(): S3Client {
  if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("Variables d'environnement R2 manquantes")
  }

  return new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

export function getBucketName(): string {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME non configuré")
  }
  return R2_BUCKET_NAME
}

/**
 * Génère une URL PUT signée pour uploader un fichier directement sur R2.
 */
export async function getUploadUrl(key: string, contentType: string, expiresInSeconds = 300) {
  const client = getClient()
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

/**
 * Génère une URL GET signée pour lire un fichier privé sur R2.
 */
export async function getDownloadUrl(key: string, expiresInSeconds = 600) {
  const client = getClient()
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  })

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

/**
 * Supprime un objet du bucket R2.
 */
export async function deleteObject(key: string) {
  const client = getClient()
  const command = new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  })

  await client.send(command)
}

/**
 * Construit une clé R2 organisée par école et contenu.
 */
export function buildR2Key(schoolId: string | null, fileName: string, prefix = "contents") {
  const sanitized = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_")
  const segment = schoolId ? `schools/${schoolId}/${prefix}` : `global/${prefix}`
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  return `${segment}/${timestamp}-${random}-${sanitized}`
}

/**
 * Extrait la clé R2 d'une URL stockée (ex: r2://key).
 * Retourne null si ce n'est pas une URL R2.
 */
export function getR2KeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith("r2://")) {
    return url.slice(5)
  }
  return null
}

/**
 * Vérifie si une URL stockée est une URL R2 interne.
 */
export function isR2Url(url: string | null | undefined): boolean {
  return !!url && url.startsWith("r2://")
}
