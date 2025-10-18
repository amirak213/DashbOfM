"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Loader2, Search, Trash2, RefreshCw, Calendar } from "lucide-react"
import { authService } from "@/app/services/auth-service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEmpty, setIsEmpty] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [limit] = useState(10)
  const [offset, setOffset] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  
  // ✨ NOUVEAUX FILTRES DE PÉRIODE
  const [period, setPeriod] = useState<"day" | "week" | "month">("day")
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

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    setIsEmpty(false)

    try {
      console.log("Fetching users with filters:", { limit, offset, period, days })
      
      // ✨ MODIFICATION: Construction de l'URL avec les paramètres de période
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        period: period,
        days: days
      })
      
      // Utilisation de apiRequest au lieu de getAllUsers pour passer les paramètres personnalisés
      const response = await authService.apiRequest(`/api/v1/chat/dashboard/users?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      console.log("Users data received:", data)

      if (!data) {
        setIsEmpty(true)
        setUsers([])
        return
      }

      if (Array.isArray(data)) {
        if (data.length === 0) {
          setIsEmpty(true)
        }
        setUsers(data)
        return
      }

      if (typeof data === "object") {
        if (data.users && Array.isArray(data.users)) {
          if (data.users.length === 0) {
            setIsEmpty(true)
          }
          setUsers(data.users)
          return
        }

        if (Object.keys(data).length === 0) {
          setIsEmpty(true)
          setUsers([])
          return
        }
      }

      console.warn("Unexpected users data format:", data)
      setIsEmpty(true)
      setUsers([])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to load users: ${errorMessage}`)
      console.error("Users fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // ✨ MODIFICATION: Ajout des dépendances period et days
  useEffect(() => {
    fetchUsers()
  }, [offset, limit, period, days])

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true)
    try {
      const response = await authService.apiRequest(`/api/v1/chat/dashboard/user/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status}`)
      }

      fetchUsers()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to delete user: ${errorMessage}`)
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.user_type && user.user_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.most_common_intent && user.most_common_intent.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const isAdmin = currentUserRole === "admin"

  if (isEmpty) {
    return (
      <div className="space-y-4">
        {/* ✨ NOUVEAU: Header avec filtres pour l'état vide */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des utilisateurs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={period} onValueChange={(value: "day" | "week" | "month") => setPeriod(value)} disabled>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Jour</SelectItem>
                <SelectItem value="week">Semaine</SelectItem>
                <SelectItem value="month">Mois</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={days} onValueChange={setDays} disabled>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="60">60 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            Aucun utilisateur trouvé. La base de données est peut-être vide ou il n'y a pas de données pour la période sélectionnée.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ✨ NOUVEAU: Header avec filtres de période */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des utilisateurs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          
          {/* Filtre de période (jour/semaine/mois) */}
          <Select value={period} onValueChange={(value: "day" | "week" | "month") => setPeriod(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Filtre de nombre de jours */}
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="60">60 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Bouton refresh */}
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
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
              <TableHead>ID Utilisateur</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Premier Vu</TableHead>
              <TableHead>Dernier Vu</TableHead>
              <TableHead>Intention Commune</TableHead>
              <TableHead>Langues</TableHead>
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
            ) : error ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} className="h-24 text-center text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} className="h-24 text-center">
                  Aucun utilisateur trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/user/${user.user_id}`} className="text-primary hover:underline">
                      {user.user_id}
                    </Link>
                  </TableCell>
                  <TableCell>{user.user_type || "N/A"}</TableCell>
                  <TableCell>{user.total_sessions}</TableCell>
                  <TableCell>{user.total_messages}</TableCell>
                  <TableCell>{user.first_seen ? formatDate(user.first_seen) : "N/A"}</TableCell>
                  <TableCell>{user.last_seen ? formatDate(user.last_seen) : "N/A"}</TableCell>
                  <TableCell>{user.most_common_intent || "N/A"}</TableCell>
                  <TableCell>{user.languages_used?.join(", ") || "N/A"}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Supprimer l'utilisateur</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer les Données Utilisateur</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer toutes les données de l'utilisateur {user.user_id} ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.user_id)}
                              disabled={isDeleting}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Suppression...
                                </>
                              ) : (
                                "Supprimer"
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
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOffset(offset + limit)}
          disabled={users.length < limit || isLoading}
        >
          Suivant
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}