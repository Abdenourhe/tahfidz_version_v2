// src/app/security/page.tsx
// Sécurité et conformité de TAHFIDZ.

import { LegalPageLayout } from "@/components/layout/LegalPageLayout"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sécurité",
  description: "Les mesures de sécurité mises en place pour protéger vos données sur TAHFIDZ.",
}

const LAST_UPDATED = "17 juin 2026"

export default function SecurityPage() {
  return (
    <LegalPageLayout title="Sécurité et conformité" lastUpdated={LAST_UPDATED}>
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Infrastructure sécurisée</h2>
        <p>
          TAHFIDZ est hébergé sur des infrastructures cloud fiables et bénéficie d&apos;une
          architecture moderne. Toutes les communications entre vos appareils et nos serveurs sont
          chiffrées via HTTPS/TLS.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. Chiffrement des données</h2>
        <p>
          Les données sont chiffrées en transit et bénéficient de mécanismes de protection au repos.
          Les mots de passe ne sont jamais stockés en clair : ils sont hashés avec des algorithmes
          robustes (bcrypt).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Authentification et sessions</h2>
        <p>
          L&apos;authentification repose sur des sessions sécurisées avec tokens JWT à durée limitée.
          Les mots de passe doivent respecter une politique de complexité minimale. La double
          vérification du rôle est assurée côté serveur pour chaque action sensible.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Isolation multi-tenant</h2>
        <p>
          Chaque école dispose d&apos;un environnement logiquement isolé grâce à l&apos;injection
          automatique du <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">schoolId</code>{" "}
          sur chaque requête base de données. Cela garantit qu&apos;une école ne peut pas accéder
          aux données d&apos;une autre école.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Sauvegardes et récupération</h2>
        <p>
          Nous mettons en place des sauvegardes régulières de la base de données afin de permettre la
          récupération des données en cas d&apos;incident. La politique de rétention et les
          procédures de restauration sont testées périodiquement.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Signalement de vulnérabilités</h2>
        <p>
          Si vous découvrez une faille de sécurité, nous vous encourageons à nous la signaler de
          manière responsable. Nous traitons les rapports avec la plus grande sérieuxité.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">7. Contact sécurité</h2>
        <p>
          Pour toute question de sécurité, écrivez-nous à{" "}
          <a href="mailto:security@tahfidz.com" className="text-tahfidz-green hover:underline">
            security@tahfidz.com
          </a>.
        </p>
      </section>
    </LegalPageLayout>
  )
}
