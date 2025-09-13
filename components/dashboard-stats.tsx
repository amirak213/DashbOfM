"use client"

import { useEffect, useState } from "react"
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  MessageCircle,
  Activity,
  TrendingUp,
} from "lucide-react"
import { authService } from "@/app/services/auth-service"
import { SessionDurationComponent } from "components/SessionDurationComponent" // Import du nouveau composant

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

interface DashboardStats {
  total_users: number
  active_users_today: number
  active_users_week: number
  total_sessions: number
  total_messages: number
  avg_messages_per_session: number
  most_common_intents: string[]
  user_types_distribution: Record<string, number>
  language_distribution: Record<string, number>
}

interface DailyAnalytics {
  date: string
  new_users: number
  active_users: number
  sessions: number
  messages: number
}

interface ActiveSession {
  session_id: string
  user_id: string
  last_active: string
  message_count: number
  user_type: string
}

interface UserStats {
  user_id: string
  total_sessions: number
  total_messages: number
  first_seen: string
  last_seen: string
  user_type: string
  most_common_intent: string
  languages_used: string[]
}

interface PartnershipKitStats {
  "Clubs étudiants": number
  "Événements culturels": number
  "Partenariats commerciaux": number
}

interface ContentCategoryStats {
  "Art et Culture": number
  Divertissement: number
  Foodie: number
  Healthy: number
  "Bons plans": number
  Lifestyle: number
  Entreprendre: number
}

const COLORS = [
  "#29C2E2",
  "#54D2E3",
  "#1AAAC0",
  "#1F99B3",
  "#88E0EE",
  "#FFC658",
  "#FF8042",
]

