import { useState } from 'react'

const WelcomeBonus = ({ userType = 'buyer', onClaim }) => {
  const [claimed, setClaimed] = useState(false)

  const buyerBonuses = [
    {
      icon: "fas fa-database",
      title: "Supplier Database Access",
      description: "Complete contact details of 500+ verified Pakistani suppliers",
      value: "$299"
    },
    {
      icon: "fas fa-chart-bar",
      title: "Product Research Tools",
      description: "Amazon Best Seller tracking and profit calculator",
      value: "$199"
    },
    {
      icon: "fas fa-headset",
      title: "Personal Consultation",
      description: "30-minute call with our sourcing expert",
      value: "$150"
    },
    {
      icon: "fas fa-crown",
      title: "Premium Support",
      description: "30 days of priority customer support",
      value: "$99"
    }
  ]

  const supplierBonuses = [
    {
      icon: "fas fa-store",
      title: "Free Product Listing",
      description: "Professional product listing with photos and description",
      value: "$199"
    },
    {
      icon: "fas fa-chart-line",
      title: "Market Analysis Report",
      description: "Detailed analysis of your product category and pricing",
      value: "$249"
    },
    {
      icon: "fas fa-handshake",
      title: "Buyer Introductions",
      description: "Direct introductions to 5 potential buyers",
      value: "$299"
    },
    {
      icon: "fas fa-graduation-cap",
      title: "Amazon Selling Course",
      description: "Complete guide to selling on Amazon marketplace",
      value: "$199"
    }
  ]

  const bonuses = userType === 'buyer' ? buyerBonuses : supplierBonuses
  const totalValue = bonuses.reduce((sum, bonus) => sum + parseInt(bonus.value.replace('$', '')), 0)

  const handleClaim = () => {
    setClaimed(true)
    if (onClaim) onClaim()
  }

  return (
    <div className="welcome-bonus-container">
      <div className="card border-warning shadow-lg">
        <div className="card-header bg-warning text-dark text-center py-4">
          <h3 className="fw-bold mb-2">
            <i className="fas fa-gift me-2"></i>
            Welcome Bonus Package
          </h3>
          <div className="display-6 fw-bold">
            <span className="text-decoration-line-through text-muted">${totalValue}</span>
            <span className="text-success ms-2">FREE</span>
          </div>
          <p className="mb-0">Limited time offer for new members</p>
        </div>
        
        <div className="card-body p-4">
          <div className="row g-3">
            {bonuses.map((bonus, index) => (
              <div key={index} className="col-md-6">
                <div className="d-flex align-items-start p-3 bg-light rounded">
                  <div className="bg-primary bg-gradient rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                    <i className={`${bonus.icon} text-white fa-sm`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="fw-bold mb-1">{bonus.title}</h6>
                    <p className="text-muted small mb-1">{bonus.description}</p>
                    <span className="badge bg-success">{bonus.value} Value</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-4">
            {!claimed ? (
              <button 
                className="btn btn-warning btn-lg px-5 fw-bold"
                onClick={handleClaim}
              >
                <i className="fas fa-gift me-2"></i>
                Claim Your ${totalValue} Welcome Bonus
              </button>
            ) : (
              <div className="alert alert-success">
                <i className="fas fa-check-circle me-2"></i>
                Bonus claimed! Check your email for access details.
              </div>
            )}
          </div>

          <div className="text-center mt-3">
            <small className="text-muted">
              <i className="fas fa-clock me-1"></i>
              Offer expires in 24 hours after registration
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeBonus