"use client"

import { useEffect, useState } from "react"
import { Clock, Loader2 } from "lucide-react"
import { authService } from "@/app/services/auth-service"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SessionWithDuration {
  session_id: string
  user_type: string
  duration_minutes: number
}

interface SessionDurationProps {
  activeSessions?: {
    active_sessions: any[]
    count: number
  } | null
}

export function SessionDurationComponent({ activeSessions }: SessionDurationProps) {
  const [sessionsWithDuration, setSessionsWithDuration] = useState<SessionWithDuration[]>([])
  const [loading, setLoading] = useState(false)

  const calculateDurationInMinutes = (lastActive: string): number => {
    const now = new Date()
    const lastActiveDate = new Date(lastActive)
    return Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60))
  }

  const fetchSessionDurations = async () => {
    setLoading(true)
    try {
      let sessions = activeSessions?.active_sessions || []
      
      if (!sessions.length) {
        const sessionsData = await authService.getActiveSessions(24)
        sessions = sessionsData.active_sessions || []
      }

      const sessionsWithDurationData = sessions.map(session => ({
        session_id: session.session_id,
        user_type: session.user_type,
        duration_minutes: calculateDurationInMinutes(session.last_active)
      }))

      setSessionsWithDuration(sessionsWithDurationData)
    } catch (error) {
      console.error("Error fetching session durations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessionDurations()
  }, [activeSessions])

  const getUserTypeColor = (userType: string) => {
    switch (userType.toLowerCase()) {
      case 'student':
        return 'bg-purple-100 text-purple-800'
      case 'visitor':
        return 'bg-gray-100 text-gray-800'
      case 'premium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#29C2E2]" />
          Duration of Sessions
        </CardTitle>
       
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin text-[#29C2E2] mr-2" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : sessionsWithDuration.length > 0 ? (
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Type d'utilisateur</TableHead>
                  <TableHead>Durée (minutes)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsWithDuration.map((session) => (
                  <TableRow key={session.session_id}>
                    <TableCell className="font-mono text-xs">
                      {session.session_id}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getUserTypeColor(session.user_type)}
                      >
                        {session.user_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {session.duration_minutes} min
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center p-6 text-muted-foreground">
            <Clock className="h-8 w-8 mb-2" />
            <p className="text-sm">Aucune session trouvée</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}