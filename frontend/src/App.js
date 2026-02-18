import { useEffect, useState, useCallback  } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import api from "./api/axios";


import Header from "./components/Header";
import Home from "./components/Home";
import Products from "./components/Products";
import Login from "./components/Login";
import Register from "./components/Register";
import MyOrders from "./components/MyOrders";
import Dashboard from "./components/Dashboard";
import UsersDashboard from "./components/UsersDashboard";
import AdminOrders from "./components/AdminOrders";
import Payment from "./components/Payment";
import Account from "./components/Account";
import Favorites from "./components/Favorites";
import AdminOrderHistory from "./components/AdminOrderHistory";
import Footer from "./components/Footer";
import ContactUs from "./components/ContactUs";
import ContactDashboard from "./components/ContactDashboard";
import DiscountDashboard from "./components/DiscountDashboard";
import Cart from "./components/Cart";
import ScrollToTop from "./components/ScrollToTop";
import ProductImagesDashboard from "./components/ProductImagesDashboard";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";


function App() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  // Persist login on refresh
  useEffect(() => {
    api
      .get("/api/auth/me.php")
      .then((res) => {
        if (res.data.loggedIn) {
          setUser(res.data.user); // { id, name, role }
        }
      })
      .finally(() => setLoading(false));
  }, []);

// Declare fetchCartCount first
const fetchCartCount = useCallback(async () => {
  if (!user) {
    setCartCount(0);
    return;
  }

  try {
    const res = await api.get("/api/cart/get.php");
    setCartCount(res.data.length); // count UNIQUE products only
  } catch (err) {
    console.error(err);
  }
}, [user]);

// Then use it inside useEffect
useEffect(() => {
  if (user?.role === "user") {
    fetchCartCount();
  } else {
    setCartCount(0);
  }
}, [user, fetchCartCount]);



  if (loading) return null; // prevents flicker

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isUser = user?.role === "user";

  return (
    <>
      <Header user={user} setUser={setUser} cartCount={cartCount} />

      <ScrollToTop />

      <Routes>

        <Route path="/" element={<Navigate to="/home" />} />
        {/* Public */}
        <Route path="/home" element={<Home user={user} refreshCartCount={fetchCartCount} />} />
        <Route path="/products" element={<Products user={user} refreshCartCount={fetchCartCount} />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* User */}
        <Route
          path="/my-orders"
          element={user ? <MyOrders user={user} /> : <Navigate to="/login" />}
        />

        <Route
          path="/payment/:orderId"
          element={user ? <Payment user={user} /> : <Navigate to="/login" />}
        />

        <Route
          path="/account"
          element={
            user ? <Account user={user} setUser={setUser} /> : <Navigate to="/login" />
          }
        />

        {/* ONLY USERS */}
        <Route
          path="/favorites"
          element={
            isUser ? <Favorites user={user} refreshCartCount={fetchCartCount} /> : <Navigate to="/" />
          }
        />

        <Route
          path="/cart"
          element={
            isUser ? <Cart user={user} refreshCartCount={fetchCartCount} /> : <Navigate to="/" />
          }
        />

        {/* Admin + Manager */}
        <Route
          path="/dashboard"
          element={
            isAdmin || isManager ? (
              <Dashboard user={user} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/dashboard/product-images"
          element={
            isAdmin || isManager ? (
              < ProductImagesDashboard user={user} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/admin-orders"
          element={
            isAdmin || isManager ? (
              <AdminOrders user={user} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/admin-order-history"
          element={
            isAdmin || isManager ? (
              <AdminOrderHistory user={user} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/contact-dashboard"
          element={
            isAdmin || isManager ? (
              <ContactDashboard user={user} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/discount-dashboard"
          element={
            isAdmin || isManager ? (
              <DiscountDashboard user={user} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* ONLY ADMIN */}
        <Route
          path="/dashboard/users"
          element={
            isAdmin ? <UsersDashboard user={user} /> : <Navigate to="/" />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {["/home", "/products", "/contact"].includes(location.pathname) && (
       <Footer user={user} setUser={setUser} />
       )}
       
    </>
  );
}

export default App;
