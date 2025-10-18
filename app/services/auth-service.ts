import { buildApiUrl } from "../../config/api"

interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

interface User {
  user_id: string
  username?: string
  role?: string
  [key: string]: any
}

interface UserProfile {
  user_id: string
  lang: string
  user_type: string
  preferences: Record<string, any>
}

interface ApiError extends Error {
  status?: number
  detail?: string
}

class AuthService {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
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

  async apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    }

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    const baseUrl = "https://api.rpms-tunisie.com/db/api"
    const fullUrl = `${baseUrl}${cleanEndpoint}`

    console.log("[v0] API Request:", fullUrl)

    try {
      let response = await fetch(fullUrl, {
        ...options,
        headers,
      })

      if (response.status === 401 && this.refreshToken) {
        console.log("🔄 Token expired, refreshing...")
        const refreshed = await this.refreshAccessToken()
        if (refreshed) {
          const newHeaders = {
            ...headers,
            Authorization: `Bearer ${this.accessToken}`,
          }
          response = await fetch(fullUrl, {
            ...options,
            headers: newHeaders,
          })
        } else {
          this.logout()
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))

        console.error("[v0] API Error:", {
          status: response.status,
          endpoint: cleanEndpoint,
          detail: errorData.detail,
        })

        const error = new Error(`API error: ${response.status}`) as ApiError
        error.status = response.status
        error.detail = errorData.detail
        throw error
      }

      return response
    } catch (error) {
      console.error("[v0] Request failed:", error)
      throw error
    }
  }

  async getDashboardStats(): Promise<any> {
    const response = await this.apiRequest("/dashboard/stats")
    return response.json()
  }

  async getAllUsers(limit = 100, offset = 0): Promise<any> {
    const response = await this.apiRequest(`/dashboard/users?limit=${limit}&offset=${offset}`)
    return response.json()
  }

  async getAllSessions(): Promise<any> {
    console.log("[v0] Fetching all sessions from /dashboard/user/sessions")
    const response = await this.apiRequest(`/dashboard/user/sessions`)
    return response.json()
  }

  async getUserSessions(userId: string): Promise<any> {
    const response = await this.apiRequest(`/dashboard/user/${userId}/sessions`)
    return response.json()
  }

  async getActiveSessions(hours = 24): Promise<any> {
    const response = await this.apiRequest(`/dashboard/sessions/active?hours=${hours}`)
    return response.json()
  }

  async getUserDetails(userId: string): Promise<UserProfile> {
    try {
      console.log("[v0] Fetching user details for:", userId)
      const response = await this.apiRequest(`/user/${userId}`)
      return response.json()
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 404) {
        console.error("[v0] User not found:", userId)
        throw new Error(`User ${userId} not found in database`)
      }
      if (apiError.status === 500) {
        console.warn("[v0] Backend error fetching user details, returning empty profile:", userId)
        return {
          user_id: userId,
          lang: "en",
          user_type: "unknown",
          preferences: {},
        }
      }
      throw error
    }
  }

  async getSessionHistory(sessionId: string): Promise<any> {
    const response = await this.apiRequest(`/dashboard/session/${sessionId}/history`)
    return response.json()
  }

  async deleteUser(userId: string): Promise<any> {
    const response = await this.apiRequest(`/dashboard/user/${userId}`, {
      method: "DELETE",
    })
    return response.json()
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.apiRequest("/auth/me")
    return response.json()
  }

  async get(endpoint: string): Promise<any> {
    const response = await this.apiRequest(endpoint)
    return response.json()
  }

  async post(endpoint: string, data: any): Promise<any> {
    const response = await this.apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response.json()
  }

  async put(endpoint: string, data: any): Promise<any> {
    const response = await this.apiRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return response.json()
  }

  async delete(endpoint: string): Promise<any> {
    const response = await this.apiRequest(endpoint, {
      method: "DELETE",
    })
    return response.json()
  }
}

export const authService = new AuthService()