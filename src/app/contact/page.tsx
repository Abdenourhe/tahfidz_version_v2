// src/app/contact/page.tsx
// Page de contact TAHFIDZ (contenu éditable via SiteConfig).

import type { Metadata } from "next"
import { ContactForm } from "./ContactForm"
import { getIcon } from "@/lib/landing/icon-mapper"
import { loadPageConfig, getPageLang } from "@/lib/site-config/page-utils"
import type { ContactCard } from "@/lib/site-config/page-types"
import { PageContentRenderer } from "@/components/site-config/PageContentRenderer"

function ContactCardItem({ card }: { card: ContactCard }) {
  const Icon = getIcon(card.icon)
  const content = (
    <div className='bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm'>
      <div className='w-10 h-10 rounded-xl bg-tahfidz-green-light dark:bg-emerald-900/30 flex items-center justify-center mb-4'>
        <Icon size={20} className='text-tahfidz-green' />
      </div>
      <h3 className='font-semibold text-gray-900 dark:text-white mb-1'>{card.title}</h3>
      <p className='text-sm text-gray-600 dark:text-gray-300'>{card.value}</p>
    </div>
  )

  if (card.href) {
    return (
      <a href={card.href} className='block hover:shadow-md transition-shadow'>
        {content}
      </a>
    )
  }

  return content
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await loadPageConfig("contact")
  const lang = await getPageLang()
  const content = config[lang]
  return {
    title: content.metaTitle ?? content.title,
    description: content.metaDescription,
  }
}

export default async function ContactPage() {
  const config = await loadPageConfig("contact")
  const lang = await getPageLang()
  const content = config[lang]

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='text-center mb-12'>
          <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4'>
            {content.title}
          </h1>
          {content.intro && (
            <p className='text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
              {content.intro}
            </p>
          )}
        </div>

        <div className='grid lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2'>
            <div className='bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-sm'>
              <ContactForm />
            </div>
          </div>

          <div className='space-y-6'>
            {content.contactCards?.map((card, index) => (
              <ContactCardItem key={index} card={card} />
            ))}
          </div>
        </div>

        {content.sections.length > 0 && (
          <div className='mt-16 max-w-3xl mx-auto'>
            <PageContentRenderer sections={content.sections} />
          </div>
        )}
      </div>
    </div>
  )
}
