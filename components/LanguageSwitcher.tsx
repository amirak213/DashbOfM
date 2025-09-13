"use client"

import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === "fr" ? "en" : "fr"
    i18n.changeLanguage(newLang)
  }

  return (
    <Button onClick={toggleLanguage} variant="outline" size="sm" className="min-w-[60px] bg-transparent">
      {i18n.language === "fr" ? "EN" : "FR"}
    </Button>
  )
}
