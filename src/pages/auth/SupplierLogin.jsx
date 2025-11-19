import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSeller } from '../../context/SellerContext'

const SupplierLogin = () => {
  const navigate = useNavigate()
  const { login: sellerLogin } = useSeller()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  })
  const [loading, setLoading] = useState(false)
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
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('http://localhost:5000/api/sellers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username, // This can be username, email, or WhatsApp number
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        console.log('Seller login successful:', data.seller.username)
        
        // Use seller context to login
        sellerLogin(data.seller, data.token)
        
        // Clear any errors
        setError('')
        
        // Redirect to seller dashboard
        navigate('/seller/dashboard')
      } else {
        setError(data.message || 'Invalid credentials. Please check your username/email/WhatsApp and password.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Failed to login. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-7">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <i className="fas fa-store fa-3x text-success"></i>
                  </div>
                  <h2 className="fw-bold text-dark mb-2">Supplier Login</h2>
                  <p className="text-muted">Manage your products and grow your business</p>
                </div>

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

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label fw-semibold">
                      Username, Email, or WhatsApp
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-user text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 ps-0"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Username, email, or WhatsApp number"
                        required
                      />
                    </div>
                    <div className="form-text small">
                      You can login with your username, email, or WhatsApp number
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">
                      Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-lock text-muted"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control border-start-0 ps-0"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4 d-flex justify-content-between align-items-center">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="rememberMe"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                      />
                      <label className="form-check-label text-muted" htmlFor="rememberMe">
                        Remember me
                      </label>
                    </div>
                    <Link to="/forgot-password" className="text-decoration-none small">
                      Forgot Password?
                    </Link>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-success w-100 py-2 fw-semibold rounded-3" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Signing In...
                      </>
                    ) : (
                      'Sign In as Supplier'
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="text-center my-4">
                  <hr className="my-3" />
                  <span className="text-muted small bg-white px-3">New supplier?</span>
                </div>

                {/* Register Link */}
                <div className="text-center">
                  <Link 
                    to="/register/supplier" 
                    className="btn btn-outline-success w-100 py-2 fw-semibold rounded-3"
                  >
                    Create Supplier Account
                  </Link>
                </div>

                {/* Other Login Options */}
                <div className="text-center mt-4">
                  <p className="text-muted small mb-2">Looking for something else?</p>
                  <div className="d-flex gap-2 justify-content-center">
                    <Link to="/login/buyer" className="btn btn-outline-secondary btn-sm">
                      Buyer Login
                    </Link>
                    <Link to="/admin/login" className="btn btn-outline-warning btn-sm">
                      Admin Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="row mt-4">
              <div className="col-12">
                <h6 className="text-center mb-3 text-dark">Why Sell on Amazon Choice?</h6>
              </div>
              <div className="col-md-4 text-center mb-2">
                <div className="p-2">
                  <i className="fas fa-users fa-lg text-success mb-1"></i>
                  <div className="fw-semibold small">Large Customer Base</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Thousands of verified buyers</div>
                </div>
              </div>
              <div className="col-md-4 text-center mb-2">
                <div className="p-2">
                  <i className="fas fa-chart-line fa-lg text-primary mb-1"></i>
                  <div className="fw-semibold small">Grow Your Business</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Scale with our platform</div>
                </div>
              </div>
              <div className="col-md-4 text-center mb-2">
                <div className="p-2">
                  <i className="fas fa-handshake fa-lg text-info mb-1"></i>
                  <div className="fw-semibold small">Trusted Platform</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Secure transactions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupplierLogin