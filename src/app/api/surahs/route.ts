// src/app/api/surahs/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const juz = searchParams.get("juz")
  const search = searchParams.get("search")

  const where: Record<string, unknown> = {}
  if (juz) where.juzNumber = parseInt(juz)
  if (search) {
    where.OR = [
      { nameFr: { contains: search, mode: "insensitive" } },
      { nameAr: { contains: search } },
    ]
  }

  const surahs = await prisma.surah.findMany({
    where,
    orderBy: { id: "asc" },
  })

  return NextResponse.json({ surahs })
}
