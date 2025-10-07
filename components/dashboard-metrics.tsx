"use client"

import type React from "react"

import { useEffect, useState } from "react"
import {
  Loader2,
  RefreshCw,
  Users,
  MessageSquare,
  TrendingUp,
  Activity,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { authService } from "@/app/services/auth-service"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ==========================================
// TYPES
// ==========================================

interface SubmissionItem {
  type: string
  id: string
  submission_date: string
  status: string
  user_id: string
}

interface BusinessMetrics {
  total_submissions: number
  submissions_by_type: Record<string, number>
  commercial_leads: number
  partnership_types_distribution: Record<string, number>
  recent_submissions: SubmissionItem[]
  conversion_funnel: Record<string, number>
  cached?: boolean
  cache_age_seconds?: number
}

interface QualityMetrics {
  abandonment_rate: number
  abandoned_sessions: number
  total_sessions: number
  misunderstood_rate: number
  misunderstood_count: number
  total_messages: number
  avg_session_duration: number
  sessions_with_recommendations: number
  recommendation_rate: number
  cached?: boolean
  cache_age_seconds?: number
}

interface BehaviorAnalytics {
  hourly_distribution: Array<{ hour: number; count: number }>
  daily_distribution: Array<{ day: string; count: number }>
  user_type_behaviors: Record<
    string,
    {
      total_sessions: number
      total_messages: number
      avg_messages_per_session: number
      avg_duration_minutes: number
      top_intents: Array<{ intent: string; count: number }>
    }
  >
  intent_trends: Record<string, Array<{ date: string; count: number }>>
}

interface TechnicalMetrics {
  total_sessions: number
  active_sessions_1h: number
  active_sessions_24h: number
  redis_keys_count: number
  avg_messages_per_session: number
  peak_usage_info: {
    hour: number
    sessions_count: number
  }
}

// ==========================================
// COMPONENTS
// ==========================================

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: "blue" | "green" | "purple" | "orange" | "red"
  subtitle?: string
}

function KPICard({ title, value, icon: Icon, color, subtitle }: KPICardProps) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    purple: "text-purple-600 bg-purple-50",
    orange: "text-orange-600 bg-orange-50",
    red: "text-red-600 bg-red-50",
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface MetricRowProps {
  label: string
  value: string | number
  highlight?: "green" | "blue"
}

