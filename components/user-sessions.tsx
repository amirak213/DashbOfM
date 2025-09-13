"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { authService } from "@/app/services/auth-service"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UserSession {
  session_id: string
  user_id: string
  created_at: string
  last_active: string
  message_count: number
  duration_minutes: number
  user_type: string
  detected_intents: string[]
}

interface UserSessionsProps {
  userId: string
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  return `${hours}h ${remainingMinutes}m`
}

export function UserSessions({ userId }: UserSessionsProps) {
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        console.log("Fetching sessions for user:", userId)
        const data = await authService.getUserSessions(userId)
        console.log("User sessions data:", data)
        
        // Handle array response or object with sessions property
        if (Array.isArray(data)) {
          setSessions(data)
        } else if (data && typeof data === 'object' && Array.isArray(data.sessions)) {
          setSessions(data.sessions)
        } else {
          setSessions([])
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
        setError(`Failed to load user sessions: ${errorMessage}`)
        console.error("User sessions fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchSessions()
    }
  }, [userId])

  // Calculate summary statistics
  const totalMessages = sessions.reduce((sum, session) => sum + session.message_count, 0)
  const totalDuration = sessions.reduce((sum, session) => sum + session.duration_minutes, 0)
  const avgMessagesPerSession = sessions.length > 0 ? totalMessages / sessions.length : 0

  // Get all unique intents across sessions
  const allIntents = sessions.flatMap((session) => session.detected_intents || [])
  const uniqueIntents = [...new Set(allIntents)].filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-muted-foreground">{avgMessagesPerSession.toFixed(1)} avg per session</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Intents card */}
      {uniqueIntents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detected Intents</CardTitle>
            <CardDescription>All intents detected across user sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {uniqueIntents.map((intent) => (
                <div key={intent} className="rounded-full bg-secondary px-3 py-1 text-sm">
                  {intent}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Intents</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No sessions found for this user.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.session_id}>
                  <TableCell className="font-medium">{session.session_id}</TableCell>
                  <TableCell>{formatDate(session.created_at)}</TableCell>
                  <TableCell>{formatDate(session.last_active)}</TableCell>
                  <TableCell>{formatDuration(session.duration_minutes)}</TableCell>
                  <TableCell>{session.message_count}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(session.detected_intents || []).map((intent, index) => (
                        <div key={`${intent}-${index}`} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                          {intent}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}