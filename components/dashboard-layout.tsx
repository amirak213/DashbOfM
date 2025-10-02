"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, LayoutDashboard, LogOut, Users, Activity, Menu, TestTube } from "lucide-react"
import { authService } from "@/app/services/auth-service"
import { useTranslation } from "react-i18next"
import LanguageSwitcher from "@/components/LanguageSwitcher"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

/* ---------------- LOGO ---------------- */
export function LogoInstantM() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
      <div className="flex items-center">
        {/* Texte L'INSTANT */}
        <h1 className="instant-text text-xl md:text-2xl mr-3">CHATBOT</h1>

        {/* Cercle avec M */}
        <div className="m-circle relative w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center">
          <span className="text-blue-400 font-bold text-lg md:text-xl">M</span>
          {/* Cercle animé */}
          <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-[spin_6s_linear_infinite]"></div>
        </div>
      </div>

      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap");

        .instant-text {
          font-family: "Patrick Hand", cursive;
          font-weight: 400;
          color: #29bde0;
          letter-spacing: 0.15em;
        }
      `}</style>
    </Link>
  )
}

/* ---------------- DASHBOARD LAYOUT ---------------- */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  const navigation = [
    { name: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("users"), href: "/dashboard/users", icon: Users },
    { name: t("sessions"), href: "/dashboard/sessions", icon: Activity },
    { name: t("analytics"), href: "/dashboard/analytics", icon: BarChart3 },
    { name: "API Test", href: "/dashboard/test", icon: TestTube },
  ]

  const handleLogout = () => {
    console.log("Logout initiated from dashboard layout")
    authService.logout()
    window.location.href = "/login"
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 md:px-6">
          {/* Logo à gauche */}
          <LogoInstantM />

          {/* Menu mobile */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden ml-2 bg-transparent">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <nav className="grid gap-2 text-lg font-medium">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent",
                      pathname === item.href ? "bg-accent" : "transparent",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Navigation desktop */}
          <nav className="ml-auto hidden gap-2 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent",
                  pathname === item.href ? "bg-accent" : "transparent",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Language switcher and logout buttons container */}
          <div className="ml-4 flex items-center gap-3">
            <div className="flex items-center">
              <LanguageSwitcher />
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 md:p-6">{children}</div>
    </div>
  )
}
