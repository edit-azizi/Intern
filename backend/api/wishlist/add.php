<?php
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once "../../config/db.php";

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'user') {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$product_id = $data['product_id'];
$user_id = $_SESSION['user']['id'];

// Check if already exists
$check = $conn->prepare(
    "SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?"
);
$check->bind_param("ii", $user_id, $product_id);
$check->execute();
$res = $check->get_result();

if ($res->num_rows > 0) {

    // Already in favorites → DO NOTHING
    echo json_encode(["status" => "exists"]);

} else {

    $stmt = $conn->prepare(
        "INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)"
    );
    $stmt->bind_param("ii", $user_id, $product_id);
    $stmt->execute();

    echo json_encode(["status" => "added"]);
}
