// scripts/configure-r2-cors.ts
// Configure les règles CORS sur le bucket Cloudflare R2.

import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_ENDPOINT = process.env.R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "")

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://tahfidz-two.vercel.app",
  // Ajouter ici d'autres domaines de production si nécessaire
]

async function main() {
  if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error("❌ Variables d'environnement R2 manquantes")
    process.exit(1)
  }

  const client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })

  const command = new PutBucketCorsCommand({
    Bucket: R2_BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: ALLOWED_ORIGINS,
          AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  })

  await client.send(command)
  console.log(`✅ CORS configuré sur le bucket ${R2_BUCKET_NAME}`)
  console.log(`   Origines autorisées : ${ALLOWED_ORIGINS.join(", ")}`)
}

main().catch((err) => {
  console.error("❌ Erreur :", err)
  process.exit(1)
})
