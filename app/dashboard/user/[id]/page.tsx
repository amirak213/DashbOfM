"use client"

import { UserDetails } from "@/components/user-details"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function UserDetailPage({ params }: { params: { userId: string } }) {
  const { userId } = params

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/sessions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">User Details: {userId}</h1>
      </div>
      <UserDetails userId={userId} />
    </div>
  )
}
