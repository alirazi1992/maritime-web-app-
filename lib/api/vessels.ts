import type { Vessel } from "@/lib/types"
import { getFromStorage, saveToStorage } from "./storage"

const STORAGE_KEY = "maritime_vessels"

// Initial seed data enriched with detailed vessel information
const seedVessels: Vessel[] = [
  {
    id: "v1",
    name: "تاجر هرمز",
    type: "cargo",
    ownerId: "2",
    ownerName: "گروه دریایی پارسیان",
    status: "active",
    position: { lat: 27.1865, lng: 56.2808 },
    speed: 12.5,
    heading: 45,
    lastUpdate: new Date().toISOString(),
    imo: "9234567",
    mmsi: "422123456",
    callSign: "EPAA",
    flag: "IR",
    length: 180,
    beam: 28,
    draft: 9.5,
    homePort: "بندرعباس",
    currentLocation: "خلیج فارس - تنگه هرمز",
    yearBuilt: 2008,
    dwt: 32000,
    grossTonnage: 21000,
    crewCapacity: 24,
    fuelType: "سوخت کم‌سولفور",
    classSociety: "کلاس آی‌آر",
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    nextInspection: new Date(Date.now() + 1000 * 60 * 60 * 24 * 150).toISOString(),
    nextDryDock: new Date(Date.now() + 1000 * 60 * 60 * 24 * 320).toISOString(),
    documents: [
      {
        id: "d1",
        title: "گواهی کلاس",
        type: "certificate",
        status: "valid",
        issueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 165).toISOString(),
        issuer: "کلاس آی‌آر",
        reference: "IR-CLASS-2024-001",
      },
      {
        id: "d2",
        title: "گواهی مدیریت ایمنی",
        type: "safety",
        status: "expiring",
        issueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 340).toISOString(),
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25).toISOString(),
        issuer: "سازمان ایمنی دریایی",
        reference: "MSA-4421-B",
      },
    ],
    healthProfile: {
      hull: "good",
      machinery: "good",
      navigation: "excellent",
      safety: "attention",
      overallScore: 82,
      notes: "بازرسی تجهیزات نجات در بندر بعدی برنامه‌ریزی شده است.",
    },
  },
  {
    id: "v2",
    name: "پیمایشگر خوزستان",
    type: "tanker",
    ownerId: "2",
    ownerName: "گروه دریایی پارسیان",
    status: "active",
    position: { lat: 26.5, lng: 55.8 },
    speed: 8.2,
    heading: 180,
    lastUpdate: new Date().toISOString(),
    imo: "9345678",
    mmsi: "422234567",
    callSign: "EPBB",
    flag: "IR",
    length: 250,
    beam: 42,
    draft: 15,
    homePort: "بوشهر",
    currentLocation: "خلیج فارس - لنگرگاه صادراتی",
    yearBuilt: 2012,
    dwt: 105000,
    grossTonnage: 60000,
    crewCapacity: 32,
    fuelType: "سوخت بسیار کم‌سولفور",
    classSociety: "ال‌آر",
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    nextInspection: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
    nextDryDock: new Date(Date.now() + 1000 * 60 * 60 * 24 * 420).toISOString(),
    documents: [
      {
        id: "d3",
        title: "گواهی بین‌المللی پیشگیری از آلودگی نفتی",
        type: "inspection",
        status: "valid",
        issueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 265).toISOString(),
        issuer: "رجیستر لویدز",
        reference: "LR-IOPP-8822",
      },
      {
        id: "d4",
        title: "گواهی‌های پزشکی خدمه",
        type: "other",
        status: "expiring",
        issueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 320).toISOString(),
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
        issuer: "وزارت بهداشت ایران",
        reference: "IMH-CREW-5561",
      },
    ],
    healthProfile: {
      hull: "attention",
      machinery: "good",
      navigation: "good",
      safety: "good",
      overallScore: 76,
      notes: "توصیه می‌شود پوشش بدنه در نخستین فرصت داک خشک ترمیم شود.",
    },
  },
  {
    id: "v3",
    name: "نسیم خزر",
    type: "cargo",
    ownerId: "2",
    ownerName: "گروه دریایی پارسیان",
    status: "pending",
    position: { lat: 27.5, lng: 56.5 },
    speed: 0,
    heading: 0,
    lastUpdate: new Date().toISOString(),
    imo: "9456789",
    mmsi: "422345678",
    callSign: "EPCC",
    flag: "IR",
    length: 150,
    beam: 24,
    draft: 8,
    homePort: "خرمشهر",
    currentLocation: "بندر - در انتظار ترخیص",
    yearBuilt: 2019,
    dwt: 18000,
    grossTonnage: 12500,
    crewCapacity: 18,
    fuelType: "گازوئیل دریایی",
    classSociety: "کلاس آی‌آر",
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    nextInspection: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
    nextDryDock: new Date(Date.now() + 1000 * 60 * 60 * 24 * 500).toISOString(),
    documents: [
      {
        id: "d5",
        title: "مجوز ترخیص بندر",
        type: "license",
        status: "expired",
        issueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 390).toISOString(),
        expiryDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        issuer: "اداره بندر خرمشهر",
      },
    ],
    healthProfile: {
      hull: "good",
      machinery: "excellent",
      navigation: "good",
      safety: "attention",
      overallScore: 80,
      notes: "مدارک مانورهای ایمنی برای تأیید نهایی ارسال شود.",
    },
  },
]

