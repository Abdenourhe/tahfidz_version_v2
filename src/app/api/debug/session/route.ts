// src/app/api/debug/session/route.ts
// Route de debug pour vérifier la session et l'impersonation

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getImpersonation } from "@/lib/impersonation"

export async function GET() {
  const session = await auth()
  const imp = await getImpersonation().catch(() => null)

  return NextResponse.json({
    session: session
      ? {
          id: session.user?.id,
          role: session.user?.role,
          schoolId: session.user?.schoolId,
          schoolSlug: session.user?.schoolSlug,
          isImpersonating: (session.user as any)?.isImpersonating,
          originalRole: (session.user as any)?.originalRole,
        }
      : null,
    impersonationCookie: imp
      ? {
          targetAdminId: imp.targetAdminId,
          targetSchoolId: imp.targetSchoolId,
          superadminId: imp.superadminId,
          createdAt: imp.createdAt,
          ageMinutes: Math.round((Date.now() - imp.createdAt) / 60000),
        }
      : null,
  })
}
