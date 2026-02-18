<?php
session_start();

// CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../../config/db.php";

// Role check
if (
    !isset($_SESSION['user']) ||
    !in_array($_SESSION['user']['role'], ['admin', 'manager'])
) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$id = (int)$_POST['id'];


// ISBN DUPLICATE CHECK


if (isset($_POST['isbn'])) {

    $newIsbn = $_POST['isbn'];

    $checkStmt = $conn->prepare(
        "SELECT id FROM products WHERE isbn = ? AND id != ? AND deleted = 0"
    );
    $checkStmt->bind_param("si", $newIsbn, $id);
    $checkStmt->execute();
    $result = $checkStmt->get_result();

    if ($result->num_rows > 0) {
        echo json_encode([
            "status" => "error",
            "message" => "Product can not be updated. ISBN already exists!"
        ]);
        exit;
    }
}

//  GET CURRENT PRICE FIRST


$stmt = $conn->prepare("SELECT price, old_price FROM products WHERE id = ? AND deleted = 0");
$stmt->bind_param("i", $id);
$stmt->execute();

$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row) {
    echo json_encode(["status"=>"error","message"=>"Product not found or deleted"]);
    exit;
}

$currentPrice = (float)$row['price'];
$currentOldPrice = (float)$row['old_price'];

$newPrice = isset($_POST['price']) ? (float)$_POST['price'] : $currentPrice;

$fields = $_POST;

$allowedFields = ["title", "description", "isbn", "quantity", "price", "category_id"];
$updateParts = [];
$types = "";
$values = [];

foreach ($allowedFields as $f) {

    if (isset($fields[$f])) {

        if ($f === "price") {

            $updateParts[] = "price = ?";
            $values[] = $newPrice;
            $types .= "d";

            if ($newPrice < $currentPrice) {

                if ($currentOldPrice != $currentPrice) {
                    $updateParts[] = "old_price = ?";
                    $values[] = $currentPrice;
                    $types .= "d";
                }
            } elseif ($newPrice > $currentPrice) {
                $updateParts[] = "old_price = NULL";
            }

        } else {

            $updateParts[] = "$f = ?";
            $values[] = $fields[$f];

            if ($f === "quantity" || $f === "category_id") {
                $types .= "i";
            } else {
                $types .= "s";
            }
        }
    }
}

// Image update
if (!empty($_FILES['image']['name'])) {

    $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $imageName = uniqid("product_") . "." . $ext;

    move_uploaded_file(
        $_FILES['image']['tmp_name'],
        "../../uploads/products/" . $imageName
    );

    $updateParts[] = "image = ?";
    $values[] = $imageName;
    $types .= "s";
}

if (empty($updateParts)) {
    echo json_encode(["status" => "error", "message" => "No valid fields"]);
    exit;
}

$values[] = $id;
$types .= "i";

$sql = "UPDATE products SET " . implode(", ", $updateParts) . " WHERE id = ? AND deleted = 0";
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$values);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to update product"]);
}
?>
