import { useEffect, useState} from "react";
import api from "../api/axios";
import "../styles/Home.css";
import logo from '../assets/techzone-no-background.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faMoneyBillTrendUp, faRankingStar, faCartPlus } from '@fortawesome/free-solid-svg-icons';


function Home({ user, refreshCartCount }) {
  const slides = [
    { title: "Welcome to TechZone!", img: "/images/slide1.jpg", subtitle: "Latest Tech Products for Everyone" },
    { title: "The Best SmartPhones", img: "/images/slide2.jpg", subtitle: "Innovation You Can Hold" },
    { title: "Top-notch Keyboards", img: "/images/slide3.jpg", subtitle: "Comfortable & Durable" },
  ];

  const benefitsSlides = [
  {
    title: "Fast Delivery",
    img: "/images/delivery.jpg",
    subtitle: "Get your tech within 24–48 hours anywhere in the country."
  },
  {
    title: "Secure Payments",
    img: "/images/secure.jpg",
    subtitle: "Encrypted checkout with multiple safe payment methods."
  },
  {
    title: "Exclusive Discounts",
    img: "/images/discount.jpg",
    subtitle: "Unlock promo codes, seasonal deals, and member offers."
  }
];


  const [currentSlide, setCurrentSlide] = useState(0);
  const [bestSellers, setBestSellers] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [activeProduct, setActiveProduct] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [selectedRatings, setSelectedRatings] = useState({});
  const [extraImages, setExtraImages] = useState([]);
  const [zoomSlide, setZoomSlide] = useState(0);


  useEffect(() => {
  fetchBestSellers();
  fetchTopRated();
  fetchSaleProducts();
}, []);

const fetchBestSellers = async () => {
  try {
    const res = await api.get("/api/products/best_sellers.php");
    setBestSellers(Array.isArray(res.data) ? res.data : []);
  } catch(err){
    console.error(err);
  }
};

const fetchTopRated = async () => {
  try {
    const res = await api.get("/api/products/top_rated.php");
    setTopRated(res.data);
  } catch(err){
    console.error(err);
  }
};

const fetchSaleProducts = async () => {
  try {
    const res = await api.get("/api/products/on_sale.php");
    setSaleProducts(res.data.slice(0,3));
  } catch(err){
    console.error(err);
  }
};

    useEffect(() => {
  if (activeProduct) {
    api.get(`/api/product-images/get.php?product_id=${activeProduct.id}`)
      .then(res => setExtraImages(res.data));
  }
}, [activeProduct]);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

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
    
    <div className="home-container">
      {/* Hero Slider */}
      <div
        className="hero-slider"
        style={{ backgroundImage: `url(${slides[currentSlide].img})` }}
      >

        <div className="hero-text">
          <img src={logo} alt="TechZone Logo" className="logo-slider" />
          <h1>{slides[currentSlide].title}</h1>
          <p>{slides[currentSlide].subtitle}</p>
        </div>
      </div>

      <section className="sale-highlight">

  <h2 className="section-title">
    <FontAwesomeIcon icon={faTag} /> Deals You Can't Miss <FontAwesomeIcon icon={faTag} />
  </h2>

  {saleProducts.length >= 3 && (
    <div className="sale-layout">

      {/* BIG PRODUCT */}
      <div
        className="sale-big"
        onClick={() => {
          setActiveProduct(saleProducts[0]);
          setOrderQty(1);
        }}
      >
        <img
          src={`http://localhost/Intern/backend/uploads/products/${saleProducts[0].image}`}
          alt={saleProducts[0].title}
        />

        <div className="sale-price">
          <span className="old">
            ${saleProducts[0].old_price}
          </span>

          <span className="new">
            ${saleProducts[0].price}
          </span>
        </div>
      </div>



      {/* RIGHT SIDE */}
      <div className="sale-side">

        {saleProducts.slice(1).map(product => (
          <div
            key={product.id}
            className="sale-small"
            onClick={() => {
                setActiveProduct(product);
                setOrderQty(1);
              }}
          >
            <img
              src={`http://localhost/Intern/backend/uploads/products/${product.image}`}
              alt={product.title}
            />

            <div className="sale-price">
              <span className="old">${product.old_price}</span>
              <span className="new">${product.price}</span>
            </div>
          </div>
        ))}

      </div>

    </div>
  )}

</section>


      <section className="home-products-section">
  <h2><FontAwesomeIcon icon={faMoneyBillTrendUp} /> Our Best Sellers <FontAwesomeIcon icon={faMoneyBillTrendUp} /></h2>

  <div className="home-products-grid">
    {bestSellers.map(product => (
      <div
        key={product.id}
        className="home-product-card"
        onClick={() => {
                setActiveProduct(product);
                setOrderQty(1);
              }}
      >
        <img
          src={`http://localhost/Intern/backend/uploads/products/${product.image}`}
          alt={product.title}
        />

        <h3>{product.title}</h3>

        <p className="price-home">
          ${product.price}
        </p>
      </div>
    ))}
  </div>
</section>


<section className="benefits-boxes">

  {benefitsSlides.map((b, i) => (
    <div key={i} className="benefit-box">

      <img src={b.img} alt={b.title} />

      <h3>{b.title}</h3>

      <p>{b.subtitle}</p>

    </div>
  ))}

</section>



<section className="home-products-section">
  <h2><FontAwesomeIcon icon={faRankingStar} /> Our Top Rated Products <FontAwesomeIcon icon={faRankingStar} /></h2>

  <div className="home-products-grid">
    {topRated.map(product => (
      <div
        key={product.id}
        className="home-product-card"
        onClick={() => {
                setActiveProduct(product);
                setOrderQty(1);
              }}
      >
        <img
          src={`http://localhost/Intern/backend/uploads/products/${product.image}`}
          alt={product.title}
        />

        <h3>{product.title}</h3>

        <p className="rating">
          ⭐ {product.avg_rating}
        </p>
      </div>
    ))}
  </div>
</section>



<div className="company-info-container">
  {/* About Us Section */}
  <section className="company-info-section about">
    <div className="info-content">
      <h2>About TechZone</h2>
      <p>
        TechZone is your one-stop destination for premium tech products. 
        From gaming rigs to peripherals, we bring the latest tech trends to your doorstep.
      </p>
      <ul>
        <li>High-quality gadgets</li>
        <li>Curated for tech enthusiasts</li>
        <li>Latest industry trends</li>
      </ul>
    </div>
    <div className="info-image">
      <img src="/images/about.jpg" alt="TechZone About" />
    </div>
  </section>

  {/* Our Mission Section */}
  <section className="company-info-section mission">
    <div className="info-content">
      <h2>Our Mission</h2>
      <p>
        Deliver the best products with top-notch customer support.
        Our team ensures every customer has the ultimate tech experience.
      </p>
      <ul>
        <li>Customer-first approach</li>
        <li>Fast delivery & secure checkout</li>
        <li>Continuous innovation</li>
      </ul>
    </div>
    <div className="info-image">
      <img src="/images/mission.jpg" alt="TechZone Mission" />
    </div>
  </section>

  {/* Customer Support Section */}
  <section className="company-info-section support">
    <div className="info-content">
      <h2>Customer Support</h2>
      <p>
        Our team is here 24/7 to assist with queries, orders, and expert advice.
        Your satisfaction is our top priority.
      </p>
      <ul>
        <li>24/7 online assistance</li>
        <li>Quick response times</li>
        <li>Expert product guidance</li>
      </ul>
    </div>
    <div className="info-image">
      <img src="/images/support.jpg" alt="Customer Support" />
    </div>
  </section>
</div>

      {/* MODAL */}
      {activeProduct && (
        <div className="modal-overlay">
          <div className="product-modal">
            <button className="close-btn" onClick={() => setActiveProduct(null)}>✕</button>

          <div
            className="image-hover-wrapper"
            onClick={() => {
              setZoomSlide(0);
              setZoomedImage(true);
            }}
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
              setZoomSlide(prev =>
                prev === 0 ? extraImages.length : prev - 1
              )
            }
          >
            ◀
          </button>

          <img
            src={
              zoomSlide === 0
                ? `http://localhost/Intern/backend/uploads/products/${activeProduct.image}`
                : `http://localhost/Intern/backend/uploads/products/${extraImages[zoomSlide - 1]?.image}`
            }
            className="zoomed-image"
            alt={activeProduct?.title || "Product image"}
          />

          <button
            onClick={() =>
                setZoomSlide(prev =>
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

export default Home;
