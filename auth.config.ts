/**
 * TAHFIDZ SaaS — Phase 2 : NextAuth v5 Multi-tenant
 *
 * Stratégie :
 *  1. Credentials provider (email + password) scopé par école
 *  2. Le JWT embarque { schoolId, schoolSlug, userId, role }
 *  3. La session expose les mêmes champs — jamais besoin de re-requêter le DB
 *  4. authorize() vérifie l'appartenance email × school avant tout
 */

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma-tenant";
import bcrypt from "bcryptjs";
import { z } from "zod";

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
  slug:     z.string().min(2), // sous-domaine de l'école
});

export const authConfig: NextAuthConfig = {
  // ── Pages personnalisées ───────────────────────────────────────────────────
  pages: {
    signIn:  "/login",
    error:   "/login",
  },

  // ── Callbacks ─────────────────────────────────────────────────────────────
  callbacks: {
    /**
     * jwt() : appelé à chaque création/refresh du token.
     * On persiste schoolId + role dans le JWT — zéro DB hit sur les requêtes API.
     */
    async jwt({ token, user }) {
      if (user) {
        token.userId     = user.id;
        token.schoolId   = (user as any).schoolId;
        token.schoolSlug = (user as any).schoolSlug;
        token.role       = (user as any).role;
      }
      return token;
    },

    /**
     * session() : expose le token vers le client (Server Components, hooks).
     * Ne jamais exposer hashedPassword ou données sensibles ici.
     */
    async session({ session, token }) {
      session.user.id         = token.userId as string;
      session.user.schoolId   = token.schoolId as string;
      session.user.schoolSlug = token.schoolSlug as string;
      session.user.role       = token.role as string;
      return session;
    },

    /**
     * authorized() : garde-fou pour les routes protégées via middleware.
     * Redirige vers /login si pas de session valide.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn  = !!auth?.user;
      const isLoginPage = nextUrl.pathname.startsWith("/login");
      if (isLoginPage) return isLoggedIn ? Response.redirect(new URL("/dashboard", nextUrl)) : true;
      return isLoggedIn;
    },
  },

  // ── Providers ─────────────────────────────────────────────────────────────
  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email:    { label: "Email",     type: "email"    },
        password: { label: "Mot de passe", type: "password" },
        slug:     { label: "École",     type: "text"     }, // injecté par le middleware
      },

      async authorize(credentials) {
        // 1. Validation des entrées
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password, slug } = parsed.data;

        // 2. Résoudre l'école par slug
        const school = await prisma.school.findUnique({
          where: { slug },
          select: { id: true, slug: true, name: true, isActive: true },
        });
        if (!school || !school.isActive) return null;

        // 3. Trouver l'utilisateur dans CETTE école uniquement
        //    L'unicité est (schoolId, email) — même email peut exister dans 2 écoles
        const user = await prisma.user.findUnique({
          where:  { schoolId_email: { schoolId: school.id, email } },
          select: { id: true, password: true, role: true, isActive: true },
        });
        if (!user || !user.isActive || !user.password) return null;

        // 4. Vérification du mot de passe
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        // 5. Mise à jour du lastLoginAt (fire-and-forget)
        prisma.user.update({
          where: { id: user.id },
          data:  { lastLoginAt: new Date() },
        }).catch(() => {});

        // 6. Retour du profil — NextAuth le passe à jwt()
        return {
          id:          user.id,
          email,
          schoolId:    school.id,
          schoolSlug:  school.slug,
          schoolName:  school.name,
          role:        user.role,
        };
      },
    }),
  ],

  // ── Stratégie JWT (pas de session DB — stateless) ─────────────────────────
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8h
};
