/**
 * Login Page JavaScript
 * Handles password toggle, language change, and form submission
 */

// Translation object for JavaScript messages
const loginTranslations = {
    en: {
        loading: 'Loading...',
        please_wait: 'Please wait...'
    },
    tr: {
        loading: 'Yükleniyor...',
        please_wait: 'Lütfen bekleyin...'
    }
};

// Get current language
function getCurrentLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const langFromURL = urlParams.get('lang');
    if (langFromURL) {
        return langFromURL;
    }
    // Get from global variable (set by PHP)
    if (typeof currentLang !== 'undefined') {
        return currentLang;
    }
    // Get from page attribute
    const htmlLang = document.documentElement.getAttribute('lang');
    return htmlLang || 'en';
}

// Get translation function
function t(key) {
    const lang = getCurrentLanguage();
    return loginTranslations[lang]?.[key] || loginTranslations.en[key] || key;
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.password-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Language change handler
document.addEventListener('DOMContentLoaded', function() {
    const languageSelect = document.getElementById('language');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            const selectedLang = this.value;
            // Update form action to preserve language
            const form = document.querySelector('form');
            if (form) {
                form.action = 'login.php?lang=' + encodeURIComponent(selectedLang);
            }
            // Reload page with new language immediately
            // Add timestamp to prevent browser caching issues
            const timestamp = new Date().getTime();
            window.location.href = 'login.php?lang=' + encodeURIComponent(selectedLang) + '&t=' + timestamp;
        });
    }

    // Form submission handling
    const form = document.querySelector('form');
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (form && submitBtn) {
        form.addEventListener('submit', function(e) {
            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + t('loading');
            submitBtn.disabled = true;
            // Language is already in form (select name="language"), so it will be submitted automatically
        });
    }
});

