import { prisma } from "@/lib/prisma"
import { decodeAnyQrValue, decodeBarcodeValue, getQrDate, verifyQrHmac, type QrPayload, type BarcodePayload } from "@/lib/qr-code"
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
 * Vérifie un payload scanné (QR code ou code-barres).
 * Retourne l'élève si tout est valide, sinon la raison de l'échec.
 */
export async function verifyQrPayload(
  encoded: string,
  teacherUserId: string,
  teacherRole: string
): Promise<VerifyResult> {
  const qrPayload = decodeAnyQrValue(encoded)
  if (qrPayload) {
    return verifyQrPayloadObject(qrPayload, teacherUserId, teacherRole)
  }

  const barcodePayload = decodeBarcodeValue(encoded)
  if (barcodePayload) {
    return verifyBarcodePayloadObject(barcodePayload, teacherUserId, teacherRole)
  }

  // Fallback : code étudiant seul (format plus court et plus fiable pour les codes-barres)
  const studentCode = encoded.trim()
  if (studentCode) {
    return verifyStudentCodePayloadObject(studentCode, teacherUserId, teacherRole)
  }

  return { ok: false, status: "INVALID_TOKEN", reason: "Payload invalide" }
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

/**
 * Vérifie un code étudiant seul scanné sur une carte.
 * L'école est déduite de l'utilisateur (prof/admin) qui scanne.
 */
export async function verifyStudentCodePayloadObject(
  studentCode: string,
  teacherUserId: string,
  teacherRole: string
): Promise<VerifyResult> {
  const user = await prisma.user.findUnique({
    where: { id: teacherUserId },
    select: { schoolId: true, role: true },
  })
  if (!user?.schoolId) {
    return { ok: false, status: "UNAUTHORIZED", reason: "École de l'utilisateur non trouvée" }
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: teacherUserId },
    select: { id: true },
  })

  if (!teacher && teacherRole === "TEACHER") {
    return { ok: false, status: "UNAUTHORIZED_TEACHER", reason: "Profil enseignant introuvable" }
  }

  const student = await prisma.student.findFirst({
    where: { studentCode, user: { schoolId: user.schoolId } },
    include: studentInclude,
  })

  if (!student) {
    return { ok: false, status: "INVALID_TOKEN", reason: "Code étudiant invalide" }
  }

  if (!student.user.isActive) {
    return { ok: false, status: "INVALID_TOKEN", reason: "Compte élève inactif" }
  }

  if (teacherRole === "TEACHER") {
    const isAssignedTeacher = student.teacherId === teacher?.id
    const isGroupTeacher = student.group?.teacherId === teacher?.id
    if (!isAssignedTeacher && !isGroupTeacher) {
      return { ok: false, status: "UNAUTHORIZED_TEACHER", reason: "Cet élève n'est pas dans votre groupe" }
    }
  }

  return { ok: true, student: student as NonNullable<typeof student> }
}

/**
 * Vérifie un payload code-barres scanné (schoolSlug:studentCode).
 * Moins sécurisé que le QR code (pas de HMAC quotidien) mais pratique pour les cartes physiques.
 */
export async function verifyBarcodePayloadObject(
  payload: BarcodePayload,
  teacherUserId: string,
  teacherRole: string
): Promise<VerifyResult> {
  const { s: schoolSlug, c: studentCode } = payload

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

  if (!teacher && teacherRole === "TEACHER") {
    return { ok: false, status: "UNAUTHORIZED_TEACHER", reason: "Profil enseignant introuvable" }
  }

  if (teacher && teacher.user.schoolId !== school.id) {
    return { ok: false, status: "UNAUTHORIZED_TEACHER", reason: "École non autorisée" }
  }

  const student = await prisma.student.findFirst({
    where: { studentCode, user: { schoolId: school.id } },
    include: studentInclude,
  })

  if (!student) {
    return { ok: false, status: "INVALID_TOKEN", reason: "Code étudiant invalide" }
  }

  if (!student.user.isActive) {
    return { ok: false, status: "INVALID_TOKEN", reason: "Compte élève inactif" }
  }

  if (teacherRole === "TEACHER") {
    const isAssignedTeacher = student.teacherId === teacher?.id
    const isGroupTeacher = student.group?.teacherId === teacher?.id
    if (!isAssignedTeacher && !isGroupTeacher) {
      return { ok: false, status: "UNAUTHORIZED_TEACHER", reason: "Cet élève n'est pas dans votre groupe" }
    }
  }

  return { ok: true, student: student as NonNullable<typeof student> }
}
