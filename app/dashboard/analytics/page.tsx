"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DailyAnalytics } from "@/components/daily-analytics"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        </div>
        <DailyAnalytics />
      </div>
    </DashboardLayout>
  )
}