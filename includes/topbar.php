<?php
/**
 * Topbar Component
 * Can be included in any page
 */

// Load translation helper
require_once __DIR__ . '/translations.php';

// Get username from session
$username = isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : 'User';
$user_initial = strtoupper(substr($username, 0, 1));

// Get topbar translations
$t_topbar = $all_translations['topbar'] ?? [];
?>

<!-- Topbar -->
<div class="topbar">
  <!-- Left Side -->
  <div class="topbar-left">
    <div class="topbar-search">
      <span class="material-symbols-rounded search-icon">search</span>
      <input type="text" placeholder="<?php echo $t_topbar['search'] ?? 'Search...'; ?>">
    </div>
  </div>

  <!-- Right Side -->
  <div class="topbar-right">
    <!-- Notifications -->
    <div class="topbar-item">
      <span class="material-symbols-rounded">notifications</span>
      <span class="badge">3</span>
    </div>

    <!-- Messages -->
    <div class="topbar-item">
      <span class="material-symbols-rounded">mail</span>
      <span class="badge">5</span>
    </div>

    <!-- Language Selector -->
    <div class="topbar-item topbar-language">
      <span class="language-text">
        <?php echo ($lang === 'en') ? ($all_translations['languages']['en'] ?? 'English') : ($all_translations['languages']['tr'] ?? 'Türkçe'); ?>
      </span>
      <span class="material-symbols-rounded dropdown-icon">keyboard_arrow_down</span>
      
      <!-- Language Dropdown Menu -->
      <div class="language-dropdown">
        <a href="?lang=en" class="dropdown-item <?php echo ($lang === 'en') ? 'active' : ''; ?>">
          <span><?php echo $all_translations['languages']['en'] ?? 'English'; ?></span>
          <?php if ($lang === 'en'): ?>
            <span class="material-symbols-rounded">check</span>
          <?php endif; ?>
        </a>
        <a href="?lang=tr" class="dropdown-item <?php echo ($lang === 'tr') ? 'active' : ''; ?>">
          <span><?php echo $all_translations['languages']['tr'] ?? 'Türkçe'; ?></span>
          <?php if ($lang === 'tr'): ?>
            <span class="material-symbols-rounded">check</span>
          <?php endif; ?>
        </a>
      </div>
    </div>

    <!-- User Profile -->
    <div class="topbar-profile">
      <div class="profile-image">
        <?php echo $user_initial; ?>
      </div>
      <div class="profile-info">
        <div class="profile-name"><?php echo $username; ?></div>
        <div class="profile-role"><?php echo $t_topbar['administrator'] ?? 'Administrator'; ?></div>
      </div>
      <span class="material-symbols-rounded dropdown-icon">keyboard_arrow_down</span>
      
      <!-- User Dropdown Menu -->
      <div class="user-dropdown">
        <a href="#" class="dropdown-item">
          <span class="material-symbols-rounded">person</span>
          <span><?php echo $t_topbar['my_profile'] ?? 'My Profile'; ?></span>
        </a>
        <a href="#" class="dropdown-item">
          <span class="material-symbols-rounded">settings</span>
          <span><?php echo $t_topbar['settings'] ?? 'Settings'; ?></span>
        </a>
        <a href="#" class="dropdown-item">
          <span class="material-symbols-rounded">help</span>
          <span><?php echo $t_topbar['help_support'] ?? 'Help & Support'; ?></span>
        </a>
        <a href="logout.php" class="dropdown-item logout">
          <span class="material-symbols-rounded">logout</span>
          <span><?php echo $t_topbar['logout'] ?? 'Logout'; ?></span>
        </a>
      </div>
    </div>
  </div>
</div>


