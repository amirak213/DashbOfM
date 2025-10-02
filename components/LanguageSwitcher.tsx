"use client"

import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [currentLang, setCurrentLang] = useState("en")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Synchroniser l'état avec la langue actuelle d'i18n
    if (i18n.language) {
      setCurrentLang(i18n.language)
    }

    // Écouter les changements de langue
    const handleLanguageChanged = (lng: string) => {
      setCurrentLang(lng)
      setIsLoading(false)
    }

    i18n.on('languageChanged', handleLanguageChanged)

    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [i18n])

  const toggleLanguage = async () => {
    if (isLoading) return

    setIsLoading(true)
    const newLang = currentLang === "fr" ? "en" : "fr"
    
    try {
      await i18n.changeLanguage(newLang)
      // L'état sera mis à jour via l'event listener
    } catch (error) {
      console.error("Error changing language:", error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      size="sm"
      disabled={isLoading}
      className="min-w-[80px] bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 font-semibold shadow-md disabled:opacity-50"
    >
      <Globe className="mr-2 h-4 w-4" />
      {isLoading ? "..." : currentLang === "fr" ? "EN" : "FR"}
    </Button>
  )
}