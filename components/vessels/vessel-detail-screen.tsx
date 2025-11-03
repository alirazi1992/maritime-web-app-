"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { WeatherCard } from "@/components/weather/weather-card"
import { PowerChart } from "@/components/charts/power-chart"
import { ComplianceTimeline } from "@/components/charts/compliance-timeline"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/hooks/use-translation"
import { vesselsApi } from "@/lib/api/vessels"
import { vesselRemindersApi } from "@/lib/api/reminders"
import type { ReminderStatus, Vessel, VesselReminder } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  Ship,
  MapPin,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  Loader2,
} from "lucide-react"

const statusBadgeVariants: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  inactive: "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
}

const reminderStatusClasses: Record<ReminderStatus, string> = {
  open: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
}

const reminderPriorityClasses = {
  high: "border-red-300 text-red-700 dark:border-red-800 dark:text-red-300",
  medium: "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-200",
  low: "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-200",
}

const healthStatusClasses = {
  excellent: "text-emerald-600 dark:text-emerald-300",
  good: "text-blue-600 dark:text-blue-300",
  attention: "text-amber-600 dark:text-amber-300",
  critical: "text-red-600 dark:text-red-300",
}

interface SidebarItem {
  title: string
  href: string
  icon: ReactNode
}

interface VesselDetailScreenProps {
  sidebarItems: SidebarItem[]
  allowReminderUpdates?: boolean
  showStatusControls?: boolean
}

