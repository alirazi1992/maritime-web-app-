"use client"

import { adminNavItems } from "@/lib/config/navigation"
import { VesselDetailScreen } from "@/components/vessels/vessel-detail-screen"

export default function AdminVesselDetailPage() {
  return <VesselDetailScreen sidebarItems={adminNavItems} allowReminderUpdates showStatusControls />
}
