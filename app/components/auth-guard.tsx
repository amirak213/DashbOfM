"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService } from "@/app/services/auth-service"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const timer = setTimeout(() => {
      const authenticated = authService.isAuthenticated()

      console.log("AuthGuard check:", { pathname, authenticated })

      // Si on est sur une page protégée sans auth, rediriger vers login
      if (!authenticated && pathname.startsWith("/dashboard")) {
        console.log("Redirecting to login - not authenticated on protected route")
        router.push("/login")
      }
      // Si on est authentifié sur la page de login, rediriger vers dashboard
      else if (authenticated && pathname === "/login") {
        console.log("Redirecting to dashboard - already authenticated")
        router.push("/dashboard")
      }

      setIsInitialized(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [router, pathname])

  // Ne pas afficher le loading sur la page de login
  if (!isInitialized && pathname !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
