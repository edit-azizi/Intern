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
    COALESCE(SUM(oi.quantity),0) as total_sold
FROM products p
LEFT JOIN order_items oi 
    ON p.id = oi.product_id
LEFT JOIN orders o
    ON oi.order_id = o.id
    AND o.status IN ('paid','shipped')
WHERE p.deleted = 0
GROUP BY p.id
ORDER BY total_sold DESC
LIMIT 10
";

$result = mysqli_query($conn, $sql);

if(!$result){
    echo json_encode([
        "status"=>"error",
        "message"=>mysqli_error($conn)
    ]);
    exit;
}

$products = [];

while($row = mysqli_fetch_assoc($result)){
    $products[] = $row;
}

echo json_encode($products);
