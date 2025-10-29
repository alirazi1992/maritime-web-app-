"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Vessel } from "@/lib/types"

interface RadarWidgetProps {
  vessels: Vessel[]
  centerLat: number
  centerLng: number
  range?: number // nautical miles
  onTargetClick?: (vessel: Vessel) => void
}

export function RadarWidget({ vessels, centerLat, centerLng, range = 50, onTargetClick }: RadarWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [sweepAngle, setSweepAngle] = useState(0)
  const [gain, setGain] = useState(50)
  const [threshold, setThreshold] = useState(30)
  const [pulseLength, setPulseLength] = useState(50)
  const [stcEnabled, setStcEnabled] = useState(true)
  const [cfarEnabled, setCfarEnabled] = useState(false)
  const [boostEnabled, setBoostEnabled] = useState(false)
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)

  // Animation loop for radar sweep
  useEffect(() => {
    const interval = setInterval(() => {
      setSweepAngle((prev) => (prev + 2) % 360)
    }, 50)

    return () => clearInterval(interval)
  }, [])

  // Draw radar display
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 20

    // Clear canvas
    ctx.fillStyle = "rgba(0, 20, 40, 0.95)"
    ctx.fillRect(0, 0, width, height)

    // Draw range rings
    ctx.strokeStyle = "rgba(0, 255, 100, 0.3)"
    ctx.lineWidth = 1
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2)
      ctx.stroke()

      // Range labels
      ctx.fillStyle = "rgba(0, 255, 100, 0.6)"
      ctx.font = "10px monospace"
      ctx.fillText(`${((range / 4) * i).toFixed(0)} NM`, centerX + 5, centerY - (radius / 4) * i + 5)
    }

    // Draw heading lines (N, E, S, W)
    ctx.strokeStyle = "rgba(0, 255, 100, 0.4)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - radius)
    ctx.lineTo(centerX, centerY + radius)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(centerX - radius, centerY)
    ctx.lineTo(centerX + radius, centerY)
    ctx.stroke()

    // Draw cardinal directions
    ctx.fillStyle = "rgba(0, 255, 100, 0.8)"
    ctx.font = "14px monospace"
    ctx.textAlign = "center"
    ctx.fillText("N", centerX, centerY - radius - 5)
    ctx.fillText("S", centerX, centerY + radius + 15)
    ctx.textAlign = "right"
    ctx.fillText("W", centerX - radius - 5, centerY + 5)
    ctx.textAlign = "left"
    ctx.fillText("E", centerX + radius + 5, centerY + 5)

    // Draw sweep
    const sweepRad = (sweepAngle * Math.PI) / 180
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, "rgba(0, 255, 100, 0.3)")
    gradient.addColorStop(0.5, "rgba(0, 255, 100, 0.1)")
    gradient.addColorStop(1, "rgba(0, 255, 100, 0)")

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(sweepRad)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, radius, -Math.PI / 12, Math.PI / 12)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.restore()

    // Draw vessels as targets
    vessels.forEach((vessel) => {
      // Calculate relative position
      const latDiff = vessel.position.lat - centerLat
      const lngDiff = vessel.position.lng - centerLng

      // Convert to nautical miles (approximate)
      const distanceNM = Math.sqrt(
        latDiff * latDiff * 60 * 60 + lngDiff * lngDiff * 60 * 60 * Math.cos((centerLat * Math.PI) / 180),
      )

      if (distanceNM > range) return // Outside radar range

      // Calculate angle
      const angle = Math.atan2(lngDiff, latDiff)
      const angleDeg = (angle * 180) / Math.PI

      // Convert to screen coordinates
      const targetRadius = (distanceNM / range) * radius
      const targetX = centerX + targetRadius * Math.sin((angleDeg * Math.PI) / 180)
      const targetY = centerY - targetRadius * Math.cos((angleDeg * Math.PI) / 180)

      // Draw target
      const isSelected = selectedVessel?.id === vessel.id
      ctx.fillStyle = isSelected ? "rgba(255, 200, 0, 0.9)" : "rgba(0, 255, 100, 0.8)"
      ctx.beginPath()
      ctx.arc(targetX, targetY, isSelected ? 6 : 4, 0, Math.PI * 2)
      ctx.fill()

      // Draw target trail
      if (vessel.speed > 0) {
        const trailLength = 20
        const headingRad = (vessel.heading * Math.PI) / 180
        const trailX = targetX - Math.sin(headingRad) * trailLength
        const trailY = targetY + Math.cos(headingRad) * trailLength

        ctx.strokeStyle = isSelected ? "rgba(255, 200, 0, 0.5)" : "rgba(0, 255, 100, 0.4)"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(targetX, targetY)
        ctx.lineTo(trailX, trailY)
        ctx.stroke()
      }

      // Draw vessel name if selected
      if (isSelected) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
        ctx.font = "12px monospace"
        ctx.textAlign = "center"
        ctx.fillText(vessel.name, targetX, targetY - 15)
      }
    })

    // Draw center point
    ctx.fillStyle = "rgba(255, 100, 0, 0.8)"
    ctx.beginPath()
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2)
    ctx.fill()
  }, [sweepAngle, vessels, centerLat, centerLng, range, selectedVessel])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) / 2 - 20

    // Find clicked vessel
    for (const vessel of vessels) {
      const latDiff = vessel.position.lat - centerLat
      const lngDiff = vessel.position.lng - centerLng
      const distanceNM = Math.sqrt(
        latDiff * latDiff * 60 * 60 + lngDiff * lngDiff * 60 * 60 * Math.cos((centerLat * Math.PI) / 180),
      )

      if (distanceNM > range) continue

      const angle = Math.atan2(lngDiff, latDiff)
      const angleDeg = (angle * 180) / Math.PI
      const targetRadius = (distanceNM / range) * radius
      const targetX = centerX + targetRadius * Math.sin((angleDeg * Math.PI) / 180)
      const targetY = centerY - targetRadius * Math.cos((angleDeg * Math.PI) / 180)

      const distance = Math.sqrt((x - targetX) ** 2 + (y - targetY) ** 2)
      if (distance < 10) {
        setSelectedVessel(vessel)
        onTargetClick?.(vessel)
        return
      }
    }

    setSelectedVessel(null)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <Card>
        <CardHeader>
          <CardTitle>رادار</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="w-full cursor-crosshair rounded-lg"
            onClick={handleCanvasClick}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Radar Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">تنظیمات رادار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Gain: {gain}%</Label>
              <Slider value={[gain]} onValueChange={(v) => setGain(v[0])} max={100} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Threshold: {threshold}%</Label>
              <Slider value={[threshold]} onValueChange={(v) => setThreshold(v[0])} max={100} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Pulse Length: {pulseLength}%</Label>
              <Slider value={[pulseLength]} onValueChange={(v) => setPulseLength(v[0])} max={100} step={1} />
            </div>
            <div className="flex items-center justify-between">
              <Label>STC</Label>
              <Switch checked={stcEnabled} onCheckedChange={setStcEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label>CFAR</Label>
              <Switch checked={cfarEnabled} onCheckedChange={setCfarEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Boost</Label>
              <Switch checked={boostEnabled} onCheckedChange={setBoostEnabled} />
            </div>
          </CardContent>
        </Card>

        {/* Target Details */}
        {selectedVessel && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">جزئیات هدف</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-muted-foreground">نام</Label>
                <p className="font-medium">{selectedVessel.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">نوع</Label>
                <p className="font-medium">{selectedVessel.type}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-muted-foreground">سرعت</Label>
                  <p className="font-medium">{selectedVessel.speed} kn</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">سمت</Label>
                  <p className="font-medium">{selectedVessel.heading}°</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">موقعیت</Label>
                <p className="text-sm font-mono">
                  {selectedVessel.position.lat.toFixed(4)}°, {selectedVessel.position.lng.toFixed(4)}°
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={() => setSelectedVessel(null)}
              >
                بستن
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
