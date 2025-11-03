"use client"

import "leaflet/dist/leaflet.css"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { vesselsApi } from "@/lib/api/vessels"
import { regionsApi } from "@/lib/api/regions"
import { adminNavItems } from "@/lib/config/navigation"
import type { Vessel, Region } from "@/lib/types"
import { useTranslation } from "@/lib/hooks/use-translation"

import { RadarWidget } from "@/components/radar/radar-widget"

const VesselMap = dynamic(() => import("@/components/map/vessel-map").then((m) => m.VesselMap), {
  ssr: false,
})

type VesselKind = string

export default function AdminRadarPage() {
  const { t, locale } = useTranslation()
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const [typeFilter, setTypeFilter] = useState<VesselKind | "all">("all")
  const [search, setSearch] = useState("")

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US"),
    [locale],
  )

  const vesselTypeOptions = useMemo(
    () => [
      { value: "all" as const, label: t("radarPage.filters.all") },
      { value: "container" as VesselKind, label: t("vessels.type.container") },
      { value: "tanker" as VesselKind, label: t("vessels.type.tanker") },
      { value: "bulk" as VesselKind, label: t("vessels.type.bulk") },
      { value: "fishing" as VesselKind, label: t("vessels.type.fishing") },
      { value: "passenger" as VesselKind, label: t("vessels.type.passenger") },
      { value: "tug" as VesselKind, label: t("vessels.type.tug") },
    ],
    [t],
  )

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [vs, rs] = await Promise.all([vesselsApi.getAll(), regionsApi.getAll()])
        if (!alive) return
        setVessels(vs)
        setRegions(rs)
      } catch (error) {
        console.error("Error loading radar data:", error)
        if (alive) setHasError(true)
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  const getKind = (v: Vessel): string | undefined =>
    ((v as any).type ?? (v as any).vesselType ?? (v as any).category ?? undefined) as string | undefined

  const searchableText = useCallback((v: Vessel) => {
    const normalize = (value: unknown) =>
      value == null ? "" : String(value).toLocaleLowerCase(locale === "fa" ? "fa-IR" : "en-US")
    const anyV = v as any
    return [
      anyV.name,
      anyV.mmsi,
      anyV.imo,
      anyV.flag,
      anyV.callSign ?? anyV.callsign,
      anyV.ownerId ?? anyV.owner,
      anyV.identifier,
    ]
      .filter(Boolean)
      .map(normalize)
      .join(" ")
  }, [locale])

  const filteredVessels = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale === "fa" ? "fa-IR" : "en-US")
    return vessels.filter((v) => {
      const kind = getKind(v)
      const matchesType = typeFilter === "all" ? true : kind === typeFilter
      const matchesQuery = query ? searchableText(v).includes(query) : true
      return matchesType && matchesQuery
    })
  }, [vessels, typeFilter, search, locale, searchableText])

  const countsLabel = t("radarPage.countsLabel", {
    filtered: numberFormatter.format(filteredVessels.length),
    total: numberFormatter.format(vessels.length),
  })

  return (
    <DashboardLayout sidebarItems={adminNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("radarPage.title")}</h1>
          <p className="text-muted-foreground">{t("radarPage.description")}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <label className="w-24 text-sm text-muted-foreground" htmlFor="vessel-type">
              {t("radarPage.typeFilterLabel")}
            </label>
            <select
              id="vessel-type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as VesselKind | "all")}
              className="w-full rounded-xl border bg-background p-2 text-sm"
            >
              {vesselTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <label className="w-24 text-sm text-muted-foreground" htmlFor="radar-search">
              {t("radarPage.searchLabel")}
            </label>
            <input
              id="radar-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("radarPage.searchPlaceholder")}
              className="w-full rounded-xl border bg-background p-2 text-sm"
            />
            <span className="whitespace-nowrap rounded-lg border px-2 py-1 text-xs text-muted-foreground">
              {countsLabel}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">{t("radarPage.loading")}</div>
        ) : hasError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
            {t("radarPage.error")}
          </div>
        ) : (
          <Tabs defaultValue="map" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="map">{t("radarPage.tabs.map")}</TabsTrigger>
              <TabsTrigger value="radar">{t("radarPage.tabs.radar")}</TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="mt-4">
              <VesselMap vessels={filteredVessels as any} regions={regions as any} />
            </TabsContent>

            <TabsContent value="radar" className="mt-4">
              <div className="rounded-2xl border p-3">
                <RadarWidget vessels={filteredVessels as any} centerLat={27.1865} centerLng={56.2808} range={50} />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
