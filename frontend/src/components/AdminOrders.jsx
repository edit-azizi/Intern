import { useEffect, useState, useCallback, useRef  } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/AdminOrders.css";

function AdminOrders({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  const gridRef = useRef(null);

  useEffect(() => {
  if (gridRef.current) {
    gridRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}, [currentPage]);

  useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, statusFilter, fromDate, toDate]);


  //  MODERN ALERT STATE
  const [uiAlert, setUiAlert] = useState({
    show: false,
    message: "",
    type: "info", // success  error  warning  info  confirm
    onConfirm: null,
  });

  const showAlert = (message, type = "info") => {
    setUiAlert({ show: true, message, type, onConfirm: null });
  };

  const showConfirm = (message, onConfirm) => {
    setUiAlert({ show: true, message, type: "confirm", onConfirm });
  };

  const closeAlert = () => {
    setUiAlert({ show: false, message: "", type: "info", onConfirm: null });
  };

  // FETCH ORDERS (wrapped in useCallback for ESLint fix)
  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get("/api/orders/get_all.php");
      setOrders(res.data);

      // Example alert: notify if there are pending orders
      const pendingOrders = res.data.filter(o => o.status === "pending");
      if (pendingOrders.length > 0) {
        showAlert(
          `⚠️ Pending Orders Alert\n\n` +
          pendingOrders.map(o =>
         `• ${o.username} - ${o.items.length} product(s)`).join("\n"),
          "warning"
        );
      }

    } catch {
      showAlert("Failed to fetch orders", "error");
    }
  }, []);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      navigate("/");
      return;
    }

    fetchOrders();
  }, [user, navigate, fetchOrders]);

  const updateStatus = async (id, status) => {
    showConfirm("Are you sure you want to change the status?", async () => {
      const res = await api.post("/api/orders/update_status.php", { id, status });

      if (res.data.status === "success") {
        showAlert("Order status updated successfully!", "success");
        fetchOrders();
      } else {
        showAlert(res.data.message, "error");
      }
    });
  };

  const deleteOrder = async (id) => {
    showConfirm("Delete this order?", async () => {
      const res = await api.post("/api/orders/delete.php", { id });

      if (res.data.status === "success") {
        showAlert("Order deleted successfully!", "success");
        fetchOrders();
      } else {
        showAlert(res.data.message, "error");
      }
    });
  };

  // FILTER LOGIC
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredOrders = orders
    .filter((o) => {
      const username = (o.username || "").toLowerCase();
      const matchesSearch =
        normalizedQuery === ""
          ? true
          : username.includes(normalizedQuery) ||
            o.items.some(item =>
                (item.title || "")
                  .toLowerCase()
                  .includes(normalizedQuery)
            );

      const matchesStatus =
        statusFilter === "all" ? true : o.status === statusFilter;

   if (!o.created_at) return false;

      const orderDate = new Date(o.created_at.replace(" ", "T"));

      const from = fromDate
        ? new Date(fromDate + "T00:00:00")
        : null;

      const to = toDate
        ? new Date(toDate + "T23:59:59")
        : null;

      const matchesFrom = from ? orderDate >= from : true;
      const matchesTo = to ? orderDate <= to : true;


      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    })
    .sort((a, b) => new Date(b.order_time) - new Date(a.order_time));


    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const getPageNumbers = () => {
  const pages = [];
  const range = 3;

  let start = Math.max(2, currentPage - range);
  let end = Math.min(totalPages - 1, currentPage + range);

  if (currentPage <= range + 2) {
    end = Math.min(totalPages - 1, 1 + range * 2);
  }

  if (currentPage >= totalPages - (range + 1)) {
    start = Math.max(2, totalPages - range * 2);
  }

  pages.push(1);

  if (start > 2) pages.push("start-ellipsis");

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) pages.push("end-ellipsis");

  if (totalPages > 1) pages.push(totalPages);

  return pages;
};

  // RESET DATES FUNCTION
  const resetDates = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="admin-orders-container">
      <h1>Manage Orders</h1>

      {/* SEARCH + FILTER */}
      <div className="filters-container">
        <input
          type="text"
          placeholder="Search by username or product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="shipped">Shipped</option>
        </select>

        From: <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        To: <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        <button className="reset-btn" onClick={resetDates}>
          Reset Dates
        </button>
      </div>

      <table className="admin-orders-table" ref={gridRef}>
        <thead>
          <tr>
            <th>User</th>
            <th>Product</th>
            <th>ISBN</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Shipping Address</th>
            <th>Ordered At</th>
            <th>Actions</th>
          </tr>
        </thead>
<tbody>
  {currentOrders.map((o) => (
    <tr key={o.id}>
      <td>{o.username}</td>

      {/* PRODUCTS TABLE */}
      <td colSpan="4">
        <table className="nested-products">
          <thead>
            <tr>
              <th>Product</th>
              <th>ISBN</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody>
            {o.items.map((item, i) => (
              <tr key={i}>
                <td>{item.title}</td>
                <td>{item.isbn}</td>
                <td>{item.quantity}</td>
                <td>${Number(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

          <div style={{
              marginTop: "8px",
              fontWeight: "bold",
              textAlign: "right"
          }}>
            Order Total: ${Number(o.total).toFixed(2)}
          </div>

      </td>

      <td>
        <select
          className="order-status"
          value={o.status}
          onChange={(e) => updateStatus(o.id, e.target.value)}
        >
          <option value="pending" disabled={o.status === "paid" || o.status === "shipped"}>
            Pending
          </option>
          <option value="paid">Paid</option>
          <option value="shipped">Shipped</option>
        </select>
      </td>

      <td>{o.payment_method || "N/A"}</td>
      <td>{o.shipping_address || "N/A"}</td>
      <td>{o.created_at}</td>

      <td>
        <button className="delete-btn" onClick={() => deleteOrder(o.id)}>
          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>

      </table>
      
          {totalPages > 1 && (
  <div className="pagination-ord">

    <button
      className="page-arrow"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(prev => prev - 1)}
    >
      ◀
    </button>

    {getPageNumbers().map((item, index) =>
      item === "start-ellipsis" || item === "end-ellipsis" ? (
        <span key={index} className="dots">...</span>
      ) : (
        <button
          key={index}
          className={`page-number ${currentPage === item ? "active" : ""}`}
          onClick={() => setCurrentPage(item)}
        >
          {item}
        </button>
      )
    )}

    <button
      className="page-arrow"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(prev => prev + 1)}
    >
      ▶
    </button>

  </div>
)}

      {/* ALERT UI */}
      {uiAlert.show && (
        <div className="ui-alert-overlay">
          <div className={`ui-alert ${uiAlert.type}`}>
            <p style={{ whiteSpace: "pre-line" }}>{uiAlert.message}</p>
            <div className="ui-alert-actions">
              {uiAlert.type === "confirm" ? (
                <>
                  <button
                    className="btn confirm"
                    onClick={() => {
                      uiAlert.onConfirm();
                      closeAlert();
                    }}
                  >
                    Yes
                  </button>
                  <button className="btn cancel" onClick={closeAlert}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn ok" onClick={closeAlert}>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
