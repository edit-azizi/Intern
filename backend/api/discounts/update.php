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

$id = (int)($data['id'] ?? 0);
$percentage = (int)($data['percentage'] ?? 0);
$max_uses = $data['max_uses'] !== "" ? (int)$data['max_uses'] : null;
$expires_at = $data['expires_at'] ?: null;
$is_active = (int)($data['is_active'] ?? 1);

if (!$id || $percentage <= 0 || $percentage > 100) {
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit;
}

$stmt = $conn->prepare("
  UPDATE discount_codes
  SET percentage = ?, max_uses = ?, expires_at = ?, is_active = ?
  WHERE id = ?
");

$stmt->bind_param(
  "iisii",
  $percentage,
  $max_uses,
  $expires_at,
  $is_active,
  $id
);

$stmt->execute();

echo json_encode(["status" => "success"]);
