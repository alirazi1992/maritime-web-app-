"use client"

import { useUIStore } from "@/lib/store/ui-store"
import { translations } from "@/lib/i18n/translations"
import { defaultLocale } from "@/lib/i18n/config"

export function useTranslation() {
  const locale = useUIStore((state) => state.locale)
  const hasHydrated = useUIStore((state) => state._hasHydrated)

  const activeLocale = hasHydrated ? locale : defaultLocale

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".")
    const dictionary = translations[activeLocale] ?? translations[defaultLocale]
    let value: any = dictionary

    for (const k of keys) {
      value = value?.[k]
    }

    if (typeof value === "string") {
      if (params) {
        return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
          const pattern = `{{${paramKey}}}`
          return acc.split(pattern).join(String(paramValue))
        }, value)
      }
      return value
    }

    return key
  }

  return {
    t: (key: string, params?: Record<string, string | number>) => {
      const result = t(key, params)
      if (result === key) {
        const lastSegment = key.split(".").pop() ?? key
        return lastSegment
          .replace(/[_-]+/g, " ")
          .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
          .replace(/\b\w/g, (letter) => letter.toUpperCase())
      }
      return result
    },
    locale: activeLocale,
  }
}
