<?php
session_start();
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../../config/db.php";
if(!isset($_SESSION['user'])){
    echo json_encode([
        "status"=>"error",
        "message"=>"Not logged in"
    ]);
    exit;
}

$user_id = $_SESSION['user']['id'];

$sql = "
SELECT c.id, p.title, p.price, p.image, c.quantity, p.quantity as stock
FROM cart c
JOIN products p ON c.product_id = p.id
WHERE c.user_id = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i",$user_id);
$stmt->execute();

$result = $stmt->get_result();
$data=[];

while($row=$result->fetch_assoc()){
    $data[]=$row;
}

echo json_encode($data);
