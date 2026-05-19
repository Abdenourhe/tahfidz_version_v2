// src/app/api/parents/[id]/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const parent = await prisma.parent.findUnique({
    where: { id: (await params).id },
    include: {
      user: { select: { id:true, fullName:true, fullNameAr:true, email:true, phone:true, isActive:true } },
      childrenLinks: { where:{isVerified:true}, include:{student:{include:{user:{select:{fullName:true}}}}} },
    },
  })
  if (!parent) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json({ parent: { ...parent, id: parent.user.id } })
}
