<?php

include "config.php";

$user1 = $_GET['user1'];
$user2 = $_GET['user2'];

$result = $conn->query("
SELECT * FROM messages
WHERE 
(sender_id = $user1 AND receiver_id = $user2)
OR
(sender_id = $user2 AND receiver_id = $user1)
ORDER BY created_at ASC
");

$data = [];

while($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);

?>