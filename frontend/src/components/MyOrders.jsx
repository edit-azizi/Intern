import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/MyOrders.css";

function MyOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all")
  const gridRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 3;
  const navigate = useNavigate();


  useEffect(() => {
  if (gridRef.current) {
    gridRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}, [currentPage]);


  useEffect(() => {
    if (!user) return;

    api.get("/api/orders/myOrders.php").then((res) => {
      if (res.data.status === "success") {
        setOrders(res.data.orders);
      }
    });
  }, [user]);

  useEffect(() => {
  setCurrentPage(1);
}, [statusFilter]);


  if (!user) return <p>Please log in.</p>;

  const filteredOrders = orders
    .filter((o) => (statusFilter === "all" ? true : o.status === statusFilter))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

     // Pagination Logic
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const indexOfLast = currentPage * ordersPerPage;
    const indexOfFirst = indexOfLast - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);

  const getPageNumbers = () => {
  const pages = [];
  const range = 3;

  let start = Math.max(2, currentPage - range);
  let end = Math.min(totalPages - 1, currentPage + range);

  if (currentPage - range <= 2) {
    end = Math.min(totalPages - 1, end + (2 - (currentPage - range)));
  }

  if (currentPage + range >= totalPages - 1) {
    start = Math.max(2, start - ((currentPage + range) - (totalPages - 1)));
  }

  if (start > 2) pages.push("start-dots");

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) pages.push("end-dots");

  return pages;
};

  return (
    <div className="orders-container" ref={gridRef}>
      <h1>My Orders</h1>

      <div className="filters-container">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="shipped">Shipped</option>
        </select>
      </div>

      {currentOrders.map((order) => {
        // Calculate total of original item prices
        const originalSum = order.items.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );

        // Proportionally adjust item prices if total has been discounted
        const adjustedItems = order.items.map((item) => {
          const proportion = originalSum ? item.subtotal / originalSum : 0;
          const adjustedSubtotal = proportion * order.total;
          return {
            ...item,
            subtotal: adjustedSubtotal,
          };
        });

        return (
          <div key={order.id} className="order-card">
            <p>
              Status: <strong>{order.status}</strong>
            </p>

            <table className="orders-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {adjustedItems.map((item, index) => (
                  <tr key={index}>
                    <td data-label="Product">{item.title}</td>
                    <td data-label="Qty">{item.quantity}</td>
                    <td data-label="Subtotal">${item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>Total: ${order.total.toFixed(2)}</h3>

            {order.status !== "paid" && order.status !== "shipped" && (
              <button
                type="button"
                className="payment_btn"
                onClick={() =>
                  navigate(`/payment/${order.id}`, { state: { order } })
                }
              >
                Proceed to payment
              </button>
            )}
          </div>
        );
      })}

      {totalPages > 1 && (
  <div className="pagination-container">

    <button
      className="page-arrow"
      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
    >
      ◀
    </button>

    {/* First Page */}
    <button
      className={`page-nr ${currentPage === 1 ? "active" : ""}`}
      onClick={() => setCurrentPage(1)}
    >
      1
    </button>

    {getPageNumbers().map((item, index) =>
      item === "start-dots" || item === "end-dots" ? (
        <span key={index} className="dots">...</span>
      ) : (
        <button
          key={index}
          className={`page-nr ${currentPage === item ? "active" : ""}`}
          onClick={() => setCurrentPage(item)}
        >
          {item}
        </button>
      )
    )}

    {/* Last Page */}
    {totalPages > 1 && (
      <button
        className={`page-nr ${currentPage === totalPages ? "active" : ""}`}
        onClick={() => setCurrentPage(totalPages)}
      >
        {totalPages}
      </button>
    )}

    <button
      className="page-arrow"
      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
      disabled={currentPage === totalPages}
    >
      ▶
    </button>

  </div>
)}

    </div>
  );
}

export default MyOrders;

