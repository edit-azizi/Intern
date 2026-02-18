<?php
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/db.php";

if (
    !isset($_SESSION['user']) ||
    !in_array($_SESSION['user']['role'], ['admin', 'manager'])
) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$sql = "
SELECT 
    o.id AS order_id,
    u.username,
    o.status,
    o.payment_method,
    o.shipping_address,
    o.created_at,
    o.total, --  GET FINAL ORDER TOTAL

    oi.quantity,
    oi.price,

    p.title,
    p.isbn

FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id

ORDER BY o.created_at DESC
";

$res = $conn->query($sql);

$orders = [];

while ($row = $res->fetch_assoc()) {

    $orderId = $row['order_id'];

    if (!isset($orders[$orderId])) {
        $orders[$orderId] = [
            "id" => $orderId,
            "username" => $row['username'],
            "status" => $row['status'],
            "payment_method" => $row['payment_method'],
            "shipping_address" => $row['shipping_address'],
            "created_at" => $row['created_at'],
            "total" => $row['total'], //  SEND FINAL TOTAL
            "items" => [],
            "raw_sum" => 0 // temporary for discount calculation
        ];
    }

    if ($row['title']) {

        $subtotal = $row['price'] * $row['quantity'];

        $orders[$orderId]["raw_sum"] += $subtotal;

        $orders[$orderId]["items"][] = [
            "title" => $row['title'],
            "isbn" => $row['isbn'],
            "quantity" => $row['quantity'],
            "price" => $row['price'],
            "original_subtotal" => $subtotal
        ];
    }
}

/*
✅ APPLY DISCOUNT FACTOR
This makes product subtotals match the FINAL order price
WITHOUT changing your DB.
*/
foreach ($orders as &$order) {

    $raw = $order['raw_sum'];
    $final = $order['total'];

    // avoid division by zero
    $factor = ($raw > 0) ? ($final / $raw) : 1;

    foreach ($order['items'] as &$item) {
        $item['subtotal'] = round($item['original_subtotal'] * $factor, 2);
    }

    unset($order['raw_sum']); // cleanup
}

echo json_encode(array_values($orders));
