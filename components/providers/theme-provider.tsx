"use client"

import type React from "react"

import { useEffect } from "react"
import { useUIStore } from "@/lib/store/ui-store"
import { useDirection } from "@/lib/hooks/use-direction"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((state) => state.theme)
  const hasHydrated = useUIStore((state) => state._hasHydrated)
  useDirection()

  useEffect(() => {
    if (hasHydrated) {
      const root = document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(theme)
    }
  }, [theme, hasHydrated])

  return <>{children}</>
}
