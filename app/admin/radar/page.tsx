"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RadarWidget } from "@/components/radar/radar-widget"
import { VesselMap } from "@/components/map/vessel-map"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { vesselsApi } from "@/lib/api/vessels"
import { regionsApi } from "@/lib/api/regions"
import { adminNavItems } from "@/lib/config/navigation"
import type { Vessel, Region } from "@/lib/types"

export default function AdminRadarPage() {
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vesselsData, regionsData] = await Promise.all([vesselsApi.getAll(), regionsApi.getAll()])
        setVessels(vesselsData)
        setRegions(regionsData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <DashboardLayout sidebarItems={adminNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">نقشه و رادار</h1>
          <p className="text-muted-foreground">رصد لحظه‌ای موقعیت شناورها</p>
        </div>

        {loading ? (
          <div className="text-center py-12">در حال بارگذاری...</div>
        ) : (
          <Tabs defaultValue="map" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="map">نقشه</TabsTrigger>
              <TabsTrigger value="radar">رادار</TabsTrigger>
            </TabsList>
            <TabsContent value="map" className="mt-6">
              <VesselMap vessels={vessels} regions={regions} />
            </TabsContent>
            <TabsContent value="radar" className="mt-6">
              <RadarWidget vessels={vessels} centerLat={27.1865} centerLng={56.2808} range={50} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
