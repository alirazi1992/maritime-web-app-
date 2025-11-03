"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Vessel, Region } from "@/lib/types"
import { useTranslation } from "@/lib/hooks/use-translation"
import { Layers } from "lucide-react"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
const Polygon = dynamic(() => import("react-leaflet").then((mod) => mod.Polygon), { ssr: false })

const FALLBACK_CENTER: [number, number] = [27.1865, 56.2808]

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)

interface VesselMapProps {
  vessels: Vessel[]
  regions?: Region[]
  center?: [number, number]
  zoom?: number
  onVesselClick?: (vessel: Vessel) => void
}

export function VesselMap({
  vessels,
  regions = [],
  center = FALLBACK_CENTER,
  zoom = 8,
  onVesselClick,
}: VesselMapProps) {
  const { t } = useTranslation()

  const text = useMemo(
    () => ({
      title: t("map.title"),
      loading: t("map.loading"),
      layersButton: t("map.layersButton"),
      layersPanel: t("map.layersPanel"),
      layers: {
        vessels: t("map.layers.vessels"),
        regions: t("map.layers.regions"),
        ports: t("map.layers.ports"),
      },
      popup: {
        type: t("map.popup.type"),
        speed: t("map.popup.speed"),
        heading: t("map.popup.heading"),
        owner: t("map.popup.owner"),
        noDescription: t("map.popup.noDescription"),
      },
    }),
    [t],
  )

  const [mounted, setMounted] = useState(false)
  const [showVessels, setShowVessels] = useState(true)
  const [showRegions, setShowRegions] = useState(true)
  const [showPorts, setShowPorts] = useState(true)
  const [layersOpen, setLayersOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const noDataLabel = t("common.noData")
  const formatText = (value: string | number | null | undefined) =>
    value === undefined || value === null || value === "" ? noDataLabel : String(value)

  const formatSpeed = (value: number | null | undefined) =>
    isNumber(value) ? `${value} ${t("units.knot")}` : noDataLabel

  const formatHeading = (value: number | null | undefined) =>
    isNumber(value) ? `${value}\u00B0` : noDataLabel

  if (!mounted) {
    return (
      <Card>
        <CardContent className="flex h-[600px] items-center justify-center">
          <p className="text-muted-foreground">{text.loading}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{text.title}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setLayersOpen((prev) => !prev)}>
            <Layers className="ml-2 h-4 w-4" />
            {text.layersButton}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <MapContainer center={center ?? FALLBACK_CENTER} zoom={zoom} style={{ height: "100%", width: "100%" }} className="z-0">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {showVessels &&
                vessels.map((vessel) => {
                  const lat = vessel.position?.lat ?? vessel.latitude ?? FALLBACK_CENTER[0]
                  const lng = vessel.position?.lng ?? vessel.longitude ?? FALLBACK_CENTER[1]

                  return (
                    <Marker
                      key={vessel.id}
                      position={[lat, lng]}
                      eventHandlers={{
                        click: () => onVesselClick?.(vessel),
                      }}
                    >
                      <Popup>
                        <div className="min-w-[200px] space-y-2">
                          <h3 className="font-semibold">{formatText((vessel as any).name)}</h3>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="text-muted-foreground">{text.popup.type}:</span> {formatText((vessel as any).type)}
                            </p>
                            <p>
                              <span className="text-muted-foreground">{text.popup.speed}:</span> {formatSpeed((vessel as any).speed)}
                            </p>
                            <p>
                              <span className="text-muted-foreground">{text.popup.heading}:</span> {formatHeading((vessel as any).heading)}
                            </p>
                            <p>
                              <span className="text-muted-foreground">{text.popup.owner}:</span> {formatText((vessel as any).ownerName)}
                            </p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}

              {showRegions &&
                regions.map((region) => {
                  const type = (region as any)?.type
                  const isPort = type === "port"
                  if (isPort && !showPorts) return null

                  const coordinates = (region.geometry?.coordinates?.[0] ?? []) as [number, number][]

                  return (
                    <Polygon
                      key={region.id}
                      positions={coordinates.map(([lng, lat]) => [lat, lng])}
                      pathOptions={{
                        color: isPort ? "#3b82f6" : type === "restricted" ? "#ef4444" : "#10b981",
                        fillOpacity: 0.2,
                      }}
                    >
                      <Popup>
                        <div className="min-w-[200px] space-y-2">
                          <h3 className="font-semibold">{formatText((region as any).name)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatText(region.description ?? text.popup.noDescription)}
                          </p>
                        </div>
                      </Popup>
                    </Polygon>
                  )
                })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {layersOpen && (
        <Card className="absolute left-4 top-20 z-10 w-64">
          <CardHeader>
            <CardTitle className="text-base">{text.layersPanel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox id="vessels" checked={showVessels} onCheckedChange={(checked) => setShowVessels(!!checked)} />
              <Label htmlFor="vessels" className="cursor-pointer">
                {text.layers.vessels}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="regions" checked={showRegions} onCheckedChange={(checked) => setShowRegions(!!checked)} />
              <Label htmlFor="regions" className="cursor-pointer">
                {text.layers.regions}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="ports" checked={showPorts} onCheckedChange={(checked) => setShowPorts(!!checked)} />
              <Label htmlFor="ports" className="cursor-pointer">
                {text.layers.ports}
              </Label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
