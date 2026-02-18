<?php
session_start();
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/db.php";

if (!isset($_SESSION['user']) ||
   ($_SESSION['user']['role'] !== 'admin' && $_SESSION['user']['role'] !== 'manager')) {
    echo json_encode([]);
    exit;
}

$result = $conn->query("
  SELECT id, code, percentage, used_count, max_uses, expires_at, is_active
  FROM discount_codes
  ORDER BY created_at DESC
");

$discounts = [];
while ($row = $result->fetch_assoc()) {
    $discounts[] = $row;
}

echo json_encode($discounts);
