import type { ReminderStatus, VesselReminder } from "@/lib/types"
import { getFromStorage, saveToStorage } from "./storage"

const STORAGE_KEY = "maritime_vessel_reminders"

const seedReminders: VesselReminder[] = [
  {
    id: "r1",
    vesselId: "v1",
    title: "تمدید گواهی مدیریت ایمنی",
    description: "گواهی به‌زودی منقضی می‌شود. مدارک تمدید را به سازمان ایمنی دریایی ارسال کنید.",
    category: "license",
    status: "open",
    priority: "high",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    relatedDocumentId: "d2",
  },
  {
    id: "r2",
    vesselId: "v1",
    title: "برگزاری مانور تجهیزات نجات",
    description: "مانور کامل خدمه را پیش از ورود به بندر بعدی اجرا و صورتجلسه کنید.",
    category: "safety",
    status: "in_progress",
    priority: "medium",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "r3",
    vesselId: "v2",
    title: "هماهنگی برای بازرسی پوشش بدنه",
    description: "با تیم داک خشک برای ارزیابی وضعیت پوشش بدنه هماهنگ شوید.",
    category: "maintenance",
    status: "open",
    priority: "medium",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "r4",
    vesselId: "v3",
    title: "ارسال مدارک تمدید ترخیص بندر",
    description: "مانیفست بار و گزارش‌های بازرسی به‌روزرسانی‌شده را برای تمدید ترخیص ارسال کنید.",
    category: "document",
    status: "open",
    priority: "high",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
    relatedDocumentId: "d5",
  },
  {
    id: "r5",
    vesselId: "v3",
    title: "تمدید گواهی‌های پزشکی خدمه",
    description: "گواهی‌های پزشکی در حال انقضای خدمه را پیش از بازرسی منطقه‌ای تمدید کنید.",
    category: "health",
    status: "in_progress",
    priority: "high",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 35).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
]

const getAllReminders = (): VesselReminder[] => {
  return getFromStorage<VesselReminder[]>(STORAGE_KEY, seedReminders)
}

const persistReminders = (reminders: VesselReminder[]) => {
  saveToStorage(STORAGE_KEY, reminders)
}

export const vesselRemindersApi = {
  getAll: async (): Promise<VesselReminder[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return getAllReminders()
  },

  getByVesselId: async (vesselId: string): Promise<VesselReminder[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return getAllReminders().filter((reminder) => reminder.vesselId === vesselId)
  },

  create: async (reminder: Omit<VesselReminder, "id" | "createdAt" | "updatedAt">): Promise<VesselReminder> => {
    await new Promise((resolve) => setTimeout(resolve, 250))
    const reminders = getAllReminders()
    const newReminder: VesselReminder = {
      ...reminder,
      id: `r${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    reminders.push(newReminder)
    persistReminders(reminders)
    return newReminder
  },

  update: async (id: string, updates: Partial<VesselReminder>): Promise<VesselReminder | null> => {
    await new Promise((resolve) => setTimeout(resolve, 250))
    const reminders = getAllReminders()
    const index = reminders.findIndex((reminder) => reminder.id === id)
    if (index === -1) return null

    reminders[index] = {
      ...reminders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    persistReminders(reminders)
    return reminders[index]
  },

  setStatus: async (id: string, status: ReminderStatus): Promise<VesselReminder | null> => {
    return vesselRemindersApi.update(id, { status })
  },

  delete: async (id: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const reminders = getAllReminders()
    const filtered = reminders.filter((reminder) => reminder.id !== id)
    if (filtered.length === reminders.length) return false
    persistReminders(filtered)
    return true
  },
}