export const vesselsApi = {
  getAll: async (): Promise<Vessel[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return getFromStorage(STORAGE_KEY, seedVessels)
  },

  getById: async (id: string): Promise<Vessel | null> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const vessels = getFromStorage<Vessel[]>(STORAGE_KEY, seedVessels)
    return vessels.find((v) => v.id === id) || null
  },

  getByOwnerId: async (ownerId: string): Promise<Vessel[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const vessels = getFromStorage<Vessel[]>(STORAGE_KEY, seedVessels)
    return vessels.filter((v) => v.ownerId === ownerId)
  },

  create: async (vessel: Omit<Vessel, "id" | "lastUpdate">): Promise<Vessel> => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    const vessels = getFromStorage<Vessel[]>(STORAGE_KEY, seedVessels)
    const newVessel: Vessel = {
      ...vessel,
      id: `v${Date.now()}`,
      lastUpdate: new Date().toISOString(),
      documents: vessel.documents ?? [],
      healthProfile: vessel.healthProfile,
      currentLocation: vessel.currentLocation ?? vessel.homePort,
    }
    vessels.push(newVessel)
    saveToStorage(STORAGE_KEY, vessels)
    return newVessel
  },

  update: async (id: string, updates: Partial<Vessel>): Promise<Vessel | null> => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    const vessels = getFromStorage<Vessel[]>(STORAGE_KEY, seedVessels)
    const index = vessels.findIndex((v) => v.id === id)
    if (index === -1) return null

    vessels[index] = {
      ...vessels[index],
      ...updates,
      documents: updates.documents ?? vessels[index].documents ?? [],
      healthProfile: updates.healthProfile ?? vessels[index].healthProfile,
      currentLocation: updates.currentLocation ?? vessels[index].currentLocation ?? vessels[index].homePort,
      lastUpdate: new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEY, vessels)
    return vessels[index]
  },

  delete: async (id: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const vessels = getFromStorage<Vessel[]>(STORAGE_KEY, seedVessels)
    const filtered = vessels.filter((v) => v.id !== id)
    if (filtered.length === vessels.length) return false
    saveToStorage(STORAGE_KEY, filtered)
    return true
  },

  updateStatus: async (id: string, status: Vessel["status"]): Promise<Vessel | null> => {
    return vesselsApi.update(id, { status })
  },
}
