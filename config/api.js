export const API_CONFIG = {
  // Use environment variable for production, fallback to localhost for development
  BASE_URL:  "https://api.rpms-tunisie.com",
  PREFIX: "/api/v1",
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
      DASHBOARD: {
        STATS: "/chat/dashboard/stats",
        USERS: "/chat/dashboard/users",
        USER_SESSIONS: "/chat/dashboard/user",
        ACTIVE_SESSIONS: "/chat/dashboard/sessions/active",
        ANALYTICS: "/chat/dashboard/analytics/daily",
      },
    },
  },
}

// LOGS DE DEBUG - AJOUTEZ CECI TEMPORAIREMENT
console.log("🔍 Environment variable:", process.env.NEXT_PUBLIC_API_BASE_URL);
console.log("🔍 Final BASE_URL:", `'${API_CONFIG.BASE_URL}'`);

export const buildApiUrl = (endpoint) => {
  const baseUrl = API_CONFIG.BASE_URL.trim() // Supprime les espaces
  const fullUrl = `${baseUrl}${API_CONFIG.PREFIX}${endpoint}`

  // Log détaillé pour debug
  console.log("🔍 BASE_URL brut:", `'${API_CONFIG.BASE_URL}'`)
  console.log("🔍 BASE_URL après trim:", `'${baseUrl}'`)
  console.log("🔍 Endpoint:", endpoint)
  console.log("🔍 URL finale:", fullUrl)

  return fullUrl
}

export const buildDashboardUrl = (endpoint, params = "") => {
  const url = buildApiUrl(API_CONFIG.ENDPOINTS.CHAT.DASHBOARD[endpoint] || endpoint)
  return params ? `${url}${params}` : url
}

export const getExternalApiUrl = (endpoint) => {
  // For external API calls (like partnership and category stats)
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL 
  return `${baseUrl}${endpoint}`
}