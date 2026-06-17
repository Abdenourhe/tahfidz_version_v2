// src/app/terms/page.tsx
// Conditions d'utilisation de TAHFIDZ.

import { LegalPageLayout } from "@/components/layout/LegalPageLayout"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Les conditions générales d'utilisation de la plateforme TAHFIDZ.",
}

const LAST_UPDATED = "17 juin 2026"

export default function TermsPage() {
  return (
    <LegalPageLayout title="Conditions d'utilisation" lastUpdated={LAST_UPDATED}>
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Acceptation des conditions</h2>
        <p>
          En accédant à la plateforme TAHFIDZ et en utilisant nos services, vous acceptez sans réserve
          les présentes conditions d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions,
          veuillez ne pas utiliser le service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. Description du service</h2>
        <p>
          TAHFIDZ est une plateforme SaaS de gestion et de suivi pédagogique destinée aux écoles de
          mémorisation du Coran. Elle permet la gestion des élèves, enseignants, parents, groupes,
          présences, évaluations et communications.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Comptes et sécurité</h2>
        <p>
          Vous êtes responsable de la confidentialité de vos identifiants de connexion. Toute activité
          effectuée depuis votre compte est réputée effectuée par vous. Vous vous engagez à notifier
          rapidement TAHFIDZ en cas d&apos;utilisation non autorisée de votre compte.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Contenu utilisateur</h2>
        <p>
          Les données saisies par les écoles (informations sur les élèves, enseignants, parents, etc.)
          restent leur propriété. TAHFIDZ agit uniquement en tant qu&apos;hébergeur et fournisseur
          d&apos;outils de gestion.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Paiement et abonnements</h2>
        <p>
          TAHFIDZ propose différents plans d&apos;abonnement (Gratuit, Starter, Pro). Les tarifs et
          fonctionnalités associées sont présentés sur la page Tarifs. L&apos;école s&apos;engage à
          réguler les sommes dues selon le plan choisi.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Résiliation</h2>
        <p>
          Vous pouvez résilier votre compte à tout moment. TAHFIDZ se réserve le droit de suspendre ou
          de résilier un compte en cas de violation des présentes conditions ou d&apos;utilisation
          frauduleuse de la plateforme.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">7. Limitation de responsabilité</h2>
        <p>
          TAHFIDZ s&apos;efforce d&apos;assurer la disponibilité et la fiabilité du service, mais ne
          peut garantir un fonctionnement sans interruption. La responsabilité de TAHFIDZ est limitée
          au montant des frais payés par l&apos;école au cours des douze derniers mois.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">8. Loi applicable</h2>
        <p>
          Les présentes conditions sont régies par les lois en vigueur au Canada. Tout litige relatif
          à l&apos;interprétation ou à l&apos;exécution des présentes conditions sera soumis aux
          tribunaux compétents de cette juridiction.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">9. Contact</h2>
        <p>
          Pour toute question juridique, contactez-nous à{" "}
          <a href="mailto:legal@tahfidz.com" className="text-tahfidz-green hover:underline">
            legal@tahfidz.com
          </a>.
        </p>
      </section>
    </LegalPageLayout>
  )
}
