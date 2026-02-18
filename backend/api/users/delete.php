<?php
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../../config/db.php";

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$id = (int)$data['id'];

if ($id === (int)$_SESSION['user']['id']) {
    echo json_encode(["status" => "error", "message" => "You cannot delete yourself"]);
    exit;
}


// CHECK FOR NON-SHIPPED ORDERS


$stmt = $conn->prepare("
    SELECT COUNT(*) as active_orders
    FROM orders
    WHERE user_id = ?
    AND status != 'shipped'
");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if ($row['active_orders'] > 0) {
    echo json_encode([
        "status" => "error",
        "message" => "User can not be deleted. An order from this user is still in progress!"
    ]);
    exit;
}

//    Orders will auto set user_id = NULL

$stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to delete user"
    ]);
}
