"use client"

import { Line, LineChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/hooks/use-translation"

interface PowerDataPoint {
  timestamp: string
  actual: number | null
  nonCompliant: number | null
  instruction?: string
  constantPower?: number
}

interface PowerChartProps {
  data: PowerDataPoint[]
  title?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  t: (key: string, params?: Record<string, string | number>) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  formatDateTime: (value: string) => string
}

function CustomTooltip({ active, payload, t, formatNumber, formatDateTime }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-1">{formatDateTime(data.timestamp)}</p>
        {data.actual !== null && (
          <p className="text-sm text-blue-600">
            {t("vessel.powerActual")}: <span className="font-bold">{formatNumber(data.actual, { maximumFractionDigits: 0 })} {t("units.kilowatt")}</span>
          </p>
        )}
        {data.instruction && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-sm font-medium">{t("compliance.instruction")}:</p>
            <p className="text-sm text-muted-foreground">{data.instruction}</p>
            {typeof data.constantPower === "number" && (
              <p className="text-sm font-bold mt-1">
                {t("vessel.constantPowerInstruction", {
                  power: formatNumber(data.constantPower, { maximumFractionDigits: 0 }),
                })}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
  return null
}

export function PowerChart({ data, title }: PowerChartProps) {
  const { t } = useTranslation()
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat("fa-IR", options).format(value)
  const formatDateTick = (value: string) => {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleDateString("fa-IR", { day: "numeric", month: "short" })
  }
  const formatDateTime = (value: string) => {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" })
  }
  const chartTitle = title ?? t("vessel.powerProfile")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} tickFormatter={formatDateTick} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatNumber(value as number, { maximumFractionDigits: 0 })}
            />
            <Tooltip
              content={(props) => (
                <CustomTooltip
                  {...props}
                  t={t}
                  formatNumber={formatNumber}
                  formatDateTime={formatDateTime}
                />
              )}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              name={t("vessel.powerActual")}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="nonCompliant"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: "#ef4444", r: 4 }}
              name={t("vessel.powerLimit")}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
