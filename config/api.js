export const API_CONFIG = {
  BASE_URL: "https://api.rpms-tunisie.com",
  PREFIX: "/db/api",
  TIMEOUT: 30000,

  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REFRESH: "/auth/refresh",
      LOGOUT: "/auth/logout",
      ME: "/auth/me",
    },
    CHAT: {
      SEND: "/send",
      SESSIONS: "/dashboard/user/sessions",
      DASHBOARD: {
        STATS: "/dashboard/stats",
        USERS: "/dashboard/users",
        USER_SESSIONS: "/user",
        ACTIVE_SESSIONS: "/dashboard/sessions/active",
        ANALYTICS: "/dashboard/analytics/daily",
      },
    },
  },
}

export const buildApiUrl = (endpoint) => {
  const baseUrl = API_CONFIG.BASE_URL.trim()
  const fullUrl = `${baseUrl}${API_CONFIG.PREFIX}${endpoint}`
  return fullUrl
}

export const buildDashboardUrl = (endpoint, params = "") => {
  const url = buildApiUrl(API_CONFIG.ENDPOINTS.CHAT.DASHBOARD[endpoint] || endpoint)
  return params ? `${url}${params}` : url
}

export const getExternalApiUrl = (endpoint) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  return `${baseUrl}${endpoint}`
}
