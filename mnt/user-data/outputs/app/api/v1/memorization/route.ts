/**
 * TAHFIDZ SaaS — Phase 3 : API REST
 * Route : /api/v1/memorization
 *
 * GET  → historique école (30 derniers jours) + stats
 * POST → enregistrer une évaluation
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";
import { MemorizationService, RecordMemorizationSchema } from "@/services/memorization.service";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ["SCHOOL_ADMIN", "TEACHER"]);
    const svc     = new MemorizationService(session.user.schoolId);

    const { searchParams } = request.nextUrl;
    const studentId = searchParams.get("studentId");

    if (studentId) {
      const [progress, history] = await Promise.all([
        svc.studentProgress(studentId),
        svc.studentHistory(studentId, {
          page:  Number(searchParams.get("page")  ?? 1),
          limit: Number(searchParams.get("limit") ?? 20),
        }),
      ]);
      return NextResponse.json({ progress, history });
    }

    // Vue école : stats globales + tableau de bord enseignant
    const teacherId = searchParams.get("teacherId");
    const [stats, dashboard] = await Promise.all([
      svc.schoolStats(),
      teacherId ? svc.teacherDashboard(teacherId) : Promise.resolve([]),
    ]);
    return NextResponse.json({ stats, dashboard });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["TEACHER", "SCHOOL_ADMIN"]);
    const body    = await request.json();
    const data    = RecordMemorizationSchema.parse(body);

    const svc    = new MemorizationService(session.user.schoolId);
    const record = await svc.record(data);

    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 422 });
    }
    return authErrorResponse(e);
  }
}
