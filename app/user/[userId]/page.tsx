"use client"

import { UserDetails } from "@/components/user-details"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, LayoutDashboard } from "lucide-react"

interface PageProps {
  params: {
    userId: string
  }
}

export default function UserDetailPage({ params }: PageProps) {
  const userId = decodeURIComponent(params.userId)

  console.log("✅ UserDetailPage rendered!")
  console.log("📍 User ID:", userId)
  console.log("📍 Current URL:", typeof window !== "undefined" ? window.location.href : "SSR")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple */}
      <div className="border-b bg-white">
        <div className="flex h-16 items-center px-4 md:px-6 gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold">User Details</h1>
            <p className="text-sm text-muted-foreground">ID: {userId}</p>
          </div>

          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4 md:p-6">
        <UserDetails userId={userId} />
      </div>
    </div>
  )
}