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

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'] ?? null;

if(!$id){
    echo json_encode([
        "status"=>"error",
        "message"=>"Invalid cart id"
    ]);
    exit;
}


$user_id = $_SESSION['user']['id'];

$stmt = $conn->prepare("
DELETE FROM cart 
WHERE id=? AND user_id=?
");

$stmt->bind_param("ii",$id,$user_id);
$stmt->execute();


echo json_encode(["status"=>"success"]);
