"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import DashboardStats from "@/components/dashboard-stats"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <DashboardStats />
      </div>
    </DashboardLayout>
  )
}
