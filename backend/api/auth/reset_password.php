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

$data = json_decode(file_get_contents("php://input"), true);

$token = $data['token'] ?? '';
$newPassword = $data['password'] ?? '';

if (!$token || !$newPassword) {
    echo json_encode(["status" => "error", "message" => "Invalid request"]);
    exit;
}

// Find valid token
$stmt = $conn->prepare("
    SELECT pr.id, pr.user_id
    FROM password_resets pr
    JOIN users u ON pr.user_id = u.id
    WHERE pr.token = ?
    AND pr.used = 0
    AND pr.expires_at > NOW()
    AND u.role = 'user'
");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "Invalid or expired token"]);
    exit;
}

$row = $result->fetch_assoc();
$userId = $row['user_id'];
$resetId = $row['id'];

// Hash new password
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

// Update password
$stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
$stmt->bind_param("si", $hashedPassword, $userId);
$stmt->execute();

// Mark token as used
$stmt = $conn->prepare("UPDATE password_resets SET used = 1 WHERE id = ?");
$stmt->bind_param("i", $resetId);
$stmt->execute();

echo json_encode(["status" => "success"]);
