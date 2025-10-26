<?php
/**
 * Sidebar Component
 * Can be included in any page
 */

// Get current language
$lang = $_GET['lang'] ?? $_SESSION['language'] ?? 'en';

// Get username from session
$username = isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : 'User';
$user_initial = strtoupper(substr($username, 0, 1));
?>

<!-- Sidebar Overlay for Mobile -->
<div class="sidebar-overlay"></div>

<!-- Mobile Sidebar Menu Button -->
<button class="sidebar-menu-button">
  <span class="material-symbols-rounded">menu</span>
</button>

<!-- Sidebar -->
<aside class="sidebar">
  <!-- Sidebar Header -->
  <header class="sidebar-header">
    <a href="dashboard.php" class="header-logo">
      <img src="assets/images/logo.svg" alt="FST Logo">
    </a>
    <button class="sidebar-toggler">
      <span class="material-symbols-rounded">chevron_left</span>
    </button>
  </header>

  <!-- Sidebar Navigation -->
  <nav class="sidebar-nav">
    <!-- Primary Navigation -->
    <ul class="nav-list primary-nav">
      <!-- Dashboard -->
      <li class="nav-item">
        <a href="dashboard.php" class="nav-link" data-tooltip="Dashboard">
          <span class="material-symbols-rounded">dashboard</span>
          <span class="nav-label">Dashboard</span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title">Dashboard</a></li>
        </ul>
      </li>

      <!-- Services -->
      <li class="nav-item dropdown-container">
        <a href="#" class="nav-link dropdown-toggle" data-tooltip="Services">
          <span class="material-symbols-rounded">business</span>
          <span class="nav-label">Services</span>
          <span class="dropdown-icon material-symbols-rounded">keyboard_arrow_down</span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title">Services</a></li>
          <li class="nav-item"><a href="#" class="nav-link dropdown-link">Cost Analysis</a></li>
          <li class="nav-item"><a href="#" class="nav-link dropdown-link">Budget Planning</a></li>
          <li class="nav-item"><a href="#" class="nav-link dropdown-link">Reports</a></li>
        </ul>
      </li>

      <!-- Projects -->
      <li class="nav-item dropdown-container">
        <a href="#" class="nav-link dropdown-toggle" data-tooltip="Projects">
          <span class="material-symbols-rounded">folder</span>
          <span class="nav-label">Projects</span>
          <span class="dropdown-icon material-symbols-rounded">keyboard_arrow_down</span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title">Projects</a></li>
          <li class="nav-item"><a href="#" class="nav-link dropdown-link">Active Projects</a></li>
          <li class="nav-item"><a href="#" class="nav-link dropdown-link">Completed</a></li>
          <li class="nav-item"><a href="#" class="nav-link dropdown-link">Archived</a></li>
        </ul>
      </li>

      <!-- Reports -->
      <li class="nav-item">
        <a href="#" class="nav-link" data-tooltip="Reports">
          <span class="material-symbols-rounded">summarize</span>
          <span class="nav-label">Reports</span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title">Reports</a></li>
        </ul>
      </li>

      <!-- Analytics -->
      <li class="nav-item">
        <a href="#" class="nav-link" data-tooltip="Analytics">
          <span class="material-symbols-rounded">analytics</span>
          <span class="nav-label">Analytics</span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title">Analytics</a></li>
        </ul>
      </li>

      <!-- Notifications -->
      <li class="nav-item">
        <a href="#" class="nav-link" data-tooltip="Notifications">
          <span class="material-symbols-rounded">notifications</span>
          <span class="nav-label">Notifications</span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title">Notifications</a></li>
        </ul>
      </li>

      <!-- Settings -->
      <li class="nav-item">
        <a href="#" class="nav-link" data-tooltip="Settings">
          <span class="material-symbols-rounded">settings</span>
          <span class="nav-label">Settings</span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title">Settings</a></li>
        </ul>
      </li>
    </ul>

    <!-- Secondary Navigation (Bottom) -->
    <ul class="nav-list secondary-nav">
      <!-- Support -->
      <li class="nav-item">
        <a href="#" class="nav-link" data-tooltip="Support">
          <span class="material-symbols-rounded">help</span>
          <span class="nav-label">Support</span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title">Support</a></li>
        </ul>
      </li>

      <!-- FST Branding -->
      <li class="nav-item nav-link-branding">
        <div class="brand-text">
          <span class="brand-name">FST</span>
          <span class="brand-version">v1.0.0</span>
        </div>
      </li>
    </ul>
  </nav>
</aside>

