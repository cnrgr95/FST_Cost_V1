<?php
/**
 * Sidebar Component
 * Can be included in any page
 */

// Load translation helper
require_once __DIR__ . '/translations.php';

// Calculate base path if not already set
if (!isset($basePath)) {
    // Get the calling file's directory
    $callerFile = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2)[0]['file'] ?? __FILE__;
    $callerDir = dirname($callerFile);
    $rootDir = dirname(__DIR__); // Project root (one level up from includes/)
    
    // Calculate relative path
    $relativePath = str_replace($rootDir . DIRECTORY_SEPARATOR, '', $callerDir);
    
    // Count directory separators to determine depth
    if ($relativePath === $callerDir) {
        // We're at root
        $basePath = '';
    } else {
        $depth = substr_count($relativePath, DIRECTORY_SEPARATOR);
        $basePath = str_repeat('../', $depth);
    }
}

// Get username from session
$username = isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : 'User';
$user_initial = strtoupper(substr($username, 0, 1));

// Get sidebar translations
$t_sidebar = $all_translations['sidebar'] ?? [];
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
    <a href="<?php echo $basePath; ?>dashboard.php" class="header-logo">
      <img src="<?php echo $basePath; ?>assets/images/logo.svg" alt="FST Logo">
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
        <a href="<?php echo $basePath; ?>dashboard.php" class="nav-link" data-tooltip="<?php echo $t_sidebar['dashboard'] ?? 'Dashboard'; ?>">
          <span class="material-symbols-rounded">dashboard</span>
          <span class="nav-label"><?php echo $t_sidebar['dashboard'] ?? 'Dashboard'; ?></span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title"><?php echo $t_sidebar['dashboard'] ?? 'Dashboard'; ?></a></li>
        </ul>
      </li>

      <!-- Cost -->
      <li class="nav-item">
        <a href="#" class="nav-link" data-tooltip="<?php echo $t_sidebar['cost'] ?? 'Cost'; ?>">
          <span class="material-symbols-rounded">attach_money</span>
          <span class="nav-label"><?php echo $t_sidebar['cost'] ?? 'Cost'; ?></span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title"><?php echo $t_sidebar['cost'] ?? 'Cost'; ?></a></li>
        </ul>
      </li>

      <!-- Contract -->
      <li class="nav-item">
        <a href="#" class="nav-link" data-tooltip="<?php echo $t_sidebar['contract'] ?? 'Contract'; ?>">
          <span class="material-symbols-rounded">description</span>
          <span class="nav-label"><?php echo $t_sidebar['contract'] ?? 'Contract'; ?></span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title"><?php echo $t_sidebar['contract'] ?? 'Contract'; ?></a></li>
        </ul>
      </li>

      <!-- Tour List -->
      <li class="nav-item">
        <a href="#" class="nav-link" data-tooltip="<?php echo $t_sidebar['tour_list'] ?? 'Tour List'; ?>">
          <span class="material-symbols-rounded">route</span>
          <span class="nav-label"><?php echo $t_sidebar['tour_list'] ?? 'Tour List'; ?></span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title"><?php echo $t_sidebar['tour_list'] ?? 'Tour List'; ?></a></li>
        </ul>
      </li>

      <!-- Definitions -->
      <li class="nav-item dropdown-container">
        <a href="#" class="nav-link dropdown-toggle" data-tooltip="<?php echo $t_sidebar['definitions'] ?? 'Definitions'; ?>">
          <span class="material-symbols-rounded">description</span>
          <span class="nav-label"><?php echo $t_sidebar['definitions'] ?? 'Definitions'; ?></span>
          <span class="dropdown-icon material-symbols-rounded">keyboard_arrow_down</span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title"><?php echo $t_sidebar['definitions'] ?? 'Definitions'; ?></a></li>
          <li class="nav-item"><a href="#" class="nav-link dropdown-link"><?php echo $t_sidebar['users'] ?? 'Users'; ?></a></li>
          <li class="nav-item"><a href="<?php echo $basePath; ?>app/definitions/languages.php" class="nav-link dropdown-link"><?php echo $t_sidebar['language'] ?? 'Languages'; ?></a></li>
          <li class="nav-item"><a href="<?php echo $basePath; ?>app/definitions/tours.php" class="nav-link dropdown-link"><?php echo $t_sidebar['tours'] ?? 'Tours'; ?></a></li>
          <li class="nav-item"><a href="<?php echo $basePath; ?>app/definitions/costs.php" class="nav-link dropdown-link"><?php echo $t_sidebar['cost_mgmt'] ?? 'Cost'; ?></a></li>
          <li class="nav-item"><a href="<?php echo $basePath; ?>app/definitions/locations.php" class="nav-link dropdown-link"><?php echo $t_sidebar['locations'] ?? 'Locations'; ?></a></li>
          <li class="nav-item"><a href="<?php echo $basePath; ?>app/definitions/positions.php" class="nav-link dropdown-link"><?php echo $t_sidebar['positions'] ?? 'Positions'; ?></a></li>
          <li class="nav-item"><a href="<?php echo $basePath; ?>app/definitions/merchants.php" class="nav-link dropdown-link"><?php echo $t_sidebar['merchants'] ?? 'Merchants'; ?></a></li>
        </ul>
      </li>

      <!-- Settings -->
      <li class="nav-item dropdown-container">
        <a href="#" class="nav-link dropdown-toggle" data-tooltip="<?php echo $t_sidebar['settings'] ?? 'Settings'; ?>">
          <span class="material-symbols-rounded">settings</span>
          <span class="nav-label"><?php echo $t_sidebar['settings'] ?? 'Settings'; ?></span>
          <span class="dropdown-icon material-symbols-rounded">keyboard_arrow_down</span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title"><?php echo $t_sidebar['settings'] ?? 'Settings'; ?></a></li>
          <li class="nav-item"><a href="#" class="nav-link dropdown-link"><?php echo $t_sidebar['system_settings'] ?? 'System Settings'; ?></a></li>
          <li class="nav-item"><a href="#" class="nav-link dropdown-link"><?php echo $t_sidebar['cash_settings'] ?? 'Cash Settings'; ?></a></li>
        </ul>
      </li>
    </ul>

    <!-- Secondary Navigation (Bottom) -->
    <ul class="nav-list secondary-nav">
      <!-- Support -->
      <li class="nav-item">
        <a href="#" class="nav-link" data-tooltip="<?php echo $t_sidebar['support'] ?? 'Support'; ?>">
          <span class="material-symbols-rounded">help</span>
          <span class="nav-label"><?php echo $t_sidebar['support'] ?? 'Support'; ?></span>
        </a>
        <ul class="dropdown-menu">
          <li class="nav-item"><a class="nav-link dropdown-title"><?php echo $t_sidebar['support'] ?? 'Support'; ?></a></li>
        </ul>
      </li>

      <!-- FST Branding -->
      <li class="nav-item nav-link-branding">
        <div class="brand-text">
          <span class="brand-name"><?php echo $t_sidebar['fst'] ?? 'FST'; ?></span>
          <span class="brand-version"><?php echo $all_translations['version'] ?? 'v1.0.0'; ?></span>
        </div>
      </li>
    </ul>
  </nav>
</aside>

