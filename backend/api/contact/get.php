<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/db.php";

$result = $conn->query(
  "SELECT id, name, email, message, created_at 
   FROM contact_messages 
   ORDER BY created_at DESC"
);

$messages = [];

while ($row = $result->fetch_assoc()) {
  $messages[] = $row;
}

echo json_encode($messages);
