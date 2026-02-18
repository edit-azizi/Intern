import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api/axios";
import "../styles/Payment.css";

function Payment({ user }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const order = state?.order;

  const [paymentMethod, setPaymentMethod] = useState("");
  const [address, setAddress] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [paypalEmail, setPaypalEmail] = useState("");

  const [discountCode, setDiscountCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);

  const [alertMsg, setAlertMsg] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const showPopup = (msg) => {
    setAlertMsg(msg);
    setShowAlert(true);
  };

  const closePopup = () => {
    setShowAlert(false);
    setAlertMsg("");
  };

  if (!user || !order) {
    return <p>Invalid payment request.</p>;
  }

  // use backend total instead of removed columns
  const originalPrice = Number(order.total).toFixed(2);

  const discountAmount = (originalPrice * discountPercent) / 100;
  const finalPrice = (originalPrice - discountAmount).toFixed(2);

  const applyDiscount = async () => {
    if (!discountCode.trim()) {
      showPopup("Please enter a discount code.");
      return;
    }

    try {
      const res = await api.post("/api/discounts/validate.php", {
        code: discountCode.trim(),
      });

      if (res.data.status === "success") {
        setDiscountPercent(res.data.percentage);
        showPopup(`Discount applied: ${res.data.percentage}%`);
      } else {
        showPopup(res.data.message || "Invalid discount code.");
      }
    } catch {
      showPopup("Discount validation failed.");
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!paymentMethod || !address) {
      showPopup("Please fill all required fields.");
      return;
    }

    if (paymentMethod === "cash" && (!fullName || !phone)) {
      showPopup("Cash payment requires name and phone.");
      return;
    }

    if (
      paymentMethod === "card" &&
      (!cardName || !cardNumber || !expiry || !cvv)
    ) {
      showPopup("Please fill all credit card fields.");
      return;
    }

    if (paymentMethod === "paypal" && !paypalEmail) {
      showPopup("PayPal email is required.");
      return;
    }

    try {
      const res = await api.post("/api/orders/pay.php", {
        order_id: order.id,
        payment_method: paymentMethod,
        shipping_address: address,
        discount_code: discountCode || null
      });

      if (res.data.status === "success") {
        showPopup("Payment successful!");
        setTimeout(() => navigate("/my-orders"), 1200);
      } else {
        showPopup(res.data.message ?? "Payment failed");
      }
    } catch {
      showPopup("Payment failed.");
    }
  };

  return (
    <div className="payment-page">
      <h1>Payment</h1>

      <div className="order-summary">

        {/* show all products */}
        {order.items?.map((item, index) => (
          <p key={index}>
            <strong>Product:</strong> {item.title} (x{item.quantity})
          </p>
        ))}

        <p><strong>Original Total:</strong> ${originalPrice}</p>

        {discountPercent > 0 && (
          <>
            <p><strong>Discount:</strong> {discountPercent}%</p>
            <p><strong>Final Total:</strong> ${finalPrice}</p>
          </>
        )}
      </div>

      {/* DISCOUNT SECTION */}
      <div className="discount-box">
        <label>Discount Code</label>
        <input
          type="text"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          placeholder="Enter discount code"
        />
        <button className="apply-btn" type="button" onClick={applyDiscount}>
          Apply Discount
        </button>
      </div>

      <form onSubmit={handlePayment}>
        <label className="payment-label">Payment Method</label>
        <select
          className="method-buttons"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="">Select</option>
          <option value="cash">Cash on Delivery</option>
          <option value="card">Credit Card</option>
          <option value="paypal">PayPal</option>
        </select>

        {paymentMethod === "cash" && (
          <div className="method-box">
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <label>Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        )}

        {paymentMethod === "card" && (
          <div className="payment-section">
            <label>Card Holder Name</label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />

            <label>Card Number</label>
            <input
              type="text"
              maxLength="16"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />

            <div className="card-row">
              <div>
                <label>Expiry (MM/YY)</label>
                <input
                  type="text"
                  maxLength="5"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </div>

              <div>
                <label>CVV</label>
                <input
                  type="password"
                  maxLength="3"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {paymentMethod === "paypal" && (
          <div className="payment-section">
            <label>PayPal Email</label>
            <input
              type="email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
            />
          </div>
        )}

        <label className="payment-label">Shipping Address</label>
        <textarea
          className="payment-textarea"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter full shipping address"
        />

        <button className="pay-btn" type="submit">
          Confirm Payment
        </button>
      </form>

      {/* ALERT POPUP */}
      {showAlert && (
        <div className="alert-overlay">
          <div className="alert-box">
            <p>{alertMsg}</p>
            <button onClick={closePopup}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payment;
