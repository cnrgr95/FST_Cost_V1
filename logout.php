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

// Redirect to login page
header('Location: login.php');
exit;

