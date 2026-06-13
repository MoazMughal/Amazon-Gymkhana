import { useEffect, useCallback } from 'react'
import { getApiUrl } from '../utils/api'

const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID

/**
 * Reusable Facebook One-Click Auth Button
 *
 * Props:
 *  - userType: 'buyer' | 'seller'
 *  - onSuccess(data): called with { token, buyer|seller, isNewUser }
 *  - onError(message): called with error string
 *  - accentColor: optional hex for hover border
 *  - label: optional override label
 */
const FacebookAuthButton = ({ userType, onSuccess, onError, accentColor = '#1877F2', label }) => {
  // Don't render if FB app ID isn't configured
  if (!FB_APP_ID) return null

  // Load Facebook JS SDK once
  useEffect(() => {
    if (window.FB) return // Already loaded

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v19.0',
      })
    }

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/en_US/sdk.js'
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }
  }, [])

  const handleClick = useCallback(() => {
    if (!window.FB) {
      onError('Facebook SDK not loaded. Please refresh and try again.')
      return
    }

    window.FB.login(
      async (response) => {
        if (response.authResponse) {
          const { accessToken } = response.authResponse
          try {
            const res = await fetch(getApiUrl('auth/facebook'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken, userType }),
            })
            const data = await res.json()
            if (res.ok) {
              onSuccess(data)
            } else {
              onError(data.message || 'Facebook sign-in failed. Please try again.')
            }
          } catch {
            onError('Connection error. Please try again.')
          }
        } else if (response.status === 'not_authorized') {
          onError('Please authorize the app to continue.')
        } else {
          // User cancelled or closed the popup — silent, no error shown
        }
      },
      { scope: 'public_profile,email' }
    )
  }, [userType, onSuccess, onError])

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '11px 16px',
        background: '#fff',
        border: '1.5px solid #e5e7eb',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '0.88rem',
        fontWeight: '600',
        color: '#374151',
        transition: 'all 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = accentColor
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,119,242,0.18)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#e5e7eb'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
      }}
    >
      {/* Facebook logo */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
      {label || 'Continue with Facebook'}
    </button>
  )
}

export default FacebookAuthButton
