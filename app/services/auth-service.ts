import { buildApiUrl } from "../../config/api.js"

interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

class AuthService {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    // Charger les tokens uniquement depuis localStorage
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token")
      this.refreshToken = localStorage.getItem("refresh_token")
    }
  }

  async login(username: string, password: string): Promise<void> {
    const response = await fetch(buildApiUrl("/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      throw new Error("Login failed")
    }

    const data: LoginResponse = await response.json()
    this.accessToken = data.access_token
    this.refreshToken = data.refresh_token

    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false

    try {
      const response = await fetch(buildApiUrl("/auth/refresh"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.refreshToken}`,
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      })

      if (!response.ok) return false

      const data: LoginResponse = await response.json()
      this.accessToken = data.access_token
      this.refreshToken = data.refresh_token

      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", data.access_token)
        localStorage.setItem("refresh_token", data.refresh_token)
      }

      return true
    } catch {
      return false
    }
  }

  logout(): void {
    this.accessToken = null
    this.refreshToken = null

    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  // Méthode pour faire des requêtes API avec token dans les headers
  async apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    }

    // Ajouter le token d'authentification dans les headers
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`
    }

    // S'assurer que l'endpoint commence par /
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    const fullUrl = buildApiUrl(cleanEndpoint)

    console.log("🚀 Making API request to:", fullUrl)
    console.log("🚀 Request headers:", headers)

    try {
      let response = await fetch(fullUrl, {
        ...options,
        headers,
      })

      console.log("📥 Response status:", response.status)

      // Si la réponse n'est pas ok, loguer le contenu
      if (!response.ok) {
        const errorText = await response.clone().text()
        console.error("❌ API Error Response:", errorText)
      }

      // Rafraîchir token si expiré (401)
      if (response.status === 401 && this.refreshToken) {
        console.log("🔄 Token expired, refreshing...")
        const refreshed = await this.refreshAccessToken()
        if (refreshed) {
          // Refaire la requête avec le nouveau token
          const newHeaders = {
            ...headers,
            Authorization: `Bearer ${this.accessToken}`,
          }
          console.log("🔄 Retrying with new token")
          response = await fetch(fullUrl, {
            ...options,
            headers: newHeaders,
          })
          console.log("📥 Retry response status:", response.status)
        } else {
          // Si le refresh échoue, déconnecter l'utilisateur
          this.logout()
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
        }
      }

      return response
    } catch (error) {
      console.error("🚨 Fetch error:", error)
      throw error
    }
  }

  // Méthodes spécifiques pour le dashboard
  async getDashboardStats() {
    const response = await this.apiRequest("/chat/dashboard/stats")
    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard stats: ${response.status}`)
    }
    return response.json()
  }

  async getAllUsers(limit = 100, offset = 0) {
    const response = await this.apiRequest(`/chat/dashboard/users?limit=${limit}&offset=${offset}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`)
    }
    return response.json()
  }

  async getUserSessions(userId: string) {
    const response = await this.apiRequest(`/chat/dashboard/user/${userId}/sessions`)
    if (!response.ok) {
      throw new Error(`Failed to fetch user sessions: ${response.status}`)
    }
    return response.json()
  }

  async getActiveSessions(hours = 24) {
    const response = await this.apiRequest(`/chat/dashboard/sessions/active?hours=${hours}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch active sessions: ${response.status}`)
    }
    return response.json()
  }

  async deleteUser(userId: string) {
    const response = await this.apiRequest(`/chat/dashboard/user/${userId}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.status}`)
    }
    return response.json()
  }

  async getCurrentUser() {
    const response = await this.apiRequest("/auth/me")
    if (!response.ok) {
      throw new Error(`Failed to fetch current user: ${response.status}`)
    }
    return response.json()
  }

  // Méthodes génériques
  async get(endpoint: string) {
    const response = await this.apiRequest(endpoint)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    return response.json()
  }

  async post(endpoint: string, data: any) {
    const response = await this.apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    return response.json()
  }

  async put(endpoint: string, data: any) {
    const response = await this.apiRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    return response.json()
  }

  async delete(endpoint: string) {
    const response = await this.apiRequest(endpoint, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    return response.json()
  }
}

export const authService = new AuthService()
