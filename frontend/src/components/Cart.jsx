import { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/Cart.css";

function Cart({ refreshCartCount }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState(null); // success / error messages
  const [confirmModal, setConfirmModal] = useState(null); // remove / checkout

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    const res = await api.get("/api/cart/get.php");
    setCart(res.data);
  };


    // TOAST HANDLER

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };


    // REMOVE ITEM

  const removeItem = async (id) => {
    setConfirmModal({
      message: "Are you sure you want to remove this item?",
      onConfirm: async () => {
        await api.post("/api/cart/delete.php", { id });
        fetchCart();
        refreshCartCount();
        showToast("Item removed from cart.", "success");
        setConfirmModal(null);
      },
    });
  };


 // CHECKOUT

  const checkout = async () => {
    setConfirmModal({
      message: "Are you sure you want to place this order?",
      onConfirm: async () => {
        try {
          setLoading(true);
          const res = await api.post("/api/cart/checkout.php");

          if (res.data.status === "success") {
            showToast("Order created successfully!", "success");
            fetchCart();
            refreshCartCount();
          } else {
            showToast("Something went wrong.", "error");
          }
        } catch (err) {
          showToast("Server error. Try again.", "error");
        } finally {
          setLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-container">
      <h1>Your Cart</h1>

      {cart.length === 0 ? (
        <p>Cart is empty</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody className="cart-body">
              {cart.map((item) => (
                <tr key={item.id}>
                  <td data-label="Product">{item.title}</td>
                  <td data-label="Qty">{item.quantity}</td>
                  <td data-label="Price">${item.price}</td>
                  <td data-label="Action">
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Total: ${total.toFixed(2)}</h2>

          <button
            className="checkout-btn"
            onClick={checkout}
            disabled={loading}
          >
            {loading ? "Processing..." : "ORDER NOW"}
          </button>
        </>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <p>{confirmModal.message}</p>
            <div className="modal-actions">
              <button
                className="modal-cancel"
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                className="modal-confirm"
                onClick={confirmModal.onConfirm}
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