function MetricRow({ label, value, highlight }: MetricRowProps) {
  const highlightClass =
    highlight === "green" ? "text-green-600" : highlight === "blue" ? "text-blue-600" : "text-foreground"

  return (
    <div className="flex justify-between items-center py-2 border-b">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${highlightClass}`}>{value}</span>
    </div>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function DashboardMetrics() {
  const [activeTab, setActiveTab] = useState("overview")
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null)
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null)
  const [behaviorAnalytics, setBehaviorAnalytics] = useState<BehaviorAnalytics | null>(null)
  const [technicalMetrics, setTechnicalMetrics] = useState<TechnicalMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

  const fetchAllMetrics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [business, quality, behavior, technical] = await Promise.all([
        authService.get("/chat/metrics/business-metrics"),
        authService.get("/chat/metrics/quality-metrics"),
        authService.get("/chat/metrics/behavior-analytics"),
        authService.get("/chat/metrics/technical-metrics"),
      ])

      setBusinessMetrics(business)
      setQualityMetrics(quality)
      setBehaviorAnalytics(behavior)
      setTechnicalMetrics(technical)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to load metrics: ${errorMessage}`)
      console.error("Metrics fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllMetrics()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des métriques...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tableau de Bord</h2>
          <Button variant="outline" size="sm" onClick={fetchAllMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tableau de Bord Chatbot</h2>
          <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble des performances et métriques</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAllMetrics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <TrendingUp className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="business">
            <Target className="w-4 h-4 mr-2" />
            Business
          </TabsTrigger>
          <TabsTrigger value="quality">
            <CheckCircle className="w-4 h-4 mr-2" />
            Qualité
          </TabsTrigger>
          <TabsTrigger value="behavior">
            <Users className="w-4 h-4 mr-2" />
            Comportement
          </TabsTrigger>
          <TabsTrigger value="technical">
            <Activity className="w-4 h-4 mr-2" />
            Technique
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Sessions Totales"
              value={technicalMetrics?.total_sessions ?? 0}
              icon={Users}
              color="blue"
              subtitle={`${technicalMetrics?.active_sessions_24h ?? 0} actives (24h)`}
            />
            <KPICard
              title="Soumissions"
              value={businessMetrics?.total_submissions ?? 0}
              icon={Target}
              color="green"
              subtitle={`${businessMetrics?.commercial_leads ?? 0} leads commerciaux`}
            />
            <KPICard
              title="Qualité"
              value={`${qualityMetrics ? (100 - (qualityMetrics.abandonment_rate ?? 0)).toFixed(0) : 0}%`}
              icon={CheckCircle}
              color="purple"
              subtitle="Taux de complétion"
            />
            <KPICard
              title="Messages"
              value={technicalMetrics?.avg_messages_per_session?.toFixed(1) ?? 0}
              icon={MessageSquare}
              color="orange"
              subtitle="Moyenne par session"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submissions by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Soumissions par Type</CardTitle>
                <CardDescription>Distribution des contributions</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(businessMetrics?.submissions_by_type || {}).map(([key, value]) => ({
                      name: key.replace(/_/g, " "),
                      value,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Funnel de Conversion</CardTitle>
                <CardDescription>Parcours utilisateur</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(businessMetrics?.conversion_funnel || {}).map(([key, value]) => ({
                      name: key.replace(/_/g, " "),
                      value,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribution Horaire</CardTitle>
                <CardDescription>Activité par heure</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={behaviorAnalytics?.hourly_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} name="Sessions" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribution Journalière</CardTitle>
                <CardDescription>Activité par jour de la semaine</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={behaviorAnalytics?.daily_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BUSINESS TAB */}
        <TabsContent value="business" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Leads Commerciaux</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600">{businessMetrics?.commercial_leads ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-2">Prospects identifiés</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Soumissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">{businessMetrics?.total_submissions ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-2">Tous types confondus</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taux de Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-purple-600">
                  {businessMetrics?.conversion_funnel?.total_visitors &&
                  businessMetrics.conversion_funnel.total_visitors > 0
                    ? (
                        ((businessMetrics.conversion_funnel.submission_complete || 0) /
                          businessMetrics.conversion_funnel.total_visitors) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-sm text-muted-foreground mt-2">Visiteurs → Soumissions</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Partnership Types */}
            <Card>
              <CardHeader>
                <CardTitle>Types de Partenariats</CardTitle>
                <CardDescription>Distribution des intérêts business</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(businessMetrics?.partnership_types_distribution || {}).map(
                        ([key, value]) => ({
                          name: key,
                          value,
                        }),
                      )}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.keys(businessMetrics?.partnership_types_distribution || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Card>
              <CardHeader>
                <CardTitle>Soumissions Récentes</CardTitle>
                <CardDescription>Dernières contributions</CardDescription>
              </CardHeader>
              <CardContent className="max-h-80 overflow-y-auto">
                <div className="space-y-3">
                  {businessMetrics?.recent_submissions?.map((submission, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="font-medium">{submission.type}</p>
                      <p className="text-sm text-muted-foreground">ID: {submission.id}</p>
                      <p className="text-xs text-muted-foreground">{submission.submission_date}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          submission.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                        }`}
                      >
                        {submission.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* QUALITY TAB */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Taux d'Abandon</h3>
                <p className="text-3xl font-bold text-red-600">{qualityMetrics?.abandonment_rate ?? 0}%</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {qualityMetrics?.abandoned_sessions ?? 0} / {qualityMetrics?.total_sessions ?? 0} sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Incompréhension</h3>
                <p className="text-3xl font-bold text-orange-600">{qualityMetrics?.misunderstood_rate ?? 0}%</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {qualityMetrics?.misunderstood_count ?? 0} messages
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Durée Moyenne</h3>
                <p className="text-3xl font-bold text-blue-600">{qualityMetrics?.avg_session_duration ?? 0} min</p>
                <p className="text-xs text-muted-foreground mt-2">Par session</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Recommandations</h3>
                <p className="text-3xl font-bold text-green-600">{qualityMetrics?.recommendation_rate ?? 0}%</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {qualityMetrics?.sessions_with_recommendations ?? 0} sessions
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métriques de Qualité Détaillées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Performance Globale</h4>
                  <div className="space-y-2">
                    <MetricRow label="Sessions totales" value={qualityMetrics?.total_sessions ?? 0} />
                    <MetricRow label="Messages totaux" value={qualityMetrics?.total_messages ?? 0} />
                    <MetricRow label="Sessions abandonnées" value={qualityMetrics?.abandoned_sessions ?? 0} />
                    <MetricRow label="Messages mal compris" value={qualityMetrics?.misunderstood_count ?? 0} />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Engagement</h4>
                  <div className="space-y-2">
                    <MetricRow
                      label="Taux de complétion"
                      value={`${qualityMetrics ? (100 - (qualityMetrics.abandonment_rate ?? 0)).toFixed(1) : 0}%`}
                      highlight="green"
                    />
                    <MetricRow
                      label="Taux de compréhension"
                      value={`${qualityMetrics ? (100 - (qualityMetrics.misunderstood_rate ?? 0)).toFixed(1) : 0}%`}
                      highlight="blue"
                    />
                    <MetricRow
                      label="Sessions avec recommandations"
                      value={qualityMetrics?.sessions_with_recommendations ?? 0}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BEHAVIOR TAB */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activité Horaire</CardTitle>
                <CardDescription>Sessions par heure de la journée</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={behaviorAnalytics?.hourly_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Sessions" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activité Journalière</CardTitle>
                <CardDescription>Sessions par jour de la semaine</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={behaviorAnalytics?.daily_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comportements par Type d'Utilisateur</CardTitle>
              <CardDescription>Analyse des patterns d'utilisation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Sessions</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Messages</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Moy. Msg/Session
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Durée Moy.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(behaviorAnalytics?.user_type_behaviors || {}).map(([type, data]) => (
                      <tr key={type} className="border-b">
                        <td className="px-4 py-3 text-sm font-medium">{type}</td>
                        <td className="px-4 py-3 text-sm">{data.total_sessions}</td>
                        <td className="px-4 py-3 text-sm">{data.total_messages}</td>
                        <td className="px-4 py-3 text-sm">{data.avg_messages_per_session}</td>
                        <td className="px-4 py-3 text-sm">{data.avg_duration_minutes} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TECHNICAL TAB */}
        <TabsContent value="technical" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Sessions Totales</h3>
                <p className="text-3xl font-bold">{technicalMetrics?.total_sessions ?? 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Actives (1h)</h3>
                <p className="text-3xl font-bold text-green-600">{technicalMetrics?.active_sessions_1h ?? 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Actives (24h)</h3>
                <p className="text-3xl font-bold text-blue-600">{technicalMetrics?.active_sessions_24h ?? 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Clés Redis</h3>
                <p className="text-3xl font-bold text-purple-600">{technicalMetrics?.redis_keys_count ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Messages moyens par session</span>
                    <span className="font-semibold">{technicalMetrics?.avg_messages_per_session?.toFixed(2) ?? 0}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min((technicalMetrics?.avg_messages_per_session ?? 0) * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Taux d'activité (24h)</span>
                    <span className="font-semibold">
                      {technicalMetrics?.total_sessions && technicalMetrics.total_sessions > 0
                        ? (
                            ((technicalMetrics.active_sessions_24h || 0) / technicalMetrics.total_sessions) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width:
                          technicalMetrics?.total_sessions && technicalMetrics.total_sessions > 0
                            ? `${((technicalMetrics.active_sessions_24h || 0) / technicalMetrics.total_sessions) * 100}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pic d'Utilisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-4xl font-bold">{technicalMetrics?.peak_usage_info?.hour ?? 0}h00</p>
                  <p className="text-muted-foreground mt-2">
                    {technicalMetrics?.peak_usage_info?.sessions_count ?? 0} sessions
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Heure de pointe</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DashboardMetrics
