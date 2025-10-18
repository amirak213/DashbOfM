"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Loader2, Search, Trash2 } from "lucide-react"
import { authService } from "@/app/services/auth-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  user_id: string
  total_sessions: number
  total_messages: number
  first_seen: string
  last_seen: string
  user_type: string
  most_common_intent: string
  languages_used: string[]
}

interface UserProfile {
  user_id: string
  lang: string
  user_type: string
  preferences: Record<string, any>
}

interface DailyAnalytics {
  date: string
  new_users: number
}

const COLORS = ["#29C2E2", "#e354bfff", "#4809beff", "#0fab84ff", "#afee04ff", "#FFC658", "#FF8042"]

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEmpty, setIsEmpty] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [limit] = useState(10)
  const [offset, setOffset] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [days, setDays] = useState("30")

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

  const fetchUsersData = async () => {
    setIsLoading(true)
    setError(null)
    setIsEmpty(false)

    try {
      // Fetch users list
      const data = await authService.getAllUsers(limit, offset)

      if (!data || (Array.isArray(data) && data.length === 0)) {
        setIsEmpty(true)
        setUsers([])
        return
      }

      const usersArray = Array.isArray(data) ? data : data.users || []
      setUsers(usersArray)

      // Fetch all users for analytics
      const allUsersData = await authService.get(`/dashboard/users?limit=1000&offset=0`)
      setTotalUsers(allUsersData.length)

      // Fetch user profiles for detailed analysis
      const profilePromises = allUsersData
        .slice(0, 100)
        .map((user: User) => authService.get(`/user/${user.user_id}`).catch(() => null))

      const profiles = (await Promise.all(profilePromises)).filter((p) => p !== null) as UserProfile[]
      setUserProfiles(profiles)

      // Fetch analytics for new users trend
      try {
        const analyticsData = await authService.get(`/dashboard/analytics/daily?days=${days}`)
        setDailyAnalytics(analyticsData.daily_analytics || [])
      } catch (analyticsError) {
        console.error("Failed to fetch analytics:", analyticsError)
        setDailyAnalytics([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to load users: ${errorMessage}`)
      console.error("Users fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsersData()
  }, [offset, limit, days])

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true)
    try {
      const response = await authService.apiRequest(`/user/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status}`)
      }

      fetchUsersData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to delete user: ${errorMessage}`)
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.user_type && user.user_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.most_common_intent && user.most_common_intent.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!matchesSearch) return false

    // Filter by period based on last_seen date
    if (user.last_seen) {
      const lastSeenDate = new Date(user.last_seen)
      const now = new Date()
      const daysAgo = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24))
      const selectedDays = Number.parseInt(days)

      return daysAgo <= selectedDays
    }

    return true
  })

  const isAdmin = currentUserRole === "admin"

  // Prepare chart data
  const userTypesData = userProfiles.reduce(
    (acc, profile) => {
      const type = profile.user_type || "unknown"
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const userTypesChartData = Object.entries(userTypesData).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
  }))

  const languageData = userProfiles.reduce(
    (acc, profile) => {
      if (profile.lang && profile.lang.trim()) {
        let cleanLang = profile.lang.trim().toLowerCase()

        if (cleanLang.includes("fren") || cleanLang.includes("fran")) {
          cleanLang = "french"
        } else if (cleanLang.includes("eng")) {
          cleanLang = "english"
        } else if (cleanLang.includes("arab")) {
          cleanLang = "arabic"
        }

        acc[cleanLang] = (acc[cleanLang] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const languageChartData = Object.entries(languageData).map(([lang, count]) => ({
    name: lang.toUpperCase(),
    value: count,
  }))

  const preferencesData = userProfiles.reduce(
    (acc, profile) => {
      if (profile.preferences && typeof profile.preferences === "object") {
        Object.entries(profile.preferences).forEach(([key]) => {
          if (key && key.trim() && key.length >= 2) {
            const preferences = key
              .split("\n")
              .map((p) => p.trim())
              .filter((p) => p.length >= 2)

            preferences.forEach((pref) => {
              const cleanPref = pref.toLowerCase().trim()
              if (!cleanPref.match(/^\d+$/) && !cleanPref.match(/^\d{4}-\d{2}-\d{2}/)) {
                acc[cleanPref] = (acc[cleanPref] || 0) + 1
              }
            })
          }
        })
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const preferencesChartData = Object.entries(preferencesData)
    .map(([preference, count]) => ({
      name: preference.charAt(0).toUpperCase() + preference.slice(1),
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  if (isEmpty) {
    return (
      <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold">👥 Users</h1>

        <Alert>
          <AlertDescription>
            No users found. The database might be empty or the users endpoint might not be returning data.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold">👥 Users</h1>

      {/* Liste des users avec leurs infos */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>Tableau détaillé</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barre de recherche et filtre période sur la même ligne */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium whitespace-nowrap">Period:</label>
                <Select value={days} onValueChange={setDays}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>First Seen</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Languages</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 9 : 8} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 9 : 8} className="h-24 text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          <Link href={`/user/${user.user_id}`} className="text-primary hover:underline">
                            {user.user_id}
                          </Link>
                        </TableCell>
                        <TableCell>{user.user_type || "N/A"}</TableCell>
                        <TableCell>{user.total_sessions}</TableCell>
                        <TableCell>{user.total_messages}</TableCell>
                        <TableCell>{user.first_seen ? formatDate(user.first_seen) : "N/A"}</TableCell>
                        <TableCell>{user.last_seen ? formatDate(user.last_seen) : "N/A"}</TableCell>
                        <TableCell>{user.languages_used?.join(", ") || "N/A"}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete user</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User Data</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete all data for user {user.user_id}? This action cannot
                                    be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.user_id)}
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
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(offset + limit)}
                disabled={users.length < limit || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}