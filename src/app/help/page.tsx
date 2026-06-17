// src/app/help/page.tsx
// Centre d'aide (placeholder).

import { LegalPageLayout } from "@/components/layout/LegalPageLayout"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Centre d'aide",
  description: "Trouvez des réponses à vos questions sur l'utilisation de TAHFIDZ.",
}

export default function HelpPage() {
  return (
    <LegalPageLayout title="Centre d'aide">
      <p>
        Le centre d&apos;aide est en cours de construction. Il contiendra prochainement des guides,
        tutoriels et une foire aux questions pour vous accompagner dans l&apos;utilisation de TAHFIDZ.
      </p>
      <p>
        En attendant, n&apos;hésitez pas à{" "}
        <a href="/contact" className="text-tahfidz-green hover:underline">nous contacter</a>{" "}
        directement pour obtenir de l&apos;assistance.
      </p>
    </LegalPageLayout>
  )
}
