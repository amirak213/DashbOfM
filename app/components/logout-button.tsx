"use client"

import { useRouter } from "next/navigation"
import { authService } from "@/app/services/auth-service"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    console.log("Logout button clicked")
    authService.logout()
    
    // Force reload pour s'assurer que tout est reset
    window.location.href = "/login"
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
    >
      Sign Out
    </button>
  )
}