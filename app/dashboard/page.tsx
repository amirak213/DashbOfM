"use client"

import DashboardStats from "@/components/dashboard-stats"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, ChevronDown } from "lucide-react"
import { authService } from "@/app/services/auth-service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function DashboardPage() {
  const { t } = useTranslation()
  const [showWelcome, setShowWelcome] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await authService.getCurrentUser()
        setCurrentUserRole(user?.role || null)
      } catch (error) {
        console.error("Failed to get current user:", error)
      }
    }
    getCurrentUser()
  }, [])

  const isAdmin = currentUserRole === "admin"

  const fetchAllExportData = async () => {
    try {
      const [usersData, dailyAnalyticsData, dashboardStats] = await Promise.all([
        authService.get("/dashboard/users?limit=1000&offset=0"),
        authService.get("/dashboard/analytics/daily"),
        authService.get("/dashboard/stats"),
      ])

      const userSessionsData: any[] = []
      for (const user of usersData.slice(0, 50)) {
        try {
          const sessions = await authService.get(`/dashboard/user/${user.user_id}/sessions`)
          userSessionsData.push(
            ...sessions.map((session: any) => ({
              ...session,
              user_id: user.user_id,
            })),
          )
        } catch (error) {
          console.error(`Failed to fetch sessions for user ${user.user_id}:`, error)
        }
      }

      return { usersData, dailyAnalyticsData, dashboardStats, userSessionsData }
    } catch (error) {
      console.error("Error fetching export data:", error)
      throw error
    }
  }

  const handleDownloadCSV = async () => {
    if (isExporting) return

    setIsExporting(true)
    try {
      const { usersData, dailyAnalyticsData, dashboardStats, userSessionsData } = await fetchAllExportData()

      let csvContent = "\uFEFF"

      csvContent += "USERS DATA\n"
      csvContent +=
        "User ID\tUser Type\tTotal Sessions\tTotal Messages\tFirst Seen\tLast Seen\tCommon Intent\tLanguages Used\n"
      usersData.forEach((user: any) => {
        const languages = user.languages_used ? user.languages_used.join("; ") : ""
        const userId = String(user.user_id || "").replace(/\t/g, " ")
        const userType = String(user.user_type || "").replace(/\t/g, " ")
        const intent = String(user.most_common_intent || "").replace(/\t/g, " ")

        csvContent += `${userId}\t${userType}\t${user.total_sessions}\t${user.total_messages}\t${user.first_seen || ""}\t${user.last_seen || ""}\t${intent}\t${languages}\n`
      })

      csvContent += "\n\n"

      csvContent += "DAILY ANALYTICS DATA\n"
      csvContent += "Date\tNew Users\tActive Users\tSessions\tMessages\n"
      if (dailyAnalyticsData.daily_analytics) {
        dailyAnalyticsData.daily_analytics.forEach((day: any) => {
          csvContent += `${day.date}\t${day.new_users}\t${day.active_users}\t${day.sessions}\t${day.messages}\n`
        })
      }

      csvContent += "\n\n"

      csvContent += "USER SESSIONS DATA\n"
      csvContent +=
        "Session ID\tUser ID\tCreated At\tLast Active\tMessage Count\tDuration (min)\tUser Type\tDetected Intents\n"
      userSessionsData.forEach((session: any) => {
        const intents = session.detected_intents ? session.detected_intents.join("; ") : ""
        const sessionId = String(session.session_id || "").replace(/\t/g, " ")
        const userId = String(session.user_id || "").replace(/\t/g, " ")
        const userType = String(session.user_type || "").replace(/\t/g, " ")

        csvContent += `${sessionId}\t${userId}\t${session.created_at || ""}\t${session.last_active || ""}\t${session.message_count || 0}\t${session.duration_minutes || 0}\t${userType}\t${intents}\n`
      })

      csvContent += "\n\n"

      csvContent += "DASHBOARD STATS SUMMARY\n"
      csvContent += "Metric\tValue\n"
      csvContent += `Total Users\t${dashboardStats.total_users}\n`
      csvContent += `Active Users Today\t${dashboardStats.active_users_today}\n`
      csvContent += `Active Users Week\t${dashboardStats.active_users_week}\n`
      csvContent += `Total Sessions\t${dashboardStats.total_sessions}\n`
      csvContent += `Total Messages\t${dashboardStats.total_messages}\n`
      csvContent += `Avg Messages Per Session\t${dashboardStats.avg_messages_per_session}\n`

      csvContent += "\n\n"

      if (dashboardStats.user_types_distribution) {
        csvContent += "USER TYPES DISTRIBUTION\n"
        csvContent += "User Type\tCount\n"
        Object.entries(dashboardStats.user_types_distribution).forEach(([type, count]) => {
          csvContent += `${type}\t${count}\n`
        })
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `chatbot-data-export-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alert("Fichier CSV téléchargé avec succès!")
    } catch (error) {
      console.error("Error generating CSV:", error)
      alert(
        "Erreur lors de la génération du fichier CSV: " + (error instanceof Error ? error.message : "Erreur inconnue"),
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadExcel = async () => {
    if (isExporting) return

    setIsExporting(true)
    try {
      const { usersData, dailyAnalyticsData, dashboardStats, userSessionsData } = await fetchAllExportData()

      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11pt; }
            th, td { border: 1px solid #cccccc; padding: 8px 12px; text-align: left; white-space: nowrap; }
            th { background-color: #4472C4; color: white; font-weight: bold; text-align: center; }
            .section-header { background-color: #29C2E2; color: white; font-weight: bold; font-size: 14pt; text-align: center; padding: 12px; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            tr:hover { background-color: #f0f0f0; }
            .number { text-align: right; }
          </style>
        </head>
        <body>
          <table>
            <tr><th colspan="8" class="section-header">📊 USERS DATA</th></tr>
            <tr><th>User ID</th><th>User Type</th><th>Total Sessions</th><th>Total Messages</th><th>First Seen</th><th>Last Seen</th><th>Common Intent</th><th>Languages Used</th></tr>
      `

      usersData.forEach((user: any) => {
        const languages = user.languages_used ? user.languages_used.join("; ") : ""
        htmlContent += `<tr><td>${user.user_id || ""}</td><td>${user.user_type || ""}</td><td class="number">${user.total_sessions || 0}</td><td class="number">${user.total_messages || 0}</td><td>${user.first_seen || ""}</td><td>${user.last_seen || ""}</td><td>${user.most_common_intent || ""}</td><td>${languages}</td></tr>`
      })

      htmlContent += `</table><br><br><table><tr><th colspan="5" class="section-header">📈 DAILY ANALYTICS</th></tr><tr><th>Date</th><th>New Users</th><th>Active Users</th><th>Sessions</th><th>Messages</th></tr>`

      if (dailyAnalyticsData.daily_analytics) {
        dailyAnalyticsData.daily_analytics.forEach((day: any) => {
          htmlContent += `<tr><td>${day.date}</td><td class="number">${day.new_users}</td><td class="number">${day.active_users}</td><td class="number">${day.sessions}</td><td class="number">${day.messages}</td></tr>`
        })
      }

      htmlContent += `</table><br><br><table><tr><th colspan="8" class="section-header">💬 USER SESSIONS</th></tr><tr><th>Session ID</th><th>User ID</th><th>Created At</th><th>Last Active</th><th>Message Count</th><th>Duration (min)</th><th>User Type</th><th>Detected Intents</th></tr>`

      userSessionsData.forEach((session: any) => {
        const intents = session.detected_intents ? session.detected_intents.join("; ") : ""
        htmlContent += `<tr><td>${session.session_id || ""}</td><td>${session.user_id || ""}</td><td>${session.created_at || ""}</td><td>${session.last_active || ""}</td><td class="number">${session.message_count || 0}</td><td class="number">${session.duration_minutes || 0}</td><td>${session.user_type || ""}</td><td>${intents}</td></tr>`
      })

      htmlContent += `</table><br><br><table><tr><th colspan="2" class="section-header">📋 DASHBOARD STATS SUMMARY</th></tr><tr><th style="width: 60%;">Metric</th><th style="width: 40%;">Value</th></tr>`
      htmlContent += `<tr><td>Total Users</td><td class="number">${dashboardStats.total_users}</td></tr>`
      htmlContent += `<tr><td>Active Users Today</td><td class="number">${dashboardStats.active_users_today}</td></tr>`
      htmlContent += `<tr><td>Active Users Week</td><td class="number">${dashboardStats.active_users_week}</td></tr>`
      htmlContent += `<tr><td>Total Sessions</td><td class="number">${dashboardStats.total_sessions}</td></tr>`
      htmlContent += `<tr><td>Total Messages</td><td class="number">${dashboardStats.total_messages}</td></tr>`
      htmlContent += `<tr><td>Avg Messages Per Session</td><td class="number">${dashboardStats.avg_messages_per_session}</td></tr>`
      htmlContent += `</table><br><br><table><tr><th colspan="2" class="section-header">👥 USER TYPES DISTRIBUTION</th></tr><tr><th style="width: 60%;">User Type</th><th style="width: 40%;">Count</th></tr>`

      Object.entries(dashboardStats.user_types_distribution || {}).forEach(([type, count]) => {
        htmlContent += `<tr><td>${type}</td><td class="number">${count}</td></tr>`
      })

      htmlContent += `</table></body></html>`

      const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `chatbot-data-export-${new Date().toISOString().split("T")[0]}.xls`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alert("Fichier Excel téléchargé avec succès!")
    } catch (error) {
      console.error("Error generating Excel:", error)
      alert(
        "Erreur lors de la génération du fichier Excel: " +
          (error instanceof Error ? error.message : "Erreur inconnue"),
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {showWelcome && (
        <div className="relative overflow-hidden rounded-2xl p-10 mb-4 shadow-lg bg-[#29C2E2]">
          <div className="relative z-10 text-center">
            <h2 className="text-3xl font-extrabold text-white drop-shadow-md">Welcome to the Dashboard of Chatbot M</h2>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center relative mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-center flex-1">{t("dashboard", "Dashboard")}</h1>

        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                disabled={isExporting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Export en cours..." : t("Export", "Exporter")}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleDownloadCSV} disabled={isExporting} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exporter en CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDownloadExcel}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter en Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <DashboardStats />
    </div>
  )
}
