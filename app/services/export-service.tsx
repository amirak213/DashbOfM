import { authService } from "./auth-service"
import { getExternalApiUrl } from "C:/Users/Hp23/Downloads/dynamic-dashboard/v0-dynamic-dashboard-main/config/api.js"

interface ExportData {
  dashboardStats: any
  users: any[]
  sessions: any[]
  analytics: any[]
  partnershipStats: any
  categoryStats: any
}

class ExportService {
  private async getAllExportData(): Promise<ExportData> {
    try {
      const [
        dashboardStats,
        usersResponse,
        sessionsResponse,
        analyticsResponse,
        partnershipResponse,
        categoryResponse,
      ] = await Promise.all([
        authService.getDashboardStats(),
        authService.getAllUsers(1000, 0), // Get more users for export
        authService.getActiveSessions(168), // Get sessions from last week
        authService.get("/dashboard/analytics/daily?days=90"),
        fetch(getExternalApiUrl("/api/v1/partnership-stats"))
          .then((r) => r.json())
          .catch(() => ({})),
        fetch(getExternalApiUrl("/api/v1/category-stats"))
          .then((r) => r.json())
          .catch(() => ({})),
      ])

      const users = Array.isArray(usersResponse) ? usersResponse : usersResponse.users || []
      const sessions = sessionsResponse?.active_sessions || []
      const analytics = analyticsResponse?.daily_analytics || []

      return {
        dashboardStats,
        users,
        sessions,
        analytics,
        partnershipStats: partnershipResponse,
        categoryStats: categoryResponse,
      }
    } catch (error) {
      console.error("Failed to fetch export data:", error)
      throw new Error("Failed to fetch data for export")
    }
  }

  private generateCSV(data: ExportData): string {
    let csv = ""

    // Dashboard Stats Section
    csv += "DASHBOARD STATISTICS\n"
    csv += "Metric,Value\n"
    csv += `Total Users,${data.dashboardStats.total_users || 0}\n`
    csv += `Active Users Today,${data.dashboardStats.active_users_today || 0}\n`
    csv += `Active Users This Week,${data.dashboardStats.active_users_week || 0}\n`
    csv += `Total Sessions,${data.dashboardStats.total_sessions || 0}\n`
    csv += `Total Messages,${data.dashboardStats.total_messages || 0}\n`
    csv += `Average Messages Per Session,${data.dashboardStats.avg_messages_per_session || 0}\n`
    csv += `Average Session Duration (min),${data.dashboardStats.avg_session_duration || 0}\n`
    csv += `Peak Usage Hour,${data.dashboardStats.peak_usage_hour || 0}\n`
    csv += `Retention Rate,${(data.dashboardStats.retention_rate || 0) * 100}%\n`
    csv += `Bounce Rate,${(data.dashboardStats.bounce_rate || 0) * 100}%\n`
    csv += `User Satisfaction Score,${(data.dashboardStats.user_satisfaction_score || 0) * 100}%\n`
    csv += `Response Time Average (s),${data.dashboardStats.response_time_avg || 0}\n`
    csv += `Error Rate,${(data.dashboardStats.error_rate || 0) * 100}%\n`
    csv += "\n"

    // Conversation Topics Section
    if (data.dashboardStats.top_conversation_topics && Array.isArray(data.dashboardStats.top_conversation_topics)) {
      csv += "TOP CONVERSATION TOPICS\n"
      csv += "Topic\n"
      data.dashboardStats.top_conversation_topics.forEach((topic: string) => {
        csv += `${topic}\n`
      })
      csv += "\n"
    }

    // User Types Distribution
    if (data.dashboardStats.user_types_distribution) {
      csv += "USER TYPES DISTRIBUTION\n"
      csv += "User Type,Count\n"
      Object.entries(data.dashboardStats.user_types_distribution).forEach(([type, count]) => {
        csv += `${type},${count}\n`
      })
      csv += "\n"
    }

    // Language Distribution
    if (data.dashboardStats.language_distribution) {
      csv += "LANGUAGE DISTRIBUTION\n"
      csv += "Language,Count\n"
      Object.entries(data.dashboardStats.language_distribution).forEach(([lang, count]) => {
        csv += `${lang},${count}\n`
      })
      csv += "\n"
    }

    // Users Data (excluding login accounts)
    if (data.users.length > 0) {
      csv += "USERS DATA\n"
      csv += "User ID,User Type,Total Sessions,Total Messages,First Seen,Last Seen,Most Common Intent,Languages Used\n"
      data.users
        .filter((user) => !user.user_id?.includes("admin") && !user.user_id?.includes("login"))
        .forEach((user) => {
          const languages = Array.isArray(user.languages_used)
            ? user.languages_used.join(";")
            : user.languages_used || ""
          csv += `${user.user_id || ""},${user.user_type || ""},${user.total_sessions || 0},${user.total_messages || 0},${user.first_seen || ""},${user.last_seen || ""},${user.most_common_intent || ""},${languages}\n`
        })
      csv += "\n"
    }

    // Sessions Data
    if (data.sessions.length > 0) {
      csv += "ACTIVE SESSIONS DATA\n"
      csv += "Session ID,User ID,Last Active,Message Count,User Type\n"
      data.sessions.forEach((session) => {
        csv += `${session.session_id || ""},${session.user_id || ""},${session.last_active || ""},${session.message_count || 0},${session.user_type || ""}\n`
      })
      csv += "\n"
    }

    // Analytics Data
    if (data.analytics.length > 0) {
      csv += "DAILY ANALYTICS DATA\n"
      csv += "Date,New Users,Active Users,Sessions,Messages\n"
      data.analytics.forEach((day) => {
        csv += `${day.date || ""},${day.new_users || 0},${day.active_users || 0},${day.sessions || 0},${day.messages || 0}\n`
      })
      csv += "\n"
    }

    // Partnership Stats
    if (data.partnershipStats?.data) {
      csv += "PARTNERSHIP STATISTICS\n"
      csv += "Partnership Type,Count\n"
      data.partnershipStats.data.forEach((item: any) => {
        csv += `${item.name || ""},${item.value || 0}\n`
      })
      csv += "\n"
    }

    // Category Stats
    if (data.categoryStats?.data) {
      csv += "CONTENT CATEGORY STATISTICS\n"
      csv += "Category,Count\n"
      data.categoryStats.data.forEach((item: any) => {
        csv += `${item.name || ""},${item.value || 0}\n`
      })
      csv += "\n"
    }

    return csv
  }

