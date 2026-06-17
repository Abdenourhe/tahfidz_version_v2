// src/lib/landing/currencies.ts
// Devises supportées par la landing page avec labels multilingues.

export type CurrencyCode = 'CAD' | 'USD' | 'EUR' | 'GBP' | 'MAD' | 'DZD' | 'TND'

export type Currency = {
  code: CurrencyCode
  symbol: string
  labels: {
    fr: string
    en: string
    ar: string
  }
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  {
    code: 'CAD',
    symbol: '$',
    labels: { fr: '$ CAD', en: '$ CAD', ar: 'دولار كندي' },
  },
  {
    code: 'USD',
    symbol: '$',
    labels: { fr: '$ USD', en: '$ USD', ar: 'دولار أمريكي' },
  },
  {
    code: 'EUR',
    symbol: '€',
    labels: { fr: '€', en: '€', ar: 'يورو' },
  },
  {
    code: 'GBP',
    symbol: '£',
    labels: { fr: '£ GBP', en: '£ GBP', ar: 'جنيه إسترليني' },
  },
  {
    code: 'MAD',
    symbol: 'MAD',
    labels: { fr: 'MAD', en: 'MAD', ar: 'درهم' },
  },
  {
    code: 'DZD',
    symbol: 'DA',
    labels: { fr: 'DZD', en: 'DZD', ar: 'دينار' },
  },
  {
    code: 'TND',
    symbol: 'DT',
    labels: { fr: 'TND', en: 'TND', ar: 'دينار تونسي' },
  },
]

export function getCurrencyLabel(
  code: string,
  lang: 'fr' | 'en' | 'ar'
): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === code)
  return currency?.labels[lang] ?? code
}
