import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/Dashboard.css";

function DiscountDashboard({ user }) {
  const navigate = useNavigate();

  const [discounts, setDiscounts] = useState([]);
  const [editDiscounts, setEditDiscounts] = useState({});
  const [updateStatus, setUpdateStatus] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5; 

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
}, [discounts]);

  const [newDiscount, setNewDiscount] = useState({
    code: "",
    percentage: "",
    max_uses: "",
    expires_at: ""
  });

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

  const fetchDiscounts = useCallback(async () => {
    try {
      const res = await api.get("/api/discounts/get.php");
      setDiscounts(res.data);

      const edits = {};
      res.data.forEach(d => {
        edits[d.id] = { ...d };
      });
      setEditDiscounts(edits);
    } catch (err) {
      console.error(err);
      showAlert("Failed to fetch discounts", "error");
    }
  }, []);

    const totalPages = Math.ceil(discounts.length / rowsPerPage);
    const paginatedDiscounts = discounts.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      navigate("/");
      return;
    }
    fetchDiscounts();
  }, [user, navigate, fetchDiscounts]);

  // CREATE DISCOUNT
  const handleAddDiscount = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/api/discounts/create.php", newDiscount);
      if (res.data.status === "success") {
        showAlert("Discount code created!", "success");
        setNewDiscount({
          code: "",
          percentage: 0,
          max_uses: "",
          expires_at: ""
        });
        fetchDiscounts();
      } else {
        showAlert(res.data.message, "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Failed to create discount", "error");
    }
  };

  // UPDATE DISCOUNT
  const handleUpdate = async (d) => {
    try {
      const res = await api.post("/api/discounts/update.php", d);
      if (res.data.status === "success") {
        setUpdateStatus("Updated successfully!");
        setTimeout(() => setUpdateStatus(""), 2000);
        fetchDiscounts();
      } else {
        showAlert(res.data.message, "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Update failed", "error");
    }
  };

  // DELETE DISCOUNT
  const handleDelete = async (id) => {
    showConfirm("Delete this discount code?", async () => {
      try {
        const res = await api.post("/api/discounts/delete.php", { id });
        if (res.data.status === "success") {
          showAlert("Deleted successfully", "success");
          fetchDiscounts();
        } else {
          showAlert("Delete failed", "error");
        }
      } catch (err) {
        console.error(err);
        showAlert("Delete failed", "error");
      }
    });
  };

  return (
    <div className="dashboard-container">
      <h1>Discount Dashboard</h1>

      {/* ADD DISCOUNT */}
      <div className="add-product-form">
        <h2>Create Discount Code</h2>

        <form onSubmit={handleAddDiscount}>
          <input
            placeholder="Code (e.g. SALE20)"
            value={newDiscount.code}
            onChange={e => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
            required
          />

          <input
            type="number"
            min="1"
            max="100"
            placeholder="Percentage (1-100%)"
            title="Enter a discount percentage from 1 to 100"
            value={newDiscount.percentage}
            onChange={e => {
              let val = Number(e.target.value);
              if (val < 1) val = 1;    
              if (val > 100) val = 100;  
              setNewDiscount({ ...newDiscount, percentage: val });
            }}
            style={{ width: "150px"}}
            required
          />

          <input
            type="number"
            min="1"
            max="500"
            placeholder="Uses (1-500)"
            value={newDiscount.max_uses}
            onChange={e => {
              let val = Number(e.target.value);
              if (val < 1) val = 1;
              if (val > 500) val = 500;
              setNewDiscount({ ...newDiscount, max_uses: val });
             }}
            style={{ width: "150px"}}
            required
          />

          <input
            type="date"
            value={newDiscount.expires_at}
            onChange={e => setNewDiscount({ ...newDiscount, expires_at: e.target.value })}
            required
          />

          <button type="submit">Create Discount</button>
        </form>
      </div>

      {/* DISCOUNTS TABLE */}
      <div className="dashboard-products" ref={gridRef}>
        {updateStatus && <div className="update-badge">{updateStatus}</div>}
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Percentage</th>
              <th>Used</th>
              <th>Max Uses</th>
              <th>Expires</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedDiscounts.map(d => (
              <tr key={d.id}>
                <td>{d.code}</td>

                <td>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editDiscounts[d.id]?.percentage || 0} 
                    onChange={e => {
                    let value = Number(e.target.value);

                    if (value < 1) value = 1;
                    if (value > 100) value = 100;

                    setEditDiscounts({
                      ...editDiscounts,
                    [d.id]: { ...editDiscounts[d.id], percentage: value }
                    });
                   }}
                  />
                </td>

                <td>{d.used_count}</td>

                <td>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={editDiscounts[d.id]?.max_uses || ""}
                    onChange={e => {
                    let value = Number(e.target.value);

                    if (value < 1) value = 1;
                    if (value > 500) value = 500;

                    setEditDiscounts({
                      ...editDiscounts,
                    [d.id]: { ...editDiscounts[d.id], max_uses: value }
                    });
                   }}
                  />
                </td>

                <td>
                  <input
                    className="discount-date"
                    type="date"
                    value={
                    editDiscounts[d.id]?.expires_at
                    ? new Date(editDiscounts[d.id].expires_at)
                    .toISOString()
                    .split("T")[0]
                    : ""
                    }
                    onChange={e =>
                      setEditDiscounts({
                        ...editDiscounts,
                        [d.id]: { ...editDiscounts[d.id], expires_at: e.target.value }
                      })
                    }
                  />
                </td>

                <td>
                  <select
                    className="select"
                    value={editDiscounts[d.id]?.is_active}
                    onChange={e =>
                      setEditDiscounts({
                        ...editDiscounts,
                        [d.id]: { ...editDiscounts[d.id], is_active: Number(e.target.value) }
                      })
                    }
                    style={{ width: "120px" }}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Disabled</option>
                  </select>
                  
                </td>

                <td>
                  <button className="update-btn" onClick={() => handleUpdate(editDiscounts[d.id])}>
                    Update
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(d.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
<div className="pagination-con">
  <button
    className="pagination-btn"
    onClick={() => setCurrentPage(1)}
    disabled={currentPage === 1}
  >
    « First
  </button>

  <button
    className="pagination-btn"
    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
  >
    ‹ Prev
  </button>

  {/* Page numbers with sliding window */}
  {Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(
      page =>
        page === 1 ||
        page === totalPages ||
        (page >= currentPage - 3 && page <= currentPage + 3)
    )
    .map((page, idx, arr) => {
      const prevPage = arr[idx - 1];
      return (
        <span key={page}>
          {prevPage && page - prevPage > 1 ? <span className="dots">...</span> : null}
          <button
            className={`pagination-btn ${currentPage === page ? "active" : ""}`}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        </span>
      );
    })}

  <button
    className="pagination-btn"
    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
  >
    Next ›
  </button>

  <button
    className="pagination-btn"
    onClick={() => setCurrentPage(totalPages)}
    disabled={currentPage === totalPages}
  >
    Last »
  </button>
</div>

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

export default DiscountDashboard;
