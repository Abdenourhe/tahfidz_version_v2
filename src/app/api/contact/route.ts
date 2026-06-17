// src/app/api/contact/route.ts
// API route placeholder pour le formulaire de contact.

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const contactSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  type: z.enum(["general", "support", "demo", "partnership", "other"]),
  schoolName: z.string().optional(),
  message: z.string().min(10).max(500),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = contactSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Données invalides", details: result.error.format() }, { status: 400 })
    }

    // TODO : envoyer l'email via SendGrid/Nodemailer ou stocker en base.
    console.log("[CONTACT FORM]", result.data)

    return NextResponse.json({ success: true, message: "Message reçu" })
  } catch (error) {
    console.error("[CONTACT API]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
