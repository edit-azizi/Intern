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

if(!isset($_SESSION['user'])){
    echo json_encode([
        "status"=>"error",
        "message"=>"Not logged in"
    ]);
    exit;
}

$user_id = $_SESSION['user']['id'];

$data = json_decode(file_get_contents("php://input"), true);

$product_id = $data['product_id'] ?? null;
$quantity = $data['quantity'] ?? 1;

if(!$product_id){
    echo json_encode([
        "status"=>"error",
        "message"=>"Invalid product"
    ]);
    exit;
}

// CHECK STOCK FIRST
$stmt = $conn->prepare("SELECT quantity FROM products WHERE id=?");
$stmt->bind_param("i", $product_id);
$stmt->execute();
$res = $stmt->get_result();
$product = $res->fetch_assoc();

if(!$product){
    echo json_encode(["status"=>"error","message"=>"Product not found"]);
    exit;
}

if($quantity > $product['quantity']){
    echo json_encode([
        "status"=>"error",
        "message"=>"Not enough stock"
    ]);
    exit;
}

// If exists → increase qty
$sql = "
INSERT INTO cart (user_id, product_id, quantity)
VALUES (?, ?, ?)
ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("iii", $user_id, $product_id, $quantity);
$stmt->execute();

echo json_encode(["status"=>"success"]);
