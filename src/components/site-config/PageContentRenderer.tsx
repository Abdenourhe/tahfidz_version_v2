// src/components/site-config/PageContentRenderer.tsx
// Rendu du contenu éditable des pages statiques (paragraphes + listes simples).

import type { PageSection } from '@/lib/site-config/page-types'

function renderBody(body: string) {
  // Découpage en blocs séparés par une ligne vide.
  const blocks = body.split(/\n\s*\n/)

  return blocks.map((block, blockIndex) => {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 0) return null

    const isList = lines.every((line) => line.startsWith('- '))

    if (isList) {
      return (
        <ul
          key={blockIndex}
          className='list-disc pl-5 space-y-2 marker:text-tahfidz-green'
        >
          {lines.map((line, lineIndex) => {
            const text = line.slice(2)
            return (
              <li
                key={lineIndex}
                className='text-gray-600 dark:text-gray-300'
                // Autorise les liens mailto/http simples dans le texte.
                dangerouslySetInnerHTML={{ __html: linkify(escapeHtml(text)) }}
              />
            )
          })}
        </ul>
      )
    }

    const text = lines.join(' ')
    return (
      <p
        key={blockIndex}
        className='text-gray-600 dark:text-gray-300 leading-relaxed'
        dangerouslySetInnerHTML={{ __html: linkify(escapeHtml(text)) }}
      />
    )
  })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function linkify(text: string): string {
  // Liens mailto
  let result = text.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '<a href="mailto:$1" class="text-tahfidz-green hover:underline">$1</a>'
  )
  // URLs simples (http/https)
  result = result.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-tahfidz-green hover:underline">$1</a>'
  )
  return result
}

export function PageContentRenderer({ sections }: { sections: PageSection[] }) {
  return (
    <div className='space-y-8'>
      {sections.map((section, index) => (
        <section key={index} className='space-y-4'>
          <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
            {section.title}
          </h2>
          <div className='space-y-4'>{renderBody(section.body)}</div>
        </section>
      ))}
    </div>
  )
}
