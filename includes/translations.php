<?php
/**
 * Translation Helper
 * Loads translations from JSON files
 */

// Get available languages dynamically from translation files (sorted by order)
function getAvailableLanguages() {
    $langDir = __DIR__ . '/../translations/';
    $languages = [];
    $languageMap = [];
    
    // First, collect all languages
    if (is_dir($langDir)) {
        $files = scandir($langDir);
        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'json' && $file !== 'language_order.json') {
                $code = pathinfo($file, PATHINFO_FILENAME);
                $filePath = $langDir . $file;
                $content = @file_get_contents($filePath);
                
                if ($content !== false) {
                    $data = @json_decode($content, true);
                    if ($data !== null && isset($data['languages'][$code])) {
                        $languageMap[$code] = $data['languages'][$code];
                    } else {
                        // Fallback to code if name not found
                        $languageMap[$code] = ucfirst($code);
                    }
                }
            }
        }
    }
    
    // Get order
    $orderFile = $langDir . 'language_order.json';
    $order = [];
    if (file_exists($orderFile)) {
        $content = @file_get_contents($orderFile);
        if ($content !== false) {
            $data = @json_decode($content, true);
            if ($data !== null && isset($data['order']) && is_array($data['order'])) {
                $order = $data['order'];
            }
        }
    }
    
    // Add languages in order
    foreach ($order as $code) {
        if (isset($languageMap[$code])) {
            $languages[$code] = $languageMap[$code];
            unset($languageMap[$code]);
        }
    }
    
    // Add remaining languages (not in order file) - sort by code for consistency
    ksort($languageMap);
    foreach ($languageMap as $code => $name) {
        $languages[$code] = $name;
    }
    
    // Ensure at least en and tr exist
    if (empty($languages)) {
        $languages = ['en' => 'English', 'tr' => 'Türkçe'];
    }
    
    return $languages;
}

function loadTranslations($lang = 'en') {
    $availableLanguages = getAvailableLanguages();
    $langKeys = array_keys($availableLanguages);
    
    // Default to English if language not supported
    if (!in_array($lang, $langKeys, true)) {
        $lang = 'en';
    }
    
    $translation_file = __DIR__ . '/../translations/' . $lang . '.json';
    
    if (!file_exists($translation_file)) {
        $translation_file = __DIR__ . '/../translations/en.json';
    }
    
    $translations = json_decode(file_get_contents($translation_file), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        // Fallback to empty array if JSON parsing fails
        $translations = [];
    }
    
    return $translations ?: [];
}

// Get current language (only if not API request and session is active)
if (!defined('API_REQUEST') && session_status() === PHP_SESSION_ACTIVE) {
    $availableLanguages = getAvailableLanguages();
    $langKeys = array_keys($availableLanguages);
    
    // Priority: GET parameter > Session > Default
    // GET parameter should always take precedence for immediate language changes
    $requested = null;
    if (isset($_GET['lang']) && !empty($_GET['lang'])) {
        $requested = trim($_GET['lang']);
    } elseif (isset($_SESSION['language']) && !empty($_SESSION['language'])) {
        $requested = $_SESSION['language'];
    } else {
        $requested = 'en';
    }
    
    // Validate against available languages dynamically
    $current_lang = in_array($requested, $langKeys, true) ? $requested : 'en';
    
    // Update session if GET parameter was provided (to persist for future requests)
    if (isset($_GET['lang']) && !empty($_GET['lang']) && in_array($current_lang, $langKeys, true)) {
        $_SESSION['language'] = $current_lang;
    }
    
    $lang = $current_lang;
    
    // Load all translations
    $all_translations = loadTranslations($current_lang);
    
    // Store available languages for use in templates
    $all_translations['_available_languages'] = $availableLanguages;
} else {
    // Default values for API requests
    $current_lang = 'en';
    $lang = 'en';
    $all_translations = [];
}
