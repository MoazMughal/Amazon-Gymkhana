import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState('buyer')
  const [formData, setFormData] = useState({
    identifier: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [maskedWhatsApp, setMaskedWhatsApp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!formData.identifier.trim()) {
      setError('Please enter your email or WhatsApp number')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: formData.identifier.trim(),
          userType: userType
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMaskedWhatsApp(data.contactInfo)
        setStep(2)
        setSuccess(`OTP sent to your ${data.method === 'email' ? 'email' : 'WhatsApp'}: ${data.contactInfo}`)
        
        if (data.developmentOTP) {
          console.log('Development OTP:', data.developmentOTP)
          setSuccess(`OTP sent to ${data.contactInfo}. Development OTP: ${data.developmentOTP}`)
        }
      } else {
        setError(data.message || 'Failed to send OTP')
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      setError('Failed to send OTP. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!formData.otp.trim()) {
      setError('Please enter the OTP')
      return
    }
    
    if (!formData.newPassword) {
      setError('Please enter a new password')
      return
    }
    
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: formData.identifier.trim(),
          otp: formData.otp.trim(),
          newPassword: formData.newPassword,
          userType: userType
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Password reset successfully! Redirecting to login...')
        setTimeout(() => {
          navigate(userType === 'buyer' ? '/login/buyer' : '/login/supplier')
        }, 2000)
      } else {
        setError(data.message || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <form onSubmit={handleSendOTP}>
      <div className="mb-3">
        <label className="form-label fw-semibold small">Account Type</label>
        <select
          className="form-select form-select-sm"
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
        >
          <option value="buyer">Buyer/Retailer</option>
          <option value="seller">Seller/Supplier</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold small">
          {userType === 'seller' ? 'Username, Email, or WhatsApp' : 'Email or WhatsApp Number'}
        </label>
        <div className="input-group">
          <span className="input-group-text bg-light">
            <i className="fas fa-user text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            placeholder={userType === 'seller' ? 'Username, email, or WhatsApp' : 'Email or WhatsApp number'}
            required
          />
        </div>
        <div className="form-text small">
          {userType === 'seller' ? 'Use username, email, or WhatsApp number' : 'Use email or WhatsApp number'}
        </div>
      </div>

      <div className="alert alert-info py-2 mb-3">
        <div className="d-flex align-items-start">
          <i className="fas fa-info-circle text-info me-2 mt-1"></i>
          <div>
            <h6 className="mb-1 small">How it works:</h6>
            <ol className="mb-0 small">
              <li>Enter your account details</li>
              <li>Get 6-digit OTP on WhatsApp</li>
              <li>Set your new password</li>
            </ol>
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        className="btn btn-warning w-100 mb-3 py-2"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            Sending OTP...
          </>
        ) : (
          <>
            <i className="fab fa-whatsapp me-2"></i>Send OTP
          </>
        )}
      </button>

      <div className="text-center">
        <Link to="/auth" className="text-decoration-none small">
          <i className="fas fa-arrow-left me-1"></i>Back to Login
        </Link>
      </div>
    </form>
  )

  const renderStep2 = () => (
    <form onSubmit={handleResetPassword}>
      <div className="alert alert-success py-2 mb-3">
        <div className="d-flex align-items-center">
          <i className="fab fa-whatsapp text-success me-2"></i>
          <small>OTP sent to: <strong>{maskedWhatsApp}</strong></small>
        </div>
        <div className="mt-2 p-2 bg-warning bg-opacity-25 rounded">
          <div className="d-flex align-items-center">
            <i className="fas fa-code text-warning me-2"></i>
            <small><strong>Development Mode:</strong> Use OTP: <code className="bg-dark text-light px-1">123456</code></small>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold small">Enter 6-Digit OTP</label>
        <input
          type="text"
          className="form-control text-center"
          name="otp"
          value={formData.otp}
          onChange={handleChange}
          placeholder="000000"
          maxLength="6"
          style={{fontSize: '1.2rem', letterSpacing: '0.3rem'}}
          required
        />
        <div className="form-text small">
          Development: Use 123456 or check console for OTP
        </div>
      </div>

      {formData.otp && formData.otp.length >= 6 && (
        <>
          <div className="mb-3">
            <label className="form-label fw-semibold small">New Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <i className="fas fa-lock text-muted"></i>
              </span>
              <input
                type="password"
                className="form-control"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                minLength="8"
                required
              />
            </div>
            <div className="form-text small">
              Password must be at least 8 characters long
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold small">Confirm New Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <i className="fas fa-lock text-muted"></i>
              </span>
              <input
                type="password"
                className="form-control"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                required
              />
            </div>
          </div>
        </>
      )}

      <button 
        type="submit" 
        className="btn btn-success w-100 mb-3 py-2"
        disabled={loading || !formData.otp || formData.otp.length < 6}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            Resetting Password...
          </>
        ) : (
          <>
            <i className="fas fa-check me-2"></i>Reset Password
          </>
        )}
      </button>

      <div className="text-center">
        <button 
          type="button" 
          className="btn btn-link text-decoration-none small p-0"
          onClick={() => setStep(1)}
        >
          <i className="fas fa-arrow-left me-1"></i>Back to Enter Details
        </button>
      </div>
    </form>
  )

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-7">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-4">
                <div className="text-center mb-3">
                  <div className="mb-2">
                    <i className="fas fa-key fa-2x text-warning"></i>
                  </div>
                  <h4 className="fw-bold text-dark mb-1">Reset Password</h4>
                  <p className="text-muted small mb-0">
                    {step === 1 ? 'Enter your details to receive OTP' : 'Enter OTP and set new password'}
                  </p>
                </div>

                {success && (
                  <div className="alert alert-success alert-dismissible fade show mb-3" role="alert">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-check-circle me-2"></i>
                      <small>{success}</small>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      <small>{error}</small>
                    </div>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setError('')}
                    ></button>
                  </div>
                )}

                {step === 1 ? renderStep1() : renderStep2()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword