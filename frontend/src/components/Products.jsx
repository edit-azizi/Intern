import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import "../styles/Products.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus, faHeart } from '@fortawesome/free-solid-svg-icons';

function Products({ user, refreshCartCount }) {
  const [products, setProducts] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState({});
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProduct, setActiveProduct] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [appliedPriceMin, setAppliedPriceMin] = useState(0);
  const [appliedPriceMax, setAppliedPriceMax] = useState(5000);
  const [appliedRatingMin, setAppliedRatingMin] = useState(0);
  const [appliedRatingMax, setAppliedRatingMax] = useState(5);
  const params = new URLSearchParams(window.location.search);
  const saleFromHome = params.get("sale") === "true";
  const [showOnlySale, setShowOnlySale] = useState(saleFromHome);
  const [extraImages, setExtraImages] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(5000);
  const [ratingMin, setRatingMin] = useState(0);
  const [ratingMax, setRatingMax] = useState(5);
  const gridRef = useRef(null);
  const PRODUCTS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const PRICE_MIN = 0;
  const PRICE_MAX = 5000;
  const RATING_MIN = 0;
  const RATING_MAX = 5;


  useEffect(() => {
  if (gridRef.current) {
    gridRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}, [currentPage]);


  useEffect(() => {
  if (activeProduct) {
    api.get(`/api/product-images/get.php?product_id=${activeProduct.id}`)
      .then(res => setExtraImages(res.data));
  }
}, [activeProduct]);


  const [uiAlert, setUiAlert] = useState({
    show: false,
    message: "",
    type: "info", // success  error  warning  info  confirm
    onConfirm: null,
  });

  const showAlert = (message, type = "info") => {
    setUiAlert({ show: true, message, type, onConfirm: null });
  };

  const closeAlert = () => {
    setUiAlert({ show: false, message: "", type: "info", onConfirm: null });
  };

  useEffect(() => {
    fetchProducts();
    if (user) fetchFavorites();
  }, [user]);

  // Reset to page 1 when filters/search change
useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, selectedCategory, appliedPriceMin, appliedPriceMax, appliedRatingMin, appliedRatingMax, showOnlySale]);


  const fetchProducts = async () => {
    try {
      const res = await api.get("/api/products/get.php");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await api.get("/api/wishlist/get.php");
      setFavoriteIds(res.data.map(p => p.id));
    } catch (err) {
      console.error(err);
    }
  };

const addToFavorites = async (productId) => {

  if (!user || user.role !== "user") {
    showAlert("Login as a user to add to favorites", "warning");
    return;
  }

  // If already favorite → do nothing
  if (favoriteIds.includes(productId)) return;

  try {
    const res = await api.post("/api/wishlist/add.php", {
      product_id: productId
    });

    if (res.data.status === "added") {
      setFavoriteIds(prev => [...prev, productId]);
    }

  } catch (err) {
    console.error(err);
  }
};


