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

if (!isset($_SESSION['user']) ||
   ($_SESSION['user']['role'] !== 'admin' && $_SESSION['user']['role'] !== 'manager')) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$code = strtoupper(trim($data['code'] ?? ''));
$percentage = (int)($data['percentage'] ?? 0);
$max_uses = $data['max_uses'] !== "" ? (int)$data['max_uses'] : null;
$expires_at = $data['expires_at'] ?: null;

if (!$code || $percentage <= 0 || $percentage > 100) {
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit;
}

// Insert
$stmt = $conn->prepare("
  INSERT INTO discount_codes
  (code, percentage, created_by, max_uses, expires_at)
  VALUES (?, ?, ?, ?, ?)
");

$stmt->bind_param(
  "siiss",
  $code,
  $percentage,
  $_SESSION['user']['id'],
  $max_uses,
  $expires_at
);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Code already exists"]);
}
