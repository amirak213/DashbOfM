import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Vos traductions
const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "welcome": "Welcome to your dashboard",
      "users": "Users",
      "sessions": "Sessions",
      "analytics": "Analytics",
      "logout": "Logout",
      "total_users": "Total Users",
      "active_today": "active today",
      "weekly_active": "Weekly Active",
      "total_sessions": "Total Sessions",
      "total_messages": "Total Messages",
      "active_sessions": "Active Sessions",
      "new_users_trend": "New Users Trend",
      "daily_message_volume": "Daily Message Volume",
      "usage_duration_per_user": "Usage Duration per User",
      "minutes_between_first_last": "Minutes between first and last visit",
      "language_distribution": "Language Distribution",
      "languages_used_by_users": "Languages used by users",
      "no_language_data_users": "No language data found in users",
      "preference_detection": "Preference Detection",
      "detected_preferences_per_user": "Detected preferences per user",
      "no_user_preferences_found": "No user preferences found",
      "check_console_logs": "Check console logs for more details",
      "no_valid_preferences": "No valid preferences detected",
      "real_user_types": "Real user types",
      "user_types_distribution": "User Types Distribution",
      "partnership_kits_detection": "Partnership Kits Detection",
      "partnership_types_detected": "Types of partnerships detected",
      "content_categories_detection": "Content Categories Detection",
      "content_categories_detected": "Content categories detected",
      "refresh_data": "Refresh data",
      "duration": "Duration",
      "messages": "Messages"
    }
  },
  fr: {
    translation: {
      "dashboard": "Tableau de bord",
      "welcome": "Bienvenue sur ton tableau de bord",
      "users": "Utilisateurs",
      "sessions": "Sessions",
      "analytics": "Analytique",
      "logout": "Se déconnecter",
      "total_users": "Total Utilisateurs",
      "active_today": "actifs aujourd'hui",
      "weekly_active": "Actifs Hebdomadaires",
      "total_sessions": "Total Sessions",
      "total_messages": "Total Messages",
      "active_sessions": "Sessions Actives",
      "new_users_trend": "Tendance Nouveaux Utilisateurs",
      "daily_message_volume": "Volume de Messages Quotidien",
      "usage_duration_per_user": "Durée d'Utilisation par Utilisateur",
      "minutes_between_first_last": "Nombre de minutes entre première et dernière visite",
      "language_distribution": "Distribution des Langues",
      "languages_used_by_users": "Langues utilisées par les utilisateurs",
      "no_language_data_users": "Aucune donnée de langue trouvée dans les utilisateurs",
      "preference_detection": "Détection des Préférences",
      "detected_preferences_per_user": "Préférences détectées par utilisateur",
      "no_user_preferences_found": "Aucune préférence utilisateur trouvée",
      "check_console_logs": "Vérifiez les logs de la console pour plus de détails",
      "no_valid_preferences": "Aucune préférence valide détectée",
      "real_user_types": "Types d'utilisateurs réels",
      "user_types_distribution": "Distribution Types d'Utilisateurs",
      "partnership_kits_detection": "Partnership Kits Detection",
      "partnership_types_detected": "Types de partenariats détectés",
      "content_categories_detection": "Content Categories Detection",
      "content_categories_detected": "Catégories de contenu détectées",
      "refresh_data": "Actualiser les données",
      "duration": "Durée",
      "messages": "Messages"
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', 
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
