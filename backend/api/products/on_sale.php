<?php
session_start();

// CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once "../../config/db.php";

$sql = "
SELECT *
FROM products
WHERE old_price IS NOT NULL
AND old_price > price
ORDER BY (old_price - price) DESC
LIMIT 3
";

$res = $conn->query($sql);

$products = [];

while($row = $res->fetch_assoc()){
    $products[] = $row;
}

echo json_encode($products);
