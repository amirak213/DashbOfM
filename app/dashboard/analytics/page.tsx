"use client"

import { DailyAnalytics } from "@/components/daily-analytics"

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">📈 Analytics</h1>
      </div>

      <DailyAnalytics />

    </div>
  )
}
