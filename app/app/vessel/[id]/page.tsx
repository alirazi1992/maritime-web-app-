"use client"

import { clientNavItems } from "@/lib/config/navigation"
import { VesselDetailScreen } from "@/components/vessels/vessel-detail-screen"

export default function ClientVesselDetailPage() {
  return <VesselDetailScreen sidebarItems={clientNavItems} allowReminderUpdates />
}
