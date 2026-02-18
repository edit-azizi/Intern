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

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

if(!isset($_SESSION['user'])){
    echo json_encode([
        "status"=>"error",
        "message"=>"Not logged in"
    ]);
    exit;
}

$user_id = $_SESSION['user']['id'];

$conn->begin_transaction();

try {

    //  Create new order (pending)
    $stmt = $conn->prepare("INSERT INTO orders (user_id, status, total) VALUES (?, 'pending', 0)");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $order_id = $conn->insert_id;

    //  Get cart items
    $stmt = $conn->prepare("
        SELECT cart.product_id, cart.quantity, products.price
        FROM cart
        JOIN products ON cart.product_id = products.id
        WHERE cart.user_id = ?
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $cart = $stmt->get_result();

    if($cart->num_rows === 0){
        throw new Exception("Cart is empty");
    }

    $total = 0; 

    while($item = $cart->fetch_assoc()) {

        $subtotal = $item['price'] * $item['quantity'];
        $total += $subtotal; 

        // Insert order items
        $stmtItem = $conn->prepare("
            INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)
        ");
        $stmtItem->bind_param("iiid", $order_id, $item['product_id'], $item['quantity'], $item['price']);
        $stmtItem->execute();

        // Decrease stock
        $stmtStock = $conn->prepare("
            UPDATE products SET quantity = quantity - ? WHERE id = ?
        ");
        $stmtStock->bind_param("ii", $item['quantity'], $item['product_id']);
        $stmtStock->execute();
    }

    // SAVE TOTAL INTO ORDERS
    $stmt = $conn->prepare("UPDATE orders SET total = ? WHERE id = ?");
    $stmt->bind_param("di", $total, $order_id);
    $stmt->execute();

    // Clear cart
    $stmt = $conn->prepare("DELETE FROM cart WHERE user_id=?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $conn->commit();

    echo json_encode([
        "status"=>"success",
        "order_id"=>$order_id
    ]);

} catch(Exception $e) {
    $conn->rollback();
    echo json_encode([
        "status"=>"error",
        "message"=>$e->getMessage()
    ]);
}
