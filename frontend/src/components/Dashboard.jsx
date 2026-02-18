import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/Dashboard.css";

function Dashboard({ user }) {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [editProducts, setEditProducts] = useState({});
  const [updateStatus, setUpdateStatus] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

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
}, [searchQuery, filterCategory]);


  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    isbn: "",
    quantity: 0,
    price: 0,
    category_id: "", 
    image: null
  });

  const [uiAlert, setUiAlert] = useState({
    show: false,
    message: "",
    type: "info",
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

  const fetchCategories = useCallback(async () => {

    try {
      const res = await api.get("/api/categories/get.php");
      setCategories(res.data);
    } catch {
      showAlert("Failed to fetch categories", "error");
    }
  }, []);


  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get("/api/products/get.php");
      setProducts(res.data);

      const edits = {};
      res.data.forEach(p => {
        edits[p.id] = { ...p, imageFile: null };
      });
      setEditProducts(edits);

const lowStock = res.data.filter(
  p => Number(p.quantity) >= 1 && Number(p.quantity) <= 5
);

const outOfStock = res.data.filter(
  p => Number(p.quantity) === 0
);

if (lowStock.length > 0 || outOfStock.length > 0) {
  let message = "";

  if (lowStock.length > 0) {
    message +=
      "⚠️ Low Stock Alert\n\n" +
      lowStock.map(p => `• ${p.title} (${p.quantity} left)`).join("\n") +
      "\n\n";
  }

  if (outOfStock.length > 0) {
    message +=
      "🚨 Out of Stock\n\n" +
      outOfStock.map(p => `• ${p.title}`).join("\n");
  }

  showAlert(message.trim(), "warning");
}

    } catch (err) {
      console.error(err);
      showAlert("Failed to fetch products", "error");
    }
  }, []);

  useEffect(() => {
  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    navigate("/");
    return;
  }

  fetchProducts();
  fetchCategories();

}, [user, navigate, fetchProducts, fetchCategories]);


      // ADD CATEGORY
      const handleAddCategory = async (e) => {
        e.preventDefault();

        if (!newCategory.trim()) return;

        const fd = new FormData();
        fd.append("name", newCategory);

        try {
          const res = await api.post("/api/categories/create.php", fd);
          if (res.data.status === "success") {
            setNewCategory("");
            fetchCategories();
            showAlert("Category added!", "success");
          } else {
            showAlert(res.data.message, "error");
          }
        } catch {
          showAlert("Failed to add category", "error");
        }
      };

      const handleDeleteCategory = async () => {
      if (!selectedCategory) {
        showAlert("Please select a category", "warning");
        return;
      }

      showConfirm("Are you sure you want to delete this category?", async () => {
        try {
          const res = await api.post("/api/categories/delete.php", {
            id: selectedCategory
          });

          if (res.data.status === "success") {
            showAlert("Category deleted!", "success");
            setSelectedCategory("");
            fetchCategories();
            fetchProducts(); // refresh products in case category disappeared
          } else {
            showAlert(res.data.message, "error");
          }

        } catch {
          showAlert("Failed to delete category", "error");
        }
      });
    };

      // CREATE PRODUCT
      const handleAddProduct = async (e) => {
        e.preventDefault();

        const fd = new FormData();
        Object.entries(newProduct).forEach(([k, v]) => {
          if (v !== null) fd.append(k, v);
        });

        try {
          const res = await api.post("/api/products/create.php", fd);
          if (res.data.status === "success") {
            showAlert("Product added successfully!", "success");
            setNewProduct({
              title: "",
              description: "",
              isbn: "",
              quantity: 0,
              price: 0,
              category_id: "",
              image: null
            });
            fetchProducts();
          } else {
            showAlert(res.data.message, "error");
          }
        } catch (err) {
          console.error(err);
          showAlert("Failed to add product", "error");
        }
      };

      
      // UPDATE PRODUCT
      const handleUpdate = async (p) => {
      if (!p.category_id) {
        showAlert(
          "Product can not be updated. Please select an existing category!",
          "warning"
        );
        return;
      }

      const fd = new FormData();
      fd.append("id", p.id);
      ["title", "description", "isbn", "quantity", "price", "category_id"].forEach(k => {
        fd.append(k, p[k]);
      });

      if (p.imageFile) fd.append("image", p.imageFile);

      try {
        const res = await api.post("/api/products/update.php", fd);
        if (res.data.status === "success") {
          setProducts(prev =>
            prev.map(prod => (prod.id === p.id ? { ...prod, ...p, image: prod.image } : prod))
          );

          setEditProducts(prev => ({ ...prev, [p.id]: { ...p, imageFile: null } }));

          setUpdateStatus(prev => ({ ...prev, [p.id]: "Updated successfully!" }));
          setTimeout(() => {
            setUpdateStatus(prev => ({ ...prev, [p.id]: "" }));
          }, 2000);
        } else {
          showAlert(res.data.message, "error");
        }
      } catch (err) {
        console.error(err);
        showAlert("Update failed", "error");
      }
    };



          // SOFT DELETE
          const handleDelete = async (id) => {
            showConfirm("Are you sure you want to delete this product?", async () => {
              try {
                const res = await api.post("/api/products/delete.php", { id });
                if (res.data.status === "success") {
                  showAlert("Product deleted successfully", "success");
                  // Refresh products after deletion
                  fetchProducts();
                } else {
                  showAlert(res.data.message || "Delete failed", "error");
                }
              } catch (err) {
                console.error(err);
                showAlert("Delete failed", "error");
              }
            });
          };

    const filtered = products.filter(p => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        p.isbn.toLowerCase().includes(searchQuery.trim().toLowerCase());

      const matchesCategory = !filterCategory || p.category_id === filterCategory;

      return matchesSearch && matchesCategory;
    });

    // PAGINATION LOGIC
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filtered.slice(indexOfFirstProduct, indexOfLastProduct);

    const totalPages = Math.ceil(filtered.length / productsPerPage);

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

  return (
    <div className="dashboard-container">
      <h1>Manage Products</h1>

      {/* ADD CATEGORY */}
      <div className="add-product-form">
        <h2>Manage Categories</h2>
        <form onSubmit={handleAddCategory}>
  <input
    placeholder="Category name"
    value={newCategory}
    onChange={(e) => setNewCategory(e.target.value)}
  />

  <button type="submit">Add Category</button>

  {/* DELETE CATEGORY */}
  <select
    value={selectedCategory}
    onChange={(e) => setSelectedCategory(e.target.value)}
  >
    <option value="">Select Category to Delete</option>
    {categories.map(c => (
      <option key={c.id} value={c.id}>{c.name}</option>
    ))}
  </select>

  <button
    type="button"
    className="delete-btn category-delete"
    onClick={handleDeleteCategory}
  >
    Delete Category
  </button>
</form>

      </div>

     {/* ADD PRODUCT */}
<div className="add-product-form">
  <h2>Add New Product</h2>

  <form onSubmit={handleAddProduct}>
    <input
      placeholder="Title"
      value={newProduct.title}
      onChange={e =>
        setNewProduct({ ...newProduct, title: e.target.value })
      }
      required
    />

    <input
      placeholder="Description"
      value={newProduct.description}
      onChange={e =>
        setNewProduct({ ...newProduct, description: e.target.value })
      }
      required
    />

    <input
      placeholder="ISBN"
      value={newProduct.isbn}
      onChange={e =>
        setNewProduct({ ...newProduct, isbn: e.target.value })
      }
      required
    />

    {/* CATEGORY DROPDOWN */}
    <select
      value={newProduct.category_id}
      onChange={e =>
        setNewProduct({ ...newProduct, category_id: e.target.value })
      }
      required
    >
      <option value="">Select Category</option>
      {categories.map(c => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>

    <input
      type="number"
      placeholder="Quantity"
      min="0"
      value={newProduct.quantity === 0 ? "" : newProduct.quantity}
      onChange={e => {
        let val = Number(e.target.value);
        if (val < 0) val = 0; // enforce min 0
        setNewProduct({ ...newProduct, quantity: val });
      }}
      required
    />

    <input
      type="number"
      placeholder="Price"
      min="0"
      step="0.01"
      value={newProduct.price === 0 ? "" : newProduct.price}
      onChange={e => {
        let val = Number(e.target.value);
        if (val < 0) val = 0; // enforce min 0
        setNewProduct({ ...newProduct, price: val });
      }}
      required
    />

    <input
      type="file"
      accept="image/*"
      onChange={e =>
        setNewProduct({ ...newProduct, image: e.target.files[0] })
      }
      required
    />

    <button type="submit">Add Product</button>
  </form>
</div>

      {/* SEARCH AND FILTER */}
     <div className="search-container">
  <input
    type="text"
    placeholder="Search by Title or ISBN..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="search-input"
  />

  <select
    value={filterCategory}
    onChange={(e) => setFilterCategory(e.target.value)}
    style={{ marginLeft: "10px", padding: "8px", borderRadius: "10px" }}
  >
    <option value="">All Categories</option>
    {categories.map(c => (
      <option key={c.id} value={c.id}>{c.name}</option>
    ))}
  </select>
</div>



      {/* PRODUCTS */}
      <div className="dashboard-products" ref={gridRef}>
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Description</th>
              <th>ISBN</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {currentProducts.map(p => {
              const qty = Number(editProducts[p.id]?.quantity ?? p.quantity);
              let stockStyle = {};
              if (qty === 0) stockStyle = { backgroundColor: "#ffd6d6" };
              else if (qty <= 5) stockStyle = { backgroundColor: "#fff7c2" };

              return (
                <tr key={p.id}>
                  <td>
                    {p.image && (
                      <img
                        src={`http://localhost/uploads/products/${p.image}`}
                        alt=""
                        width="50"
                      />
                    )}
                    <input type="file"
                      onChange={e =>
                        setEditProducts({
                          ...editProducts,
                          [p.id]: { ...editProducts[p.id], imageFile: e.target.files[0] }
                        })
                      } />
                  </td>

                  {["title", "description", "isbn"].map(f => (
                    <td key={f}>
                      <input type="text" value={editProducts[p.id]?.[f] || ""}
                        onChange={e =>
                          setEditProducts({
                            ...editProducts,
                            [p.id]: { ...editProducts[p.id], [f]: e.target.value }
                          })
                        } />
                    </td>
                  ))}

                  {/* CATEGORY EDIT */}
                  <td>
                    <select
                      value={editProducts[p.id]?.category_id || ""}
                      onChange={e =>
                        setEditProducts({
                          ...editProducts,
                          [p.id]: { ...editProducts[p.id], category_id: e.target.value }
                        })
                      }
                    >
                      <option value="">None</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <input type="number" min="0" value={qty} style={stockStyle}
                      onChange={e =>
                        setEditProducts({
                          ...editProducts,
                          [p.id]: { ...editProducts[p.id], quantity: Number(e.target.value) }
                        })
                      } />
                  </td>

                  <td>
                    <input type="number" min="0.01"
                      value={editProducts[p.id]?.price}
                      onChange={e =>
                        setEditProducts({
                          ...editProducts,
                          [p.id]: { ...editProducts[p.id], price: Number(e.target.value) }
                        })
                      } />
                  </td>

                  <td>
                    <button className="update-btn" onClick={() => handleUpdate(editProducts[p.id])}>Update</button>
                    <button className="delete-btn" onClick={() => handleDelete(p.id)}>Delete</button>
                    {updateStatus[p.id] && (
                     <div className="update-badge">
                    {updateStatus[p.id]}
                    </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
          {totalPages > 1 && (
  <div className="pagination-con">

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

      {/* MODERN ALERT UI */}
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

export default Dashboard;
