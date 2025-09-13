"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, RefreshCw, AlertCircle, Trash2 } from "lucide-react"
import { authService } from "@/app/services/auth-service"

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

interface ActiveSession {
  session_id: string
  user_id: string
  last_active: string
  message_count: number
  user_type: string
}

interface ActiveSessionsResponse {
  active_sessions: ActiveSession[]
  count: number
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
}

export function ActiveSessionsTable() {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [count, setCount] = useState(0)
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

  const fetchSessions = async () => {
    setIsLoading(true)
    setError(null)
    setIsEmpty(false)

    try {
      console.log(`Fetching active sessions for last ${hours} hours`)
      const data = await authService.getActiveSessions(parseInt(hours))
      console.log("Active sessions data:", data)

      // Check if the response is empty or doesn't have the expected structure
      if (!data || typeof data !== "object") {
        setIsEmpty(true)
        setSessions([])
        setCount(0)
        return
      }

      // Handle different response formats
      if (Array.isArray(data)) {
        // If the response is directly an array of sessions
        setSessions(data)
        setCount(data.length)
      } else if (data.active_sessions && Array.isArray(data.active_sessions)) {
        // If the response has the expected structure
        setSessions(data.active_sessions)
        setCount(typeof data.count === "number" ? data.count : data.active_sessions.length)
      } else if (Object.keys(data).length === 0) {
        // Empty object response
        setIsEmpty(true)
        setSessions([])
        setCount(0)
      } else {
        // Unexpected format
        console.warn("Unexpected active sessions response format:", data)
        setIsEmpty(true)
        setSessions([])
        setCount(0)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      console.error("Active sessions error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    setIsDeleting(true)
    try {
      const response = await authService.apiRequest(`/api/v1/chat/dashboard/session/${sessionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.status}`)
      }

      // Refresh the sessions list
      fetchSessions()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to delete session: ${errorMessage}`)
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [hours])

  const isAdmin = currentUserRole === "admin"
  console.log("Is admin in sessions:", isAdmin, "Current role:", currentUserRole)

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Active Sessions</div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Time window:</span>
            <Select value={hours} onValueChange={setHours}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select hours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Last 6 hours</SelectItem>
                <SelectItem value="12">Last 12 hours</SelectItem>
                <SelectItem value="24">Last 24 hours</SelectItem>
                <SelectItem value="48">Last 48 hours</SelectItem>
                <SelectItem value="72">Last 72 hours</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchSessions}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                <strong>Error:</strong> {error}
              </p>
              <div className="text-xs text-muted-foreground">
                <p>
                  <strong>Troubleshooting:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Make sure your API server is running</li>
                  <li>Check that the active sessions endpoint exists</li>
                  <li>Verify your authentication is valid</li>
                  <li>Try logging out and back in</li>
                </ul>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">0 active sessions in the last {hours} hours</div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Time window:</span>
            <Select value={hours} onValueChange={setHours}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select hours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Last 6 hours</SelectItem>
                <SelectItem value="12">Last 12 hours</SelectItem>
                <SelectItem value="24">Last 24 hours</SelectItem>
                <SelectItem value="48">Last 48 hours</SelectItem>
                <SelectItem value="72">Last 72 hours</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchSessions}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            No active sessions found. There might be no active sessions in the selected time window or the database
            might be empty.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {count} active sessions in the last {hours} hours
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Time window:</span>
          <Select value={hours} onValueChange={setHours}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select hours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">Last 6 hours</SelectItem>
              <SelectItem value="12">Last 12 hours</SelectItem>
              <SelectItem value="24">Last 24 hours</SelectItem>
              <SelectItem value="48">Last 48 hours</SelectItem>
              <SelectItem value="72">Last 72 hours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchSessions}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>User Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
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
                                undone and will remove all messages and data associated with this session.
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
    </div>
  )
}