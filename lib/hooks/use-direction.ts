"use client"

import { useUIStore } from "@/lib/store/ui-store"
import { localeDirections } from "@/lib/i18n/config"
import { useEffect } from "react"

export function useDirection() {
  const locale = useUIStore((state) => state.locale)
  const hasHydrated = useUIStore((state) => state._hasHydrated)
  const direction = localeDirections[locale]

  useEffect(() => {
    if (hasHydrated && typeof document !== "undefined") {
      document.documentElement.dir = direction
      document.documentElement.lang = locale
    }
  }, [direction, locale, hasHydrated])

  return direction
}
