export const locales = ["fa", "en"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export const localeNames: Record<Locale, string> = {
  fa: "Persian",
  en: "English",
}

export const localeDirections: Record<Locale, "rtl" | "ltr"> = {
  fa: "rtl",
  en: "ltr",
}
