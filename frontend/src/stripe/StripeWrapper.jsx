// Not inserted yet eshte per Stripe per pagese

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_YOUR_PUBLISHABLE_KEY");

export default function StripeWrapper({ children, clientSecret }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      {children}
    </Elements>
  );
}
