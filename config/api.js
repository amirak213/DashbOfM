export const API_CONFIG = {
  BASE_URL: "http://127.0.0.1:8000",
  PREFIX: "/api/v1", // Removed /chat, using base prefix only
  TIMEOUT: 30000,

  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REFRESH: "/auth/refresh",
      LOGOUT: "/auth/logout",
      ME: "/auth/me",
    },
    CHAT: {
      SEND: "/chat/send",
      SESSIONS: "/chat/sessions",
    },
    DASHBOARD: {
      STATS: "/dashboard/stats",
      USERS: "/dashboard/users",
      USER_SESSIONS: "/dashboard/user",
      ACTIVE_SESSIONS: "/dashboard/sessions/active",
    },
  },
}

// Note: Make sure your FastAPI backend has CORS configured to allow requests from your frontend domain
// The backend should include: app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], ...)

export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.PREFIX}${endpoint}`
}

export const buildDashboardUrl = (endpoint, params = "") => {
  const url = buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD[endpoint] || endpoint)
  return params ? `${url}${params}` : url
}
