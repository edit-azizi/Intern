<!-- Not inserted yet eshte per Stripe per pagese -->


<?php
require_once "../../config/db.php";
require_once "../../config/stripe.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$order_id = $data['order_id'] ?? null;

if (!$order_id) {
  http_response_code(400);
  echo json_encode(["error" => "Order ID required"]);
  exit;
}

/* Get order price */
$stmt = $conn->prepare("
  SELECT price 
  FROM orders 
  WHERE id = ?
");
$stmt->bind_param("i", $order_id);
$stmt->execute();
$result = $stmt->get_result();
$order = $result->fetch_assoc();

if (!$order) {
  http_response_code(404);
  echo json_encode(["error" => "Order not found"]);
  exit;
}

$amount = (int) ($order['price'] * 100);

$intent = \Stripe\PaymentIntent::create([
  'amount' => $amount,
  'currency' => 'usd',
  'automatic_payment_methods' => ['enabled' => true],
]);

echo json_encode([
  'clientSecret' => $intent->client_secret
]);
