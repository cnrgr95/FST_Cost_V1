<?php
/**
 * Logout Page
 */

session_start();

// Destroy session
session_destroy();

// Clear any cookies
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

// Clear remembered_username cookie
if (isset($_COOKIE['remembered_username'])) {
    setcookie('remembered_username', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

// Redirect to login page
header('Location: login.php');
exit;

