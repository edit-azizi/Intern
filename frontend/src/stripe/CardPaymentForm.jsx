// Not inserted yet eshte per Stripe per pagese

import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import api from "../api/axios";

export default function CardPaymentForm({ order, address, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const handlePay = async () => {
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      order.clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      }
    );

    if (error) {
      alert(error.message);
      return;
    }

    if (paymentIntent.status === "succeeded") {
      await api.post("/api/orders/pay_stripe.php", {
        order_id: order.id,
        shipping_address: address,
      });

      onSuccess();
    }
  };

  return (
    <>
      <CardElement />
      <button type="button" onClick={handlePay} className="pay-btn">
        Pay with Card
      </button>
    </>
  );
}
