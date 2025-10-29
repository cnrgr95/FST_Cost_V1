// Languages Page JavaScript
(function() {
    'use strict';
    
    // Load page configuration
    let pageConfig = {};
    const configElement = document.getElementById('page-config');
    if (configElement) {
        try {
            pageConfig = JSON.parse(configElement.textContent);
            if (pageConfig.apiBase) {
                window.API_BASE = pageConfig.apiBase;
            }
            if (pageConfig.translations) {
                window.Translations = pageConfig.translations;
            }
        } catch (e) {
            console.error('Failed to parse page config:', e);
        }
    }
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/languages.php';
    
    // Get translations
    const t = window.Translations || {};
    const tCommon = t.common || {};
    const tLangMgmt = t.language_mgmt || {};
    
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
            btn.addEventListener('click', function() {
                closeAddModal();
                closeEditModal();
            });
        });
        
        // Setup form submissions
        document.getElementById('addLanguageForm').addEventListener('submit', handleAddLanguage);
        document.getElementById('editLanguageForm').addEventListener('submit', handleEditLanguage);
        
        // Close modal when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                closeAddModal();
                closeEditModal();
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
            showToast('error', tLangMgmt.failed_to_load || 'Failed to load languages');
        }
    }
    
    // Render languages list
    function renderLanguagesList() {
        const container = document.getElementById('languages-list');
        let html = '';
        
        currentData.languages.forEach(lang => {
            const isActive = currentData.currentLang && currentData.currentLang.code === lang.code;
            const isBase = lang.code === 'en';
            html += `
                <div class="lang-item ${isActive ? 'active' : ''}" data-code="${lang.code}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div onclick="selectLanguage('${lang.code}')" style="flex: 1; cursor: pointer;">
                            <strong>${lang.code.toUpperCase()}</strong> - ${lang.name}
                        </div>
                        <div style="display: flex; gap: 5px;">
                            ${!isBase ? `
                            <button onclick="editLanguageName('${lang.code}', '${lang.name.replace(/'/g, "\\'")}')" style="padding: 4px 8px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <span class="material-symbols-rounded" style="font-size: 16px;">edit</span>
                            </button>
                            <button onclick="deleteLanguage('${lang.code}')" style="padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <span class="material-symbols-rounded" style="font-size: 16px;">delete</span>
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html || `<p style="color: #9ca3af;">${tLangMgmt.no_languages || 'No languages found'}</p>`;
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
            showToast('error', tLangMgmt.failed_to_load || 'Failed to load translations');
        }
    }
    
    // Render translations editor
    function renderTranslationsEditor() {
        const container = document.getElementById('editor-content');
        const lang = currentData.currentLang;
        const data = currentData.translations;
        
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>${tLangMgmt.edit_translations || 'Edit Translations'} - ${lang.name} (${lang.code.toUpperCase()})</h2>
                <button class="btn-primary" onclick="saveTranslations()" style="padding: 10px 20px;">
                    <span class="material-symbols-rounded">save</span>
                    ${tLangMgmt.save_translations || 'Save Translations'}
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
                showToast('success', result.message || tLangMgmt.translations_saved || 'Translations saved successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error saving translations:', error);
            showToast('error', tLangMgmt.failed_to_save_translations || 'Failed to save translations');
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
                showToast('success', result.message || tLangMgmt.language_created || 'Language created successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating language:', error);
            showToast('error', tLangMgmt.failed_to_create || 'Failed to create language');
        }
    }
    
    // Edit language name
    window.editLanguageName = function(code, currentName) {
        currentData.editingCode = code;
        currentData.editingName = currentName;
        openEditModal();
    };
    
    // Open edit modal
    window.openEditModal = function() {
        const modal = document.getElementById('editLanguageModal');
        const form = document.getElementById('editLanguageForm');
        form.querySelector('input[name="name"]').value = currentData.editingName;
        modal.classList.add('active');
    };
    
    // Close edit modal
    window.closeEditModal = function() {
        document.getElementById('editLanguageModal').classList.remove('active');
        delete currentData.editingCode;
        delete currentData.editingName;
    };
    
    // Handle edit language form submission
    async function handleEditLanguage(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const name = formData.get('name');
        
        if (name && name.trim() !== '' && name !== currentData.editingName) {
            await updateLanguageName(currentData.editingCode, name.trim());
            closeEditModal();
        }
    }
    
    // Update language name
    async function updateLanguageName(code, name) {
        try {
            const response = await fetch(`${API_BASE}?action=language`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, name })
            });
            const result = await response.json();
            
            if (result.success) {
                await fetchLanguages();
                // Reload current language if it was the one being edited
                if (currentData.currentLang && currentData.currentLang.code === code) {
                    await selectLanguage(code);
                }
                showToast('success', result.message || tLangMgmt.language_updated || 'Language name updated successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error updating language name:', error);
            showToast('error', tLangMgmt.failed_to_update || 'Failed to update language name');
        }
    }
    
    // Delete language
    window.deleteLanguage = function(code) {
        const lang = currentData.languages.find(l => l.code === code);
        const confirmMessage = `${tLangMgmt.delete_confirm || 'Are you sure you want to delete this language? This action cannot be undone.'}`;
        
        showConfirmDialog(confirmMessage, async function() {
            try {
                const response = await fetch(`${API_BASE}?action=language&code=${code}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                if (result.success) {
                    // Clear current language if it was deleted
                    if (currentData.currentLang && currentData.currentLang.code === code) {
                        currentData.currentLang = null;
                        currentData.translations = {};
                        document.getElementById('editor-content').innerHTML = `
                            <div style="text-align: center; padding: 40px; color: #9ca3af;">
                                <span class="material-symbols-rounded" style="font-size: 48px;">language</span>
                                <p>${tLangMgmt.select_language_prompt || 'Select a language to edit translations'}</p>
                            </div>
                        `;
                    }
                    await fetchLanguages();
                    showToast('success', result.message || tLangMgmt.language_deleted || 'Language deleted successfully');
                } else {
                    showToast('error', result.message);
                }
            } catch (error) {
                console.error('Error deleting language:', error);
                showToast('error', tLangMgmt.failed_to_delete || 'Failed to delete language');
            }
        });
    };
})();
