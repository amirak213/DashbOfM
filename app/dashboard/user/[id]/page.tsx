"use client"

import { UserDetails } from "@/components/user-details"

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const { id } = params

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">User Details: {id}</h1>
      </div>
      <UserDetails userId={id} />
    </div>
  )
}