<?php
session_start();
require_once "../../config/db.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  exit;
}

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'user') {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}


$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['product_id'])) {
  echo json_encode([
    "status" => "error",
    "message" => "Missing product id"
  ]);
  exit;
}

$userId = $_SESSION['user']['id'];
$productId = $data['product_id'];

$stmt = $conn->prepare(
  "DELETE FROM wishlists WHERE user_id = ? AND product_id = ?"
);

$stmt->bind_param("ii", $userId, $productId);

if ($stmt->execute()) {
  if ($stmt->affected_rows > 0) {
    echo json_encode([
      "status" => "success"
    ]);
  } else {
    echo json_encode([
      "status" => "error",
      "message" => "Nothing deleted (maybe product not in wishlist)"
    ]);
  }
} else {
  echo json_encode([
    "status" => "error",
    "message" => "Delete failed: " . $stmt->error
  ]);
}
