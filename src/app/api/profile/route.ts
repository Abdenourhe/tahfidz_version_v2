// src/app/api/profile/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const profileSchema = z.object({
  fullName: z.string().min(2),
  fullNameAr: z.string().optional(),
  phone: z.string().optional(),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      fullName: parsed.data.fullName,
      fullNameAr: parsed.data.fullNameAr,
      phone: parsed.data.phone,
    },
    select: { id: true, fullName: true, email: true },
  })

  return NextResponse.json({ user })
}
