// src/lib/library/permissions.ts
// Logique d'accès au module Bibliothèque

import { prisma } from "@/lib/prisma"
import { ContentVisibility, UserRole } from "@prisma/client"

interface LibraryUser {
  id: string
  role: UserRole
  schoolId: string | null
}

interface LibraryCollection {
  id: string
  schoolId: string
  groupId: string | null
}

interface LibraryContent {
  id: string
  visibility: ContentVisibility
  schoolId: string | null
  collection: LibraryCollection | null
}

/** Rôles autorisés à gérer la bibliothèque (créer/modifier/supprimer) */
export function canManageLibrary(user: LibraryUser): boolean {
  return ["SUPERADMIN", "ADMIN", "TEACHER"].includes(user.role)
}

/** Vérifie si un utilisateur peut accéder à une collection */
export async function canAccessCollection(
  user: LibraryUser,
  collection: LibraryCollection
): Promise<boolean> {
  if (user.role === "SUPERADMIN") return true
  if (user.schoolId !== collection.schoolId) return false

  // Admin = tout son école
  if (user.role === "ADMIN") return true

  // Teacher = groupes qu'il enseigne
  if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } })
    if (!teacher) return false
    if (collection.groupId) {
      const group = await prisma.group.findFirst({
        where: { id: collection.groupId, teacherId: teacher.id },
      })
      if (group) return true
    }
    return false
  }

  // Student = membre du group ou inscrit à la collection autonome
  if (user.role === "STUDENT") {
    const student = await prisma.student.findFirst({ where: { userId: user.id } })
    if (!student) return false
    if (collection.groupId && student.groupId === collection.groupId) return true
    const enrolled = await prisma.libraryCollectionEnrollment.findFirst({
      where: { collectionId: collection.id, studentId: student.id, status: "ACTIVE" },
    })
    return !!enrolled
  }

  // Parent = un de ses enfants a accès
  if (user.role === "PARENT") {
    const parent = await prisma.parent.findFirst({
      where: { userId: user.id },
      include: { childrenLinks: { select: { studentId: true } } },
    })
    if (!parent) return false
    const childrenIds = parent.childrenLinks.map((l) => l.studentId)
    if (childrenIds.length === 0) return false

    if (collection.groupId) {
      const childInGroup = await prisma.student.findFirst({
        where: { id: { in: childrenIds }, groupId: collection.groupId },
      })
      if (childInGroup) return true
    }
    const childEnrolled = await prisma.libraryCollectionEnrollment.findFirst({
      where: { collectionId: collection.id, studentId: { in: childrenIds }, status: "ACTIVE" },
    })
    return !!childEnrolled
  }

  return false
}

/** Vérifie si un utilisateur peut accéder à un contenu */
export async function canAccessContent(
  user: LibraryUser,
  content: LibraryContent
): Promise<boolean> {
  if (user.role === "SUPERADMIN") return true

  // GLOBAL → tout le monde
  if (content.visibility === "GLOBAL") return true

  // SCHOOL → membres de l'école
  if (content.visibility === "SCHOOL") {
    return user.schoolId === content.schoolId
  }

  // CLASS → accès à la collection
  if (content.visibility === "CLASS") {
    if (!content.collection) return false
    return canAccessCollection(user, content.collection)
  }

  return false
}

/** Vérifie si l'utilisateur peut modifier/supprimer un contenu ou une collection */
export function canEditLibraryResource(
  user: LibraryUser,
  resourceSchoolId: string,
  resourceCreatedBy?: string
): boolean {
  if (user.role === "SUPERADMIN") return true
  if (user.role === "ADMIN" && user.schoolId === resourceSchoolId) return true
  if (user.role === "TEACHER" && user.schoolId === resourceSchoolId) {
    // Un enseignant ne peut modifier que ses propres ressources
    return resourceCreatedBy ? resourceCreatedBy === user.id : true
  }
  return false
}
