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
require '../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');

if (!$email) {
    echo json_encode(["status" => "error", "message" => "Email is required"]);
    exit;
}

// Only role = user can reset
$stmt = $conn->prepare("SELECT id, name FROM users WHERE email = ? AND role = 'user'");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    // Important: don't reveal if email exists
    echo json_encode(["status" => "success"]);
    exit;
}

$user = $result->fetch_assoc();
$userId = $user['id'];
$userName = $user['name'];

// Generate secure token
$token = bin2hex(random_bytes(32));

// Invalidate old tokens for this user
$conn->query("UPDATE password_resets SET used = 1 WHERE user_id = $userId");

// Insert new token with 30-min expiry
$stmt = $conn->prepare("
    INSERT INTO password_resets (user_id, token, expires_at)
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))
");
$stmt->bind_param("is", $userId, $token);
$stmt->execute();

// Send reset email via PHPMailer
$mail = new PHPMailer(true);

try {
    $resetLink = "http://localhost:3000/reset-password?token=" . $token;

    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'email';
    $mail->Password   = 'code'; 
    $mail->SMTPSecure = 'tls';
    $mail->Port       = 587;

    $mail->setFrom('email', 'TechZone');
    $mail->addAddress($email, $userName);

    $mail->isHTML(true);
    $mail->Subject = 'Password Reset Request';
    $mail->Body    = "
        <h3>Password Reset Request</h3>
        <p>Hello {$userName},</p>
        <p>We received a request to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href='$resetLink'>$resetLink</a></p>
        <p>This link will expire in 30 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
    ";

    $mail->send();

} catch (Exception $e) {
    // Optional: log $mail->ErrorInfo to file for debugging
    error_log("Password reset email error: " . $mail->ErrorInfo);
}

// Always respond with success to avoid revealing emails
echo json_encode(["status" => "success"]);
