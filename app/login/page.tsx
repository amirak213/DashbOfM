"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/app/services/auth-service"
import { useTranslation } from "react-i18next"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { t } = useTranslation()

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await authService.login(username, password)
      router.push("/dashboard")
    } catch (err) {
      setError(t("login_error", "Invalid username or password"))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  return (
    <>
      {/* Animations */}
      <style jsx global>{`
        @keyframes wave-rotation {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .wave-animation-1 {
          animation: wave-rotation 3s infinite linear;
        }
        .wave-animation-2 {
          animation: wave-rotation 4s infinite linear;
        }
        .wave-animation-3 {
          animation: wave-rotation 5s infinite linear;
        }

        /* Animation texte */
        @keyframes letterSpacing {
          0% {
            letter-spacing: -0.5em;
            opacity: 0;
          }
          40% {
            letter-spacing: 0.1em;
          }
          100% {
            letter-spacing: 0.2em;
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .instant-text {
          font-family: "Arial", sans-serif;
          font-weight: 300;
          letter-spacing: 0.2em;
          animation: letterSpacing 2s ease-out forwards;
        }

        .m-circle {
          animation: fadeInUp 1s ease-out 1.5s both;
        }

        .subtitle-text {
          animation: fadeInUp 1s ease-out 2s both;
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Arrière-plan */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500"></div>

        {/* Formes animées */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white bg-opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div
            className="absolute top-40 right-20 w-72 h-72 bg-purple-300 bg-opacity-20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute -bottom-32 left-40 w-72 h-72 bg-cyan-300 bg-opacity-20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        {/* Carte de connexion */}
        <div className="relative z-10">
          <div
            className="bg-gray-900 bg-opacity-85 backdrop-blur-lg border border-gray-700 border-opacity-50 shadow-2xl rounded-2xl overflow-hidden relative"
            style={{ width: "400px", height: "600px" }}
          >
            {/* Vagues animées - reduced opacity for better contrast */}
            <div
              className="wave-animation-1 absolute opacity-10 rounded-full"
              style={{
                width: "540px",
                height: "700px",
                left: 0,
                top: 0,
                marginLeft: "-50%",
                marginTop: "-70%",
                background: "linear-gradient(744deg, #af40ff, #5b42f3 60%, #00ddeb)",
              }}
            ></div>
            <div
              className="wave-animation-2 absolute opacity-10 rounded-full"
              style={{
                width: "540px",
                height: "700px",
                left: 0,
                top: "210px",
                marginLeft: "-50%",
                marginTop: "-70%",
                background: "linear-gradient(744deg, #af40ff, #5b42f3 60%, #00ddeb)",
              }}
            ></div>
            <div
              className="wave-animation-3 absolute opacity-10 rounded-full"
              style={{
                width: "540px",
                height: "700px",
                left: 0,
                top: "210px",
                marginLeft: "-50%",
                marginTop: "-70%",
                background: "linear-gradient(744deg, #af40ff, #5b42f3 60%, #00ddeb)",
              }}
            ></div>

            {/* Formulaire */}
            <div className="relative z-20 p-8 h-full flex flex-col justify-center">
              {/* Nouveau header avec L'INSTANT M */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <h1 className="instant-text text-2xl text-white mr-3">CHATBOT</h1>
                  <div className="m-circle w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">M</span>
                  </div>
                </div>
                <p className="subtitle-text text-gray-200 text-xs mt-4">
                  {t("login_welcome", "Welcome to dashboard of chatbot M")}
                </p>
              </div>

              {/* Champs */}
              <div className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
                    {t("username", "Username")}
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 bg-gray-800 bg-opacity-80 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                    placeholder={t("username_placeholder", "Enter your username")}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                    {t("password", "Password")}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 bg-gray-800 bg-opacity-80 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                    placeholder={t("password_placeholder", "Enter your password")}
                    disabled={loading}
                  />
                </div>

                {/* Message d'erreur */}
                {error && (
                  <div className="bg-red-900 bg-opacity-80 border border-red-600 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Bouton */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit()}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? t("signing_in", "Signing in...") : t("sign_in", "Sign in")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
