import { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/ProductImagesDashboard.css";

function ProductImagesDashboard({ user }) {

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [images, setImages] = useState([]);
  const [newImage, setNewImage] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [uiAlert, setUiAlert] = useState({
    show: false,
    message: "",
    type: "info",
    onConfirm: null
  });

  const canAccess = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    if (!canAccess) return;
    fetchProducts();
  }, [canAccess]);

  const fetchProducts = async () => {
    const res = await api.get("/api/products/get.php");
    setProducts(res.data);
  };

  const fetchImages = async (productId) => {
    const res = await api.get(`/api/product-images/get.php?product_id=${productId}`);
    setImages(res.data);
  };

  const showConfirm = (message, onConfirm) => {
    setUiAlert({
      show: true,
      message,
      type: "confirm",
      onConfirm
    });
  };

  const closeAlert = () => {
    setUiAlert({ show: false, message: "", type: "info", onConfirm: null });
  };

  const handleUpload = () => {
    if (!selectedProduct || !newImage) {
      setUiAlert({ show: true, message: "Select product & image first", type: "warning" });
      return;
    }

    showConfirm("Are you sure you want to upload this image?", async () => {
      const fd = new FormData();
      fd.append("product_id", selectedProduct);
      fd.append("image", newImage);

      const res = await api.post("/api/product-images/upload.php", fd);

      if (res.data.status === "success") {
        fetchImages(selectedProduct);
        setNewImage(null);
        setUiAlert({ show: true, message: "Image uploaded successfully", type: "success" });
      }
    });
  };

  const handleDelete = (id) => {
    showConfirm("Are you sure you want to delete this image?", async () => {
      const fd = new FormData();
      fd.append("id", id);

      const res = await api.post("/api/product-images/delete.php", fd);

      if (res.data.status === "success") {
        fetchImages(selectedProduct);
        setUiAlert({ show: true, message: "Image deleted successfully", type: "success" });
      }
    });
  };

  const categoryCounts = products.reduce((acc, product) => {
    if (!product.category_name) return acc;
    acc[product.category_name] = (acc[product.category_name] || 0) + 1;
    return acc;
  }, {});

  const filteredProducts = products.filter(p => {
    const matchesCategory =
      selectedCategory === "all" || p.category_name === selectedCategory;

    const matchesSearch =
      searchQuery.trim() === "" ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.isbn?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (!canAccess) {
    return (
      <div className="extra-images-dashboard">
        <h2>Access Denied</h2>
        <p>Only Admin and Manager can access this page.</p>
      </div>
    );
  }

  return (
    <div className="extra-images-dashboard">
      <h1>Manage Product Images</h1>

      <div className="filters-row">

        <input
          type="text"
          placeholder="Search by Title or ISBN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {Object.entries(categoryCounts).map(([name, count]) => (
            <option key={name} value={name}>
              {name} ({count})
            </option>
          ))}
        </select>

      </div>

      <select
        value={selectedProduct}
        onChange={(e) => {
          setSelectedProduct(e.target.value);
          fetchImages(e.target.value);
        }}
      >
        <option value="">Select Product</option>
        {filteredProducts.map(p => (
          <option key={p.id} value={p.id}>
            {p.title} (ISBN: {p.isbn})
          </option>
        ))}
      </select>

      {selectedProduct && (
        <>
          <div className="upload-section">
            <input
              type="file"
              onChange={(e) => setNewImage(e.target.files[0])}
            />
            <button onClick={handleUpload}>Upload</button>
          </div>

          <div className="images-grid">
            {images.map(img => (
              <div key={img.id}>
                <img
                  src={`http://localhost/Intern/backend/uploads/products/${img.image}`}
                  alt=""
                />
                <button onClick={() => handleDelete(img.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {uiAlert.show && (
        <div className="ui-alert-overlay">
          <div className={`ui-alert ${uiAlert.type}`}>
            <p>{uiAlert.message}</p>
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

export default ProductImagesDashboard;
