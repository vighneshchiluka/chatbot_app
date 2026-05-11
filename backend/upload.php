<?php

if(isset($_FILES['file'])) {

    if (!is_dir("../uploads")) {
        mkdir("../uploads", 0777, true);
    }

    $filename =
        time() . "_" .
        basename($_FILES['file']['name']);

    $path = "uploads/" . $filename;

    move_uploaded_file(
        $_FILES['file']['tmp_name'],
        "../" . $path
    );

    echo json_encode([
        "status" => "success",
        "path" => $path
    ]);
}
?>