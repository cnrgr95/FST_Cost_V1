<?php
/**
 * Translation Helper
 * Loads translations from JSON files
 */

function loadTranslations($lang = 'en') {
    // Default to English if language not supported
    if (!in_array($lang, ['en', 'tr'])) {
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

// Get current language
$current_lang = $_GET['lang'] ?? $_SESSION['language'] ?? 'en';
$_SESSION['language'] = $current_lang;
$lang = $current_lang;

// Load all translations
$all_translations = loadTranslations($current_lang);
