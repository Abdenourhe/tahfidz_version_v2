// src/i18n/request.ts
import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = cookieStore.get("locale")?.value ?? "fr"
  const validLocales = ["fr", "ar"]
  const finalLocale = validLocales.includes(locale) ? locale : "fr"

  return {
    locale: finalLocale,
    messages: (await import(`../../messages/${finalLocale}.json`)).default,
  }
})
