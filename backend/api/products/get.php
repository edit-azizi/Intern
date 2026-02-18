<?php
session_start();

// CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");

require_once "../../config/db.php";

$sql = "
SELECT 
    p.id,
    p.title,
    p.description,
    p.isbn,
    p.quantity,
    p.price,
    p.old_price,
    p.image,
    p.category_id,
    c.name AS category_name,
    ROUND(AVG(r.rating), 1) AS avg_rating,
    COUNT(r.id) AS rating_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_ratings r ON p.id = r.product_id
WHERE p.deleted = 0
GROUP BY p.id
ORDER BY p.id DESC
";

$result = $conn->query($sql);

$products = [];
while ($row = $result->fetch_assoc()) {
    $products[] = $row;
}

echo json_encode($products);
