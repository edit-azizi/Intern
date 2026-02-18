<!-- Not inserted yet eshte per Stripe per pagese -->

<?php
require_once "../../config/db.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

$data = json_decode(file_get_contents("php://input"), true);

$order_id = $data['order_id'];
$address  = $data['shipping_address'];

$stmt = $conn->prepare("
  UPDATE orders
  SET status='paid',
      payment_method='card',
      shipping_address=?,
      paid_at=NOW()
  WHERE id=?
");

$stmt->bind_param("si", $address, $order_id);

if ($stmt->execute()) {
  echo json_encode(["status" => "success"]);
} else {
  echo json_encode(["status" => "error"]);
}
