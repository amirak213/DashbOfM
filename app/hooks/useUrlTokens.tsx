"use client"

import { useEffect, useRef } from 'react'
import { authService } from '@/app/services/auth-service'

export function usePersistentUrlTokens() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingRef = useRef(false)

  const forceTokensInUrl = () => {
    if (isUpdatingRef.current || typeof window === 'undefined') return
    
    const accessToken = authService.getAccessToken()
    const refreshToken = localStorage.getItem('refresh_token')
    
    if (!accessToken && !refreshToken) return
    
    const currentUrl = new URL(window.location.href)
    let needsUpdate = false
    
    // Vérifier si les tokens sont absents ou différents
    if (accessToken && currentUrl.searchParams.get('token') !== accessToken) {
      currentUrl.searchParams.set('token', accessToken)
      needsUpdate = true
    }
    
    if (refreshToken && currentUrl.searchParams.get('refresh') !== refreshToken) {
      currentUrl.searchParams.set('refresh', refreshToken)
      needsUpdate = true
    }
    
    if (needsUpdate) {
      isUpdatingRef.current = true
      const newUrl = currentUrl.toString()
      
      // Essayer plusieurs méthodes pour forcer la persistance
      try {
        // Méthode 1: replaceState standard
        window.history.replaceState({}, '', newUrl)
        
        // Méthode 2: Double replaceState après un délai
        setTimeout(() => {
          window.history.replaceState({}, '', newUrl)
          
          // Méthode 3: Vérification et re-application si nécessaire
          setTimeout(() => {
            if (window.location.href !== newUrl) {
              window.history.replaceState({}, '', newUrl)
            }
            isUpdatingRef.current = false
          }, 50)
        }, 10)
        
        console.log('URL forcefully updated with tokens:', newUrl)
      } catch (error) {
        console.error('Error updating URL:', error)
        isUpdatingRef.current = false
      }
    }
  }

  useEffect(() => {
    // Mise à jour initiale après le montage
    const initialTimeout = setTimeout(forceTokensInUrl, 100)
    
    // Surveillance continue toutes les 500ms
    intervalRef.current = setInterval(forceTokensInUrl, 500)
    
    // Observer les changements d'URL via popstate
    const handlePopState = () => {
      setTimeout(forceTokensInUrl, 50)
    }
    
    // Observer les mutations du DOM qui pourraient affecter l'URL
    const observer = new MutationObserver(() => {
      setTimeout(forceTokensInUrl, 50)
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    })
    
    // Intercepter les méthodes de navigation
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState
    
    window.history.pushState = function(state, title, url) {
      originalPushState.call(this, state, title, url)
      setTimeout(forceTokensInUrl, 50)
    }
    
    window.history.replaceState = function(state, title, url) {
      // Éviter la boucle infinie si c'est notre propre mise à jour
      if (!isUpdatingRef.current) {
        originalReplaceState.call(this, state, title, url)
        setTimeout(forceTokensInUrl, 50)
      } else {
        originalReplaceState.call(this, state, title, url)
      }
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      observer.disconnect()
      window.removeEventListener('popstate', handlePopState)
      
      // Restaurer les méthodes originales
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
    }
  }, [])

  return forceTokensInUrl
}

// Composant simple à ajouter à votre layout principal
export function UrlTokenPersister() {
  usePersistentUrlTokens()
  return null
}

// Version avec indicateur visuel pour debug
export function UrlTokenPersisterWithIndicator() {
  const forceUpdate = usePersistentUrlTokens()
  
  const handleManualUpdate = () => {
    console.log('Manual token URL update triggered')
    forceUpdate()
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 9999,
      display: 'flex',
      gap: '5px'
    }}>
      <button 
        onClick={handleManualUpdate}
        style={{
          padding: '4px 8px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          fontSize: '11px',
          cursor: 'pointer'
        }}
      >
        Force Tokens
      </button>
      <div style={{
        padding: '4px 8px',
        background: authService.getAccessToken() ? '#28a745' : '#dc3545',
        color: 'white',
        borderRadius: '3px',
        fontSize: '11px'
      }}>
        {authService.getAccessToken() ? 'Authenticated' : 'No Token'}
      </div>
    </div>
  )
}