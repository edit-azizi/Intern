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
    p.*,
    ROUND(AVG(r.rating), 1) AS avg_rating,
    COUNT(r.id) AS rating_count
FROM products p
LEFT JOIN product_ratings r
    ON p.id = r.product_id
WHERE p.deleted = 0
GROUP BY p.id
HAVING rating_count > 0
ORDER BY avg_rating DESC, rating_count DESC
LIMIT 10
";

$result = mysqli_query($conn, $sql);

$products = [];

while ($row = mysqli_fetch_assoc($result)) {
    $products[] = $row;
}

echo json_encode($products);
?>
