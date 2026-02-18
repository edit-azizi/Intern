<?php
session_start();
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/db.php";

if (!isset($_SESSION['user'])) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$user_id = $_SESSION['user']['id'];

$sql = "
SELECT 
    o.id AS order_id,
    o.status,
    o.created_at,
    o.total,

    oi.product_id,
    oi.quantity,
    oi.price,

    p.title

FROM orders o

LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id

WHERE o.user_id = ?

ORDER BY o.created_at DESC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();

$result = $stmt->get_result();

$orders = [];

while ($row = $result->fetch_assoc()) {

    $orderId = $row['order_id'];

    if (!isset($orders[$orderId])) {
        $orders[$orderId] = [
            "id" => $orderId,
            "status" => $row['status'],
            "created_at" => $row['created_at'],
            "total" => (float)$row['total'],
            "items" => []
        ];
    }

    if ($row['product_id']) {

        $itemTotal = $row['price'] * $row['quantity'];

        $orders[$orderId]["items"][] = [
            "title" => $row['title'],
            "quantity" => $row['quantity'],
            "price" => (float)$row['price'],
            "subtotal" => $itemTotal
        ];
    }
}

echo json_encode([
    "status" => "success",
    "orders" => array_values($orders)
]);



// <?php
// session_start();
// header("Content-Type: application/json");
// header("Access-Control-Allow-Origin: http://localhost:3000");
// header("Access-Control-Allow-Methods: GET");
// header("Access-Control-Allow-Credentials: true");

// require_once "../../config/db.php";

// if (!isset($_SESSION['user'])) {
//     echo json_encode([
//         "status" => "error",
//         "message" => "You must be logged in to view orders."
//     ]);
//     exit;
// }

// $userId = $_SESSION['user']['id'];

// $stmt = $conn->prepare("
//     SELECT o.id, o.quantity, o.price, o.isbn, o.status, o.order_time, p.title
//     FROM orders o
//     JOIN products p ON o.product_id = p.id
//     WHERE o.user_id = ?
//     ORDER BY o.order_time DESC
// ");
// $stmt->bind_param("i", $userId);
// $stmt->execute();
// $result = $stmt->get_result();

// $orders = [];
// while ($row = $result->fetch_assoc()) {
//     $orders[] = $row;
// }

// echo json_encode([
//     "status" => "success",
//     "orders" => $orders
// ]);
