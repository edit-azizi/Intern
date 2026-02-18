<?php
session_start();

// CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");

require_once "../../config/db.php";

if (
    !isset($_SESSION['user']) ||
    !in_array($_SESSION['user']['role'], ['admin', 'manager'])
) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$product_id = (int)$_POST['product_id'];

if (!$product_id || empty($_FILES['image']['name'])) {
    echo json_encode(["status" => "error", "message" => "Missing data"]);
    exit;
}

$ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
$imageName = uniqid("extra_") . "." . $ext;

move_uploaded_file(
    $_FILES['image']['tmp_name'],
    "../../uploads/products/" . $imageName
);

$stmt = $conn->prepare("INSERT INTO product_images (product_id, image) VALUES (?, ?)");
$stmt->bind_param("is", $product_id, $imageName);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error"]);
}
?>
