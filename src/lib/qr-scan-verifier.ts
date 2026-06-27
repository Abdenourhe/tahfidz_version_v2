import { prisma } from "@/lib/prisma"
import { decodeQrPayload, getQrDate, verifyQrHmac, type QrPayload } from "@/lib/qr-code"
import type { Prisma } from "@prisma/client"

const studentInclude = {
  user: { select: { schoolId: true, fullName: true, avatar: true, isActive: true } },
  group: { select: { id: true, teacherId: true, name: true } },
} satisfies Prisma.StudentInclude

type VerifiedStudent = Prisma.StudentGetPayload<{ include: typeof studentInclude }>

type VerifyResult =
  | { ok: true; student: VerifiedStudent }
  | { ok: false; status: string; reason: string }

/**
 * Vérifie un payload QR code scanné.
 * Retourne l'élève si tout est valide, sinon la raison de l'échec.
 */
export async function verifyQrPayload(
  encoded: string,
  teacherUserId: string,
  teacherRole: string
): Promise<VerifyResult> {
  const payload = decodeQrPayload(encoded)
  if (!payload) {
    return { ok: false, status: "INVALID_TOKEN", reason: "Payload invalide" }
  }

  return verifyQrPayloadObject(payload, teacherUserId, teacherRole)
}

export async function verifyQrPayloadObject(
  payload: QrPayload,
  teacherUserId: string,
  teacherRole: string
): Promise<VerifyResult> {
  const { s: schoolSlug, t: token, h: hmac } = payload

  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    select: { id: true },
  })
  if (!school) {
    return { ok: false, status: "INVALID_TOKEN", reason: "École introuvable" }
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: teacherUserId },
    include: { user: { select: { schoolId: true, role: true } } },
  })

  // Seuls les enseignants (et admins/superadmins) peuvent scanner
  if (!teacher && teacherRole === "TEACHER") {
    return { ok: false, status: "UNAUTHORIZED_TEACHER", reason: "Profil enseignant introuvable" }
  }

  // Vérifier que l'enseignant appartient à la bonne école
  if (teacher && teacher.user.schoolId !== school.id) {
    return { ok: false, status: "UNAUTHORIZED_TEACHER", reason: "École non autorisée" }
  }

  const student = await prisma.student.findUnique({
    where: { qrCodeToken: token },
    include: studentInclude,
  })

  if (!student) {
    return { ok: false, status: "INVALID_TOKEN", reason: "Token invalide" }
  }

  if (student.user.schoolId !== school.id) {
    return { ok: false, status: "INVALID_TOKEN", reason: "Élève non rattaché à cette école" }
  }

  if (!student.user.isActive) {
    return { ok: false, status: "INVALID_TOKEN", reason: "Compte élève inactif" }
  }

  // Vérifier le HMAC avec la date du jour
  if (!student.qrCodeSecret || !verifyQrHmac(student.qrCodeSecret, getQrDate(), hmac)) {
    return { ok: false, status: "INVALID_HMAC", reason: "QR code invalide ou expiré" }
  }

  // Vérifier que l'enseignant est responsable de l'élève
  if (teacherRole === "TEACHER") {
    const isAssignedTeacher = student.teacherId === teacher?.id
    const isGroupTeacher = student.group?.teacherId === teacher?.id
    if (!isAssignedTeacher && !isGroupTeacher) {
      return { ok: false, status: "UNAUTHORIZED_TEACHER", reason: "Cet élève n'est pas dans votre groupe" }
    }
  }

  return { ok: true, student: student as NonNullable<typeof student> }
}
