<?php
require_once "config/db.php";

$name = "Edit Azizi";
$username = "editazizi";
$email = "edit@gmail.com";
$password = password_hash("123456", PASSWORD_DEFAULT);
$role = "admin";

$stmt = $conn->prepare("INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $name, $username, $email, $password, $role);

if ($stmt->execute()) {
    echo "Admin inserted successfully!";
} else {
    echo "Error: " . $stmt->error;
}
