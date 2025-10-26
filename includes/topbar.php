<?php
/**
 * Topbar Component
 * Can be included in any page
 */

// Calculate base path dynamically
if (!isset($basePath)) {
    $callerFile = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2)[0]['file'] ?? __FILE__;
    $callerDir = dirname($callerFile);
    $rootDir = dirname(__DIR__);
    $relativePath = str_replace($rootDir . DIRECTORY_SEPARATOR, '', $callerDir);
    if ($relativePath === $callerDir) {
        $basePath = '';
    } else {
        $depth = substr_count($relativePath, DIRECTORY_SEPARATOR);
        $basePath = str_repeat('../', $depth);
    }
}

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
    <!-- Fullscreen Toggle -->
    <div class="topbar-item topbar-fullscreen" onclick="toggleFullscreen()">
      <span class="material-symbols-rounded">fullscreen</span>
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
        <a href="<?php echo $basePath; ?>logout.php" class="dropdown-item logout">
          <span class="material-symbols-rounded">logout</span>
          <span><?php echo $t_topbar['logout'] ?? 'Logout'; ?></span>
        </a>
      </div>
    </div>
  </div>
</div>

<script>
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log('Error attempting to enable fullscreen:', err);
    });
    document.querySelector('.topbar-fullscreen .material-symbols-rounded').textContent = 'fullscreen_exit';
  } else {
    document.exitFullscreen().catch(err => {
      console.log('Error attempting to exit fullscreen:', err);
    });
    document.querySelector('.topbar-fullscreen .material-symbols-rounded').textContent = 'fullscreen';
  }
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', function() {
  const icon = document.querySelector('.topbar-fullscreen .material-symbols-rounded');
  if (icon) {
    if (document.fullscreenElement) {
      icon.textContent = 'fullscreen_exit';
    } else {
      icon.textContent = 'fullscreen';
    }
  }
});

// Listen for F11 key
document.addEventListener('keydown', function(e) {
  if (e.key === 'F11') {
    e.preventDefault();
    toggleFullscreen();
  }
});
</script>

