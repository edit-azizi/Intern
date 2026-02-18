import { useEffect, useState, useCallback, useRef } from "react";
import api from "../api/axios";
import "../styles/ContactDashboard.css";

function ContactDashboard() {
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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


  const [uiAlert, setUiAlert] = useState({
    show: false,
    message: "",
    type: "info", // success error warning info confirm
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

  // useCallback to prevent useEffect warning
  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get("/api/contact/get.php");
      setMessages(res.data);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load contact messages.", "error");
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const deleteMessage = async (id) => {
    showConfirm("Delete this message?", async () => {
      try {
        const res = await api.post("/api/contact/delete.php", { id });

        if (res.data.status === "success") {
          setMessages(prev => prev.filter(m => m.id !== id));
          showAlert("Message deleted successfully!", "success");
        } else {
          showAlert("Failed to delete message.", "error");
        }
      } catch (err) {
        console.error(err);
        showAlert("Error deleting message.", "error");
      }
    });
  };

    const filteredMessages = messages
      .filter(m =>
        m.email.toLowerCase().includes(search.toLowerCase())
      )
      .filter(m => {
        const msgDate = new Date(m.created_at);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && msgDate < start) return false;
        if (end && msgDate > end) return false;
        return true;
      });

    const totalPages = Math.ceil(filteredMessages.length / rowsPerPage);
    const paginatedMessages = filteredMessages.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );

  return (
    <div className="contact-dashboard">
      <h1>Contact Messages</h1>

  <div className="search-date-container">
    <input
      type="text"
      placeholder="Search by email..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />

    <div className="date-filter-container">
      <label className="date-label">
        From:<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </label>
      <label className="date-label">
        To:<input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </label>
    </div>

    <button className="reset-btn" onClick={() => { setStartDate(""); setEndDate(""); }}>
      Reset
    </button>
  </div>

      <div className="table-wrapper" ref={gridRef}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Message</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
        {paginatedMessages.length === 0 && (
          <tr>
            <td colSpan="5" className="empty">No messages found.</td>
          </tr>
        )}

        {paginatedMessages.map(msg => (
          <tr key={msg.id}>
            <td>{msg.name}</td>
            <td>{msg.email}</td>
            <td className="message-cell">{msg.message}</td>
            <td>{msg.created_at}</td>
            <td>
              <button className="delete-btn" onClick={() => deleteMessage(msg.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
          </tbody>
        </table>
                {/* PAGINATION */}
        <div className="pagination-container">
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

export default ContactDashboard;
