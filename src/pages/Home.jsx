import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ScrollToTop from '../components/ScrollToTop'
import CurrencySelector from '../components/CurrencySelector'
import { useCurrency } from '../context/CurrencyContext'

// Import product images for hero background
import noseRingImg from '../assets/main-pics/nose ring.jpg'
import spoonImg from '../assets/main-pics/Spoon.jpg'
import bulbImg from '../assets/main-pics/Light Bulb.jpg'
import watchImg from '../assets/main-pics/Black Watch.jpg'
import lampshadeImg from '../assets/main-pics/Black Lampshade.jpg'
import balloonImg from '../assets/main-pics/Balloons.jpg'
import remoteImg from '../assets/main-pics/LG-Remote.jpg'
import glassImg from '../assets/main-pics/Glass-580.jpg'
import watchStrapImg from '../assets/main-pics/Watch Strap.jpg'
import tapeImg from '../assets/main-pics/Black-T.jpg'
import fairyImg from '../assets/main-pics/whiteFairy.jpg'
import forksImg from '../assets/main-pics/forks.jpg'
import cableImg from '../assets/main-pics/Charger Cable.jpg'
import lacesImg from '../assets/main-pics/laces.jpg'
import carBulbImg from '../assets/main-pics/Car Bulbs.jpg'
import sunglassesImg from '../assets/main-pics/Sunglasses.jpg'

