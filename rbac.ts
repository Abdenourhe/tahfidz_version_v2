/**
 * TAHFIDZ SaaS — Phase 2 : RBAC
 *
 * Hiérarchie des rôles :
 *   SUPER_ADMIN > SCHOOL_ADMIN > TEACHER > STUDENT > PARENT
 *
 * Usage dans un Route Handler :
 *   const session = await requireRole(request, ["SCHOOL_ADMIN", "TEACHER"])
 *   // Lève une Response 403 si non autorisé, retourne la session sinon
 *
 * Usage dans un Server Component :
 *   const session = await getRequiredSession()
 *   if (!canAccess(session.user.role, "TEACHER")) redirect("/403")
 */

import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

// ─── Hiérarchie ──────────────────────────────────────────────────────────────

const ROLE_RANK: Record<string, number> = {
  SUPER_ADMIN:  100,
  SCHOOL_ADMIN: 80,
  TEACHER:      60,
  STUDENT:      40,
  PARENT:       20,
};

/**
 * Vérifie qu'un rôle est au moins aussi élevé qu'un rôle minimum.
 * canAccess("TEACHER", "TEACHER") → true
 * canAccess("PARENT",  "TEACHER") → false
 */
export function canAccess(userRole: string, minimumRole: string): boolean {
  return (ROLE_RANK[userRole] ?? 0) >= (ROLE_RANK[minimumRole] ?? 999);
}

/**
 * Vérifie que l'utilisateur a l'un des rôles listés.
 * Utile quand plusieurs rôles distincts ont accès (pas une hiérarchie stricte).
 */
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

// ─── Guards pour Route Handlers ──────────────────────────────────────────────

type SessionGuard = {
  user: { id: string; schoolId: string; schoolSlug: string; role: string; email: string };
};

/**
 * À appeler en tête de tout Route Handler protégé.
 * Retourne la session ou lève une NextResponse 401/403.
 *
 * @param allowedRoles - si vide, tout rôle authentifié est accepté
 * @param strictSchool  - si true, vérifie que x-school-id header correspond à la session
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[] = [],
  strictSchool = true
): Promise<SessionGuard> {
  const session = await auth();

  if (!session?.user) {
    throw new AuthError(401, "Non authentifié");
  }

  if (allowedRoles.length > 0 && !hasRole(session.user.role, allowedRoles)) {
    // SUPER_ADMIN passe toujours
    if (session.user.role !== "SUPER_ADMIN") {
      throw new AuthError(403, "Accès refusé — rôle insuffisant");
    }
  }

  if (strictSchool && session.user.role !== "SUPER_ADMIN") {
    const headerSchoolId = request.headers.get("x-school-id");
    if (headerSchoolId && headerSchoolId !== session.user.schoolId) {
      throw new AuthError(403, "Accès refusé — mauvais tenant");
    }
  }

  return session as SessionGuard;
}

/**
 * Transforme une AuthError en NextResponse JSON.
 * Utilisation :
 *   try { const session = await requireRole(...) }
 *   catch (e) { return authErrorResponse(e) }
 */
export function authErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
}

// ─── Guard Server Component ───────────────────────────────────────────────────

export async function getRequiredSession(): Promise<SessionGuard> {
  const session = await auth();
  if (!session?.user) throw new AuthError(401, "Non authentifié");
  return session as SessionGuard;
}

// ─── Erreur ───────────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AuthError";
  }
}
