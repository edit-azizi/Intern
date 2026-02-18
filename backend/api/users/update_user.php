<?php
session_start();
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/db.php";

if (!isset($_SESSION['user'])) {
    echo json_encode(["status" => "error", "message" => "Not logged in"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data['name'] ?? '');
$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$name || !$username || !$email) {
    echo json_encode(["status" => "error", "message" => "Name, username, and email required"]);
    exit;
}

// Check if username or email is already taken by another user
$stmt = $conn->prepare("SELECT id FROM users WHERE (username=? OR email=?) AND id != ?");
$stmt->bind_param("ssi", $username, $email, $_SESSION['user']['id']);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows > 0) {
    echo json_encode(["status" => "error", "message" => "Username or email already in use"]);
    exit;
}

// Update user
if ($password) {
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE users SET name=?, username=?, email=?, password=? WHERE id=?");
    $stmt->bind_param("ssssi", $name, $username, $email, $hashed, $_SESSION['user']['id']);
} else {
    $stmt = $conn->prepare("UPDATE users SET name=?, username=?, email=? WHERE id=?");
    $stmt->bind_param("sssi", $name, $username, $email, $_SESSION['user']['id']);
}

if ($stmt->execute()) {
    // Update session user info
    $_SESSION['user']['name'] = $name;
    $_SESSION['user']['username'] = $username;
    $_SESSION['user']['email'] = $email;

    echo json_encode(["status" => "success", "user" => $_SESSION['user']]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to update account"]);
}
