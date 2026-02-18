<?php
session_start();

// CORS headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../../config/db.php";

// Must be logged in
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'user') {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$product_id = (int)$data['product_id'];
$rating = (float)$data['rating'];
$user_id = $_SESSION['user']['id'];

// Validate rating
if ($rating < 1 || $rating > 5) {
    echo json_encode(["status" => "error", "message" => "Invalid rating value"]);
    exit;
}

// Check if user already rated this product
$stmt = $conn->prepare("
    SELECT id FROM product_ratings 
    WHERE product_id = ? AND user_id = ?
");
$stmt->bind_param("ii", $product_id, $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // Update rating
    $stmt = $conn->prepare("
        UPDATE product_ratings 
        SET rating = ? 
        WHERE product_id = ? AND user_id = ?
    ");
    $stmt->bind_param("dii", $rating, $product_id, $user_id);
} else {
    // Insert rating
    $stmt = $conn->prepare("
        INSERT INTO product_ratings (product_id, user_id, rating)
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param("iid", $product_id, $user_id, $rating);
}

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to save rating"]);
}
