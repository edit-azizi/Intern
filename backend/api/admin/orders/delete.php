<?php
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$type = $data['type'] ?? 'today';

switch ($type) {
    case 'today':
        $whereDate = "DATE(created_at) = CURDATE()";
        break;
    case 'yesterday':
        $whereDate = "DATE(created_at) = CURDATE() - INTERVAL 1 DAY";
        break;
    case 'week':
        $whereDate = "created_at >= CURDATE() - INTERVAL 7 DAY";
        break;
    case 'month':
        $whereDate = "created_at >= CURDATE() - INTERVAL 30 DAY";
        break;
    case 'custom':
        $from = $data['from'] ?? null;
        $to   = $data['to'] ?? null;

        if (!$from || !$to) {
            echo json_encode(["status" => "error", "message" => "Invalid date range"]);
            exit;
        }

        $whereDate = "DATE(created_at) BETWEEN '$from' AND '$to'";
        break;
    default:
        $whereDate = "DATE(created_at) = CURDATE()";
}

$sql = "
DELETE FROM orders
WHERE status IN ('paid', 'shipped')
AND $whereDate
";

if ($conn->query($sql)) {
    echo json_encode([
        "status" => "success",
        "deleted_rows" => $conn->affected_rows
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Delete failed"
    ]);
}
