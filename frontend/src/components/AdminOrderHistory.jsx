import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/AdminOrderHistory.css";

function AdminOrderHistory({ user }) {
  const navigate = useNavigate();

  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterType, setFilterType] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8; // 8 rows + 1 totals row = 9 total

  const gridRef = useRef(null);

  useEffect(() => {
  if (gridRef.current) {
    gridRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}, [currentPage]);

  const totals = stats.reduce(
    (acc, row) => {
      acc.totalSold += Number(row.total_sold);
      acc.totalOrders += Number(row.orders_count);
      acc.totalRevenue += Number(row.revenue);
      return acc;
    },
    { totalSold: 0, totalOrders: 0, totalRevenue: 0 }
  );

      // Pagination Logic
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = stats.slice(indexOfFirstRow, indexOfLastRow);

    const totalPages = Math.ceil(stats.length / rowsPerPage);

    useEffect(() => {
  setCurrentPage(1);
}, [filterType, customFrom, customTo]);



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

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  // Fetch stats
  const fetchStats = async () => {
    setLoading(true);

    try {
      let url = `/api/admin/orders/analytics.php?type=${filterType}`;

      if (filterType === "custom") {
        url += `&from=${customFrom}&to=${customTo}`;
      }

      const res = await api.get(url);

      // ensure stats is always an array
      if (Array.isArray(res.data)) {
        setStats(res.data);
      } else {
        setStats([]); // prevent stats.map error
      }
    } catch (err) {
      console.error(err);
      showAlert("Failed to fetch stats.", "error");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  // Delete orders
  const deleteOrders = async () => {
    showConfirm("Are you sure you want to delete these orders?", async () => {
      try {
        const res = await api.post("/api/admin/orders/delete.php", {
          type: filterType,
          from: customFrom,
          to: customTo,
        });

        if (res.data.status === "success") {
          showAlert(`Deleted ${res.data.deleted_rows} orders`, "success");
          fetchStats();
        } else {
          showAlert(res.data.message, "error");
        }
      } catch (err) {
        console.error(err);
        showAlert("Delete failed", "error");
      }
    });
  };

  // Export CSV
  const exportCSV = () => {
    let url =
      "http://localhost/Intern/backend/api/admin/orders/export.php?type=" +
      filterType;

    if (filterType === "custom") {
      url += `&from=${customFrom}&to=${customTo}`;
    }

    window.open(url, "_blank");
  };

      const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 3;

      let start = Math.max(2, currentPage - maxVisible);
      let end = Math.min(totalPages - 1, currentPage + maxVisible);

      pages.push(1);

      if (start > 2) pages.push("...");

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) pages.push("...");

      if (totalPages > 1) pages.push(totalPages);

      return pages;
    };

  return (
    <div className="order-history-container" ref={gridRef}>
      <h1>Order History (Analytics)</h1>

      <div className="filter-panel-history">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>

        {filterType === "custom" && (
          <div className="custom-range">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
            <button onClick={fetchStats}>Apply</button>
          </div>
        )}

        <button onClick={exportCSV}>Export to Excel (CSV)</button>
        <button className="delete-btn" onClick={deleteOrders}>
          Delete Orders
        </button>
      </div>

      <div className="stats-table">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Total Sold</th>
                <th>Orders Count</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{row.total_sold}</td>
                  <td>{row.orders_count}</td>
                  <td>${Number(row.revenue).toFixed(2)}</td>
                </tr>
              ))}

              {/* TOTALS ROW */}
              {stats.length > 0 && (
                <tr className="totals-row">
                  <td>
                    <strong>Total</strong>
                  </td>
                  <td>
                    <strong>{totals.totalSold}</strong>
                  </td>
                  <td>
                    <strong>{totals.totalOrders}</strong>
                  </td>
                  <td>
                    <strong>${totals.totalRevenue.toFixed(2)}</strong>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {stats.length === 0 && !loading && (
          <p>No orders found for this period.</p>
        )}

      {totalPages > 1 && (
      <div className="pagination-container-history">
        <button
          className="page-arrow"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          ◀
        </button>

        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span key={index} className="dots">...</span>
          ) : (
            <button
              key={index}
              className={`page-number ${currentPage === page ? "active" : ""}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          )
        )}

        <button
          className="page-arrow"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          ▶
        </button>
      </div>
    )}
      </div>

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

export default AdminOrderHistory;
