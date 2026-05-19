import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentService } from "@/services/student.service";
import Link from "next/link";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp     = await searchParams;
  const svc    = new StudentService(session.user.schoolId);
  const result = await svc.list({
    search: sp.search,
    status: sp.status as any,
    page:   Number(sp.page ?? 1),
    limit:  20,
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Élèves</h1>
        {session.user.role === "SCHOOL_ADMIN" && (
          <Link
            href="/students/new"
            className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            + Ajouter
          </Link>
        )}
      </div>

      {/* Barre de recherche */}
      <form className="flex gap-2">
        <input
          name="search"
          defaultValue={sp.search}
          placeholder="Rechercher un élève…"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
        >
          Rechercher
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nom complet</th>
              <th className="text-left px-4 py-3 font-medium">Classe</th>
              <th className="text-left px-4 py-3 font-medium">Statut</th>
              <th className="text-left px-4 py-3 font-medium">Évaluations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.data.map((student: any) => (
              <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/students/${student.id}`} className="font-medium hover:underline">
                    {student.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {student.enrollments[0]?.class?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={student.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {student._count.memorizationRecords}
                </td>
              </tr>
            ))}
            {result.data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Aucun élève trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>{result.meta.total} élève(s)</span>
        <div className="flex gap-2">
          {result.meta.page > 1 && (
            <Link href={`?page=${result.meta.page - 1}`} className="px-3 py-1 rounded border border-border hover:bg-muted">
              ← Précédent
            </Link>
          )}
          {result.meta.page < result.meta.totalPages && (
            <Link href={`?page=${result.meta.page + 1}`} className="px-3 py-1 rounded border border-border hover:bg-muted">
              Suivant →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    SUSPENDED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    GRADUATED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    WITHDRAWN: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };
  const labels: Record<string, string> = {
    ACTIVE: "Actif", SUSPENDED: "Suspendu", GRADUATED: "Diplômé", WITHDRAWN: "Retiré",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}
