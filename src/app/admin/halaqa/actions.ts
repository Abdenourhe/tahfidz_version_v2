"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function deleteSession(formData: FormData) {
  const session = await auth()
  if (!session?.user?.schoolId) return
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") return

  const id = formData.get("id") as string
  if (!id) return

  await prisma.halaqaSession.delete({
    where: { id, schoolId: session.user.schoolId },
  })
  revalidatePath("/admin/halaqa")
}

export async function cancelSession(formData: FormData) {
  const session = await auth()
  if (!session?.user?.schoolId) return
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") return

  const id = formData.get("id") as string
  if (!id) return

  const halaqa = await prisma.halaqaSession.findFirst({
    where: { id, schoolId: session.user.schoolId },
  })
  if (!halaqa || halaqa.status === "ENDED" || halaqa.status === "CANCELLED") return

  await prisma.halaqaSession.update({
    where: { id },
    data: { status: "CANCELLED", endedAt: new Date() },
  })
  revalidatePath("/admin/halaqa")
}