export function VesselDetailScreen({
  sidebarItems,
  allowReminderUpdates = true,
  showStatusControls = false,
}: VesselDetailScreenProps) {
  const params = useParams()
  const { t } = useTranslation()
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat("fa-IR", options).format(value)
  const formatSignedNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    const formatted = formatNumber(Math.abs(value), options)
    if (value > 0) return `+${formatted}`
    if (value < 0) return `-${formatted}`
    return formatted
  }
  const formatInteger = (value: number) => formatNumber(value, { maximumFractionDigits: 0 })
  const formatCoordinate = (value: number) =>
    new Intl.NumberFormat("fa-IR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value)
  const formatDateTime = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" })
  }
  type MetricUnit = "percent" | "ton" | "minute"
  interface MetricNumeric {
    amount: number
    unit: MetricUnit
    signed?: boolean
    fractionDigits?: number
  }
  interface MetricEntry {
    label: string
    value?: MetricNumeric
    valueText?: string
    change?: MetricNumeric
    trend: "up" | "down" | "neutral"
    color: string
  }
  const formatMetricValue = (metric: MetricNumeric) => {
    const { amount, unit, signed, fractionDigits } = metric
    const options: Intl.NumberFormatOptions =
      unit === "minute"
        ? { maximumFractionDigits: 0 }
        : { minimumFractionDigits: fractionDigits ?? 1, maximumFractionDigits: fractionDigits ?? 1 }
    const formattedNumber = signed ? formatSignedNumber(amount, options) : formatNumber(amount, options)
    const unitLabel =
      unit === "percent" ? t("units.percent") : unit === "ton" ? t("units.ton") : t("units.minute")
    return unit === "percent" ? `${formattedNumber}${unitLabel}` : `${formattedNumber} ${unitLabel}`
  }
  const { toast } = useToast()
  const [vessel, setVessel] = useState<Vessel | null>(null)
  const [reminders, setReminders] = useState<VesselReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingReminderId, setUpdatingReminderId] = useState<string | null>(null)
  const [updatingVesselStatus, setUpdatingVesselStatus] = useState(false)

  useEffect(() => {
    loadVesselData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const loadVesselData = async () => {
    if (!params?.id) return
    setLoading(true)
    try {
      const [vesselData, reminderData] = await Promise.all([
        vesselsApi.getById(params.id as string),
        vesselRemindersApi.getByVesselId(params.id as string),
      ])
      setVessel(vesselData)
      setReminders(reminderData)
    } catch (error) {
      console.error("Failed to load vessel:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReminderStatusChange = async (reminderId: string, status: ReminderStatus) => {
    if (!allowReminderUpdates) return
    try {
      setUpdatingReminderId(reminderId)
      const updated = await vesselRemindersApi.setStatus(reminderId, status)
      if (updated) {
        setReminders((prev) => prev.map((item) => (item.id === reminderId ? updated : item)))
      }
    } catch (error) {
      console.error("Failed to update reminder status", error)
    } finally {
      setUpdatingReminderId(null)
    }
  }

  const refreshReminders = async () => {
    if (!params?.id) return
    setUpdatingReminderId("refresh")
    try {
      const data = await vesselRemindersApi.getByVesselId(params.id as string)
      setReminders(data)
    } finally {
      setUpdatingReminderId(null)
    }
  }

  const handleVesselStatusUpdate = async (status: Vessel["status"]) => {
    if (!showStatusControls || !vessel) return
    try {
      setUpdatingVesselStatus(true)
      const updated = await vesselsApi.updateStatus(vessel.id, status)
      if (updated) {
        setVessel(updated)
        toast({
          title: t("vessel.statusUpdated"),
          description: t(`vessels.status.${status}`),
        })
      }
    } catch (error) {
      console.error("Failed to update vessel status", error)
      toast({
        title: t("common.error"),
        description: t("vessel.statusUpdateError"),
        variant: "destructive",
      })
    } finally {
      setUpdatingVesselStatus(false)
    }
  }

  const reminderSummary = useMemo(() => {
    const open = reminders.filter((reminder) => reminder.status === "open").length
    const inProgress = reminders.filter((reminder) => reminder.status === "in_progress").length
    const completed = reminders.filter((reminder) => reminder.status === "completed").length

    const upcoming = reminders
      .filter((reminder) => reminder.dueDate && reminder.status !== "completed")
      .sort((a, b) => new Date(a.dueDate ?? "").getTime() - new Date(b.dueDate ?? "").getTime())[0] ?? null

    return { open, inProgress, completed, upcoming }
  }, [reminders])

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!vessel) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("vessels.notFound")}</p>
        </div>
      </DashboardLayout>
    )
  }

  const powerData = [
    { timestamp: "2020-07-02T00:00:00Z", actual: 95, nonCompliant: null },
    { timestamp: "2020-07-03T00:00:00Z", actual: 102, nonCompliant: null },
    { timestamp: "2020-07-04T00:00:00Z", actual: 98, nonCompliant: null },
    { timestamp: "2020-07-05T00:00:00Z", actual: 105, nonCompliant: null },
    { timestamp: "2020-07-06T00:00:00Z", actual: null, nonCompliant: 98 },
    {
      timestamp: "2020-07-07T00:00:00Z",
      actual: null,
      nonCompliant: 98,
      instruction: `${formatDateTime("2020-07-06T10:43:00Z")} - ${formatDateTime("2020-07-07T23:55:00Z")}`,
      constantPower: 98,
    },
    { timestamp: "2020-07-08T00:00:00Z", actual: null, nonCompliant: 110 },
    { timestamp: "2020-07-09T00:00:00Z", actual: 103, nonCompliant: null },
  ]

  const complianceEvents = [
    {
      id: "1",
      startTime: "2020-07-06T10:43:00Z",
      endTime: "2020-07-07T23:55:00Z",
      instruction: t("vessel.constantPowerInstruction", { power: formatNumber(98, { maximumFractionDigits: 0 }) }),
      constantPower: 98,
      type: "non-compliant" as const,
    },
    {
      id: "2",
      startTime: "2020-07-08T21:10:00Z",
      endTime: "2020-07-09T01:03:00Z",
      instruction: t("vessel.constantPowerInstruction", { power: formatNumber(110, { maximumFractionDigits: 0 }) }),
      constantPower: 110,
      type: "non-compliant" as const,
    },
  ]

  const weatherData = {
    timestamp: "3 June 2020 - 09:20",
    course: 83,
    beaufortScale: 4,
    douglasSeaScale: 5,
    airTemp: 19,
    seaTemp: 12,
    windSpeed: 17,
    windDirection: 349,
    waveHeight: 2,
    swellHeight: 1.3,
    swellDirection: 101,
    currentSpeed: 1.2,
    currentDirection: 270,
  }

  const performanceMetrics: MetricEntry[] = [
    {
      label: t("vessel.mainEngine"),
      value: { amount: 2, unit: "percent", signed: true, fractionDigits: 1 },
      change: { amount: 5.3, unit: "ton", signed: true, fractionDigits: 1 },
      trend: "up",
      color: "green",
    },
    {
      label: t("vessel.overallPerformance"),
      value: { amount: 4, unit: "percent", signed: true, fractionDigits: 1 },
      change: { amount: 7.9, unit: "ton", signed: true, fractionDigits: 1 },
      trend: "up",
      color: "green",
    },
    {
      label: t("vessel.weatherImpact"),
      value: { amount: 7, unit: "percent", signed: true, fractionDigits: 1 },
      change: { amount: 1.2, unit: "ton", signed: true, fractionDigits: 1 },
      trend: "up",
      color: "cyan",
    },
    {
      label: t("vessel.hullPropeller"),
      value: { amount: 1, unit: "percent", signed: true, fractionDigits: 1 },
      change: { amount: 1.9, unit: "ton", signed: true, fractionDigits: 1 },
      trend: "up",
      color: "orange",
    },
    {
      label: t("vessel.cipRisk"),
      valueText: t("vessel.noRisk"),
      change: { amount: 10, unit: "minute" },
      trend: "neutral",
      color: "gray",
    },
    {
      label: t("vessel.emissionRisk"),
      value: { amount: 3, unit: "percent", fractionDigits: 1 },
      change: { amount: -10.8, unit: "ton", signed: true, fractionDigits: 1 },
      trend: "down",
      color: "red",
    },
  ]

  const formatDate = (value?: string) => {
    if (!value) return t("reminders.noDueDate")
    try {
      return new Date(value).toLocaleDateString("fa-IR")
    } catch {
      return value
    }
  }

  const renderDueMeta = (value?: string) => {
    if (!value) return t("reminders.noDueDate")
    const diffDays = Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (Number.isNaN(diffDays)) return t("reminders.noDueDate")
    if (diffDays > 0) {
      return `${formatDate(value)} - ${t("reminders.remainingDays", { count: formatInteger(diffDays) })}`
    }
    if (diffDays === 0) {
      return `${formatDate(value)} - ${t("reminders.dueToday")}`
    }
    return `${formatDate(value)} - ${t("reminders.overdueDays", { count: formatInteger(Math.abs(diffDays)) })}`
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <Ship className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">{vessel.name}</h1>
              <Badge className={cn("text-xs", statusBadgeVariants[vessel.status])}>
                {t(`vessels.status.${vessel.status}`)}
              </Badge>
              {vessel.type && <Badge variant="outline">{t(`vessels.type.${vessel.type}`) ?? vessel.type}</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {vessel.imo && <span>IMO: {vessel.imo}</span>}
              {vessel.mmsi && <span>MMSI: {vessel.mmsi}</span>}
              {vessel.callSign && <span>{t("vessel.callSignLabel")}: {vessel.callSign}</span>}
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {vessel.currentLocation || vessel.homePort || t("vessel.unknownLocation")}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground md:items-end">
            <p>
              {t("vessel.ownerLabel")}:{" "}
              <span className="font-medium text-foreground">{vessel.ownerName}</span>
            </p>
            <p>
              {t("vessels.lastUpdate")}:{" "}
              {new Date(vessel.lastUpdate).toLocaleString("fa-IR")}
            </p>
            {showStatusControls && (
              <div className="flex flex-wrap gap-2 pt-1">
                {vessel.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleVesselStatusUpdate("approved")}
                      disabled={updatingVesselStatus}
                    >
                      {t("vessel.approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleVesselStatusUpdate("rejected")}
                      disabled={updatingVesselStatus}
                    >
                      {t("vessel.reject")}
                    </Button>
                  </>
                )}
                {(vessel.status === "approved" || vessel.status === "inactive") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVesselStatusUpdate("active")}
                    disabled={updatingVesselStatus}
                  >
                    {t("vessel.activate")}
                  </Button>
                )}
                {vessel.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVesselStatusUpdate("inactive")}
                    disabled={updatingVesselStatus}
                  >
                    {t("vessel.markInactive")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="overview">{t("vessel.overview")}</TabsTrigger>
            <TabsTrigger value="performance">{t("vessel.performance")}</TabsTrigger>
            <TabsTrigger value="compliance">{t("vessel.compliance")}</TabsTrigger>
            <TabsTrigger value="weather">{t("vessel.weather")}</TabsTrigger>
            <TabsTrigger value="reminders">{t("vessel.remindersTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("vessel.keyFacts")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessels.form.type")}</p>
                      <p className="font-medium">{t(`vessels.type.${vessel.type}`) ?? vessel.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessels.form.flag")}</p>
                      <p className="font-medium">{vessel.flag ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessel.homePort")}</p>
                      <p className="font-medium">{vessel.homePort ?? t("vessel.unknownLocation")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessels.form.currentLocation")}</p>
                      <p className="font-medium">{vessel.currentLocation ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessels.form.yearBuilt")}</p>
                      <p className="font-medium">{vessel.yearBuilt ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessels.form.dwt")}</p>
                      <p className="font-medium">
                        {typeof vessel.dwt === "number" ? `${formatNumber(vessel.dwt)} ${t("units.ton")}` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessel.grossTonnage")}</p>
                      <p className="font-medium">
                        {typeof vessel.grossTonnage === "number"
                          ? `${formatNumber(vessel.grossTonnage)} ${t("units.grossTon")}`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessel.crewCapacity")}</p>
                      <p className="font-medium">
                        {typeof vessel.crewCapacity === "number" ? formatInteger(vessel.crewCapacity) : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessel.fuelType")}</p>
                      <p className="font-medium">{vessel.fuelType ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessel.classSociety")}</p>
                      <p className="font-medium">{vessel.classSociety ?? "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t("vessel.healthSnapshot")}</CardTitle>
                  <Badge variant="outline">
                    {t("vessel.overallScore")}: {vessel.healthProfile?.overallScore ?? "—"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vessel.healthProfile ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {(["hull", "machinery", "navigation", "safety"] as const).map((area) => (
                        <div key={area} className="rounded-lg border p-4">
                          <p className="text-sm text-muted-foreground">{t(`vessel.health.${area}`)}</p>
                          <p className={cn("text-lg font-semibold capitalize", healthStatusClasses[vessel.healthProfile?.[area]])}>
                            {t(`vessel.healthStatus.${vessel.healthProfile?.[area]}`)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">{t("vessel.noHealthData")}</p>
                  )}
                  {vessel.healthProfile?.notes && (
                    <div className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                      {vessel.healthProfile.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t("vessel.certificates")}</CardTitle>
                  <Badge variant="outline">
                    {formatInteger(vessel.documents?.length ?? 0)} {t("vessel.totalDocuments")}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vessel.documents?.length ? (
                    vessel.documents.map((document) => (
                      <div key={document.id} className="rounded-lg border p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold">{document.title}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {t(`vessel.documentType.${document.type}`)}
                            </p>
                          </div>
                          <Badge className={cn("text-xs", reminderStatusClasses[document.status === "valid" ? "completed" : document.status === "expiring" ? "in_progress" : "open"])}>
                            {t(`vessel.documentStatus.${document.status}`)}
                          </Badge>
                        </div>
                        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                          {document.issueDate && (
                            <span>
                              {t("vessel.issueDate")}: {formatDate(document.issueDate)}
                            </span>
                          )}
                          {document.expiryDate && (
                            <span>
                              {t("vessel.expiryDate")}: {formatDate(document.expiryDate)}
                            </span>
                          )}
                          {document.issuer && <span>{t("vessel.issuer")}: {document.issuer}</span>}
                          {document.reference && <span>{t("vessel.reference")}: {document.reference}</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("vessel.noDocuments")}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("vessel.operationalMilestones")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessel.lastInspection")}</p>
                      <p className="font-medium">{formatDate(vessel.lastInspection)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessel.nextInspection")}</p>
                      <p className="font-medium">{formatDate(vessel.nextInspection)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessel.nextDryDock")}</p>
                      <p className="font-medium">{formatDate(vessel.nextDryDock)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vessels.position")}</p>
                      <p className="font-medium">
                        {`${formatCoordinate(vessel.position.lat)}، ${formatCoordinate(vessel.position.lng)}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {performanceMetrics.map((metric, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">
                          {metric.value ? formatMetricValue(metric.value) : metric.valueText ?? "-"}
                        </p>
                        {metric.change && (
                          <p className="text-sm text-muted-foreground">{formatMetricValue(metric.change)}</p>
                        )}
                      </div>
                      {metric.trend === "up" && <TrendingUp className={`w-6 h-6 text-${metric.color}-500`} />}
                      {metric.trend === "down" && <TrendingDown className={`w-6 h-6 text-${metric.color}-500`} />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{t("vessel.powerProfile")}</CardTitle>
              </CardHeader>
              <CardContent>
                <PowerChart data={powerData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("vessel.complianceHistory")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ComplianceTimeline events={complianceEvents} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weather">
            <WeatherCard data={weatherData} />
          </TabsContent>

          <TabsContent value="reminders" className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">{t("vessel.remindersSummary.open")}</p>
                  <p className="text-lg font-bold">{formatInteger(reminderSummary.open)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <RefreshCcw className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">{t("vessel.remindersSummary.inProgress")}</p>
                  <p className="text-lg font-bold">{formatInteger(reminderSummary.inProgress)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">{t("vessel.remindersSummary.completed")}</p>
                  <p className="text-lg font-bold">{formatInteger(reminderSummary.completed)}</p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {reminderSummary.upcoming ? (
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">
                      {t("vessel.remindersSummary.nextDue")}: {reminderSummary.upcoming.title}
                    </p>
                    <p className="text-muted-foreground">{renderDueMeta(reminderSummary.upcoming.dueDate)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("reminders.noUpcoming")}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshReminders}
                  disabled={updatingReminderId === "refresh"}
                >
                  {updatingReminderId === "refresh" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="mr-2 h-4 w-4" />
                  )}
                  {t("reminders.refresh")}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {reminders.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    {t("reminders.emptyState")}
                  </CardContent>
                </Card>
              ) : (
                reminders.map((reminder) => (
                  <Card key={reminder.id} className="border-l-4 border-l-primary">
                    <CardContent className="py-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={cn("text-xs", reminderStatusClasses[reminder.status])}>
                              {t(`reminders.status.${reminder.status}`)}
                            </Badge>
                            <Badge variant="outline" className={cn("text-xs", reminderPriorityClasses[reminder.priority])}>
                              {t(`reminders.priority.${reminder.priority}`)}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {t(`reminders.category.${reminder.category}`)}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold">{reminder.title}</h3>
                          {reminder.description && (
                            <p className="text-sm text-muted-foreground max-w-2xl">{reminder.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {renderDueMeta(reminder.dueDate)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("reminders.lastUpdated")}:{" "}
                            {new Date(reminder.updatedAt).toLocaleString("fa-IR")}
                          </p>
                        </div>
                        {allowReminderUpdates && (
                          <div className="flex flex-col gap-2 md:min-w-[220px]">
                            {reminder.status !== "completed" && (
                              <Button
                                size="sm"
                                onClick={() => handleReminderStatusChange(reminder.id, "completed")}
                                disabled={updatingReminderId === reminder.id}
                              >
                                {updatingReminderId === reminder.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                )}
                                {t("reminders.markComplete")}
                              </Button>
                            )}
                            {reminder.status === "open" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReminderStatusChange(reminder.id, "in_progress")}
                                disabled={updatingReminderId === reminder.id}
                              >
                                {t("reminders.markInProgress")}
                              </Button>
                            )}
                            {reminder.status !== "open" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReminderStatusChange(reminder.id, "open")}
                                disabled={updatingReminderId === reminder.id}
                              >
                                {t("reminders.reopen")}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
