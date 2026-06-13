/**
 * PhoneAuthForm — reusable phone+OTP form for login or registration.
 *
 * Props:
 *   mode         : 'login' | 'register'
 *   userType     : 'buyer' | 'seller'
 *   accentColor  : CSS color string
 *   onSuccess    : (data) => void  — called with { token, buyer|seller }
 *   onError      : (msg) => void
 *
 * For seller registration extra fields (username, country, city, productCategory)
 * are collected inline.
 */
import { useState } from 'react'
import { getApiUrl } from '../utils/api'

const SELLER_CATEGORIES = [
  'Automotive','Baby Products','Beauty & Personal Care','Clothing & Fashion',
  'Electronics & Gadgets','Fashion Jewelry','Food & Beverages','Home & Kitchen',
  'Industrial & Scientific','Office Products','Pet Supplies','Sports & Outdoors',
  'Toys & Games','Other'
]

export default function PhoneAuthForm({ mode = 'login', userType = 'buyer', accentColor = '#ff6600', onSuccess, onError }) {
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [maskedPhone, setMaskedPhone] = useState('')

  const base = userType === 'buyer' ? 'buyer' : 'sellers'

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: `1.5px solid #e5e7eb`, borderRadius: '8px',
    fontSize: '0.88rem', outline: 'none',
    background: '#fafafa', color: '#1f2937',
    boxSizing: 'border-box'
  }

  const btnStyle = (disabled) => ({
    width: '100%', padding: '11px',
    background: disabled ? '#d1d5db' : accentColor,
    border: 'none', borderRadius: '8px', color: '#fff',
    fontWeight: '700', fontSize: '0.88rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: '12px'
  })

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let endpoint, body

      if (mode === 'register') {
        endpoint = `${base}/register-phone`
        body = userType === 'buyer'
          ? { firstName, lastName, phone, password }
          : { username, phone, password, country, city, productCategory }
      } else {
        // login — just send OTP
        endpoint = `${base}/send-phone-otp`
        body = { phone }
      }

      const res = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (!res.ok) {
        onError && onError(data.message || 'Failed to send OTP')
        return
      }

      setMaskedPhone(data.phone || phone)
      setStep('otp')
    } catch {
      onError && onError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const endpoint = mode === 'register'
        ? `${base}/verify-phone-otp`
        : `${base}/login-phone`

      const res = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      })
      const data = await res.json()

      if (!res.ok) {
        onError && onError(data.message || 'Invalid OTP')
        return
      }

      onSuccess && onSuccess(data)
    } catch {
      onError && onError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const label = (text) => (
    <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>{text}</div>
  )

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOTP}>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '2rem' }}>📱</div>
          <div style={{ fontSize: '0.88rem', color: '#374151', fontWeight: '600' }}>Enter the 6-digit code</div>
          <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Sent to {maskedPhone}</div>
        </div>

        {label('Verification Code')}
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="_ _ _ _ _ _"
          required
          style={{ ...inputStyle, letterSpacing: '0.4em', textAlign: 'center', fontSize: '1.2rem' }}
        />

        <button type="submit" disabled={loading || otp.length < 6} style={btnStyle(loading || otp.length < 6)}>
          {loading ? 'Verifying…' : 'Verify & Continue'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => { setStep('phone'); setOtp('') }}
            style={{ background: 'none', border: 'none', color: accentColor, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            ← Change phone number
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSendOTP}>
      {/* Buyer registration extras */}
      {mode === 'register' && userType === 'buyer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            {label('First Name')}
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First" required style={inputStyle} />
          </div>
          <div>
            {label('Last Name')}
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last" required style={inputStyle} />
          </div>
        </div>
      )}

      {/* Seller registration extras */}
      {mode === 'register' && userType === 'seller' && (
        <>
          <div style={{ marginBottom: '8px' }}>
            {label('Username')}
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" required style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              {label('Country')}
              <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. UK" required style={inputStyle} />
            </div>
            <div>
              {label('City')}
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. London" required style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: '8px' }}>
            {label('Product Category')}
            <select value={productCategory} onChange={e => setProductCategory(e.target.value)} required style={{ ...inputStyle }}>
              <option value="">Select category</option>
              {SELLER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </>
      )}

      {label('Mobile Number')}
      <input
        type="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="+447911123456"
        required
        style={inputStyle}
      />
      <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>Include country code</div>

      {mode === 'register' && (
        <div style={{ marginTop: '8px' }}>
          {label('Password')}
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            minLength={8}
            required
            style={inputStyle}
          />
        </div>
      )}

      <button type="submit" disabled={loading} style={btnStyle(loading)}>
        {loading ? 'Sending code…' : 'Send Verification Code'}
      </button>
    </form>
  )
}
