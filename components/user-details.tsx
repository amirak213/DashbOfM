"use client"

import { useEffect, useState } from "react"
import { Loader2, User, Calendar, MapPin, Phone, Mail, Building, Tag, MessageSquare, Clock, Settings, Heart } from "lucide-react"
import { authService } from "@/app/services/auth-service"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UserData {
  user_id: string
  session_id: string
  user_type: string
  interests: Record<string, any>
  interaction_count: number
  first_seen: string
  last_seen: string
  location: string | null
  visited_pages: string[]
  preferences: Record<string, any>
  content_proposals: Record<string, any>
  communique_de_presse: string
  affiche_ou_visuel: string
  liens_utiles: string[]
  coordonnees_contact: {
    fullName: string
    phone_number: string
    email: string
  }
  business_interests: string[]
  requested_services: string[]
}

interface Message {
  role: string
  content: string
  timestamp: string
}

interface Session {
  session_id: string
  created_at: string
  last_active: string
  message_count: number
  conversation_message_count: number
  last_user_message: string
  messages: Message[]
}

interface UserDetailsProps {
  userId: string
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
}

function renderObjectValue(value: any): string {
  if (value === null || value === undefined) {
    return "Not specified"
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

export function UserDetails({ userId }: UserDetailsProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [userError, setUserError] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoadingUser(true)
      setUserError(null)
      
      try {
        console.log("Fetching user data for:", userId)
        const data = await authService.get(`/chat/user/${userId}`)
        console.log("User data received:", data)
        setUserData(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
        setUserError(`Failed to load user details: ${errorMessage}`)
        console.error("User details fetch error:", err)
      } finally {
        setIsLoadingUser(false)
      }
    }

    const fetchHistory = async () => {
      setIsLoadingHistory(true)
      setHistoryError(null)

      try {
        console.log("Fetching history for:", userId)
        const data = await authService.get(`/chat/history/${userId}`)
        console.log("History data received:", data)

        if (Array.isArray(data)) {
          setSessions(data)
        } else if (data && typeof data === "object" && Array.isArray(data.sessions)) {
          setSessions(data.sessions)
        } else {
          setSessions([])
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
        setHistoryError(`Failed to load conversation history: ${errorMessage}`)
        console.error("History fetch error:", err)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    if (userId) {
      fetchUserData()
      fetchHistory()
    }
  }, [userId])

  const totalMessages = sessions.reduce((total, session) => total + session.message_count, 0)

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (userError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{userError}</AlertDescription>
      </Alert>
    )
  }

  if (!userData) {
    return (
      <Alert>
        <AlertDescription>No user data found.</AlertDescription>
      </Alert>
    )
  }

  const hasPreferences = userData.preferences && Object.keys(userData.preferences).length > 0
  const hasInterests = userData.interests && Object.keys(userData.interests).length > 0

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details">User Details</TabsTrigger>
        <TabsTrigger value="preferences" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Preferences & Interests
          {(hasPreferences || hasInterests) && (
            <Badge variant="secondary" className="ml-1">
              {Object.keys(userData.preferences || {}).length + Object.keys(userData.interests || {}).length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Conversation History
          {!isLoadingHistory && sessions.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {sessions.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-6">
        {/* Basic Information */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium">User ID:</span>
                <p className="text-sm text-muted-foreground">{userData.user_id}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Session ID:</span>
                <p className="text-sm text-muted-foreground font-mono">{userData.session_id}</p>
              </div>
              <div>
                <span className="text-sm font-medium">User Type:</span>
                <Badge variant="secondary" className="ml-2">
                  {userData.user_type}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium">Interactions:</span>
                <p className="text-2xl font-bold">{userData.interaction_count}</p>
              </div>
              <div>
                <span className="text-sm font-medium">First Seen:</span>
                <p className="text-sm text-muted-foreground">{formatDate(userData.first_seen)}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Last Seen:</span>
                <p className="text-sm text-muted-foreground">{formatDate(userData.last_seen)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location & Pages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium">Location:</span>
                <p className="text-sm text-muted-foreground">{userData.location || "Not specified"}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Visited Pages:</span>
                <p className="text-sm text-muted-foreground">
                  {userData.visited_pages?.length > 0 ? userData.visited_pages.length : "None"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        {(userData.coordonnees_contact?.fullName ||
          userData.coordonnees_contact?.email ||
          userData.coordonnees_contact?.phone_number) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {userData.coordonnees_contact.fullName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Full Name</p>
                    <p className="text-sm text-muted-foreground">{userData.coordonnees_contact.fullName}</p>
                  </div>
                </div>
              )}
              {userData.coordonnees_contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{userData.coordonnees_contact.email}</p>
                  </div>
                </div>
              )}
              {userData.coordonnees_contact.phone_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{userData.coordonnees_contact.phone_number}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Business Information */}
        <div className="grid gap-4 md:grid-cols-2">
          {userData.business_interests && userData.business_interests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Business Interests
                </CardTitle>
                <CardDescription>Areas of business interest</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userData.business_interests.map((interest, index) => (
                    <Badge key={index} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {userData.requested_services && userData.requested_services.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Requested Services
                </CardTitle>
                <CardDescription>Services the user is interested in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userData.requested_services.map((service, index) => (
                    <Badge key={index} variant="secondary">
                      {service}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Additional Information */}
        {(userData.liens_utiles?.length > 0 || userData.communique_de_presse || userData.affiche_ou_visuel) && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userData.communique_de_presse && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Press Release</h4>
                  <p className="text-sm text-muted-foreground">{userData.communique_de_presse}</p>
                </div>
              )}

              {userData.affiche_ou_visuel && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Visual/Poster</h4>
                  <p className="text-sm text-muted-foreground">{userData.affiche_ou_visuel}</p>
                </div>
              )}

              {userData.liens_utiles && userData.liens_utiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Useful Links</h4>
                  <ul className="space-y-1">
                    {userData.liens_utiles.map((link, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="preferences" className="space-y-6">
        {/* User Preferences */}
        {hasPreferences && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                User Preferences
              </CardTitle>
              <CardDescription>Settings and preferences configured by the user</CardDescription>
            </CardHeader>
            <CardContent>
  <div className="grid gap-4 md:grid-cols-2">
    {Object.entries(userData.preferences).map(([key, value]) => (
      <div key={key} className="p-4 border rounded-lg bg-muted/50">
        <h4 className="font-medium text-sm capitalize mb-2">
          {key.replace(/_/g, " ")}
        </h4>
        <div className="text-sm text-muted-foreground">
          {typeof value === "object" && value !== null ? (
            <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(value, null, 2)}
            </pre>
          ) : (
            <p className="break-words">{renderObjectValue(value)}</p>
          )}
        </div>
      </div>
    ))}
  </div>
</CardContent>
          </Card>
        )}

        {/* User Interests */}
        {hasInterests && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                User Interests
              </CardTitle>
              <CardDescription>Topics and areas the user has shown interest in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(userData.interests).map(([key, value]) => (
                  <div key={key} className="p-4 border rounded-lg bg-primary/5">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm capitalize">
                        {key.replace(/_/g, " ")}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {typeof value}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {typeof value === "object" && value !== null ? (
                        <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        <p className="break-words">{renderObjectValue(value)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!hasPreferences && !hasInterests && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No Preferences or Interests Found</p>
            <p className="text-sm text-muted-foreground">
              This user hasn't configured any preferences or shown specific interests yet.
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        {/* History Overview */}
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Messages/Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessions.length > 0 ? (totalMessages / sessions.length).toFixed(1) : "0"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions */}
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : historyError ? (
          <Alert variant="destructive">
            <AlertDescription>{historyError}</AlertDescription>
          </Alert>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No conversation history found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.session_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Session {session.session_id.slice(0, 8)}...</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{session.message_count} messages</Badge>
                      <span className="text-sm text-muted-foreground">{formatDate(session.created_at)}</span>
                    </div>
                  </div>
                  <CardDescription>
                    Last active: {formatDate(session.last_active)}
                    {session.last_user_message && (
                      <span className="block mt-1">
                        <strong>Last message:</strong> {session.last_user_message}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] w-full">
                    <div className="space-y-3">
                      {session.messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={message.role === "user" ? "secondary" : "outline"} className="text-xs">
                                {message.role === "user" ? "User" : "Assistant"}
                              </Badge>
                              <span className="text-xs opacity-70 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(message.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}