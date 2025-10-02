"use client"

import { ActiveSessionsTable } from "@/components/active-sessions-table"

export default function SessionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>
      </div>
      <ActiveSessionsTable />
    </div>
  )
}
