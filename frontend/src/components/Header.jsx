import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api/axios";
import "../styles/Header.css";
import logo from '../assets/techzone-no-background-logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faCircleUser, faHeart } from '@fortawesome/free-solid-svg-icons';


function Header({ user, setUser, cartCount }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout.php");
      setUser(null);
      navigate("/login");
    } catch {
      console.error("Logout failed");
    }
  };

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  return (
    <>
      <header className="header">
        <div className="header-left">

          {/* Admin Sidebar Button */}
          {(isAdmin || isManager) && (
            <button
              className="admin-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
          )}

          <img src={logo} alt="TechZone Logo" className="logo" />

          <Link to="/" className="nav-link">Home</Link>
          <Link to="/products" className="nav-link">Products</Link>
          <Link to="/contact" className="nav-link">Contact Us</Link>

          {/* Regular users */}
          {user && !isAdmin && !isManager && (
            <Link to="/my-orders" className="nav-link">My Orders</Link>
          )}
        </div>

        <div className="header-right">
          {!user ? (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link register-btn">Register</Link>
            </>
          ) : (
            <>
              {user && !isAdmin && !isManager && (
              <button
                className="cart-btn"
                onClick={() => navigate("/cart")}
                title="My Cart"
              >
            <div className="cart-icon-wrapper">
              <FontAwesomeIcon icon={faCartShopping} />
              {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
             )}
            </div>
            </button>

              )}

              {user && !isAdmin && !isManager && (
                <button
                  className="favorites-btn"
                  onClick={() => navigate("/favorites")}
                  title="My Favorites"
                >
                  <FontAwesomeIcon icon={faHeart} />
                </button>
              )}

              <span className="nav-link hello">Hello {user.name}</span>

              <button
                className="settings-btn"
                onClick={() => navigate("/account")}
                title="Account settings"
              >
                <FontAwesomeIcon icon={faCircleUser} />
              </button>

              <button onClick={handleLogout} className="nav-link logout-btn">
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {/* ADMIN SIDEBAR */}
      {(isAdmin || isManager) && (
        <>
          <div
            className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}
          >
            <button
              className="close-sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>

            <h3>Admin Panel</h3>

            <Link to="/dashboard" onClick={() => setSidebarOpen(false)}>Manage Products</Link>
            <Link to="/dashboard/product-images" onClick={() => setSidebarOpen(false)}>Manage Product Images</Link>
            <Link to="/admin-orders" onClick={() => setSidebarOpen(false)}>Manage Orders</Link>
            <Link to="/admin-order-history" onClick={() => setSidebarOpen(false)}>Order History</Link>
            <Link to="/contact-dashboard" onClick={() => setSidebarOpen(false)}>Messages</Link>
            <Link to="/discount-dashboard" onClick={() => setSidebarOpen(false)}>Manage Discounts</Link>

            {isAdmin && (
              <Link to="/dashboard/users" onClick={() => setSidebarOpen(false)}>
                Manage Users
              </Link>
            )}
          </div>

          {/* Overlay */}
          {sidebarOpen && (
            <div
              className="sidebar-overlay"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </>
      )}
    </>
  );
}

export default Header;
