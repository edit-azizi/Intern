import { useEffect, useState, useCallback, useRef  } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/Products.css";
import "../styles/Favorites.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';

function Favorites({ user, refreshCartCount }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState({});
  const [activeProduct, setActiveProduct] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [extraImages, setExtraImages] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const gridRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);


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

  const showConfirm = (message, onConfirm) => {
    setUiAlert({ show: true, message, type: "confirm", onConfirm });
  };

  const closeAlert = () => {
    setUiAlert({ show: false, message: "", type: "info", onConfirm: null });
  };

  const fetchFavorites = useCallback(async () => {
  try {
    const res = await api.get("/api/wishlist/get.php");
    setProducts(res.data);
  } catch (err) {
    console.error(err);
    showAlert("Failed to load favorites.", "error");
  }
}, []);


useEffect(() => {
  if (!user || user.role !== "user") {
    navigate("/");
    return;
  }

  fetchFavorites();
}, [user, navigate, fetchFavorites]);



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

  const removeFromFavorites = async (product) => {
    showConfirm("Remove this product from favorites?", async () => {
      try {
        const res = await api.post("/api/wishlist/remove.php", {
          product_id: product.id,
        });

        if (res.data.status === "success") {
          showAlert("Removed from favorites!", "success");
          fetchFavorites();
        } else {
          showAlert(res.data.message, "error");
        }
      } catch (err) {
        console.error(err);
        showAlert("Failed to remove from favorites.", "error");
      }
    });
  };

  const selectRating = (productId, value) => {
    setSelectedRatings({ ...selectedRatings, [productId]: value });
  };

  const submitRating = async (productId) => {
    if (!user) {
      showAlert("You must be logged in to rate a product.", "warning");
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
        fetchFavorites();
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
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= selected ? "filled" : ""}`}
            onClick={() => selectRating(productId, star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="products-container" ref={gridRef}>
      <h1>My Favorites</h1>

      {products.length === 0 && <p>No favorites yet.</p>}

      <div className="products-grid">
        {currentProducts.map((product) => (
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

            <h2>{product.title}</h2>

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

            <button
              className="show-btn"
              onClick={() => {
                setActiveProduct(product);
                setOrderQty(1);
              }}
            >
              Show Product
            </button>

            <button
              className="remove-fav"
              onClick={() => removeFromFavorites(product)}
            >
              Remove from favorites
            </button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">

          <button
            className="page-arrow"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ◀
          </button>

          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              className={`page-number ${currentPage === index + 1 ? "active" : ""}`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}

          <button
            className="page-arrow"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            ▶
          </button>

        </div>
      )}


      {/* MODAL */}
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

export default Favorites;
