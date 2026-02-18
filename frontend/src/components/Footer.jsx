import "../styles/Footer.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faSquareXTwitter } from '@fortawesome/free-brands-svg-icons';
import { faGlobe} from '@fortawesome/free-solid-svg-icons';
import logocircle from '../assets/techzone-circle-tab.png'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand */}
        <div className="footer-section">
          <h2 className="footer-logo">TechZone</h2>
          <p>Your one-stop shop for premium tech products.</p>
        </div>

        {/* Links */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/products">Products</a></li>
            <li><a href="/favorites">Favorites</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        {/* Support */}
        <div className="footer-section">
          <h3>Support</h3>
          <ul>
            <li><a href="/faq">FAQ</a></li>
            <li><a href="/shipping">Shipping</a></li>
            <li><a href="/returns">Returns</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
          </ul>
        </div>

        {/* Social */}
        <div className="footer-section">
          <h3>Follow Us</h3>
          <div className="social-icons">
         <button title="Website" aria-label="Website"><FontAwesomeIcon icon={faGlobe} /></button>
         <button title="Facebook" aria-label="Facebook"><FontAwesomeIcon icon={faFacebook} /></button>
         <button title="Instagram" aria-label="Instagram"><FontAwesomeIcon icon={faInstagram} /></button>
         <button title="X" aria-label="Twitter"><FontAwesomeIcon icon={faSquareXTwitter} /></button>
        </div>

        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} TechZone. All rights reserved.
      </div>
      <img src={logocircle} alt="TechZone Logo" className="logo-footer" />
    </footer>
  );
}

export default Footer;
