"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, RefreshCw, AlertCircle, Trash2 } from "lucide-react"
import { authService } from "@/app/services/auth-service"

import { Button } from "@/components/ui/button"
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
  created_at?: string
  last_active: string
  message_count: number
  duration_minutes?: number
  user_type: string
  detected_intents?: string[]
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
      const data = await authService.getAllSessions()

      if (!data) {
        setIsEmpty(true)
        setSessions([])
        setCount(0)
        return
      }

      // Backend returns array directly
      if (Array.isArray(data)) {
        setSessions(data)
        setCount(data.length)
        setIsEmpty(data.length === 0)
      }
      // If it's an object with sessions property
      else if (data.sessions && Array.isArray(data.sessions)) {
        setSessions(data.sessions)
        setCount(data.count || data.sessions.length)
        setIsEmpty(data.sessions.length === 0)
      }
      // Unexpected format
      else {
        setError(`Unexpected data format: ${typeof data}`)
        setIsEmpty(true)
        setSessions([])
        setCount(0)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      console.error("Error fetching sessions:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    setIsDeleting(true)
    try {
      const response = await authService.apiRequest(`/dashboard/session/${sessionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.status}`)
      }

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

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Active Sessions</div>
          <Button variant="outline" size="sm" onClick={fetchSessions}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
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
                  <li>Check endpoint: /dashboard/user/sessions</li>
                  <li>Verify your authentication token is valid</li>
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
          <div className="text-sm text-muted-foreground">0 sessions found</div>
          <Button variant="outline" size="sm" onClick={fetchSessions}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        <Alert>
          <AlertDescription>
            No sessions found. The database might be empty or there are no sessions yet.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {count} session{count !== 1 ? "s" : ""} found
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
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
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
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
                  No sessions found.
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
