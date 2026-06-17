// src/app/contact/page.tsx
// Page de contact TAHFIDZ.

import type { Metadata } from "next"
import { ContactForm } from "./ContactForm"
import { Mail, MapPin, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'équipe TAHFIDZ pour une question, un support ou une demande de démo.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Contactez-nous
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Une question ? Besoin d&apos;assistance ou d&apos;une démonstration ? Notre équipe vous répond.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
              <ContactForm />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-tahfidz-green-light dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <Mail size={20} className="text-tahfidz-green" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Email</h3>
              <a href="mailto:contact@tahfidz.com" className="text-sm text-gray-600 dark:text-gray-300 hover:text-tahfidz-green transition">
                contact@tahfidz.com
              </a>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-tahfidz-green-light dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <Clock size={20} className="text-tahfidz-green" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Disponibilité</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Lun - Ven, 9h - 18h</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-tahfidz-green-light dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <MapPin size={20} className="text-tahfidz-green" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Siège social</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Canada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
