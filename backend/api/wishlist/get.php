<?php
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/db.php";

if (!isset($_SESSION['user'])) {
    echo json_encode([]);
    exit;
}

$user_id = $_SESSION['user']['id'];

$sql = "
SELECT p.*
FROM wishlists w
JOIN products p ON p.id = w.product_id
WHERE w.user_id = ?
ORDER BY w.created_at DESC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$favorites = [];
while ($row = $result->fetch_assoc()) {
    $favorites[] = $row;
}

echo json_encode($favorites);
