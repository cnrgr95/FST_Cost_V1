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
    <!-- Search removed -->
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
        <?php 
        $availableLanguages = $all_translations['_available_languages'] ?? ['en' => 'English', 'tr' => 'Türkçe'];
        echo htmlspecialchars($availableLanguages[$lang] ?? 'English');
        ?>
      </span>
      <span class="material-symbols-rounded dropdown-icon">keyboard_arrow_down</span>
      
      <!-- Language Dropdown Menu -->
      <div class="language-dropdown">
        <?php
        // Preserve current URL parameters while changing language
        $currentParams = $_GET;
        foreach ($availableLanguages as $langCode => $langName):
            $currentParams['lang'] = $langCode;
            $langUrl = '?' . http_build_query($currentParams);
            $isActive = ($lang === $langCode);
        ?>
        <a href="<?php echo htmlspecialchars($langUrl); ?>" class="dropdown-item <?php echo $isActive ? 'active' : ''; ?>">
          <span><?php echo htmlspecialchars($langName); ?></span>
          <?php if ($isActive): ?>
            <span class="material-symbols-rounded">check</span>
          <?php endif; ?>
        </a>
        <?php endforeach; ?>
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

<script src="<?php echo $basePath; ?>assets/js/includes/topbar.js"></script>

