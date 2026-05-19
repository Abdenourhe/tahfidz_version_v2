"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd    = new FormData(e.currentTarget);
    const email = fd.get("email")    as string;
    const pwd   = fd.get("password") as string;
    const slug  = fd.get("slug")     as string;

    const result = await signIn("credentials", {
      email, password: pwd, slug,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email, mot de passe ou identifiant d'école incorrect.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-medium">🕌 TAHFIDZ</h1>
          <p className="text-muted-foreground text-sm mt-1">Connexion à votre école</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="slug">
              Identifiant de l'école
            </label>
            <input
              id="slug" name="slug" type="text"
              placeholder="al-nour"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email" name="email" type="email"
              placeholder="admin@ecole.com"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="password">Mot de passe</label>
            <input
              id="password" name="password" type="password"
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-foreground text-background py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Démo : slug <code className="font-mono bg-muted px-1 rounded">al-nour</code> · Admin@1234
        </p>
      </div>
    </main>
  );
}
