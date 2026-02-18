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

$name = trim($data['name']);
$username = trim($data['username']);
$email = trim($data['email']);
$password = password_hash($data['password'], PASSWORD_DEFAULT);
$role = $data['role'];


//  CHECK IF USERNAME OR EMAIL ALREADY EXISTS


$checkStmt = $conn->prepare(
    "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1"
);
$checkStmt->bind_param("ss", $username, $email);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows > 0) {
    echo json_encode([
        "status" => "error",
        "message" => "User can not be added. Username or email already exists!"
    ]);
    exit;
}


// INSERT USER


$stmt = $conn->prepare(
    "INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)"
);
$stmt->bind_param("sssss", $name, $username, $email, $password, $role);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to create user"
    ]);
}
?>
