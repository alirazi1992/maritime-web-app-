"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/hooks/use-translation"
import type { Vessel } from "@/lib/types"
import { vesselsApi } from "@/lib/api/vessels"

type VesselFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vessel: Vessel | null
  onSuccess: () => void
  mode: "admin" | "client"
  ownerInfo?: { id: string; name: string }
}

type FormState = {
  name: string
  type: Vessel["type"]
  ownerId: string
  ownerName: string
  status: Vessel["status"]
  speed: number
  heading: number
  lat: number
  lng: number
  imo: string
  mmsi: string
  callSign: string
  flag: string
  homePort: string
  currentLocation: string
  yearBuilt: string
  dwt: string
  grossTonnage: string
  crewCapacity: string
  fuelType: string
  classSociety: string
  length: string
  beam: string
  draft: string
  lastInspection: string
  nextInspection: string
  nextDryDock: string
}

const DEFAULT_OWNER_ID = "2"
const DEFAULT_OWNER_NAME = "Persian Maritime Group"

export function VesselFormDialog({ open, onOpenChange, vessel, onSuccess, mode, ownerInfo }: VesselFormDialogProps) {
  const { toast } = useToast()
  const { t } = useTranslation()

  const buildFormState = useMemo(
    () => (source?: Vessel): FormState => ({
      name: source?.name ?? "",
      type: source?.type ?? "cargo",
      ownerId: source?.ownerId ?? ownerInfo?.id ?? DEFAULT_OWNER_ID,
      ownerName: source?.ownerName ?? ownerInfo?.name ?? DEFAULT_OWNER_NAME,
      status: source?.status ?? "pending",
      speed: source?.speed ?? 0,
      heading: source?.heading ?? 0,
      lat: source?.position.lat ?? 27.1865,
      lng: source?.position.lng ?? 56.2808,
      imo: source?.imo ?? "",
      mmsi: source?.mmsi ?? "",
      callSign: source?.callSign ?? "",
      flag: source?.flag ?? "",
      homePort: source?.homePort ?? "",
      currentLocation: source?.currentLocation ?? "",
      yearBuilt: source?.yearBuilt ? source.yearBuilt.toString() : "",
      dwt: source?.dwt ? source.dwt.toString() : "",
      grossTonnage: source?.grossTonnage ? source.grossTonnage.toString() : "",
      crewCapacity: source?.crewCapacity ? source.crewCapacity.toString() : "",
      fuelType: source?.fuelType ?? "",
      classSociety: source?.classSociety ?? "",
      length: source?.length ? source.length.toString() : "",
      beam: source?.beam ? source.beam.toString() : "",
      draft: source?.draft ? source.draft.toString() : "",
      lastInspection: source?.lastInspection ? source.lastInspection.slice(0, 10) : "",
      nextInspection: source?.nextInspection ? source.nextInspection.slice(0, 10) : "",
      nextDryDock: source?.nextDryDock ? source.nextDryDock.slice(0, 10) : "",
    }),
    [ownerInfo],
  )

  const [formData, setFormData] = useState<FormState>(() => buildFormState(vessel ?? undefined))

  useEffect(() => {
    setFormData(buildFormState(vessel ?? undefined))
  }, [buildFormState, vessel, open])

  const showStatusField = mode === "admin"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const ownerId = formData.ownerId || ownerInfo?.id || vessel?.ownerId || DEFAULT_OWNER_ID
    const ownerName = formData.ownerName || ownerInfo?.name || vessel?.ownerName || DEFAULT_OWNER_NAME
    const status = mode === "client" && !vessel ? "pending" : formData.status

    const payload = {
      name: formData.name,
      type: formData.type,
      ownerId,
      ownerName,
      status,
      speed: formData.speed,
      heading: formData.heading,
      position: { lat: formData.lat, lng: formData.lng },
      imo: formData.imo || undefined,
      mmsi: formData.mmsi || undefined,
      callSign: formData.callSign || undefined,
      flag: formData.flag || undefined,
      homePort: formData.homePort || undefined,
      currentLocation: formData.currentLocation || undefined,
      yearBuilt: formData.yearBuilt ? Number.parseInt(formData.yearBuilt, 10) : undefined,
      dwt: formData.dwt ? Number.parseFloat(formData.dwt) : undefined,
      grossTonnage: formData.grossTonnage ? Number.parseFloat(formData.grossTonnage) : undefined,
      crewCapacity: formData.crewCapacity ? Number.parseInt(formData.crewCapacity, 10) : undefined,
      fuelType: formData.fuelType || undefined,
      classSociety: formData.classSociety || undefined,
      length: formData.length ? Number.parseFloat(formData.length) : undefined,
      beam: formData.beam ? Number.parseFloat(formData.beam) : undefined,
      draft: formData.draft ? Number.parseFloat(formData.draft) : undefined,
      lastInspection: formData.lastInspection ? new Date(formData.lastInspection).toISOString() : undefined,
      nextInspection: formData.nextInspection ? new Date(formData.nextInspection).toISOString() : undefined,
      nextDryDock: formData.nextDryDock ? new Date(formData.nextDryDock).toISOString() : undefined,
    } satisfies Omit<Vessel, "id" | "lastUpdate">

    try {
      if (vessel) {
        await vesselsApi.update(vessel.id, payload)
        toast({ title: t("common.success"), description: t("vessels.updateSuccess") })
      } else {
        await vesselsApi.create(payload)
        toast({ title: t("common.success"), description: t("vessels.createSuccess") })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save vessel", error)
      toast({
        title: t("common.error"),
        description: t("vessels.saveError"),
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vessel ? t("vessels.editVessel") : t("vessels.addVessel")}</DialogTitle>
          <DialogDescription>{t("vessels.dialogHint")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                id="name"
                label={`${t("vessels.form.name")} *`}
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                required
              />
              <div className="space-y-2">
                <Label htmlFor="type">{`${t("vessels.form.type")} *`}</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Vessel["type"] })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cargo">{t("vessels.type.cargo")}</SelectItem>
                    <SelectItem value="tanker">{t("vessels.type.tanker")}</SelectItem>
                    <SelectItem value="passenger">{t("vessels.type.passenger")}</SelectItem>
                    <SelectItem value="fishing">{t("vessels.type.fishing")}</SelectItem>
                    <SelectItem value="military">{t("vessels.type.other")}</SelectItem>
                    <SelectItem value="other">{t("vessels.type.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showStatusField && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">{t("vessels.statusLabel")}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Vessel["status"] })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t("vessels.status.pending")}</SelectItem>
                      <SelectItem value="approved">{t("vessels.status.approved")}</SelectItem>
                      <SelectItem value="active">{t("vessels.status.active")}</SelectItem>
                      <SelectItem value="inactive">{t("vessels.status.inactive")}</SelectItem>
                      <SelectItem value="rejected">{t("vessels.status.rejected")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <TextField
                  id="flag"
                  label={t("vessels.form.flag")}
                  value={formData.flag}
                  onChange={(value) => setFormData({ ...formData, flag: value })}
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-4">
              <TextField id="imo" label={t("vessels.form.imo")} value={formData.imo} onChange={(value) => setFormData({ ...formData, imo: value })} />
              <TextField id="mmsi" label="MMSI" value={formData.mmsi} onChange={(value) => setFormData({ ...formData, mmsi: value })} />
              <TextField
                id="callSign"
                label={t("vessels.form.callSign")}
                value={formData.callSign}
                onChange={(value) => setFormData({ ...formData, callSign: value })}
              />
              <TextField
                id="homePort"
                label={t("vessel.homePort")}
                value={formData.homePort}
                onChange={(value) => setFormData({ ...formData, homePort: value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                id="currentLocation"
                label={t("vessels.form.currentLocation")}
                value={formData.currentLocation}
                onChange={(value) => setFormData({ ...formData, currentLocation: value })}
              />
              <TextField
                id="fuelType"
                label={t("vessel.fuelType")}
                value={formData.fuelType}
                onChange={(value) => setFormData({ ...formData, fuelType: value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <NumericField id="yearBuilt" label={t("vessels.form.yearBuilt")} value={formData.yearBuilt} onChange={(value) => setFormData({ ...formData, yearBuilt: value })} />
              <NumericField id="crewCapacity" label={t("vessel.crewCapacity")} value={formData.crewCapacity} onChange={(value) => setFormData({ ...formData, crewCapacity: value })} />
              <TextField
                id="classSociety"
                label={t("vessel.classSociety")}
                value={formData.classSociety}
                onChange={(value) => setFormData({ ...formData, classSociety: value })}
              />
              <NumericField id="dwt" label={t("vessels.form.dwt")} value={formData.dwt} onChange={(value) => setFormData({ ...formData, dwt: value })} />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <NumericField id="grossTonnage" label={t("vessel.grossTonnage")} value={formData.grossTonnage} onChange={(value) => setFormData({ ...formData, grossTonnage: value })} />
              <NumericField id="length" label={t("vessel.lengthLabel")} value={formData.length} onChange={(value) => setFormData({ ...formData, length: value })} step="0.1" />
              <NumericField id="beam" label={t("vessel.beamLabel")} value={formData.beam} onChange={(value) => setFormData({ ...formData, beam: value })} step="0.1" />
              <NumericField id="draft" label={t("vessel.draftLabel")} value={formData.draft} onChange={(value) => setFormData({ ...formData, draft: value })} step="0.1" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <NumericField
                id="speed"
                label={`${t("vessels.speed")} (${t("vessels.knotsUnit")})`}
                value={formData.speed.toString()}
                onChange={(value) => setFormData({ ...formData, speed: Number.parseFloat(value) || 0 })}
                step="0.1"
                required
              />
              <NumericField
                id="heading"
                label={t("vessels.heading")}
                value={formData.heading.toString()}
                onChange={(value) => setFormData({ ...formData, heading: Number.parseFloat(value) || 0 })}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <NumericField
                id="lat"
                label={t("vessels.latitude")}
                value={formData.lat.toString()}
                onChange={(value) => setFormData({ ...formData, lat: Number.parseFloat(value) || 0 })}
                step="0.0001"
                required
              />
              <NumericField
                id="lng"
                label={t("vessels.longitude")}
                value={formData.lng.toString()}
                onChange={(value) => setFormData({ ...formData, lng: Number.parseFloat(value) || 0 })}
                step="0.0001"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <DateField
                id="lastInspection"
                label={t("vessel.lastInspection")}
                value={formData.lastInspection}
                onChange={(value) => setFormData({ ...formData, lastInspection: value })}
              />
              <DateField
                id="nextInspection"
                label={t("vessel.nextInspection")}
                value={formData.nextInspection}
                onChange={(value) => setFormData({ ...formData, nextInspection: value })}
              />
              <DateField
                id="nextDryDock"
                label={t("vessel.nextDryDock")}
                value={formData.nextDryDock}
                onChange={(value) => setFormData({ ...formData, nextDryDock: value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">{t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
  required,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  )
}

function NumericField({
  id,
  label,
  value,
  onChange,
  step,
  required,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  step?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  )
}

function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
