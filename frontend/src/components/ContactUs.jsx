import { useState } from "react";
import api from "../api/axios";
import "../styles/ContactUs.css";

function ContactUs() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [loading, setLoading] = useState(false);


  const [uiAlert, setUiAlert] = useState({
    show: false,
    message: "",
    type: "info", // success  error  warning  info
  });

  const showAlert = (message, type = "info") => {
    setUiAlert({ show: true, message, type });
  };

  const closeAlert = () => {
    setUiAlert({ show: false, message: "", type: "info" });
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      showAlert("Please fill all fields.", "warning");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/api/contact/create.php", form);

      if (res.data.status === "success") {
        showAlert("Message sent successfully! 📩", "success");
        setForm({ name: "", email: "", message: "" });
      } else {
        showAlert(res.data.message || "Failed to send message.", "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">

      {/* LEFT SIDE – MAP */}
      <div className="contact-map">
        <iframe
          title="Company Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3489.848491756632!2d21.170651985991068!3d42.64861612396043!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x13549fde1f43b34f%3A0xef12fd5db8c36195!2sTectigon!5e0!3m2!1sen!2s!4v1769348284816!5m2!1sen!2s"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* RIGHT SIDE – FORM */}
      <div className="contact-form-box">
        <h2>Contact Us</h2>
        <p>Have a question or feedback? We’d love to hear from you.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={form.name}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={form.email}
            onChange={handleChange}
          />

          <textarea
            name="message"
            placeholder="Your Message..."
            rows="5"
            value={form.message}
            onChange={handleChange}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>

      {/* ALERT UI */}
      {uiAlert.show && (
        <div className="ui-alert-overlay">
          <div className={`ui-alert ${uiAlert.type}`}>
            <p>{uiAlert.message}</p>
            <div className="ui-alert-actions">
              <button className="btn ok" onClick={closeAlert}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ContactUs;
