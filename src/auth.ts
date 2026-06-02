// src/auth.ts — NextAuth.js v5 stable, multi-tenant par schoolId

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
        try {
          const parsed = LoginSchema.safeParse(credentials)
          if (!parsed.success) {
            console.log("[AUTH] LoginSchema parse failed", parsed.error.flatten())
            return null
          }
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
            if (!valid) {
              console.log("[AUTH] SuperAdmin password mismatch", email)
              return null
            }
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
        if (!schoolSlug || schoolSlug.length < 2) {
          console.log("[AUTH] Missing schoolSlug", { email, schoolSlug })
          return null
        }

        const school = await prisma.school.findFirst({
          where:  { slug: { equals: schoolSlug, mode: "insensitive" } },
          select: { id: true, slug: true, name: true, logo: true, city: true, isActive: true },
        })
        if (!school?.isActive) {
          console.log("[AUTH] School not found or inactive", { schoolSlug })
          return null
        }

        const user = await prisma.user.findUnique({
          where:  { schoolId_email: { schoolId: school.id, email } },
          select: { id: true, password: true, role: true, isActive: true, fullName: true, avatar: true },
        })
        if (!user?.isActive) {
          console.log("[AUTH] User not found or inactive", { email, schoolId: school.id })
          return null
        }

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) {
          console.log("[AUTH] Password mismatch", { email, schoolId: school.id })
          return null
        }

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
        } catch (err: any) {
          console.error("[AUTH] Unexpected error in authorize", err?.message || err)
          return null
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
        token.avatar = user.avatar
        token.schoolName = user.schoolName
        token.schoolLogo = user.schoolLogo
        token.schoolCity = user.schoolCity
        token.studentCode = user.studentCode
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.schoolId = token.schoolId as string
        session.user.schoolSlug = token.schoolSlug as string
        session.user.avatar = token.avatar as string | undefined
        session.user.schoolName = token.schoolName as string | undefined
        session.user.schoolLogo = token.schoolLogo as string | undefined
        session.user.schoolCity = token.schoolCity as string | undefined
        session.user.studentCode = token.studentCode as string | undefined
      }
      return session
    },
  },
})

export { nextAuthHandlers as handlers, baseAuth as auth }

declare module "next-auth" {
  interface User {
    role: string
    schoolId: string
    schoolSlug: string
    avatar?: string
    schoolName?: string
    schoolLogo?: string
    schoolCity?: string
    studentCode?: string
  }
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      schoolId: string
      schoolSlug: string
      avatar?: string
      schoolName?: string
      schoolLogo?: string
      schoolCity?: string
      studentCode?: string
    }
  }
}