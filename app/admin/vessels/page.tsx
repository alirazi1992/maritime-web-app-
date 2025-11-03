"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Check, X, Eye } from "lucide-react"
import { vesselsApi } from "@/lib/api/vessels"
import { adminNavItems } from "@/lib/config/navigation"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/hooks/use-translation"
import type { Vessel } from "@/lib/types"
import { VesselFormDialog } from "@/components/vessels/vessel-form-dialog"

export default function AdminVesselsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null)

  const loadVessels = useCallback(async () => {
    setLoading(true)
    try {
      const data = await vesselsApi.getAll()
      setVessels(data)
    } catch (error) {
      console.error("Error loading vessels:", error)
      toast({
        title: t("common.error"),
        description: t("vessels.loadError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  useEffect(() => {
    void loadVessels()
  }, [loadVessels])

  const handleApprove = async (id: string) => {
    try {
      await vesselsApi.updateStatus(id, "approved")
      toast({
        title: t("vessel.statusUpdated"),
        description: t("vessels.status.approved"),
      })
      loadVessels()
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("vessel.statusUpdateError"),
        variant: "destructive",
      })
    }
  }

  const handleReject = async (id: string) => {
    try {
      await vesselsApi.updateStatus(id, "rejected")
      toast({
        title: t("vessel.statusUpdated"),
        description: t("vessels.status.rejected"),
      })
      loadVessels()
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("vessel.statusUpdateError"),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t("vessels.deleteConfirm"))) return

    try {
      await vesselsApi.delete(id)
      toast({
        title: t("common.success"),
        description: t("vessels.deleteSuccess"),
      })
      loadVessels()
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("vessels.deleteError"),
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout sidebarItems={adminNavItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("vessels.vesselDetails")}</h1>
            <p className="text-muted-foreground">{t("vessels.adminOverviewHint")}</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("vessels.addVessel")}
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("vessels.vesselName")}</TableHead>
                  <TableHead>{t("vessels.vesselType")}</TableHead>
                  <TableHead>{t("vessels.owner")}</TableHead>
                  <TableHead>{t("vessels.statusLabel")}</TableHead>
                  <TableHead>{t("vessels.speed")}</TableHead>
                  <TableHead>{t("vessel.lastInspection")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vessels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      {t("common.noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  vessels.map((vessel) => (
                    <TableRow key={vessel.id}>
                      <TableCell className="font-medium">{vessel.name}</TableCell>
                      <TableCell>{t(`vessels.type.${vessel.type}`) ?? vessel.type}</TableCell>
                      <TableCell>{vessel.ownerName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
                          {t(`vessels.status.${vessel.status}`)}
                        </span>
                      </TableCell>
                      <TableCell>{vessel.speed} {t("vessels.knotsUnit")}</TableCell>
                      <TableCell>
                        {vessel.lastInspection
                          ? new Date(vessel.lastInspection).toLocaleDateString("fa-IR")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {vessel.status === "pending" && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleApprove(vessel.id)}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleReject(vessel.id)}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/admin/vessels/${vessel.id}`)}
                            aria-label={t("vessels.viewDetails")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingVessel(vessel)
                              setDialogOpen(true)
                            }}
                            aria-label={t("common.edit")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(vessel.id)}
                            aria-label={t("common.delete")}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <VesselFormDialog
        mode="admin"
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingVessel(null)
        }}
        vessel={editingVessel}
        onSuccess={loadVessels}
      />
    </DashboardLayout>
  )
}
