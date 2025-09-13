"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/app/services/auth-service"

export default function Home() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      if (authService.isAuthenticated()) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
      setIsChecking(false)
    }

    checkAuthAndRedirect()
  }, [router])

  if (isChecking) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </main>
    )
  }

  return null
}