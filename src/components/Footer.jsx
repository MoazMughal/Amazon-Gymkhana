import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-md-6 mb-4">
            <h5>About Amazon Choice</h5>
            <p>Connecting Pakistan's Amazon sellers, suppliers, and service providers under one platform to foster growth and collaboration.</p>
            <div className="social-icons mt-4">
              <a href="#" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" aria-label="YouTube">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-6 mb-4">
            <h5>Quick Links</h5>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/amazons-choice">Amazon's Choice</Link></li>
              <li><Link to="/categories">Best Seller Categories</Link></li>
              <li><Link to="/latest-deals">Today's deals</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          
          <div className="col-lg-3 col-md-6 mb-4">
            <h5>Important Links</h5>
            <ul>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">FAQs</a></li>
            </ul>
          </div>
          
          <div className="col-lg-3 col-md-6 mb-4">
            <h5>Contact Info</h5>
            <ul>
              <li><i className="fas fa-map-marker-alt me-2"></i> Islamabad, Pakistan</li>
              <li><i className="fas fa-envelope me-2"></i> info@amazonchoice.pk</li>
              <li><i className="fas fa-phone me-2"></i> +92 300 1234567</li>
              <li><i className="fab fa-whatsapp me-2"></i> +92 300 1234567</li>
            </ul>
          </div>
        </div>
        
        <div className="copyright">
          <p>&copy; 2023 Amazon Choice. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer