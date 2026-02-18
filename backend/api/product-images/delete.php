<?php
session_start();

// CORS headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once "../../config/db.php";

if (
    !isset($_SESSION['user']) ||
    !in_array($_SESSION['user']['role'], ['admin', 'manager'])
) {
    echo json_encode(["status" => "error"]);
    exit;
}

$id = (int)$_POST['id'];

$stmt = $conn->prepare("SELECT image FROM product_images WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if ($row) {
    unlink("../../uploads/products/" . $row['image']);
}

$stmt = $conn->prepare("DELETE FROM product_images WHERE id = ?");
$stmt->bind_param("i", $id);

$stmt->execute();

echo json_encode(["status" => "success"]);
?>
