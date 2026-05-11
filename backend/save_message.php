<?php

include "config.php";

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$conn->query("
INSERT INTO messages 
(sender_id, receiver_id, message, file_path)
VALUES (
    '{$data['sender_id']}',
    '{$data['receiver_id']}',
    '{$data['message']}',
    '{$data['file_path']}'
)
");

?>