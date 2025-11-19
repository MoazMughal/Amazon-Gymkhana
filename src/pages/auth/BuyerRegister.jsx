import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const BuyerRegister = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsappNo: '',
    agreeToTerms: false
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    
    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('http://localhost:5000/api/buyer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          whatsappNo: formData.whatsappNo,
          userType: 'buyer'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate('/login/buyer')
        }, 3000)
      } else {
        setError(data.message || 'Registration failed. Please try again.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Failed to register. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <i className="fas fa-shopping-cart fa-3x text-primary"></i>
                  </div>
                  <h2 className="fw-bold text-dark mb-2">Create Buyer Account</h2>
                  <p className="text-muted">Join thousands of retailers getting wholesale prices</p>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-check-circle fa-2x text-success me-3"></i>
                      <div>
                        <h5 className="alert-heading mb-1">🎉 Welcome to Amazon Choice!</h5>
                        <p className="mb-1">Your buyer account has been created successfully!</p>
                        <small className="text-muted">
                          Check your email for your $747 welcome bonus package. Redirecting to login...
                        </small>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setError('')}
                    ></button>
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit} style={{ display: success ? 'none' : 'block' }}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="firstName" className="form-label fw-semibold">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="lastName" className="form-label fw-semibold">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      Email Address
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="fas fa-envelope text-muted"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="whatsappNo" className="form-label fw-semibold">
                      WhatsApp Number
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="fab fa-whatsapp text-success"></i>
                      </span>
                      <input
                        type="tel"
                        className="form-control"
                        id="whatsappNo"
                        name="whatsappNo"
                        value={formData.whatsappNo}
                        onChange={handleChange}
                        placeholder="e.g., +92 300 1234567"
                        required
                      />
                    </div>
                    <div className="form-text small">
                      Include country code. Used for login and order updates.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">
                      Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="fas fa-lock text-muted"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a strong password"
                        required
                      />
                    </div>
                    <div className="form-text small">
                      Password must be at least 8 characters long
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label fw-semibold">
                      Confirm Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="fas fa-lock text-muted"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="agreeToTerms"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        required
                      />
                      <label className="form-check-label" htmlFor="agreeToTerms">
                        I agree to the <Link to="/terms" className="text-decoration-none">Terms of Service</Link> and <Link to="/privacy" className="text-decoration-none">Privacy Policy</Link>
                      </label>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2 fw-semibold rounded-3 mb-3" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating Account...
                      </>
                    ) : (
                      'Create Buyer Account'
                    )}
                  </button>

                  <div className="text-center">
                    <span className="text-muted">Already have an account? </span>
                    <Link to="/login/buyer" className="text-decoration-none fw-semibold">
                      Sign In
                    </Link>
                  </div>
                </form>

                {/* Other Options */}
                <div className="text-center mt-4">
                  <hr className="my-3" />
                  <p className="text-muted small mb-2">Want to sell products instead?</p>
                  <Link to="/register/supplier" className="btn btn-outline-success btn-sm">
                    Create Supplier Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuyerRegister