<?php
/**
 * Platform Helper Functions
 * Provides cross-platform compatibility functions
 */

/**
 * Create directory with platform-appropriate permissions
 * @param string $path Directory path
 * @param int|null $mode Permission mode (null = auto-detect platform default)
 * @param bool $recursive Create parent directories
 * @return bool Success
 */
function createDirectory($path, $mode = null, $recursive = true) {
    if (file_exists($path) && is_dir($path)) {
        return true;
    }
    
    // Auto-detect platform-appropriate mode
    if ($mode === null) {
        // Windows doesn't use Unix permissions effectively
        // Use 0755 for Unix/Linux/Mac, let Windows use default
        $mode = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') ? null : 0755;
    }
    
    if ($mode !== null) {
        $result = @mkdir($path, $mode, $recursive);
    } else {
        $result = @mkdir($path, $recursive);
    }
    
    // On Windows, try to set permissions after creation if possible
    if ($result && $mode !== null && function_exists('chmod')) {
        @chmod($path, $mode);
    }
    
    return $result;
}

/**
 * Get platform-specific path separator
 * @return string Path separator
 */
function getPathSeparator() {
    return DIRECTORY_SEPARATOR;
}

/**
 * Normalize path for current platform
 * Converts mixed separators to platform-appropriate ones
 * @param string $path Path to normalize
 * @return string Normalized path
 */
function normalizePath($path) {
    // Replace all separators with platform-specific one
    return str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
}

/**
 * Check if running on Windows
 * @return bool
 */
function isWindows() {
    return strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
}

/**
 * Check if running on Unix/Linux
 * @return bool
 */
function isUnix() {
    return !isWindows();
}

/**
 * Get default file permissions for current platform
 * @return int Permission mode (null for Windows)
 */
function getDefaultFileMode() {
    return isWindows() ? null : 0644;
}

/**
 * Get default directory permissions for current platform
 * @return int Permission mode (null for Windows)
 */
function getDefaultDirMode() {
    return isWindows() ? null : 0755;
}

/**
 * Find executable in PATH
 * @param string $executable Executable name (e.g., 'php', 'composer')
 * @param array $commonPaths Additional paths to check
 * @return string|null Full path to executable or null if not found
 */
function findExecutable($executable, $commonPaths = []) {
    // Add .exe extension on Windows
    $execName = $executable . (isWindows() ? '.exe' : '');
    
    // Check common paths first
    foreach ($commonPaths as $path) {
        $fullPath = normalizePath($path . DIRECTORY_SEPARATOR . $execName);
        if (file_exists($fullPath) && is_executable($fullPath)) {
            return $fullPath;
        }
    }
    
    // Check PATH environment variable
    $pathEnv = getenv('PATH');
    if ($pathEnv) {
        $paths = explode(isWindows() ? ';' : ':', $pathEnv);
        foreach ($paths as $path) {
            $fullPath = normalizePath($path . DIRECTORY_SEPARATOR . $execName);
            if (file_exists($fullPath) && is_executable($fullPath)) {
                return $fullPath;
            }
        }
    }
    
    // Try direct command
    if (isWindows()) {
        $output = [];
        @exec("where $executable 2>nul", $output);
        if (!empty($output) && file_exists(trim($output[0]))) {
            return trim($output[0]);
        }
    } else {
        $output = [];
        @exec("which $executable 2>/dev/null", $output);
        if (!empty($output) && file_exists(trim($output[0]))) {
            return trim($output[0]);
        }
    }
    
    return null;
}

/**
 * Get composer executable path
 * @return string|null Path to composer or null
 */
function findComposer() {
    // Try composer.phar in project root first
    $projectRoot = dirname(__DIR__);
    $composerPhar = normalizePath($projectRoot . DIRECTORY_SEPARATOR . 'composer.phar');
    if (file_exists($composerPhar)) {
        return $composerPhar;
    }
    
    // Try global composer
    $composer = findExecutable('composer');
    if ($composer) {
        return $composer;
    }
    
    // Try composer.phar globally
    $commonPaths = [];
    if (isWindows()) {
        $commonPaths = [
            'C:\\ProgramData\\ComposerSetup\\bin',
            getenv('APPDATA') . '\\Composer\\vendor\\bin',
        ];
    } else {
        $home = getenv('HOME');
        if ($home) {
            $commonPaths = [
                $home . '/.composer/vendor/bin',
                '/usr/local/bin',
                '/usr/bin',
            ];
        }
    }
    
    return findExecutable('composer', $commonPaths) ?: findExecutable('composer.phar', $commonPaths);
}

/**
 * Check if directory is writable (cross-platform)
 * @param string $path Directory path
 * @return bool
 */
function isDirectoryWritable($path) {
    if (!is_dir($path)) {
        return false;
    }
    
    // Try to create a test file
    $testFile = normalizePath($path . DIRECTORY_SEPARATOR . '.write_test_' . uniqid());
    $result = @file_put_contents($testFile, 'test');
    if ($result !== false) {
        @unlink($testFile);
        return true;
    }
    
    return false;
}

/**
 * Get system timezone or default
 * @param string $default Default timezone
 * @return string Timezone identifier
 */
function getSystemTimezone($default = 'UTC') {
    // Try to get from PHP ini
    $tz = ini_get('date.timezone');
    if (!empty($tz)) {
        return $tz;
    }
    
    // Try to get from system
    if (function_exists('date_default_timezone_get')) {
        try {
            $tz = @date_default_timezone_get();
            if (!empty($tz)) {
                return $tz;
            }
        } catch (Exception $e) {
            // Ignore
        }
    }
    
    return $default;
}

?>

