<?php
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../../../config/db.php";

/* Role check */
if (
    !isset($_SESSION['user']) ||
    !in_array($_SESSION['user']['role'], ['admin', 'manager'])
) {
    http_response_code(403);
    echo json_encode(["message" => "Unauthorized"]);
    exit;
}

/* Date filter */
$type = $_GET['type'] ?? 'today';

switch ($type) {
    case 'today':
        $whereDate = "DATE(o.created_at) = CURDATE()";
        break;
    case 'yesterday':
        $whereDate = "DATE(o.created_at) = CURDATE() - INTERVAL 1 DAY";
        break;
    case 'week':
        $whereDate = "o.created_at >= CURDATE() - INTERVAL 7 DAY";
        break;
    case 'month':
        $whereDate = "o.created_at >= CURDATE() - INTERVAL 30 DAY";
        break;
    case 'custom':
        $from = $_GET['from'] ?? null;
        $to   = $_GET['to'] ?? null;

        if (!$from || !$to) {
            echo json_encode(["message" => "Invalid date range"]);
            exit;
        }

        $whereDate = "DATE(o.created_at) BETWEEN '$from' AND '$to'";
        break;
    default:
        $whereDate = "DATE(o.created_at) = CURDATE()";
}

/* CORRECT analytics using order_items */
$sql = "
SELECT 
    p.id,
    p.title,
    SUM(oi.quantity) AS total_sold,
    COUNT(DISTINCT o.id) AS orders_count,

    SUM(
        (oi.price * oi.quantity) /
        (
            SELECT SUM(oi2.price * oi2.quantity)
            FROM order_items oi2
            WHERE oi2.order_id = o.id
        )
        * o.total
    ) AS revenue

FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id

WHERE 
    o.status IN ('paid', 'shipped')
    AND $whereDate

GROUP BY p.id
ORDER BY total_sold DESC
";


$result = $conn->query($sql);

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
