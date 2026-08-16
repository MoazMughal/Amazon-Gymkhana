import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getApiUrl } from '../../utils/api'
import { useBuyer } from '../../context/BuyerContext'
import { useSeller } from '../../context/SellerContext'
import GoogleAuthButton from '../../components/GoogleAuthButton'
import FacebookAuthButton from '../../components/FacebookAuthButton'
import PhoneAuthForm from '../../components/PhoneAuthForm'

const UnifiedLogin = () => {
  const navigate = useNavigate()
  const { login: buyerLogin, isLoggedIn: buyerLoggedIn, authResolved: buyerResolved } = useBuyer()
  const { login: sellerLogin, isLoggedIn: sellerLoggedIn, authResolved: sellerResolved } = useSeller()

  // Redirect if already logged in
  useEffect(() => {
    if (buyerResolved && buyerLoggedIn) navigate('/buyer/dashboard', { replace: true })
  }, [buyerLoggedIn, buyerResolved, navigate])

  useEffect(() => {
    if (sellerResolved && sellerLoggedIn) navigate('/seller/dashboard', { replace: true })
  }, [sellerLoggedIn, sellerResolved, navigate])

  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false })
  const [showPassword, setShowPassword] = useState(false)
  const [tab, setTab] = useState('email') // 'email' | 'phone'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Try buyer login first, then seller
    try {
      // Attempt buyer login
      const buyerRes = await fetch(getApiUrl('buyer/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      })
      const buyerData = await buyerRes.json()

      if (buyerRes.ok && buyerData.buyer) {
        buyerLogin(buyerData.buyer, buyerData.token)
        navigate('/buyer/dashboard')
        return
      }

      // Attempt seller login
      const sellerRes = await fetch(getApiUrl('sellers/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.email, password: formData.password })
      })
      const sellerData = await sellerRes.json()

      if (sellerRes.ok && sellerData.seller) {
        await sellerLogin(sellerData.seller, sellerData.token)
        navigate('/seller/dashboard')
        return
      }

      // Both failed
      setError('Invalid email or password. Please try again.')
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Google — try buyer response first, then seller
  const handleGoogleSuccess = (data) => {
    if (data.buyer) {
      buyerLogin(data.buyer, data.token)
      navigate('/buyer/dashboard')
    } else if (data.seller) {
      sellerLogin(data.seller, data.token)
      navigate('/seller/dashboard')
    }
  }
  const handleGoogleError = (msg) => setError(msg)

  // Facebook — same pattern
  const handleFacebookSuccess = (data) => {
    if (data.buyer) {
      buyerLogin(data.buyer, data.token)
      navigate('/buyer/dashboard')
    } else if (data.seller) {
      sellerLogin(data.seller, data.token)
      navigate('/seller/dashboard')
    }
  }
  const handleFacebookError = (msg) => setError(msg)

  // Phone OTP — response has buyer or seller
  const handlePhoneSuccess = (data) => {
    if (data.buyer) {
      buyerLogin(data.buyer, data.token)
      navigate('/buyer/dashboard')
    } else if (data.seller) {
      sellerLogin(data.seller, data.token)
      navigate('/seller/dashboard')
    }
  }

  const accent = '#ff6600'

  const inputWrap = (focused) => ({
    display: 'flex', alignItems: 'center',
    border: `1.5px solid ${focused ? accent : '#e5e7eb'}`,
    borderRadius: '10px', overflow: 'hidden',
    background: '#fafafa', transition: 'border-color 0.2s'
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #ff6600 0%, #c2410c 40%, #1f2937 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      padding: '80px 16px 40px',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Bg orb */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '420px',
        background: '#fff', borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden', position: 'relative', zIndex: 1
      }}>
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #ff6600, #c2410c)' }} />

        <div style={{ padding: '32px 28px 28px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #ff6600 0%, #c2410c 100%)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(255,102,0,0.35)', marginBottom: '14px'
            }}>
              <i className="fas fa-sign-in-alt" style={{ fontSize: '1.4rem', color: '#fff' }}></i>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1f2937', margin: '0 0 4px' }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
              Sign in as buyer or supplier — we'll take you to the right place
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
              padding: '10px 14px', marginBottom: '16px',
              fontSize: '0.83rem', color: '#dc2626',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <i className="fas fa-exclamation-circle" style={{ flexShrink: 0 }}></i>
              {error}
            </div>
          )}

          {/* Google */}
          <div style={{ marginBottom: '8px' }}>
            <GoogleAuthButton
              userType="buyer"
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              accentColor={accent}
            />
          </div>

          {/* Facebook */}
          <div style={{ marginBottom: '16px' }}>
            <FacebookAuthButton
              userType="buyer"
              onSuccess={handleFacebookSuccess}
              onError={handleFacebookError}
            />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* Tab: Email / Phone */}
          <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '10px', marginBottom: '16px' }}>
            {[
              { key: 'email', icon: 'fa-envelope', label: 'Email' },
              { key: 'phone', icon: 'fa-mobile-alt', label: 'Phone' }
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setTab(t.key); setError('') }}
                style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
                  background: tab === t.key ? accent : 'transparent',
                  color: tab === t.key ? '#fff' : '#6b7280',
                  fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <i className={`fas ${t.icon}`} style={{ marginRight: '5px' }}></i>{t.label}
              </button>
            ))}
          </div>

          {/* Phone OTP login */}
          {tab === 'phone' && (
            <PhoneAuthForm
              mode="login"
              userType="buyer"
              accentColor={accent}
              onSuccess={handlePhoneSuccess}
              onError={setError}
            />
          )}

          {/* Email / password form */}
          {tab === 'email' && <form onSubmit={handleSubmit}>

            {/* Email field */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={inputWrap(false)}
                onFocusCapture={e => e.currentTarget.style.borderColor = accent}
                onBlurCapture={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <span style={{ padding: '0 12px', color: '#9ca3af', display: 'flex', alignItems: 'center', height: '44px', flexShrink: 0 }}>
                  <i className="fas fa-envelope" style={{ fontSize: '0.85rem' }}></i>
                </span>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email or username"
                  required
                  autoComplete="username"
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                    fontSize: '0.88rem', color: '#1f2937', padding: '0 12px 0 0', height: '44px'
                  }}
                />
              </div>
            </div>

            {/* Password field with show/hide */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={inputWrap(false)}
                onFocusCapture={e => e.currentTarget.style.borderColor = accent}
                onBlurCapture={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <span style={{ padding: '0 12px', color: '#9ca3af', display: 'flex', alignItems: 'center', height: '44px', flexShrink: 0 }}>
                  <i className="fas fa-lock" style={{ fontSize: '0.85rem' }}></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                    fontSize: '0.88rem', color: '#1f2937', padding: '0 0 0 0', height: '44px',
                    // Hide browser native password reveal button
                    MsRevealPassword: 'none'
                  }}
                  onInput={e => {
                    // Chrome/Edge native eye icon suppression
                    e.target.style.setProperty('--webkit-credentials-auto-fill-button', 'none')
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    padding: '0 14px', background: 'none', border: 'none',
                    cursor: 'pointer', color: '#9ca3af', display: 'flex',
                    alignItems: 'center', height: '44px', flexShrink: 0,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = accent}
                  onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: '0.85rem' }}></i>
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', color: '#6b7280' }}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  style={{ accentColor: accent, width: '14px', height: '14px' }}
                />
                Remember me
              </label>
              <Link to="/forgot-password-token" style={{ fontSize: '0.82rem', color: accent, textDecoration: 'none', fontWeight: '600' }}>
                Forgot Password?
              </Link>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#d1d5db' : 'linear-gradient(135deg, #ff6600 0%, #c2410c 100%)',
                border: 'none', borderRadius: '10px', color: '#fff',
                fontSize: '0.92rem', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(255,102,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s', marginBottom: '16px'
              }}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm" role="status"></span> Signing in…</>
                : <><i className="fas fa-sign-in-alt"></i> Sign In</>
              }
            </button>
          </form>}

          {/* Register links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>New here?</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              to="/register/buyer"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', border: '2px solid #ff6600', borderRadius: '10px',
                color: '#ff6600', fontWeight: '700', fontSize: '0.82rem',
                textDecoration: 'none', background: 'transparent', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <i className="fas fa-user-plus"></i> Buyer
            </Link>
            <Link
              to="/register/supplier"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', border: '2px solid #16a34a', borderRadius: '10px',
                color: '#16a34a', fontWeight: '700', fontSize: '0.82rem',
                textDecoration: 'none', background: 'transparent', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <i className="fas fa-store"></i> Supplier
            </Link>
          </div>

        </div>
      </div>

      {/* Trust badges */}
      <div style={{ display: 'flex', gap: '32px', marginTop: '28px', position: 'relative', zIndex: 1 }}>
        {[
          { icon: 'fa-tags', label: 'Wholesale Prices' },
          { icon: 'fa-shield-alt', label: 'Secure Login' },
          { icon: 'fa-handshake', label: 'Trusted Platform' }
        ].map(b => (
          <div key={b.label} style={{ textAlign: 'center' }}>
            <i className={`fas ${b.icon}`} style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', display: 'block', marginBottom: '4px' }}></i>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', fontWeight: '600', whiteSpace: 'nowrap' }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UnifiedLogin
