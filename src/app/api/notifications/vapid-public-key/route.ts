// src/app/api/notifications/vapid-public-key/route.ts
// GET: Renvoie la clé publique VAPID au client

import { NextResponse } from "next/server"
import { getVapidPublicKey } from "@/lib/web-push"

export async function GET() {
  const key = getVapidPublicKey()
  if (!key) {
    return NextResponse.json({ error: "VAPID non configuré" }, { status: 500 })
  }
  return NextResponse.json({ publicKey: key })
}
