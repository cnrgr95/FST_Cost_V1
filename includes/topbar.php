<?php
/**
 * Topbar Component
 * Can be included in any page
 */

// Get current language
$lang = $_GET['lang'] ?? $_SESSION['language'] ?? 'en';

// Get username from session
$username = isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : 'User';
$user_initial = strtoupper(substr($username, 0, 1));
?>

<!-- Topbar -->
<div class="topbar">
  <!-- Left Side -->
  <div class="topbar-left">
    <div class="topbar-search">
      <span class="material-symbols-rounded search-icon">search</span>
      <input type="text" placeholder="Search...">
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
    <div class="topbar-item" onclick="toggleLanguage()">
      <span class="material-symbols-rounded">language</span>
    </div>

    <!-- User Profile -->
    <div class="topbar-profile">
      <div class="profile-image">
        <?php echo $user_initial; ?>
      </div>
      <div class="profile-info">
        <div class="profile-name"><?php echo $username; ?></div>
        <div class="profile-role">Administrator</div>
      </div>
      <span class="material-symbols-rounded dropdown-icon">keyboard_arrow_down</span>
      
      <!-- User Dropdown Menu -->
      <div class="user-dropdown">
        <a href="#" class="dropdown-item">
          <span class="material-symbols-rounded">person</span>
          <span>My Profile</span>
        </a>
        <a href="#" class="dropdown-item">
          <span class="material-symbols-rounded">settings</span>
          <span>Settings</span>
        </a>
        <a href="#" class="dropdown-item">
          <span class="material-symbols-rounded">help</span>
          <span>Help & Support</span>
        </a>
        <a href="logout.php" class="dropdown-item logout">
          <span class="material-symbols-rounded">logout</span>
          <span>Logout</span>
        </a>
      </div>
    </div>
  </div>
</div>

<script>
function toggleLanguage() {
  const currentLang = '<?php echo $lang; ?>';
  const newLang = currentLang === 'en' ? 'tr' : 'en';
  window.location.href = window.location.pathname + '?lang=' + newLang;
}
</script>

