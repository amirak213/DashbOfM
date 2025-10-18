"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw, Activity, MessageSquare, Clock, Users } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SessionByPeriod {
  period: string
  total_sessions: number
  unique_users: number
}

interface SessionsAnalytics {
  period: string
  date_range: {
    start: string
    end: string
  }
  sessions_by_period: SessionByPeriod[]
  average_messages_per_session: {
    avg: number
    min: number
    max: number
  }
  average_conversation_duration: {
    avg_minutes: number
    min_minutes: number
    max_minutes: number
  }
  activation_rate: {
    rate_percentage: number
    interacting_users: number
    total_visitors: number
  }
}

export function SessionsAnalytics() {
  const [analytics, setAnalytics] = useState<SessionsAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEmpty, setIsEmpty] = useState(false)
  const [period, setPeriod] = useState<"day" | "week" | "month">("day")
  const [days, setDays] = useState("30")

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    setIsEmpty(false)

    try {
      console.log("Fetching sessions analytics:", { period, days })
      const response = await fetch(
        `http://localhost:8100/api/dashboard/analytics/sessions?period=${period}&days=${days}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Sessions analytics data received:", data)

      if (!data || typeof data !== "object") {
        setIsEmpty(true)
        setAnalytics(null)
        return
      }

      if (!data.sessions_by_period || data.sessions_by_period.length === 0) {
        setIsEmpty(true)
        setAnalytics(null)
        return
      }

      setAnalytics(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to load sessions analytics: ${errorMessage}`)
      console.error("Sessions analytics fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [period, days])

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Sessions Analytics</h2>
          <div className="flex items-center gap-2">
            
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchAnalytics}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            No sessions analytics data available. The database might be empty or there are no sessions recorded yet.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Sessions Analytics</h2>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  const totalSessions = analytics.sessions_by_period.reduce((acc, curr) => acc + curr.total_sessions, 0)

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sessions Analytics</h2>
        <div className="flex items-center gap-2">
          
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Totales</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">{analytics.sessions_by_period.length} périodes</p>
          </CardContent>
        </Card>

        {/* Average Messages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Moyens/Session</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.average_messages_per_session.avg}</div>
            <p className="text-xs text-muted-foreground">
              Min: {analytics.average_messages_per_session.min} | Max: {analytics.average_messages_per_session.max}
            </p>
          </CardContent>
        </Card>

        {/* Average Duration */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durée Moyenne</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.average_conversation_duration.avg_minutes.toFixed(1)} min</div>
            <p className="text-xs text-muted-foreground">
              Min: {analytics.average_conversation_duration.min_minutes} | Max:{" "}
              {analytics.average_conversation_duration.max_minutes} min
            </p>
          </CardContent>
        </Card>

        {/* Activation Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Activation</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activation_rate.rate_percentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activation_rate.interacting_users} / {analytics.activation_rate.total_visitors} visiteurs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sessions Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Sessions au fil du temps</CardTitle>
            <CardDescription>
              Du {new Date(analytics.date_range.start).toLocaleDateString()} au{" "}
              {new Date(analytics.date_range.end).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.sessions_by_period}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total_sessions" stroke="#8884d8" name="Sessions" strokeWidth={2} />
                <Line
                  type="monotone"
                  dataKey="unique_users"
                  stroke="#82ca9d"
                  name="Utilisateurs uniques"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sessions Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des sessions</CardTitle>
            <CardDescription>Sessions vs utilisateurs uniques</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.sessions_by_period}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_sessions" fill="#8884d8" name="Sessions" />
                <Bar dataKey="unique_users" fill="#82ca9d" name="Utilisateurs uniques" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Détails par période</CardTitle>
          <CardDescription>Vue détaillée des sessions pour chaque période</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Période</th>
                  <th className="text-right p-2">Sessions</th>
                  <th className="text-right p-2">Utilisateurs Uniques</th>
                  <th className="text-right p-2">Sessions/Utilisateur</th>
                </tr>
              </thead>
              <tbody>
                {analytics.sessions_by_period.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2">{item.period}</td>
                    <td className="text-right p-2">{item.total_sessions}</td>
                    <td className="text-right p-2">{item.unique_users}</td>
                    <td className="text-right p-2">
                      {item.unique_users > 0 ? (item.total_sessions / item.unique_users).toFixed(2) : "0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}