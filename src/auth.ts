// src/auth.ts — NextAuth.js v5, multi-tenant par schoolId

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const LoginSchema = z.object({
  email:      z.string().email(),
  password:   z.string().min(6),
  schoolSlug: z.string().optional().default(""),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials)
        if (!parsed.success) return null
        const { email: rawEmail, password, schoolSlug } = parsed.data
        const email = rawEmail.toLowerCase().trim()

        // SUPERADMIN bypass — pas besoin de slug
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

        // Auth normale (ADMIN / TEACHER / STUDENT / PARENT)
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

        // Récupérer studentCode si c'est un élève
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
        const u = user as typeof user & {
          role: string; schoolId: string; schoolSlug: string; schoolName: string; avatar?: string; schoolLogo?: string; schoolCity?: string; studentCode?: string
        }
        token.id          = u.id
        token.role        = u.role
        token.avatar      = u.avatar
        token.schoolId    = u.schoolId
        token.schoolSlug  = u.schoolSlug
        token.schoolName  = u.schoolName
        token.schoolLogo  = u.schoolLogo
        token.schoolCity  = u.schoolCity
        token.studentCode = u.studentCode
      }
      // Fallback pour les tokens existants (sans reconnexion)
      if (!token.schoolLogo && token.schoolId) {
        const school = await prisma.school.findUnique({
          where: { id: token.schoolId as string },
          select: { logo: true, city: true },
        })
        token.schoolLogo = school?.logo ?? undefined
        token.schoolCity = school?.city ?? undefined
      }
      if (!token.studentCode && token.role === "STUDENT" && token.id) {
        const studentProfile = await prisma.student.findUnique({
          where: { userId: token.id as string },
          select: { studentCode: true },
        })
        token.studentCode = studentProfile?.studentCode ?? undefined
      }
      return token
    },
    async session({ session, token }) {
      const u = session.user as any
      u.id          = token.id          as string
      u.role        = token.role        as string
      u.avatar      = token.avatar      as string | undefined
      u.schoolId    = token.schoolId    as string
      u.schoolSlug  = token.schoolSlug  as string
      u.schoolName  = token.schoolName  as string
      u.schoolLogo  = token.schoolLogo  as string | undefined
      u.schoolCity  = token.schoolCity  as string | undefined
      u.studentCode = token.studentCode as string | undefined
      return session
    },
  },
})

declare module "next-auth" {
  interface User {
    role:        string
    avatar?:     string
    schoolId:    string
    schoolSlug:  string
    schoolName:  string
    schoolLogo?: string
    schoolCity?: string
    studentCode?: string
  }
  interface Session {
    user: {
      id:          string
      name:        string
      email:       string
      role:        string
      avatar?:     string
      schoolId:    string
      schoolSlug:  string
      schoolName:  string
      schoolLogo?: string
      schoolCity?: string
      studentCode?: string
    }
  }
}
