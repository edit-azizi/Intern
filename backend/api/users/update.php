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

// Admin only
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$id = $data['id'];
$fields = $data['fields'] ?? [];


// CHECK IF USERNAME OR EMAIL ALREADY EXISTS (excluding current user)
if (isset($fields['username']) || isset($fields['email'])) {

    $newUsername = $fields['username'] ?? "";
    $newEmail = $fields['email'] ?? "";

    $checkSql = "SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("ssi", $newUsername, $newEmail, $id);
    $checkStmt->execute();
    $result = $checkStmt->get_result();

    if ($result->num_rows > 0) {
        echo json_encode([
            "status" => "error",
            "message" => "User can not be updated. Username or email already exists!"
        ]);
        exit;
    }
}


$allowedFields = ["name", "username", "email", "role"];
$updateParts = [];
$values = [];
$types = "";

// Build dynamic update
foreach ($allowedFields as $field) {
    if (isset($fields[$field])) {
        $updateParts[] = "$field = ?";
        $values[] = $fields[$field];
        $types .= "s";
    }
}

if (empty($updateParts)) {
    echo json_encode(["status" => "error", "message" => "No valid fields"]);
    exit;
}

$values[] = $id;
$types .= "i";

$sql = "UPDATE users SET " . implode(", ", $updateParts) . " WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$values);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Update failed"]);
}
