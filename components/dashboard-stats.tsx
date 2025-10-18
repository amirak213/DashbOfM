"use client"

import { useEffect, useState } from "react"
import { Loader2, AlertCircle, RefreshCw, Users, MessageCircle, Activity, TrendingUp } from "lucide-react"
import { authService } from "@/app/services/auth-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTranslation } from "react-i18next"
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

interface UserStats {
  user_id: string
  total_sessions: number
  total_messages: number
  first_seen: string
  last_seen: string
  user_type: string
  most_common_intent: string
  languages_used: string[]
  preferences?: Record<string, any>
}

interface UserProfile {
  user_id: string
  lang: string
  user_type: string
  first_seen: string
  last_seen: string
  preferences: Record<string, any>
  conversation_count: number
}

interface SessionStats {
  session_id: string
  user_id: string
  created_at: string
  last_active: string
  message_count: number
  duration_minutes: number
  user_type: string
  detected_intents: string[]
}

// ============================================
// CACHE SYSTÈME - Évite les appels répétitifs
// ============================================
class ProfileCache {
  private cache = new Map<string, { data: any; timestamp: number; error?: boolean }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private pendingRequests = new Map<string, Promise<any>>();

  get(userId: string) {
    const cached = this.cache.get(userId);
    if (!cached) return null;
    
    // Si erreur, ne pas retry pendant 1 minute
    if (cached.error && Date.now() - cached.timestamp < 60000) {
      return { error: true };
    }
    
    // Si succès et pas expiré
    if (!cached.error && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    
    return null;
  }

  set(userId: string, data: any, isError: boolean = false) {
    this.cache.set(userId, {
      data,
      timestamp: Date.now(),
      error: isError
    });
  }

  hasPendingRequest(userId: string): boolean {
    return this.pendingRequests.has(userId);
  }

  setPendingRequest(userId: string, promise: Promise<any>) {
    this.pendingRequests.set(userId, promise);
    promise.finally(() => this.pendingRequests.delete(userId));
  }

  getPendingRequest(userId: string): Promise<any> | undefined {
    return this.pendingRequests.get(userId);
  }

  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

const profileCache = new ProfileCache();


type Period = "this-week" | "last-week" | "2-weeks" | "1-month"

const COLORS = ["#29C2E2", "#e354bfff", "#4809beff", "#0fab84ff", "#afee04ff", "#FFC658", "#FF8042"]

export default function EnhancedDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([])
  const [topUsers, setTopUsers] = useState<UserStats[]>([])
  const [allUsersData, setAllUsersData] = useState<UserStats[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [languageDistribution, setLanguageDistribution] = useState<Record<string, number>>({})
  const [preferencesDistribution, setPreferencesDistribution] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("this-week")

  const getDateRange = (period: Period) => {
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case "this-week":
        startDate.setDate(now.getDate() - now.getDay())
        break
      case "last-week":
        startDate.setDate(now.getDate() - now.getDay() - 7)
        break
      case "2-weeks":
        startDate.setDate(now.getDate() - 14)
        break
      case "1-month":
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    return {
      start: startDate.toISOString().split("T")[0],
      end: now.toISOString().split("T")[0],
    }
  }

  const processLanguagesFromUsers = (userData: UserStats[]) => {
    const langCount: Record<string, number> = {}
    
    userData.forEach(user => {
      if (user.languages_used && Array.isArray(user.languages_used)) {
        user.languages_used.forEach(lang => {
          if (lang && lang.trim()) {
            const cleanLang = lang.trim().toLowerCase()
            langCount[cleanLang] = (langCount[cleanLang] || 0) + 1
          }
        })
      }
    })

    console.log("🌍 Languages detected from users:", langCount)
    setLanguageDistribution(langCount)
  }

  const processLanguagesFromProfiles = (profiles: UserProfile[]) => {
    const langCount: Record<string, number> = {}
    
    profiles.forEach(profile => {
      if (profile.lang && profile.lang.trim()) {
        let cleanLang = profile.lang.trim().toLowerCase()
        
        // Normaliser toutes les variantes de "french"
        if (cleanLang.includes('fren') || cleanLang.includes('fran') || cleanLang === 'frnesh' || cleanLang === 'frnech' || cleanLang === 'fench') {
          cleanLang = 'french'
        }
        // Normaliser les variantes d'"english"
        else if (cleanLang.includes('eng') || cleanLang.includes('angl')) {
          cleanLang = 'english'
        }
        // Normaliser les variantes d'"arabic"
        else if (cleanLang.includes('arab') || cleanLang.includes('عرب')) {
          cleanLang = 'arabic'
        }
        // Normaliser "tunisian arabizi"
        else if (cleanLang.includes('tunisian') && cleanLang.includes('arabizi')) {
          cleanLang = 'tunisian arabizi'
        }
        
        langCount[cleanLang] = (langCount[cleanLang] || 0) + 1
      }
    })

    console.log("🌍 Languages detected from profiles:", langCount)
    setLanguageDistribution(langCount)
  }

  const processPreferencesFromProfiles = (profiles: UserProfile[]) => {
    const prefCount: Record<string, number> = {}
    
    console.log("🔍 Processing preferences from", profiles.length, "profiles")
    
    profiles.forEach(profile => {
      if (profile.preferences && typeof profile.preferences === "object") {
        console.log(`🔍 User ${profile.user_id} preferences:`, profile.preferences)
        
        Object.entries(profile.preferences).forEach(([key, value]) => {
          // Traiter la clé comme préférence (ignorer les valeurs qui sont des dates ISO)
          if (key && key.trim() && key.length >= 2) {
            // Séparer les préférences qui contiennent des \n
            const preferences = key.split('\n').map(p => p.trim()).filter(p => p.length >= 2)
            
            preferences.forEach(pref => {
              const cleanPref = pref.toLowerCase().trim()
              // Ignorer les nombres purs et les dates
              if (!cleanPref.match(/^\d+$/) && !cleanPref.match(/^\d{4}-\d{2}-\d{2}/)) {
                console.log(`✅ Adding preference: "${cleanPref}"`)
                prefCount[cleanPref] = (prefCount[cleanPref] || 0) + 1
              }
            })
          }
        })
      }
    })

    console.log("⚙️ Final preferences detected:", prefCount)
    console.log("⚙️ Total unique preferences:", Object.keys(prefCount).length)
    setPreferencesDistribution(prefCount)
  }

 const fetchAllData = async () => {
  setIsLoading(true)
  setError(null)

  const dateRange = getDateRange(selectedPeriod)

  try {
    if (!authService.isAuthenticated()) {
      setError("Authentification requise pour accéder au dashboard")
      return
    }

    // Fetch main stats
    const statsData = await authService.get(
      `/dashboard/stats?start_date=${dateRange.start}&end_date=${dateRange.end}`
    )
    console.log("📊 Stats data:", statsData)
    setStats(statsData)

    // Fetch ALL users data
    try {
      const usersData = await authService.get(
        `/dashboard/users?limit=1000&offset=0`
      )
      console.log("👥 All users data fetched:", usersData.length, "users")
      
      setAllUsersData(usersData)
      setTopUsers(usersData.slice(0, 5))
      
      // ✅ CORRECTION : Fetch profiles avec gestion d'erreur 500
      const profilePromises = usersData.map(async (user: UserStats) => {
        // Vérifier le cache
        const cached = profileCache.get(user.user_id);
        if (cached !== null) {
          if (cached.error) {
            console.warn(`⏭️ Skipping user ${user.user_id} (cached error)`);
            return null;
          }
          return cached;
        }

        // Vérifier si requête déjà en cours
        if (profileCache.hasPendingRequest(user.user_id)) {
          return profileCache.getPendingRequest(user.user_id);
        }

        // Créer nouvelle requête
        const promise = authService.get(`/user/${user.user_id}`)
          .then(profile => {
            profileCache.set(user.user_id, profile, false);
            return profile;
          })
          .catch(err => {
  // ✅ Gérer l'erreur 500 sans crasher l'application
  if (err.status === 500) {
    console.warn(`⏭️ Skipping user ${user.user_id} - Invalid data structure (content_proposals format issue)`);
    profileCache.set(user.user_id, null, true);
    return null;
  }
  
  // Autres erreurs
  if (err.status === 404) {
    console.warn(`⏭️ User ${user.user_id} not found`);
    return null;
  }
  
  // Erreurs réseau ou autres
  console.error(`❌ Failed to fetch profile for ${user.user_id}:`, err.message || err);
  return null;
});

        profileCache.setPendingRequest(user.user_id, promise);
        return promise;
      });
      
      // ✅ Utiliser Promise.allSettled au lieu de Promise.all
      const profileResults = await Promise.allSettled(profilePromises);
      const profiles = profileResults
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<any>).value) as UserProfile[];
      
      
      
      console.log("👤 User profiles fetched:", profiles.length, "profiles (", usersData.length - profiles.length, "skipped due to errors)");
      setUserProfiles(profiles);
      
      
      // Process languages from profiles
      processLanguagesFromProfiles(profiles);
      
      // Process preferences from profiles
      processPreferencesFromProfiles(profiles);
    } catch (error) {
      console.error("❌ Failed to fetch users data:", error)
      setTopUsers([])
      setAllUsersData([])
      setUserProfiles([])
    }

    // Fetch analytics data
    try {
      const analyticsData = await authService.get(
        `/dashboard/analytics/daily?start_date=${dateRange.start}&end_date=${dateRange.end}`
      )
      setDailyAnalytics(analyticsData.daily_analytics || [])
    } catch (analyticsError) {
      console.error("❌ Failed to fetch analytics:", analyticsError)
      setDailyAnalytics([])
    }

  } catch (err) {
    console.error("❌ Dashboard error:", err)
    setError(err instanceof Error ? err.message : "Unknown error")
  } finally {
    setIsLoading(false)
  }
}
  useEffect(() => {
    fetchAllData()
  }, [selectedPeriod])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#29C2E2] mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Chargement du dashboard...</p>
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
            Authentification requise pour accéder au dashboard.
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
            Erreur: {error}
            <Button variant="outline" size="sm" onClick={fetchAllData} className="ml-2">
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
          <AlertDescription>Aucune donnée disponible.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Prepare chart data
  const userTypesChartData = Object.entries(stats.user_types_distribution || {}).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
  }))

  const languageChartData = Object.entries(languageDistribution).map(([lang, count]) => ({
    name: lang.toUpperCase(),
    value: count,
  }))

  const preferencesChartData = Object.entries(preferencesDistribution)
    .map(([preference, count]) => ({
      name: preference.charAt(0).toUpperCase() + preference.slice(1),
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  return (
    <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-[#29C2E2]">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-[#1AAAC0]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_users_today} actifs aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-[#54D2E3]">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active cette semaine</CardTitle>
            <Activity className="h-5 w-5 text-[#29C2E2]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_users_week.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-[#1AAAC0]">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-5 w-5 text-[#29C2E2]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_sessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.avg_messages_per_session?.toFixed(1)} msg/session
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-[#1AAAC0]">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageCircle className="h-5 w-5 text-[#1AAAC0]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_messages.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      {dailyAnalytics.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Nouveaux utilisateurs</CardTitle>
              <CardDescription>Tendance quotidienne</CardDescription>
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

          <Card>
            <CardHeader>
              <CardTitle>Volume de messages</CardTitle>
              <CardDescription>Messages par jour</CardDescription>
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
      <div className="grid gap-4 md:grid-cols-3">
        {/* Language Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des langues</CardTitle>
            <CardDescription>
              {languageChartData.length > 0
                ? `${languageChartData.length} langues détectées`
                : "Aucune donnée"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {languageChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={languageChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {languageChartData.map((_, index) => (
                        <Cell key={`cell-lang-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {languageChartData.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <span
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {item.name}
                      </span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Aucune langue détectée
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferences Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des préférences</CardTitle>
            <CardDescription>
              {preferencesChartData.length > 0
                ? `Top ${preferencesChartData.length} préférences`
                : "Aucune donnée"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {preferencesChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={preferencesChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent = 0 }) => `${name.slice(0, 8)}... ${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {preferencesChartData.map((_, index) => (
                        <Cell key={`cell-pref-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                  {preferencesChartData.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <span
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {item.name}
                      </span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Aucune préférence détectée
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Types d'utilisateurs</CardTitle>
            <CardDescription>
              {userTypesChartData.length > 0
                ? `${userTypesChartData.length} types détectés`
                : "Aucune donnée"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userTypesChartData.length > 0 ? (
              <>
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
                        <Cell key={`cell-type-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {userTypesChartData.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <span
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {item.name}
                      </span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Aucun type détecté
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Liste des préférences */}
      {Object.keys(preferencesDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Liste des préférences</CardTitle>
            <CardDescription>
              {Object.keys(preferencesDistribution).length} préférences uniques détectées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <ul className="space-y-1">
                {Object.entries(preferencesDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([preference], index) => (
                    <li
                      key={index}
                      className="px-3 py-2 bg-white border border-gray-200 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      {preference.charAt(0).toUpperCase() + preference.slice(1)}
                    </li>
                  ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={fetchAllData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser les données
        </Button>
      </div>
    </div>
  )
}