// src/lib/library/access.ts
// Helpers de listage des ressources accessibles par rôle

import { prisma } from "@/lib/prisma"
import { canAccessCollection, canAccessContent } from "./permissions"
import type { UserRole, Prisma } from "@prisma/client"

interface UserCtx {
  id: string
  role: UserRole
  schoolId: string | null
}

const collectionInclude = {
  group: { select: { id: true, name: true } },
  _count: { select: { contents: true, enrollments: true } },
} as const

const contentInclude = {
  category: { select: { id: true, name: true, color: true } },
  collection: { select: { id: true, schoolId: true, groupId: true } },
  _count: { select: { episodes: true } },
} as const

export async function getAccessibleCollections(user: UserCtx) {
  if (user.role === "SUPERADMIN") {
    return prisma.libraryCollection.findMany({
      orderBy: { createdAt: "desc" },
      include: collectionInclude,
    })
  }

  if (!user.schoolId) return []

  const collections = await prisma.libraryCollection.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { createdAt: "desc" },
    include: collectionInclude,
  })

  const results = []
  for (const collection of collections) {
    if (await canAccessCollection(user, collection as any)) {
      results.push(collection)
    }
  }
  return results
}

export async function getAccessibleContents(user: UserCtx) {
  if (user.role === "SUPERADMIN") {
    return prisma.libraryContent.findMany({
      orderBy: { createdAt: "desc" },
      include: contentInclude,
    })
  }

  const where: Prisma.LibraryContentWhereInput = user.schoolId
    ? { OR: [{ schoolId: user.schoolId }, { schoolId: { equals: null } }] }
    : { schoolId: { equals: null } }

  const contents = await prisma.libraryContent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: contentInclude,
  })

  const results = []
  for (const content of contents) {
    if (await canAccessContent(user, content as any)) {
      results.push(content)
    }
  }
  return results
}

/**
 * Retourne les contenus globaux accessibles à l'utilisateur.
 * Pour les rôles non SUPERADMIN, seuls les contenus PUBLISHED sont visibles.
 */
export async function getGlobalContents(user: UserCtx) {
  const where: Prisma.LibraryContentWhereInput =
    user.role === "SUPERADMIN"
      ? { visibility: "GLOBAL" }
      : { visibility: "GLOBAL", status: "PUBLISHED" }

  const contents = await prisma.libraryContent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: contentInclude,
  })

  const results = []
  for (const content of contents) {
    if (await canAccessContent(user, content as any)) {
      results.push(content)
    }
  }
  return results
}

export async function getUserBookmarks(userId: string) {
  const bookmarks = await prisma.userBookmark.findMany({
    where: { userId },
    select: { contentId: true },
  })
  return bookmarks.map((b) => b.contentId)
}

export async function getUserProgressMap(userId: string) {
  const progress = await prisma.userContentProgress.findMany({
    where: { userId },
    select: { contentId: true, progress: true },
  })
  return new Map(progress.map((p) => [p.contentId, p.progress]))
}
