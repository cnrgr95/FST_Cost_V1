// Languages Page JavaScript
(function() {
    'use strict';
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/languages.php';
    
    // Get translations
    const t = window.Translations || {};
    const tCommon = t.common || {};
    
    let currentData = {
        languages: [],
        currentLang: null,
        translations: {}
    };
    
    let currentTranslationEditor = null;
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        // Setup modal close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', closeAddModal);
        });
        
        // Setup form submissions
        document.getElementById('addLanguageForm').addEventListener('submit', handleAddLanguage);
        
        // Close modal when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                closeAddModal();
            }
        });
        
        // Load data
        loadData();
    });
    
    // Load data
    async function loadData() {
        await fetchLanguages();
    }
    
    // Fetch languages
    async function fetchLanguages() {
        try {
            const response = await fetch(`${API_BASE}?action=languages`);
            const result = await response.json();
            
            if (result.success) {
                currentData.languages = result.data || [];
                renderLanguagesList();
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error fetching languages:', error);
            showToast('error', 'Failed to load languages');
        }
    }
    
    // Render languages list
    function renderLanguagesList() {
        const container = document.getElementById('languages-list');
        let html = '';
        
        currentData.languages.forEach(lang => {
            const isActive = currentData.currentLang && currentData.currentLang.code === lang.code;
            html += `
                <div class="lang-item ${isActive ? 'active' : ''}" data-code="${lang.code}" onclick="selectLanguage('${lang.code}')">
                    <div><strong>${lang.code.toUpperCase()}</strong> - ${lang.name}</div>
                </div>
            `;
        });
        
        container.innerHTML = html || '<p style="color: #9ca3af;">No languages found</p>';
    }
    
    // Select language
    window.selectLanguage = async function(code) {
        currentData.currentLang = currentData.languages.find(l => l.code === code);
        await loadTranslation(code);
    };
    
    // Load translation
    async function loadTranslation(code) {
        try {
            const response = await fetch(`${API_BASE}?action=translation&code=${code}`);
            const result = await response.json();
            
            if (result.success) {
                currentData.translations = result.data;
                renderTranslationsEditor();
                renderLanguagesList();
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error loading translation:', error);
            showToast('error', 'Failed to load translations');
        }
    }
    
    // Render translations editor
    function renderTranslationsEditor() {
        const container = document.getElementById('editor-content');
        const lang = currentData.currentLang;
        const data = currentData.translations;
        
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Edit Translations - ${lang.name} (${lang.code.toUpperCase()})</h2>
                <button class="btn-primary" onclick="saveTranslations()" style="padding: 10px 20px;">
                    <span class="material-symbols-rounded">save</span>
                    Save Translations
                </button>
            </div>
        `;
        
        // Render each section
        for (const section in data) {
            if (section === 'languages' || section === 'version' || section === 'app') continue;
            
            html += `<div class="translation-section">`;
            html += `<h3>${section.charAt(0).toUpperCase() + section.slice(1)}</h3>`;
            
            if (typeof data[section] === 'object' && data[section] !== null) {
                for (const key in data[section]) {
                    const value = data[section][key];
                    const fieldId = `${section}.${key}`;
                    
                    html += `<div class="translation-item">`;
                    html += `<label for="${fieldId}">${key}</label>`;
                    
                    if (typeof value === 'string' && value.length > 100) {
                        html += `<textarea id="${fieldId}" data-section="${section}" data-key="${key}">${escapeHtml(value)}</textarea>`;
                    } else {
                        html += `<input type="text" id="${fieldId}" data-section="${section}" data-key="${key}" value="${escapeHtml(value)}">`;
                    }
                    html += `</div>`;
                }
            }
            
            html += `</div>`;
        }
        
        container.innerHTML = html;
    }
    
    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Save translations
    window.saveTranslations = async function() {
        const lang = currentData.currentLang;
        const editedData = { ...currentData.translations };
        
        // Get all input and textarea values
        document.querySelectorAll('#editor-content input, #editor-content textarea').forEach(input => {
            const section = input.dataset.section;
            const key = input.dataset.key;
            
            if (section && key) {
                if (!editedData[section]) {
                    editedData[section] = {};
                }
                editedData[section][key] = input.value;
            }
        });
        
        try {
            const response = await fetch(`${API_BASE}?action=translation&code=${lang.code}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editedData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                currentData.translations = editedData;
                showToast('success', result.message || 'Translations saved successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error saving translations:', error);
            showToast('error', 'Failed to save translations');
        }
    };
    
    // Open add modal
    window.openAddModal = function() {
        document.getElementById('addLanguageModal').classList.add('active');
    };
    
    // Close add modal
    window.closeAddModal = function() {
        document.getElementById('addLanguageModal').classList.remove('active');
        document.getElementById('addLanguageForm').reset();
    };
    
    // Handle add language
    async function handleAddLanguage(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = {
            code: formData.get('code').toLowerCase(),
            name: formData.get('name')
        };
        
        try {
            const response = await fetch(`${API_BASE}?action=language`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                closeAddModal();
                await fetchLanguages();
                await selectLanguage(data.code);
                showToast('success', result.message || 'Language created successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating language:', error);
            showToast('error', 'Failed to create language');
        }
    }
})();