const addToCart = async (product, qty = 1) => {

 if (!user || user.role !== "user"){
   showAlert("Login as user first","warning");
   return;
 }

 // HARD CHECK
 if(qty > product.quantity){
   showAlert(`Only ${product.quantity} left in stock!`,"error");
   return;
 }

 try{
   await api.post("/api/cart/add.php",{
     product_id:product.id,
     quantity:qty
   });

   refreshCartCount();

   showAlert("Added to cart","success");

 }catch(err){
   console.log(err);
 }
};



  const selectRating = (productId, value) => {
    setSelectedRatings({ ...selectedRatings, [productId]: value });
  };

  const submitRating = async (productId) => {
    if (!user || user.role !== "user") {
      showAlert("You must be logged in as a user to rate a product.", "warning");
      return;
    }

    const rating = selectedRatings[productId];
    if (!rating) return;

    try {
      const res = await api.post("/api/ratings/rate.php", {
        product_id: productId,
        rating,
      });

      if (res.data.status === "success") {
        showAlert("Rating submitted!", "success");
        setSelectedRatings({ ...selectedRatings, [productId]: null });
        fetchProducts();
      } else {
        showAlert(res.data.message, "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Failed to submit rating.", "error");
    }
  };

          const renderStars = (productId) => {

            const selected = selectedRatings[productId] || 0;
            return (
              <div className="stars">
                {[1,2,3,4,5].map(star => (
                  <span
                    key={star}
                    className={`star ${star <= selected ? "filled" : ""}`}
                    onClick={() => selectRating(productId, star)}
                    style={{
                    cursor: "pointer",
                    opacity: 1,
          }}
                  >
                    ★
                  </span>
                ))}
              </div>
            );
          };

  // build category counts ONLY from products
  const categoryCounts = products.reduce((acc, product) => {
    if (!product.category_name) return acc;
    acc[product.category_name] = (acc[product.category_name] || 0) + 1;
    return acc;
  }, {});

  const normalizedQuery = searchQuery.trim().toLowerCase();

const filteredSortedProducts = products
  .filter(p => {

    // CATEGORY
    const matchesCategory =
      selectedCategory === "all"
        ? true
        : p.category_name === selectedCategory;

    // SEARCH
    const matchesSearch =
      normalizedQuery === "" ||
      p.title?.toLowerCase().includes(normalizedQuery);

    // PRICE
    const matchesPrice =
      Number(p.price) >= appliedPriceMin &&
      Number(p.price) <= appliedPriceMax;

    // RATING
    const rating = Number(p.avg_rating || 0);

    const matchesRating =
      rating >= appliedRatingMin &&
      rating <= appliedRatingMax;

    // SALE FILTER
    const matchesSale =
      !showOnlySale ||
      (p.old_price && Number(p.old_price) > Number(p.price));

    return (
      matchesCategory &&
      matchesSearch &&
      matchesPrice &&
      matchesRating &&
      matchesSale
    );
  })
  .sort((a, b) => 0); // keep your real sort


  // PAGINATION LOGIC
const totalPages = Math.ceil(filteredSortedProducts.length / PRODUCTS_PER_PAGE);

const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
const endIndex = startIndex + PRODUCTS_PER_PAGE;

const currentProducts = filteredSortedProducts.slice(startIndex, endIndex);

// page range (3 before + 3 after)
const getPageNumbers = () => {
  const pages = [];
  const range = 3;

  let start = Math.max(1, currentPage - range);
  let end = Math.min(totalPages, currentPage + range);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return pages;
};



const applyFilters = () => {
  // Ensure min is not bigger than max
  const fixedPriceMin = Math.min(priceMin, priceMax);
  const fixedPriceMax = Math.max(priceMin, priceMax);

  const fixedRatingMin = Math.min(ratingMin, ratingMax);
  const fixedRatingMax = Math.max(ratingMin, ratingMax);

  // Clamp to allowed ranges
  setPriceMin(fixedPriceMin);
  setPriceMax(fixedPriceMax);
  setRatingMin(fixedRatingMin);
  setRatingMax(fixedRatingMax);

  setAppliedPriceMin(Math.max(PRICE_MIN, fixedPriceMin));
  setAppliedPriceMax(Math.min(PRICE_MAX, fixedPriceMax));
  setAppliedRatingMin(Math.max(RATING_MIN, fixedRatingMin));
  setAppliedRatingMax(Math.min(RATING_MAX, fixedRatingMax));

  setShowFilters(false);
};

const resetFilters = () => {

  setPriceMin(0);
  setPriceMax(5000);
  setRatingMin(0);
  setRatingMax(5);

  setAppliedPriceMin(0);
  setAppliedPriceMax(5000);
  setAppliedRatingMin(0);
  setAppliedRatingMax(5);

  setShowOnlySale(false);
};

  return (
    <div className="products-container"  ref={gridRef}>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        {/* CATEGORY DROPDOWN */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ marginLeft: "10px", padding: "8px" }}
        >
          <option value="all">All ({products.length})</option>

          {Object.entries(categoryCounts).map(([name, count]) => (
            <option key={name} value={name}>
              {name} ({count})
            </option>
          ))}
        </select>

          <button
    className="filter-btn"
    onClick={() => setShowFilters(prev => !prev)}
  >
    ▶ Filters
  </button>

      </div>


      {/* SLIDE-IN FILTER PANEL */}

<div className={`filter-panel ${showFilters ? "open" : ""}`}>

  <button className="close-filter" onClick={() => setShowFilters(false)}>
    ✕
  </button>

  {/* PRICE FILTER */}
  <div className="filter-group">
    <h3>Price</h3>
    <div className="filter-inputs">
      <input
        type="number"
        min="0"
        max="5000"
        value={priceMin}
        onChange={(e) =>
          setPriceMin(Math.max(0, Math.min(Number(e.target.value || 0), 5000)))
        }
      />
      <span>-</span>
      <input
        type="number"
        min="0"
        max="5000"
        value={priceMax}
        onChange={(e) =>
          setPriceMax(Math.max(0, Math.min(Number(e.target.value || 0), 5000)))
        }
      />
    </div>

    <input
      type="range"
      min="0"
      max="5000"
      value={priceMin}
      onChange={(e) => setPriceMin(Number(e.target.value))}
    />
    <input
      type="range"
      min="0"
      max="5000"
      value={priceMax}
      onChange={(e) => setPriceMax(Number(e.target.value))}
    />
  </div>

  {/* RATING FILTER */}
  <div className="filter-group">
    <h3>Rating</h3>
    <div className="filter-inputs">
      <input
        type="number"
        min="0"
        max="5"
        step="0.1"
        value={ratingMin}
        onChange={(e) =>
          setRatingMin(Math.max(0, Math.min(Number(e.target.value || 0), 5)))
        }
      />
      <span>-</span>
      <input
        type="number"
        min="0"
        max="5"
        step="0.1"
        value={ratingMax}
        onChange={(e) =>
          setRatingMax(Math.max(0, Math.min(Number(e.target.value || 0), 5)))
        }
      />
    </div>

    <input
      type="range"
      min="0"
      max="5"
      step="0.1"
      value={ratingMin}
      onChange={(e) => setRatingMin(Number(e.target.value))}
    />
    <input
      type="range"
      min="0"
      max="5"
      step="0.1"
      value={ratingMax}
      onChange={(e) => setRatingMax(Number(e.target.value))}
    />
  </div>

  <div className="filter-actions">
    <button className="apply-btn" onClick={applyFilters}>
      Apply
    </button>
    <button className="reset-btn" onClick={resetFilters}>
      Reset
    </button>
  </div>

  <div className="filter-actions" style={{ marginTop: "10px" }}>
  <button
    className={`sale-filter-btn ${showOnlySale ? "active" : ""}`}
    onClick={() => {
  setShowOnlySale(prev => !prev);
  setShowFilters(false);
}}

  >
    {showOnlySale ? "SHOW ALL PRODUCTS" : "PRODUCTS ON SALE"}
  </button>
</div>

</div>


{showFilters && (
  <div className="filter-backdrop" onClick={() => setShowFilters(false)}></div>
)}


      <div className="products-grid">
        {currentProducts.map(product => {
          const isFav = favoriteIds.includes(product.id);

          return (
            <div className="product-card" key={product.id}>

              {product.old_price && Number(product.old_price) > Number(product.price) && (
               <div className="sale-badge">SALE</div>
                  )}

              <div className="product-image-wrapper">
                <img
                  src={
                    product.image
                      ? `http://localhost/Intern/backend/uploads/products/${product.image}`
                      : "/no-image.png"
                  }
                  alt={product.title}
                />
              </div>

              <h2>
                {product.title}
                <span
                  className="wishlist-heart"
                  onClick={() => addToFavorites(product.id)}
                  style={{
                    color: isFav ? "red" : "#fcfafa",
                    cursor: "pointer",
                    opacity: 1,
                    userSelect: "none",
                  }}
                  title={isFav ? "In favorites" : "Add to favorites"}
                >
                  {isFav ? <FontAwesomeIcon icon={faHeart} style={{
                      stroke: "red",
                      strokeWidth: "40",
                    }} /> : <FontAwesomeIcon icon={faHeart}   
                    style={{
                      stroke: "#000",
                      strokeWidth: "40",
                    }}/>}
                </span>
              </h2>

              <div className="price-box">
              <span className="current-price">
               ${product.price}
             </span>

               {product.old_price && Number(product.old_price) > Number(product.price) && (
                <span className="old-price">
                  ${product.old_price}
                </span>
                )}
             </div>

              <p className="rating-info">
                ⭐ {product.avg_rating ? product.avg_rating : "0"} / 5.0
              </p>
              <small>Rated by: {product.rating_count || 0}</small>

              <button
                className="show-btn"
                onClick={() => {
                  setActiveProduct(product);
                  setOrderQty(1);
                }}
              >
                Show Product
              </button>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
  <div className="pagination-container">
    
    <button
      className="page-arrow"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(prev => prev - 1)}
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
      onClick={() => setCurrentPage(prev => prev + 1)}
    >
      ▶
    </button>

  </div>
)}


      {activeProduct && (
        <div className="modal-overlay">
          <div className="product-modal">
            <button className="close-btn" onClick={() => setActiveProduct(null)}>✕</button>

          <div
            className="image-hover-wrapper"
            onClick={() =>
              setZoomedImage(
                `http://localhost/Intern/backend/uploads/products/${activeProduct.image}`
              )
            }
          >
            <img
              className="clickable-product-image"
              src={`http://localhost/Intern/backend/uploads/products/${activeProduct.image}`}
              alt={activeProduct.title}
            />

            <div className="image-hover-overlay">
              Click the image to see other images & zoom
            </div>
          </div>


            <h2>{activeProduct.title}</h2>
            <p className="description">{activeProduct.description}</p>
            <p><strong>ISBN:</strong> {activeProduct.isbn}</p>
            <p><strong>Quantity:</strong> {activeProduct.quantity}</p>
            <p className="price">${activeProduct.price}</p>

            <div className="rating-box">
              {renderStars(activeProduct.id)}
              <button
                className="rate-btn"
                disabled={!selectedRatings[activeProduct.id]}
                onClick={() => submitRating(activeProduct.id)}
              >
                Rate
              </button>
            </div>

            <div className="qty-box">
              <label>Quantity:</label>
              <input
                type="number"
                min="1"
                max={activeProduct.quantity}
                value={orderQty}
                onChange={(e) => {
                 let value = Number(e.target.value);

                 if (value < 1) value = 1;
                 if (value > activeProduct.quantity) {
                 value = activeProduct.quantity;
                 showAlert(`Only ${activeProduct.quantity} in stock`, "warning");
                }

                 setOrderQty(value);
                  }}

              />
            </div>

            <button
        className="order-btn"
        disabled={Number(activeProduct.quantity) === 0}
        style={{
          backgroundColor: Number(activeProduct.quantity) === 0 ? "grey" : "#4CAF50",
          cursor: Number(activeProduct.quantity) === 0 ? "not-allowed" : "pointer",
        }}
        onClick={() => addToCart(activeProduct, orderQty)}
      >
         {Number(activeProduct.quantity) === 0 ? (
         "Out of Stock"
          ) : (
           <>
         <FontAwesomeIcon icon={faCartPlus} style={{ marginRight: "8px" }} />
          Add to Cart
         </>
         )}
      </button>
          </div>
        </div>
      )}


              {zoomedImage && (
          <div
            className="image-zoom-overlay"
            onClick={() => setZoomedImage(null)}
          >
            <button
              className="zoom-close"
              onClick={() => setZoomedImage(null)}
            >
              ✕
            </button>

        <div className="zoom-slider" onClick={(e)=>e.stopPropagation()}>

          <button
            onClick={() =>
              setCurrentSlide(prev =>
                prev === 0 ? extraImages.length : prev - 1
              )
            }
          >
            ◀
          </button>

          <img
            src={
              currentSlide === 0
                ? `http://localhost/Intern/backend/uploads/products/${activeProduct.image}`
                : `http://localhost/Intern/backend/uploads/products/${extraImages[currentSlide - 1]?.image}`
            }
            className="zoomed-image"
            alt={activeProduct?.title || "Product image"}
          />

          <button
            onClick={() =>
              setCurrentSlide(prev =>
                prev === extraImages.length ? 0 : prev + 1
              )
            }
          >
            ▶
          </button>
        </div>

          </div>
        )}


      {/* ALERT UI */}
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

export default Products;
