// src/auth.ts — NextAuth.js v5 stable, multi-tenant par schoolId

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { getImpersonation } from "@/lib/impersonation"
import { z } from "zod"

const LoginSchema = z.object({
  email:      z.string().email(),
  password:   z.string().min(6),
  schoolSlug: z.string().optional().default(""),
})

const {
  handlers: nextAuthHandlers,
  auth: baseAuth,
  signIn,
  signOut,
} = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials)
        if (!parsed.success) return null
        const { email: rawEmail, password, schoolSlug } = parsed.data
        const email = rawEmail.toLowerCase().trim()

        // SUPERADMIN bypass
        const superAdmin = await prisma.user.findFirst({
          where: { email, role: "SUPERADMIN", isActive: true },
          select: {
            id: true, password: true, fullName: true, avatar: true, schoolId: true,
            school: { select: { slug: true, name: true, logo: true, city: true } },
          },
        })
        if (superAdmin) {
          const valid = await bcrypt.compare(password, superAdmin.password)
          if (!valid) return null
          prisma.user.update({
            where: { id: superAdmin.id },
            data: { lastLoginAt: new Date() },
          }).catch(() => {})
          return {
            id:         superAdmin.id,
            email,
            name:       superAdmin.fullName,
            role:       "SUPERADMIN",
            avatar:     superAdmin.avatar ?? undefined,
            schoolId:   superAdmin.schoolId ?? "",
            schoolSlug: superAdmin.school?.slug ?? "platform",
            schoolName: superAdmin.school?.name ?? "TAHFIDZ Platform",
            schoolLogo: superAdmin.school?.logo ?? undefined,
            schoolCity: superAdmin.school?.city ?? undefined,
          }
        }

        // Auth normale
        if (!schoolSlug || schoolSlug.length < 2) return null

        const school = await prisma.school.findFirst({
          where:  { slug: { equals: schoolSlug, mode: "insensitive" } },
          select: { id: true, slug: true, name: true, logo: true, city: true, isActive: true },
        })
        if (!school?.isActive) return null

        const user = await prisma.user.findUnique({
          where:  { schoolId_email: { schoolId: school.id, email } },
          select: { id: true, password: true, role: true, isActive: true, fullName: true, avatar: true },
        })
        if (!user?.isActive) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        let studentCode: string | undefined
        if (user.role === "STUDENT") {
          const studentProfile = await prisma.student.findUnique({
            where: { userId: user.id },
            select: { studentCode: true },
          })
          studentCode = studentProfile?.studentCode
        }

        prisma.user.update({
          where: { id: user.id },
          data:  { lastLoginAt: new Date() },
        }).catch(() => {})

        return {
          id:         user.id,
          email,
          name:       user.fullName,
          role:       user.role,
          avatar:     user.avatar ?? undefined,
          schoolId:   school.id,
          schoolSlug: school.slug,
          schoolName: school.name,
          schoolLogo: school.logo ?? undefined,
          schoolCity: school.city ?? undefined,
          studentCode,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.schoolId = user.schoolId
        token.schoolSlug = user.schoolSlug
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.schoolId = token.schoolId as string
        session.user.schoolSlug = token.schoolSlug as string
      }
      return session
    },
  },
})

export { nextAuthHandlers as handlers }

/** Wrapper auth() qui lit le cookie d'impersonation et modifie la session */
export async function auth() {
  const session = await baseAuth()
  if (!session?.user) return session

  try {
    const imp = await getImpersonation()
    if (!imp) return session

    const [admin, school] = await Promise.all([
      prisma.user.findUnique({
        where: { id: imp.targetAdminId },
        select: { id: true, email: true, fullName: true, role: true, schoolId: true, avatar: true },
      }),
      prisma.school.findUnique({
        where: { id: imp.targetSchoolId },
        select: { id: true, slug: true, name: true, logo: true, city: true },
      }),
    ])

    if (!admin || admin.role !== "ADMIN") return session

    return {
      ...session,
      user: {
        ...session.user,
        id: admin.id,
        name: admin.fullName ?? session.user.name,
        email: admin.email ?? session.user.email,
        role: admin.role,
        schoolId: admin.schoolId,
        schoolSlug: school?.slug ?? session.user.schoolSlug,
        schoolName: school?.name ?? (session.user as any).schoolName,
        schoolLogo: school?.logo ?? (session.user as any).schoolLogo,
        schoolCity: school?.city ?? (session.user as any).schoolCity,
        isImpersonating: true,
        originalRole: "SUPERADMIN",
      } as any,
    }
  } catch {
    return session
  }
}

declare module "next-auth" {
  interface User {
    role: string
    schoolId: string
    schoolSlug: string
  }
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      schoolId: string
      schoolSlug: string
    }
  }
}