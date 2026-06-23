// src/app/api/halaqa/quota/route.ts
// Retourne le statut du quota Halaqa de l'école connectée

import { auth } from "@/auth"
import { getHalaqaQuotaStatus } from "@/lib/halaqa-quota"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const status = await getHalaqaQuotaStatus(session.user.schoolId)
    if (!status) {
      return NextResponse.json({ error: "École non trouvée" }, { status: 404 })
    }

    return NextResponse.json({ status }, { status: 200 })
  } catch (error: any) {
    console.error("[HALAQA QUOTA GET ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