export default function EnhancedDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([])
  const [activeSessions, setActiveSessions] = useState<{
    active_sessions: ActiveSession[]
    count: number
  } | null>(null)
  const [topUsers, setTopUsers] = useState<UserStats[]>([])
  const [partnershipStats, setPartnershipStats] = useState<PartnershipKitStats>({
    "Clubs étudiants": 0,
    "Événements culturels": 0,
    "Partenariats commerciaux": 0,
  })
  const [categoryStats, setCategoryStats] = useState<ContentCategoryStats>({
    "Art et Culture": 0,
    Divertissement: 0,
    Foodie: 0,
    Healthy: 0,
    "Bons plans": 0,
    Lifestyle: 0,
    Entreprendre: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!authService.isAuthenticated()) {
        setError("Authentification requise pour accéder au dashboard")
        return
      }

      const [statsData, sessionsData, usersData] = await Promise.all([
        authService.getDashboardStats(),
        authService.getActiveSessions(24),
        authService.getAllUsers(100, 0),
      ])

      console.log("🔍 Raw API statsData:", statsData)
      console.log("🔍 statsData.language_distribution:", statsData.language_distribution)

      setStats(statsData)
      setActiveSessions(sessionsData)

      const sortedUsers = usersData.users
        ? usersData.users
            .sort((a: UserStats, b: UserStats) => b.total_messages - a.total_messages)
            .slice(0, 5)
        : usersData.sort((a: UserStats, b: UserStats) => b.total_messages - a.total_messages).slice(0, 5)
      setTopUsers(sortedUsers)

      // Fetch daily analytics
      try {
        const analyticsData = await authService.get("/dashboard/analytics/daily")
        setDailyAnalytics(analyticsData.daily_analytics || [])
      } catch (analyticsError) {
        console.error("Failed to fetch analytics:", analyticsError)
        setDailyAnalytics([])
      }

      // --- PARTNERSHIP STATS ---
      try {
        const partnershipResponse = await fetch("http://localhost:8000/api/v1/partnership-stats")
        const partnershipData = await partnershipResponse.json()
        if (partnershipData.success && partnershipData.data && Array.isArray(partnershipData.data)) {
          const newPartnershipStats: PartnershipKitStats = {
            "Clubs étudiants": 0,
            "Événements culturels": 0,
            "Partenariats commerciaux": 0,
          }
          partnershipData.data.forEach((item: any) => {
            const itemName = item.name.toLowerCase()
            if (itemName.includes("club") || itemName.includes("étudiant"))
              newPartnershipStats["Clubs étudiants"] = item.value || 0
            if (itemName.includes("événement") || itemName.includes("culturel"))
              newPartnershipStats["Événements culturels"] = item.value || 0
            if (
              itemName.includes("commercial") ||
              itemName.includes("entreprise") ||
              itemName.includes("partenariat")
            )
              newPartnershipStats["Partenariats commerciaux"] = item.value || 0
          })
          setPartnershipStats(newPartnershipStats)
        }
      } catch (error) {
        console.error("Failed to fetch partnership stats:", error)
      }

      // --- CATEGORY STATS ---
      try {
        const categoryResponse = await fetch("http://localhost:8000/api/v1/category-stats")
        const categoryData = await categoryResponse.json()
        if (categoryData.success && categoryData.data && Array.isArray(categoryData.data)) {
          const newCategoryStats: ContentCategoryStats = {
            "Art et Culture": 0,
            Divertissement: 0,
            Foodie: 0,
            Healthy: 0,
            "Bons plans": 0,
            Lifestyle: 0,
            Entreprendre: 0,
          }
          categoryData.data.forEach((item: any) => {
            const cleanName = item.name.replace("M ", "")
            if (cleanName === "Art et Culture") newCategoryStats["Art et Culture"] = item.value || 0
            if (cleanName === "Divertissement") newCategoryStats["Divertissement"] = item.value || 0
            if (cleanName === "Foodie") newCategoryStats["Foodie"] = item.value || 0
            if (cleanName === "Healthy") newCategoryStats["Healthy"] = item.value || 0
            if (cleanName === "Bons plans") newCategoryStats["Bons plans"] = item.value || 0
            if (cleanName === "Lifestyle") newCategoryStats["Lifestyle"] = item.value || 0
            if (cleanName === "Entreprendre") newCategoryStats["Entreprendre"] = item.value || 0
          })
          setCategoryStats(newCategoryStats)
        }
      } catch (error) {
        console.error("Failed to fetch category stats:", error)
      }
    } catch (err) {
      console.error("Dashboard error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#29C2E2] mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!authService.isAuthenticated()) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Authentification requise pour accéder au dashboard. Veuillez vous connecter.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement des données: {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAllData} 
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aucune donnée disponible.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const userTypesChartData = Object.entries(stats.user_types_distribution || {}).map(
    ([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
    }),
  )

  const partnershipChartData = Object.entries(partnershipStats)
    .map(([type, count]) => ({ name: type, value: count }))
    .filter((item) => item.value > 0)

  const categoryChartData = Object.entries(categoryStats)
    .map(([type, count]) => ({ name: type, value: count }))
    .filter((item) => item.value > 0)

  const languageChartData = Object.entries(stats.language_distribution || {}).map(
    ([language, count]) => ({
      name: language.charAt(0).toUpperCase() + language.slice(1),
      value: count,
    }),
  )

  return (
    <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
      {/* Top Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-[#29C2E2] shadow-md">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-[#1AAAC0]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.active_users_today} active today</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-[#1AAAC0] shadow-md">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-5 w-5 text-[#29C2E2]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_sessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.avg_messages_per_session?.toFixed(1) || "0"} avg messages/session
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-[#29C2E2] shadow-md">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageCircle className="h-5 w-5 text-[#1AAAC0]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_messages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all sessions</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-[#1AAAC0] shadow-md">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <TrendingUp className="h-5 w-5 text-[#29C2E2]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions?.count || 0}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Session Duration Section - Nouvelle section ajoutée */}
      <SessionDurationComponent activeSessions={activeSessions} />

      {/* Daily Analytics Charts */}
      {dailyAnalytics.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>New Users Trend</CardTitle>
              <CardDescription>New users per day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="new_users" stroke="#1AAAC0" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Daily Message Volume</CardTitle>
              <CardDescription>Messages trend over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="messages" fill="#29C2E2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Distribution Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Partnership Stats */}
        {partnershipChartData.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Partnership Kits Detection</CardTitle>
              <CardDescription>Types de partenariats détectés</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={partnershipChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent = 0 }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {partnershipChartData.map((_, index) => (
                      <Cell key={`cell-partnership-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Category Stats */}
        {categoryChartData.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Content Categories Detection</CardTitle>
              <CardDescription>Catégories de contenu détectées</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent = 0 }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-category-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* User Types Distribution */}
        {userTypesChartData.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>User Types Distribution</CardTitle>
              <CardDescription>Breakdown by user category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={userTypesChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userTypesChartData.map((_, index) => (
                      <Cell key={`cell-usertype-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Language Distribution */}
      {languageChartData.length > 0 ? (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
            <CardDescription>Répartition des utilisateurs par langue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {languageChartData.map((lang) => {
                const total = Object.values(stats.language_distribution || {}).reduce(
                  (sum: number, val: number) => sum + val,
                  0
                )
                const percent = total > 0 ? (lang.value / total) * 100 : 0
                return (
                  <div key={lang.name} className="space-y-1">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{lang.name}</span>
                      <span>
                        {lang.value} users ({percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full">
                      <div
                        className="h-3 rounded-full bg-[#29C2E2] transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
            <CardDescription>Répartition des utilisateurs par langue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[100px] text-muted-foreground">
              Aucune donnée de langue disponible dans l'API
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchAllData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser les données
        </Button>
      </div>
    </div>
  )
}