  private async generatePDF(data: ExportData): Promise<Blob> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dashboard Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #29C2E2; border-bottom: 2px solid #29C2E2; padding-bottom: 10px; }
          h2 { color: #1AAAC0; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #29C2E2; }
          .performance-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>L'INSTANT M - Dashboard Export Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        
        <h2>Dashboard Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${data.dashboardStats.total_users || 0}</div>
            <div>Total Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.dashboardStats.active_users_today || 0}</div>
            <div>Active Users Today</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.dashboardStats.total_sessions || 0}</div>
            <div>Total Sessions</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.dashboardStats.total_messages || 0}</div>
            <div>Total Messages</div>
          </div>
        </div>

        <h2>Performance Metrics</h2>
        <div class="performance-grid">
          <div class="stat-card">
            <div class="stat-value">${(data.dashboardStats.avg_session_duration || 0).toFixed(1)}min</div>
            <div>Avg Session Duration</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${((data.dashboardStats.retention_rate || 0) * 100).toFixed(1)}%</div>
            <div>Retention Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${(data.dashboardStats.response_time_avg || 0).toFixed(2)}s</div>
            <div>Response Time</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.dashboardStats.peak_usage_hour || 0}:00</div>
            <div>Peak Usage Hour</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${((data.dashboardStats.user_satisfaction_score || 0) * 100).toFixed(1)}%</div>
            <div>User Satisfaction</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${((data.dashboardStats.error_rate || 0) * 100).toFixed(2)}%</div>
            <div>Error Rate</div>
          </div>
        </div>

        ${
          data.dashboardStats.top_conversation_topics && data.dashboardStats.top_conversation_topics.length > 0
            ? `
        <h2>Top Conversation Topics</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0;">
          ${data.dashboardStats.top_conversation_topics
            .slice(0, 10)
            .map(
              (topic: string) =>
                `<span style="background: #e3f2fd; padding: 5px 10px; border-radius: 15px; font-size: 12px;">${topic}</span>`,
            )
            .join("")}
        </div>
        `
            : ""
        }

        ${
          data.dashboardStats.user_types_distribution
            ? `
        <h2>User Types Distribution</h2>
        <table>
          <thead>
            <tr><th>User Type</th><th>Count</th></tr>
          </thead>
          <tbody>
            ${Object.entries(data.dashboardStats.user_types_distribution)
              .map(([type, count]) => `<tr><td>${type}</td><td>${count}</td></tr>`)
              .join("")}
          </tbody>
        </table>
        `
            : ""
        }

        ${
          data.users.length > 0
            ? `
        <h2>Users Summary (Top 50, excluding admin accounts)</h2>
        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Type</th>
              <th>Sessions</th>
              <th>Messages</th>
              <th>First Seen</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            ${data.users
              .filter((user) => !user.user_id?.includes("admin") && !user.user_id?.includes("login"))
              .slice(0, 50)
              .map(
                (user) => `
              <tr>
                <td>${user.user_id || ""}</td>
                <td>${user.user_type || ""}</td>
                <td>${user.total_sessions || 0}</td>
                <td>${user.total_messages || 0}</td>
                <td>${user.first_seen ? new Date(user.first_seen).toLocaleDateString() : ""}</td>
                <td>${user.last_seen ? new Date(user.last_seen).toLocaleDateString() : ""}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        `
            : ""
        }

        ${
          data.analytics.length > 0
            ? `
        <h2>Daily Analytics (Last 30 Days)</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>New Users</th>
              <th>Active Users</th>
              <th>Sessions</th>
              <th>Messages</th>
            </tr>
          </thead>
          <tbody>
            ${data.analytics
              .slice(-30)
              .map(
                (day) => `
              <tr>
                <td>${day.date || ""}</td>
                <td>${day.new_users || 0}</td>
                <td>${day.active_users || 0}</td>
                <td>${day.sessions || 0}</td>
                <td>${day.messages || 0}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        `
            : ""
        }
      </body>
      </html>
    `

    // Convert HTML to PDF using browser's print functionality
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      throw new Error("Unable to open print window")
    }

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Trigger print dialog
    printWindow.print()
    printWindow.close()

    // Return a placeholder blob since we're using browser print
    return new Blob([htmlContent], { type: "text/html" })
  }

  async exportAllData(format: "csv" | "pdf"): Promise<void> {
    try {
      const data = await this.getAllExportData()

      if (format === "csv") {
        const csvContent = this.generateCSV(data)
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)

        link.setAttribute("href", url)
        link.setAttribute("download", `dashboard-export-${new Date().toISOString().split("T")[0]}.csv`)
        link.style.visibility = "hidden"

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)
      } else if (format === "pdf") {
        await this.generatePDF(data)
      }
    } catch (error) {
      console.error("Export failed:", error)
      throw error
    }
  }
}

export const exportService = new ExportService()
