// src/app/privacy/page.tsx
// Politique de confidentialité de TAHFIDZ.

import { LegalPageLayout } from "@/components/layout/LegalPageLayout"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Découvrez comment TAHFIDZ collecte, utilise et protège vos données personnelles.",
}

const LAST_UPDATED = "17 juin 2026"

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Politique de confidentialité" lastUpdated={LAST_UPDATED}>
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Notre engagement</h2>
        <p>
          Chez TAHFIDZ, la protection de vos données et de celles de votre école est une priorité.
          Cette politique explique quelles informations nous collectons, comment nous les utilisons
          et quels sont vos droits.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. Données collectées</h2>
        <p>Nous collectons uniquement les données nécessaires au fonctionnement de la plateforme :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Données de compte</strong> : nom, email, mot de passe hashé, rôle.</li>
          <li><strong>Données de l&apos;école</strong> : nom, adresse, logo, informations de contact.</li>
          <li><strong>Données des élèves</strong> : nom, progression de mémorisation, présences, évaluations.</li>
          <li><strong>Données des parents</strong> : nom, email, lien avec l&apos;enfant.</li>
          <li><strong>Données techniques</strong> : logs de connexion, préférences de notification.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Utilisation des données</h2>
        <p>Vos données sont utilisées pour :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Fournir et améliorer les services de gestion de l&apos;école coranique.</li>
          <li>Permettre le suivi pédagogique des élèves et la communication avec les parents.</li>
          <li>Assurer la sécurité du compte et de la plateforme.</li>
          <li>Envoyer des notifications importantes liées à l&apos;utilisation du service.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Stockage et sécurité</h2>
        <p>
          Les données sont stockées dans une base de données PostgreSQL sécurisée, hébergée sur des
          infrastructures cloud fiables. Les mots de passe sont hashés et les communications sont
          chiffrées en transit via HTTPS.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Vos droits</h2>
        <p>
          Conformément aux réglementations applicables, vous disposez d&apos;un droit d&apos;accès,
          de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits,
          contactez-nous à l&apos;adresse ci-dessous.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Cookies et tracking</h2>
        <p>
          TAHFIDZ utilise des cookies strictement nécessaires à l&apos;authentification et au
          fonctionnement de la plateforme. Nous n&apos;utilisons pas de cookies de tracking à des
          fins publicitaires.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">7. Contact</h2>
        <p>
          Pour toute question relative à la confidentialité, contactez notre responsable de la
          protection des données à{" "}
          <a href="mailto:privacy@tahfidz.com" className="text-tahfidz-green hover:underline">
            privacy@tahfidz.com
          </a>.
        </p>
      </section>
    </LegalPageLayout>
  )
}
