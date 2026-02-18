<?php
session_start();
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);
$code = strtoupper(trim($data['code'] ?? ''));

if (!$code) {
    echo json_encode(["status" => "error", "message" => "Code is required"]);
    exit;
}

$stmt = $conn->prepare("
  SELECT id, percentage, used_count, max_uses, expires_at, is_active
  FROM discount_codes
  WHERE code = ?
  LIMIT 1
");

$stmt->bind_param("s", $code);
$stmt->execute();
$result = $stmt->get_result();
$discount = $result->fetch_assoc();

if (!$discount) {
    echo json_encode(["status" => "error", "message" => "Discount code not found"]);
    exit;
}

if (!$discount['is_active']) {
    echo json_encode(["status" => "error", "message" => "Discount code is inactive"]);
    exit;
}

if ($discount['max_uses'] !== null && $discount['used_count'] >= $discount['max_uses']) {
    echo json_encode(["status" => "error", "message" => "Discount code has reached max uses"]);
    exit;
}

if ($discount['expires_at'] && strtotime($discount['expires_at']) < time()) {
    echo json_encode(["status" => "error", "message" => "Discount code expired"]);
    exit;
}

echo json_encode([
    "status" => "success",
    "percentage" => (int)$discount['percentage'],
    "discount_id" => (int)$discount['id']
]);
