"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, RefreshCw, Activity, Clock, Trash2, TrendingUp } from "lucide-react"
import { authService } from "@/app/services/auth-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ActiveSession {
  session_id: string
  user_id: string
  last_active: string
  message_count: number
  user_type: string
}

interface DailyAnalytics {
  date: string
  sessions: number
  messages: number
}

interface BusinessMetrics {
  total_submissions: number
  submissions_by_type: Record<string, number>
  conversion_funnel: Record<string, number>
}

interface ActiveUsersAnalytics {
  timestamp: string
  active_users: {
    last_hour: number
    last_24_hours: number
    average_per_hour_24h: number
  }
  peak_hour: {
    hour: string | null
    active_users: number
  }
  hourly_breakdown: Array<{
    hour: string
    active_users: number
  }>
}

const COLORS = ["#29C2E2", "#e354bfff", "#4809beff", "#0fab84ff", "#afee04ff", "#FFC658", "#FF8042"]

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
}

function formatHour(hourString: string): string {
  try {
    return new Date(hourString).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return hourString
  }
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([])
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null)
  const [activeUsersAnalytics, setActiveUsersAnalytics] = useState<ActiveUsersAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEmpty, setIsEmpty] = useState(false)
  const [hours, setHours] = useState("24")
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

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

  const fetchSessionsData = async () => {
    setIsLoading(true)
    setError(null)
    setIsEmpty(false)

    try {
      // Fetch active sessions
      const sessionsData = await authService.getActiveSessions(Number.parseInt(hours))

      if (!sessionsData || (Array.isArray(sessionsData) && sessionsData.length === 0)) {
        setIsEmpty(true)
        setSessions([])
      } else {
        const sessionsArray = Array.isArray(sessionsData) ? sessionsData : sessionsData.active_sessions || []
        setSessions(sessionsArray)
      }

      // Fetch active users analytics with apiRequest
      try {
        const activeUsersResponse = await authService.apiRequest(`/dashboard/analytics/active-users`, {
          method: "GET",
        })

        if (activeUsersResponse.ok) {
          const activeUsersData = await activeUsersResponse.json()
          setActiveUsersAnalytics(activeUsersData)
        } else {
          console.error("Failed to fetch active users analytics:", activeUsersResponse.status)
          setActiveUsersAnalytics(null)
        }
      } catch (err) {
        console.error("Failed to fetch active users analytics:", err)
        setActiveUsersAnalytics(null)
      }

      // Fetch daily analytics for sessions & messages
      try {
        const analyticsResponse = await authService.apiRequest(`/dashboard/analytics/daily?days=30`, {
          method: "GET",
        })

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()
          setDailyAnalytics(analyticsData.daily_analytics || [])
        } else {
          console.error("Failed to fetch daily analytics:", analyticsResponse.status)
          setDailyAnalytics([])
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err)
        setDailyAnalytics([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      console.error("Sessions error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessionsData()
  }, [hours])

  const handleDeleteSession = async (sessionId: string) => {
    setIsDeleting(true)
    try {
      const response = await authService.apiRequest(`/dashboard/session/${sessionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.status}`)
      }

      fetchSessionsData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to delete session: ${errorMessage}`)
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const isAdmin = currentUserRole === "admin"

  // Prepare chart data
  const submissionsByTypeData = businessMetrics
    ? Object.entries(businessMetrics.submissions_by_type || {}).map(([key, value]) => ({
        name: key.replace(/_/g, " "),
        value,
      }))
    : []

  const conversionFunnelData = businessMetrics
    ? Object.entries(businessMetrics.conversion_funnel || {}).map(([key, value]) => ({
        name: key.replace(/_/g, " "),
        value,
      }))
    : []

  if (isEmpty && !isLoading) {
    return (
      <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold">🔄 Sessions</h1>

        <Alert>
          <AlertDescription>
            No active sessions found. There might be no active sessions in the selected time window.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🔄 Sessions</h1>
        <Button onClick={fetchSessionsData} variant="outline" className="flex items-center gap-2 bg-transparent">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Vue d'ensemble sessions - Updated with Active Users Analytics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-[#29C2E2]">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Actifs (1h)</CardTitle>
            <Activity className="h-5 w-5 text-[#1AAAC0]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeUsersAnalytics?.active_users.last_hour.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">utilisateurs uniques</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-[#54D2E3]">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Actifs (24h)</CardTitle>
            <Activity className="h-5 w-5 text-[#29C2E2]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeUsersAnalytics?.active_users.last_24_hours.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">utilisateurs uniques</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-[#1AAAC0]">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Moyenne par Heure</CardTitle>
            <TrendingUp className="h-5 w-5 text-[#29C2E2]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeUsersAnalytics?.active_users.average_per_hour_24h?.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">utilisateurs/heure</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-[#1AAAC0]">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Heure de Pointe</CardTitle>
            <Clock className="h-5 w-5 text-[#1AAAC0]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsersAnalytics?.peak_hour.active_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              {activeUsersAnalytics?.peak_hour.hour ? `à ${formatHour(activeUsersAnalytics.peak_hour.hour)}` : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Breakdown Chart */}
      {activeUsersAnalytics?.hourly_breakdown && activeUsersAnalytics.hourly_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activité Horaire (24h)</CardTitle>
            <CardDescription>Nombre d'utilisateurs actifs par heure</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activeUsersAnalytics.hourly_breakdown.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={formatHour} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip labelFormatter={formatHour} formatter={(value) => [`${value} utilisateurs`, "Actifs"]} />
                <Line
                  type="monotone"
                  dataKey="active_users"
                  stroke="#29C2E2"
                  strokeWidth={2}
                  dot={{ fill: "#29C2E2" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Loading and Error States */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#29C2E2]" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Conversion */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Soumissions par Type */}
        {submissionsByTypeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Soumissions par Type</CardTitle>
              <CardDescription>Distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={submissionsByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#29C2E2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Funnel de Conversion */}
        {conversionFunnelData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Funnel de Conversion</CardTitle>
              <CardDescription>Parcours utilisateur</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={conversionFunnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1AAAC0" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Liste des sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des sessions</CardTitle>
              <CardDescription>Sessions actives avec leurs infos</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={hours} onValueChange={setHours}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select hours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">Last 24 hours</SelectItem>
                  <SelectItem value="48">Last 48 hours</SelectItem>
                  <SelectItem value="168">Last 7 days</SelectItem>
                  <SelectItem value="720">Last 30 days</SelectItem>
                  <SelectItem value="1440">Last 60 days</SelectItem>
                  <SelectItem value="2160">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>User Type</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                      No active sessions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.session_id}>
                      <TableCell className="font-medium">{session.session_id}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/user/${session.user_id}`} className="text-primary hover:underline">
                          {session.user_id}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(session.last_active)}</TableCell>
                      <TableCell>{session.message_count}</TableCell>
                      <TableCell>{session.user_type || "N/A"}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/user/${session.user_id}`}>View User</Link>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete session</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Session</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete session {session.session_id}? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSession(session.session_id)}
                                    disabled={isDeleting}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    {isDeleting ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                      </>
                                    ) : (
                                      "Delete"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
