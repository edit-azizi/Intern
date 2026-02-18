<?php
session_start();

// CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once "../../config/db.php";

// Role check
if (
    !isset($_SESSION['user']) ||
    !in_array($_SESSION['user']['role'], ['admin', 'manager'])
) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

// FormData fields
$title = $_POST['title'];
$description = $_POST['description'];
$isbn = $_POST['isbn'];
$quantity = $_POST['quantity'];
$price = $_POST['price'];
$category_id = !empty($_POST['category_id']) ? $_POST['category_id'] : NULL;

// ISBN DUPLICATE CHECK

$checkStmt = $conn->prepare("SELECT id FROM products WHERE isbn = ? AND deleted = 0");
$checkStmt->bind_param("s", $isbn);
$checkStmt->execute();
$result = $checkStmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        "status" => "error",
        "message" => "Product can not be added. ISBN already exists!"
    ]);
    exit;
}

$imageName = null;

// Image upload (optional)
if (!empty($_FILES['image']['name'])) {
    $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $imageName = uniqid("product_") . "." . $ext;
    move_uploaded_file(
        $_FILES['image']['tmp_name'],
        "../../uploads/products/" . $imageName
    );
}

// Insert
$stmt = $conn->prepare(
    "INSERT INTO products (title, description, isbn, quantity, price, image, category_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)"
);

$stmt->bind_param(
    "sssidsi",
    $title,
    $description,
    $isbn,
    $quantity,
    $price,
    $imageName,
    $category_id
);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to insert product."]);
}
