import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MemorizationService } from "@/services/memorization.service";
import { Suspense } from "react";

export default async function MemorizationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-medium">Mémorisation</h1>

      <Suspense fallback={<div className="h-24 rounded-xl bg-muted animate-pulse" />}>
        <SchoolStatsWidget schoolId={session.user.schoolId} />
      </Suspense>

      {session.user.role === "TEACHER" && (
        <Suspense fallback={<div className="h-48 rounded-xl bg-muted animate-pulse" />}>
          <TeacherWidget schoolId={session.user.schoolId} teacherId={session.user.id} />
        </Suspense>
      )}
    </div>
  );
}

async function SchoolStatsWidget({ schoolId }: { schoolId: string }) {
  const svc   = new MemorizationService(schoolId);
  const stats = await svc.schoolStats();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: "Réussis",        value: stats.passed,      color: "text-green-600" },
        { label: "À revoir",       value: stats.needsReview, color: "text-yellow-600" },
        { label: "Échoués",        value: stats.failed,      color: "text-red-600" },
        { label: "En attente",     value: stats.pending,     color: "text-muted-foreground" },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className={`text-2xl font-medium mt-1 ${s.color}`}>{s.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">30 derniers jours</p>
        </div>
      ))}
    </div>
  );
}

async function TeacherWidget({ schoolId, teacherId }: { schoolId: string; teacherId: string }) {
  const svc      = new MemorizationService(schoolId);
  const students = await svc.teacherDashboard(teacherId);

  return (
    <div className="rounded-xl border border-border">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-base font-medium">Mes élèves</h2>
      </div>
      <ul className="divide-y divide-border">
        {students.map((s) => (
          <li key={s.studentId} className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{s.studentName}</p>
              <p className="text-xs text-muted-foreground">{s.lastSurah} · {new Date(s.lastDate).toLocaleDateString("fr-MA")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{s.lastGrade}/100</p>
              <StatusPill status={s.lastStatus} />
            </div>
          </li>
        ))}
        {students.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            Aucune évaluation enregistrée
          </li>
        )}
      </ul>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PASSED:       "text-green-600",
    NEEDS_REVIEW: "text-yellow-600",
    FAILED:       "text-red-600",
    PENDING:      "text-muted-foreground",
  };
  const labels: Record<string, string> = {
    PASSED: "Réussi", NEEDS_REVIEW: "À revoir", FAILED: "Échoué", PENDING: "En attente",
  };
  return <span className={`text-xs ${map[status] ?? ""}`}>{labels[status] ?? status}</span>;
}
