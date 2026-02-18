<?php
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");

require_once "../../config/db.php";

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

if (!isset($_SESSION['user'])) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$orderId = $data['order_id'] ?? null;
$method = $data['payment_method'] ?? null;
$address = $data['shipping_address'] ?? null;
$discountCode = strtoupper(trim($data['discount_code'] ?? ''));

if (!$orderId || !$method || !$address) {
    echo json_encode(["status" => "error", "message" => "Missing data"]);
    exit;
}

/* GET ORDER + TOTAL */
$stmt = $conn->prepare("
    SELECT id, total
    FROM orders
    WHERE id = ? AND user_id = ? AND status = 'pending'
");

$stmt->bind_param("ii", $orderId, $_SESSION['user']['id']);
$stmt->execute();

$order = $stmt->get_result()->fetch_assoc();

if (!$order) {
    echo json_encode(["status" => "error", "message" => "Order not found"]);
    exit;
}

$finalPrice = (float)$order['total'];


/* APPLY DISCOUNT */
if ($discountCode !== "") {

    $stmt = $conn->prepare("
        SELECT percentage, max_uses, used_count, expires_at, is_active
        FROM discount_codes
        WHERE code = ?
    ");

    $stmt->bind_param("s", $discountCode);
    $stmt->execute();

    $discount = $stmt->get_result()->fetch_assoc();

    if (
        $discount &&
        $discount['is_active'] &&
        (!$discount['expires_at'] || strtotime($discount['expires_at']) > time()) &&
        (!$discount['max_uses'] || $discount['used_count'] < $discount['max_uses'])
    ) {

        $percent = (int)$discount['percentage'];
        $finalPrice -= ($finalPrice * $percent / 100);

        // increment usage
        $stmt = $conn->prepare("
            UPDATE discount_codes
            SET used_count = used_count + 1
            WHERE code = ?
        ");
        $stmt->bind_param("s", $discountCode);
        $stmt->execute();
    }
}


/* UPDATE ORDER WITH FINAL TOTAL + MARK PAID */
$stmt = $conn->prepare("
    UPDATE orders
    SET 
        total = ?,
        status = 'paid',
        payment_method = ?,
        shipping_address = ?,
        paid_at = NOW()
    WHERE id = ? AND user_id = ?
");

$stmt->bind_param(
    "dssii",
    $finalPrice,
    $method,
    $address,
    $orderId,
    $_SESSION['user']['id']
);

$stmt->execute();

echo json_encode([
    "status" => "success",
    "final_price" => $finalPrice
]);
