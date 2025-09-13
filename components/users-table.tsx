"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Loader2, Search, Trash2 } from "lucide-react"
import { authService } from "@/app/services/auth-service"

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
      console.log("Fetching users with limit:", limit, "offset:", offset)
      const data = await authService.getAllUsers(limit, offset)

      console.log("Users data received:", data)

      // Handle different response formats
      if (!data) {
        setIsEmpty(true)
        setUsers([])
        return
      }

      // If data is an array, use it directly
      if (Array.isArray(data)) {
        if (data.length === 0) {
          setIsEmpty(true)
        }
        setUsers(data)
        return
      }

      // If data is an object, check if it has a users array property
      if (typeof data === "object") {
        if (data.users && Array.isArray(data.users)) {
          if (data.users.length === 0) {
            setIsEmpty(true)
          }
          setUsers(data.users)
          return
        }

        // If it's an empty object
        if (Object.keys(data).length === 0) {
          setIsEmpty(true)
          setUsers([])
          return
        }
      }

      // If we get here, the format is unexpected
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

  useEffect(() => {
    fetchUsers()
  }, [offset, limit])

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true)
    try {
      const response = await authService.apiRequest(`/api/v1/chat/dashboard/user/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status}`)
      }

      // Refresh the user list
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
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            disabled
          />
        </div>

        <Alert>
          <AlertDescription>
            No users found. The database might be empty or the users endpoint might not be returning data.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
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
              <TableHead>Common Intent</TableHead>
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
            ) : error ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} className="h-24 text-center text-red-500">
                  {error}
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
                            <span className="sr-only">Delete user</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User Data</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete all data for user {user.user_id}? This action cannot be
                              undone.
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
  )
}
