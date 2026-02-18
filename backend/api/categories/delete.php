<?php
session_start();

// CORS headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once "../../config/db.php";

// Check if user is admin
if (
    !isset($_SESSION['user']) ||
    !in_array($_SESSION['user']['role'], ['admin', 'manager'])
) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}


// Get product ID from React
$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'];

// Delete from database
$stmt = $conn->prepare("DELETE FROM categories WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to delete product"]);
}
