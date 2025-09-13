"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { EndpointTester } from "@/components/endpoint-tester"

export default function TestPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">API Testing</h1>
        </div>
        <EndpointTester />
      </div>
    </DashboardLayout>
  )
}