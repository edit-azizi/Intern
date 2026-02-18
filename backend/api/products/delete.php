<?php
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once "../../config/db.php";

if (!isset($_SESSION['user'])) {
    echo json_encode(["status" => "error", "message" => "No session found"]);
    exit;
}

if (!in_array($_SESSION['user']['role'], ['admin', 'manager'])) {
    echo json_encode(["status" => "error", "message" => "Unauthorized role"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id'])) {
    echo json_encode(["status" => "error", "message" => "No product ID sent"]);
    exit;
}

$id = (int) $data['id'];

// Soft delete: set deleted = 1
$stmt = $conn->prepare("UPDATE products SET deleted = 1 WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to delete product"]);
}