const Home = () => {
  const navigate = useNavigate()
  const [currentSubtitle, setCurrentSubtitle] = useState(0)
  const [currentRotatingText, setCurrentRotatingText] = useState(0)
  const [currentStatusIndex, setCurrentStatusIndex] = useState({})
  const [currentImageSet, setCurrentImageSet] = useState(0)
  const [isBuyerLoggedIn, setIsBuyerLoggedIn] = useState(false)
  const { formatPrice } = useCurrency()
  
  // Background image sets with product images
  const imageSets = [
    [
      noseRingImg,
      watchStrapImg,
      lampshadeImg,
      fairyImg,
      forksImg,
      cableImg,
      bulbImg,
      glassImg
    ],
    [
      tapeImg,
      lacesImg,
      sunglassesImg,
      carBulbImg,
      spoonImg,
      balloonImg,
      remoteImg,
      watchImg
    ],
    [
      glassImg,
      noseRingImg,
      fairyImg,
      cableImg,
      lampshadeImg,
      forksImg,
      bulbImg,
      watchStrapImg
    ]
  ]

  const subtitles = [
    "Connect with Trusted Pakistani Suppliers",
    "Unlock High Profit Margins",
    "Amazon's Choice & Best Sellers",
    "Direct WhatsApp Business Integration",
    "Private Label & Wholesale Opportunities",
    "Quality Assurance & Compliance",
    "Competitive Shipping & Logistics",
    "Market Insights & Trends",
    "Complete Supply Chain Support",
    "Community & Networking"
  ]

  const rotatingTexts = [
    {
      title: "Connect with Trusted Pakistani Suppliers",
      description: "Access our verified network of manufacturers and suppliers specializing in Amazon-ready products. Build direct relationships with reliable partners who understand international quality standards and shipping requirements."
    },
    {
      title: "Unlock High Profit Margins",
      description: "Discover products with proven 200-400% markup potential. Our curated selection focuses on high-demand items with excellent ROI, helping you maximize profitability while maintaining competitive pricing on Amazon marketplace."
    },
    {
      title: "Amazon's Choice & Best Sellers",
      description: "Get access to carefully selected products that have achieved Amazon's Choice status or are trending as best sellers. Save time on product research and focus on scaling your business with proven winners."
    },
    {
      title: "Direct WhatsApp Business Integration",
      description: "Communicate instantly with suppliers through our integrated WhatsApp Business platform. Negotiate prices, discuss customization options, and manage orders in real-time with seamless communication channels."
    },
    {
      title: "Private Label & Wholesale Opportunities",
      description: "Explore both wholesale and private label options with Pakistani manufacturers. Whether you're looking for ready-to-sell products or custom-branded solutions, we connect you with the right partners."
    },
    {
      title: "Quality Assurance & Compliance",
      description: "All our suppliers maintain strict quality control standards and understand Amazon's compliance requirements. Source with confidence knowing products meet international quality and safety standards."
    },
    {
      title: "Competitive Shipping & Logistics",
      description: "Benefit from established shipping routes and logistics partnerships. Our suppliers have experience with international shipping, customs clearance, and Amazon FBA requirements for smooth operations."
    },
    {
      title: "Market Insights & Trends",
      description: "Stay ahead of market trends with our regular updates on best-performing categories and emerging opportunities in the Amazon ecosystem across US, UK, UAE, and European markets."
    },
    {
      title: "Complete Supply Chain Support",
      description: "From product sourcing to quality inspection, packaging customization, and shipping coordination - we provide end-to-end support to ensure your Amazon business runs smoothly and efficiently."
    },
    {
      title: "Community & Networking",
      description: "Join Pakistan's fastest-growing Amazon seller community. Share experiences, learn from successful sellers, and collaborate with like-minded entrepreneurs to grow your business together."
    }
  ]

  // Featured products for scrolling section - matching main.html
  const featuredProducts = [
    { id: 'prod-101', name: "Black NATO Watch Strap", price: "£19.89", rating: 4.0, reviews: 7, image: watchStrapImg, basket: 42, monthlyOrders: "800", markup: "250%",
      statuses: ["Selling Fast", "42 in basket", "Amazon's Choice"] },
    { id: 'prod-001', name: "Large White Glitter Fairy Wings", price: "£19.89", rating: 4.6, reviews: 72, image: fairyImg, basket: 91, monthlyOrders: "3.2K", markup: "340%",
      statuses: ["Selling Fast", "91 in basket", "Amazon's Choice"] },
    { id: 'prod-011', name: "300 Pack Paper Straws", price: "£19.89", rating: 4.7, reviews: 93, markup: "290%", image: spoonImg, basket: 112, monthlyOrders: "5K",
      statuses: ["Best Seller", "112 in basket", "Trending Now"] },
    { id: 'prod-002', name: "Clear Reusable Forks 150pcs", price: "£19.89", rating: 4.5, reviews: 124, image: forksImg, basket: 88, monthlyOrders: "4.5K", markup: "280%",
      statuses: ["Selling Fast", "88 in basket", "Amazon's Choice"] },
    { id: 'prod-012', name: "1L Plastic Measuring Jug", price: "£19.89", rating: 5.0, reviews: 67, markup: "340%", image: glassImg, basket: 42, monthlyOrders: "1.6K",
      statuses: ["Best Seller", "42 in basket", "Limited Stock"] },
    { id: 'prod-006', name: "1M Charger Cable", price: "£19.89", rating: 4.5, reviews: 13, image: cableImg, basket: 28, monthlyOrders: "1.1K", markup: "220%",
      statuses: ["Selling Fast", "28 in basket", "Amazon's Choice"] },
    { id: 'prod-005', name: "Extra Thin Nose Ring 0.5mm", price: "£0.24", rating: 4.5, reviews: 67, image: noseRingImg, basket: 52, monthlyOrders: "2.1K", markup: "1145%",
      statuses: ["Selling Fast", "52 in basket", "Amazon's Choice"], hasProfit: true, monthlyProfit: 575, yearlyProfit: 6900 },
    { id: 'prod-020', name: "10 Pieces G4 Halogen Bulbs", price: "£0.18", rating: 4.3, reviews: 42, image: bulbImg, basket: 37, monthlyOrders: "1.8K", markup: "1283%",
      statuses: ["Selling Fast", "37 in basket", "Amazon's Choice"], hasProfit: true, monthlyProfit: 342, yearlyProfit: 4104 },
    { id: 'prod-lamp-001', name: "Red Paper Lampshade", price: "£0.32", rating: 4.5, reviews: 72, image: lampshadeImg, basket: 58, monthlyOrders: "2.3K", markup: "1147%",
      statuses: ["Best Seller", "58 in basket", "Limited Stock"], hasProfit: true, monthlyProfit: 644, yearlyProfit: 7728 },
    { id: 'prod-fuse-001', name: "Car Fuses 10 Pack Standard Blade", price: "£0.15", rating: 4.6, reviews: 89, image: carBulbImg, basket: 89, monthlyOrders: "3.2K", markup: "1227%",
      statuses: ["Best Seller", "89 in basket", "Amazon's Choice"], hasProfit: true, monthlyProfit: 512, yearlyProfit: 6144 },
    { id: 'prod-tape-001', name: "Black Gaffer Tape Professional", price: "£8.99", rating: 4.4, reviews: 156, image: tapeImg, basket: 67, monthlyOrders: "2.8K", markup: "320%",
      statuses: ["Trending Now", "67 in basket", "Amazon's Choice"] },
    { id: 'prod-laces-001', name: "Colorful Shoe Laces 5 Pairs", price: "£5.99", rating: 4.2, reviews: 98, image: lacesImg, basket: 45, monthlyOrders: "1.9K", markup: "280%",
      statuses: ["Selling Fast", "45 in basket", "Best Seller"] },
    { id: 'prod-sunglasses-001', name: "Fashion Sunglasses UV Protection", price: "£12.99", rating: 4.5, reviews: 134, image: sunglassesImg, basket: 78, monthlyOrders: "3.5K", markup: "350%",
      statuses: ["Hot Item", "78 in basket", "Amazon's Choice"] }
  ]

  // Duplicate products for infinite scroll
  const scrollingProducts = [...featuredProducts, ...featuredProducts]

  // Best wholesale products - matching main.html
  const wholesaleProducts = [
    { name: "Large White Glitter Fairy Wings", price: "£19.89", markup: "340%", image: fairyImg, badge: "Best Seller" },
    { name: "Clear Reusable Forks 150pcs", price: "£19.89", markup: "250%", image: forksImg, badge: "Hot Deal" },
    { name: "1L Plastic Measuring Jug", price: "£19.89", markup: "280%", image: glassImg, badge: "Best Seller" },
    { name: "1M Charger Cable", price: "£19.89", markup: "220%", image: cableImg, badge: "Hot Deal" },
    { name: "Extra Thin Nose Ring 0.5mm", price: "£19.89", markup: "270%", image: noseRingImg, badge: "Best Seller" },
    { name: "Black NATO Watch Strap", price: "£19.89", markup: "240%", image: watchStrapImg, badge: "Hot Deal" },
    { name: "Adult Dancewear Princess Tutu Skirt", price: "£19.89", markup: "260%", image: balloonImg, badge: "Best Seller" },
    { name: "300 Pack Paper Straws", price: "£19.89", markup: "290%", image: spoonImg, badge: "Hot Deal" }
  ]

  const wholesaleScrolling = [...wholesaleProducts, ...wholesaleProducts]

  // Shuffle array function
  const shuffleArray = (array) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  // Check if buyer is logged in
  useEffect(() => {
    const token = localStorage.getItem('buyerToken')
    setIsBuyerLoggedIn(!!token)
  }, [])

  useEffect(() => {
    const subtitleInterval = setInterval(() => {
      setCurrentSubtitle((prev) => (prev + 1) % subtitles.length)
    }, 5000)
    
    const rotatingTextInterval = setInterval(() => {
      setCurrentRotatingText((prev) => (prev + 1) % rotatingTexts.length)
    }, 5000)
    
    const imageRotationInterval = setInterval(() => {
      setCurrentImageSet((prev) => (prev + 1) % imageSets.length)
    }, 4000)
    
    return () => {
      clearInterval(subtitleInterval)
      clearInterval(rotatingTextInterval)
      clearInterval(imageRotationInterval)
    }
  }, [])

  // Rotate status indicators
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStatusIndex(prev => {
        const newIndex = {}
        featuredProducts.forEach((_, idx) => {
          const currentIdx = prev[idx] || 0
          newIndex[idx] = (currentIdx + 1) % 3
        })
        return newIndex
      })
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const handleContactNow = (e, product) => {
    e.preventDefault()
    e.stopPropagation()
    // Navigate to product detail page
    navigate(`/product/${product.id}`)
  }

  const handleProductClick = (product) => {
    // Pass all product data in URL parameters so it displays correctly
    const params = new URLSearchParams({
      name: product.name,
      img: product.image,
      price: product.price.replace(/[£$₨]/g, ''),
      rating: product.rating || 4.5,
      reviews: product.reviews || 0,
      category: 'General',
      brand: '',
      discount: 0
    })
    const url = `/product/${product.id}?${params.toString()}`
    window.open(url, '_blank')
  }

  return (
    <div>
      {/* Currency Selector - Fixed Position */}
      <CurrencySelector />

      {/* Hero Section with Animated Background */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="background-grid">
            {imageSets[currentImageSet].map((image, index) => (
              <div key={index} className={`grid-item item-${index + 1}`}>
                <img src={image} alt={`Product ${index + 1}`} className="animate__animated animate__fadeIn" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="container hero-content">
          <div className="row justify-content-center">
            <div className="col-lg-10 col-xl-9 text-center">
              <h1 className="hero-title animate__animated animate__fadeInDown" style={{marginTop: '60px'}}>
                Connecting Amazon Business <span className="highlight-text">Community under One Roof</span>
              </h1>
              
              {/* Rotating Hero Subtitle */}
              <section className="rotating-text-section">
                <div className="rotating-text-container">
                  {rotatingTexts.map((text, index) => (
                    <div key={index} className={`rotating-text ${index === currentRotatingText ? 'active' : ''}`}>
                      <h3>{text.title}</h3>
                      <p>{text.description}</p>
                    </div>
                  ))}
                </div>
              </section>
              
              <div className="search-bar">
                <div className="input-group search-input-group">
                  <input 
                    type="text" 
                    className="form-control form-control-lg search-input" 
                    placeholder="Search by Product, Supplier, or Category"
                  />
                  <button className="btn search-btn" type="button">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>
              
              <div className="hero-buttons d-flex gap-3 justify-content-center flex-wrap animate__animated animate__fadeInUp animate__delay-1s">
                <Link to="/amazons-choice" className="btn btn-primary btn-lg px-4 py-3 shadow-lg">
                  <i className="fas fa-store me-2"></i>Explore Amazon's Choice
                </Link>
                <Link to="/join-now" className="btn btn-outline-light btn-lg px-4 py-3 shadow-lg">
                  <i className="fas fa-user-plus me-2"></i>Join Community
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding">
        <div className="container">
          <div className="row g-3 stats-bar mb-4">
            <div className="col-12 col-md-4">
              <div className="stat-card">
                <div className="stat-heading">Average Markup</div>
                <div className="stat-value">170.00%</div>
                <div className="stat-sub">of wholesale prices</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="stat-card">
                <div className="stat-heading">Active Deals</div>
                <div className="stat-value">21,674+</div>
                <div className="stat-sub">as of today</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="stat-card">
                <div className="stat-heading">New Suppliers</div>
                <div className="stat-value">321</div>
                <div className="stat-sub">in the past 7 days</div>
              </div>
            </div>
          </div>

          <div className="section-header text-center mb-5">
            <h2 className="section-title modern-title">Amazon's Choice Products</h2>
            <p className="section-subtitle">Handpicked bestsellers with proven sales performance</p>
          </div>
          <div className="featured-scroller-container amazon-choice-products">
            <div className="featured-scroller">
              {[...featuredProducts, ...featuredProducts].map((product, index) => (
                <div key={index} className="featured-item featured-item-small">
                  <div 
                    className="product-card" 
                    style={{cursor: 'pointer', textDecoration: 'none', color: 'inherit'}}
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="amazon-choice-badge">Amazon's Choice</div>
                    <div className="markup-badge">{product.markup}</div>
                    
                    <div className="product-image-container">
                      <img 
                        src={product.image}
                        alt={product.name} 
                        className="product-image"
                      />
                    </div>
                    
                    <div className="card-body">
                      <h5 className="card-title">{product.name}</h5>
                      <p className="card-text">Premium quality product with excellent customer reviews</p>
                      
                      <div className="price">{formatPrice(product.price)}</div>
                      <div className="monthly-orders">Monthly Orders: {product.monthlyOrders}</div>
                      
                      <div className="rating">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`${i < Math.floor(product.rating) ? 'fas' : (i < product.rating ? 'fas fa-star-half-alt' : 'far')} fa-star`}></i>
                        ))}
                        <span className="rating-count">({product.reviews})</span>
                      </div>
                      
                      {product.hasProfit && product.monthlyProfit && (
                        <div className="profit-display" style={{marginTop: '6px', padding: '6px', background: '#f8f9fa', borderLeft: '3px solid #28a745', borderRadius: '6px', fontSize: '.8rem'}}>
                          <div className="profit-row" style={{display: 'flex', justifyContent: 'space-between'}}>
                            <span className="profit-label">Monthly Profit:</span>
                            <span className="profit-value blink" style={{fontWeight: '700', color: '#28a745'}}>£{product.monthlyProfit}</span>
                          </div>
                          <div className="profit-row" style={{display: 'flex', justifyContent: 'space-between'}}>
                            <span className="profit-label">Yearly Profit:</span>
                            <span className="profit-value" style={{fontWeight: '700', color: '#28a745'}}>£{product.yearlyProfit.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="product-status" style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', height: '20px', overflow: 'hidden', position: 'relative'}}>
                        {product.statuses.map((status, statusIdx) => (
                          <span 
                            key={statusIdx}
                            className={`status-indicator ${
                              status.includes("Best Seller") ? "status-best-seller" :
                              status.includes("Selling Fast") ? "status-selling-fast" :
                              status.includes("Amazon's Choice") ? "status-amazon-choice" :
                              status.includes("Trending") ? "status-trending" :
                              status.includes("in basket") ? "status-basket" : "status-best-seller"
                            } ${(currentStatusIndex[index] || 0) === statusIdx ? 'active' : ''}`}
                            style={{
                              padding: '3px 6px',
                              borderRadius: '4px',
                              fontWeight: '600',
                              fontSize: '0.65rem',
                              display: 'inline-block',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              opacity: (currentStatusIndex[index] || 0) === statusIdx ? 1 : 0,
                              transition: 'opacity 0.5s ease'
                            }}
                          >
                            {status}
                          </span>
                        ))}
                      </div>
                      
                      <div className="product-actions" style={{display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px'}}>
                        <a 
                          href={`https://www.amazon.com/s?k=${encodeURIComponent(product.name)}`}
                          className="btn btn-outline-primary btn-sm"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="fab fa-amazon me-1"></i>Verify on Amazon
                        </a>
                        {isBuyerLoggedIn ? (
                          <button
                            onClick={(e) => handleContactNow(e, product)}
                            className="btn btn-success btn-sm"
                            style={{background: '#10b981'}}
                          >
                            <i className="fas fa-phone me-1"></i>Contact Now
                          </button>
                        ) : (
                          <Link 
                            to="/join-now"
                            className="btn btn-primary btn-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <i className="fas fa-lock me-1"></i>Join Now
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-4">
            <Link to="/amazons-choice" className="btn btn-primary me-2">View All Products</Link>
            <Link to="/contact" className="btn btn-outline-primary">List Your Product</Link>
          </div>
        </div>
      </section>

      {/* Amazon Gymkhana Best Seller's Choice Section */}
      <section className="section-padding">
        <div className="container">
          <div className="wholesale-section">
            <div className="wholesale-header">
              <h2 className="wholesale-title">Amazon Gymkhana Best Seller's Choice</h2>
              <p className="wholesale-subtitle">High-margin products with proven sales performance. Perfect for resellers and retailers.</p>
            </div>
            <div className="wholesale-products">
              <div className="wholesale-scroll">
                {wholesaleScrolling.map((product, index) => (
                  <div key={index} className="wholesale-item">
                    <div className="wholesale-badge">{product.badge}</div>
                    <div className="wholesale-image">
                      <img 
                        src={product.image}
                        alt={product.name} 
                      />
                    </div>
                    <div className="wholesale-content">
                      <h4 className="wholesale-name">{product.name}</h4>
                      <div className="wholesale-price">{formatPrice(product.price)}</div>
                      <div className="wholesale-markup">{product.markup} Markup</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header text-center mb-5">
            <h2 className="section-title modern-title">What Our Customers Say</h2>
            <p className="section-subtitle">Real feedback from successful Amazon sellers</p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="testimonial-card">
                <p>"Found amazing Pakistani suppliers here. My margins improved instantly."</p>
                <div className="t-meta">— Ali R., Amazon Seller</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="testimonial-card">
                <p>"The community and deals are legit. Highly recommend joining."</p>
                <div className="t-meta">— Sana K., Retailer</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="testimonial-card">
                <p>"As a manufacturer, I connected with multiple exporters in a week."</p>
                <div className="t-meta">— Farooq M., Manufacturer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zone Cards */}
      <section className="section-padding bg-light">
        <div className="container text-center">
          <div className="section-header text-center mb-5">
            <h2 className="section-title modern-title">Join Our Community</h2>
            <p className="section-subtitle">Connect with suppliers, retailers, and service providers</p>
          </div>
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-3">
              <div className="zone-card">
                <i className="fas fa-industry"></i>
                <h4>Supplier's / Manufacturer's Zone</h4>
                <p>List your products and connect with retailers looking for quality Pakistani products.</p>
                <Link to="/register/supplier" className="btn btn-outline-primary mt-3">Explore More</Link>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="zone-card">
                <i className="fas fa-store"></i>
                <h4>Retailer's Zone</h4>
                <p>Find verified suppliers and source products for your Amazon store.</p>
                <Link to="/register/buyer" className="btn btn-outline-primary mt-3">Explore Product's</Link>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="zone-card">
                <i className="fas fa-concierge-bell"></i>
                <h4>Service Providers</h4>
                <p>Offer your Amazon-related services to the community (photography, listing, etc.).</p>
                <Link to="/auth" className="btn btn-outline-primary mt-3">Explore Services</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding how-it-works">
        <div className="container">
          <div className="section-header text-center mb-5">
            <h2 className="section-title modern-title text-white">How It Works</h2>
            <p className="section-subtitle text-white opacity-75">Get started in three simple steps</p>
          </div>
          <div className="row">
            <div className="col-md-4">
              <div className="step-card">
                <div className="step-number">1</div>
                <h4>Register</h4>
                <p>Create your account as a supplier, retailer, or service provider.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="step-card">
                <div className="step-number">2</div>
                <h4>Find Best Seller Product</h4>
                <p>Find your best Product- <br /> Buy / Sale</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="step-card">
                <div className="step-number">3</div>
                <h4>Connect Directly</h4>
                <p>Use our integrated WhatsApp / WeChat feature to connect directly with potential partners.</p>
              </div>
            </div>
          </div>
          <div className="text-center mt-5">
            <Link to="/join-now" className="btn btn-primary btn-lg">Get Started Today</Link>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  )
}

export default Home