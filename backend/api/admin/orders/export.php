<?php
session_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");

require_once "../../../config/db.php";

/* Role check */
if (
    !isset($_SESSION['user']) ||
    !in_array($_SESSION['user']['role'], ['admin', 'manager'])
) {
    exit("Unauthorized");
}

$type = $_GET['type'] ?? 'today';

switch ($type) {
    case 'today':
        $whereDate = "DATE(o.created_at) = CURDATE()";
        $label = "today";
        break;
    case 'yesterday':
        $whereDate = "DATE(o.created_at) = CURDATE() - INTERVAL 1 DAY";
        $label = "yesterday";
        break;
    case 'week':
        $whereDate = "o.created_at >= CURDATE() - INTERVAL 7 DAY";
        $label = "last_7_days";
        break;
    case 'month':
        $whereDate = "o.created_at >= CURDATE() - INTERVAL 30 DAY";
        $label = "last_30_days";
        break;
    case 'custom':
        $from = $_GET['from'];
        $to   = $_GET['to'];
        $whereDate = "DATE(o.created_at) BETWEEN '$from' AND '$to'";
        $label = "custom_{$from}_{$to}";
        break;
    default:
        $whereDate = "DATE(o.created_at) = CURDATE()";
        $label = "today";
}

header("Content-Type: text/csv");
header("Content-Disposition: attachment; filename=order_stats_$label.csv");

$output = fopen("php://output", "w");

fputcsv($output, ["Product", "Total Sold", "Orders Count", "Revenue"]);

$sql = "
SELECT 
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

$totalSold = 0;
$totalOrders = 0;
$totalRevenue = 0;

while ($row = $result->fetch_assoc()) {
    fputcsv($output, [
        $row['title'],
        $row['total_sold'],
        $row['orders_count'],
        number_format((float)$row['revenue'], 2, '.', '')
    ]);

    $totalSold += $row['total_sold'];
    $totalOrders += $row['orders_count'];
    $totalRevenue += (float)$row['revenue'];
}

// Totals row
fputcsv($output, []);
fputcsv($output, [
    "TOTAL",
    $totalSold,
    $totalOrders,
    number_format($totalRevenue, 2, '.', '')
]);

fclose($output);
exit;
