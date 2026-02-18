<?php
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once "../../config/db.php";

if (
    !isset($_SESSION['user']) ||
    !in_array($_SESSION['user']['role'], ['admin', 'manager'])
) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}


$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'];
$status = $data['status'];

$allowed = ["pending", "paid", "shipped"];
if (!in_array($status, $allowed)) {
    echo json_encode(["status" => "error", "message" => "Invalid status"]);
    exit;
}

$stmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
$stmt->bind_param("si", $status, $id);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error"]);
}
