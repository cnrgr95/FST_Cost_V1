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
        // Setup cancel buttons explicitly
        const cancelAddBtn = document.getElementById('cancelAddLanguageBtn');
        if (cancelAddBtn) {
            cancelAddBtn.addEventListener('click', function(e) {
                e.preventDefault();
                closeAddModal();
            });
        }
        
        const cancelEditBtn = document.getElementById('cancelEditLanguageBtn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', function(e) {
                e.preventDefault();
                closeEditModal();
            });
        }
        
        // Setup form submissions
        document.getElementById('addLanguageForm').addEventListener('submit', handleAddLanguage);
        document.getElementById('editLanguageForm').addEventListener('submit', handleEditLanguage);
        
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
    
    // Render languages list with drag and drop
    function renderLanguagesList(dataToRender = null) {
        const container = document.getElementById('languages-list');
        const countBadge = document.getElementById('languagesCountBadge');
        const data = dataToRender !== null ? dataToRender : currentData.languages;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px;">
                    <span class="material-symbols-rounded">language</span>
                    <h3>${tLangMgmt.no_languages || 'No languages found'}</h3>
                    <p>${tLangMgmt.add_language || 'Add your first language'}</p>
                </div>
            `;
            if (countBadge) countBadge.textContent = '0';
            window.languagesListData = [];
            return;
        }
        
        const totalCount = data.length;
        const escapedHtml = window.escapeHtml || function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        let html = '';
        data.forEach((lang, index) => {
            const isActive = currentData.currentLang && currentData.currentLang.code === lang.code;
            const isBase = lang.code === 'en';
            const escapedName = escapedHtml(lang.name);
            html += `
                <div class="lang-item ${isActive ? 'active' : ''}" 
                     data-code="${lang.code}" 
                     draggable="true" 
                     data-index="${index}"
                     data-name="${(lang.name || '').toLowerCase()}"
                     data-code-search="${(lang.code || '').toLowerCase()}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                            <span class="drag-handle material-symbols-rounded" style="cursor: move; color: #6b7280; font-size: 20px;">drag_handle</span>
                        <div onclick="selectLanguage('${lang.code}')" style="flex: 1; cursor: pointer;">
                            <strong>${lang.code.toUpperCase()}</strong> - ${escapedName}
                            </div>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            ${!isBase ? `
                            <button onclick="editLanguageName('${lang.code}', '${lang.name.replace(/'/g, "\\'")}')" title="${tCommon.edit || 'Edit'} ${escapedName}" style="padding: 4px 8px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <span class="material-symbols-rounded" style="font-size: 16px;">edit</span>
                            </button>
                            <button onclick="deleteLanguage('${lang.code}')" title="${tCommon.delete || 'Delete'} ${escapedName}" style="padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <span class="material-symbols-rounded" style="font-size: 16px;">delete</span>
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html || `<p style="color: #9ca3af;">${tLangMgmt.no_languages || 'No languages found'}</p>`;
        if (countBadge) countBadge.textContent = totalCount;
        window.languagesListData = data;
        
        // Setup drag and drop
        setupDragAndDrop();
    }
    
    // Setup drag and drop for language ordering
    function setupDragAndDrop() {
        const container = document.getElementById('languages-list');
        const items = container.querySelectorAll('.lang-item');
        
        items.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
        });
    }
    
    let draggedElement = null;
    
    function handleDragStart(e) {
        draggedElement = this;
        this.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }
    
    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        
        if (draggedElement !== this) {
            const allItems = Array.from(this.parentElement.children);
            const draggedIndex = Array.from(draggedElement.parentElement.children).indexOf(draggedElement);
            const targetIndex = allItems.indexOf(this);
            
            if (draggedIndex < targetIndex) {
                this.parentElement.insertBefore(draggedElement, this.nextSibling);
            } else {
                this.parentElement.insertBefore(draggedElement, this);
            }
        }
        return false;
    }
    
    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        return false;
    }
    
    function handleDragEnd(e) {
        this.style.opacity = '1';
        
        // Save new order
        const container = document.getElementById('languages-list');
        const items = Array.from(container.querySelectorAll('.lang-item'));
        const newOrder = items.map(item => item.getAttribute('data-code'));
        
        saveLanguageOrder(newOrder);
    }
    
    // Save language order
    async function saveLanguageOrder(order) {
        try {
            const response = await fetch(`${API_BASE}?action=language_order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ order: order })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update local data order
                const orderedLanguages = [];
                order.forEach(code => {
                    const lang = currentData.languages.find(l => l.code === code);
                    if (lang) {
                        orderedLanguages.push(lang);
                    }
                });
                // Add any languages not in order
                currentData.languages.forEach(lang => {
                    if (!order.includes(lang.code)) {
                        orderedLanguages.push(lang);
                    }
                });
                currentData.languages = orderedLanguages;
                
                showToast('success', tLangMgmt.order_saved || 'Language order saved successfully');
            } else {
                showToast('error', result.message || 'Failed to save language order');
            }
        } catch (error) {
            console.error('Error saving language order:', error);
            showToast('error', tLangMgmt.failed_to_save_order || 'Failed to save language order');
        }
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
                <div style="display: flex; gap: 10px;">
                    ${lang.code !== 'en' ? `
                    <button class="btn-secondary" onclick="autoTranslateAll('${lang.code}')" style="padding: 10px 20px;" id="autoTranslateBtn">
                        <span class="material-symbols-rounded">translate</span>
                        ${tLangMgmt.auto_translate_all || 'Auto Translate All'}
                    </button>
                    ` : ''}
                <button class="btn-primary" onclick="saveTranslations()" style="padding: 10px 20px;">
                    <span class="material-symbols-rounded">save</span>
                    ${tLangMgmt.save_translations || 'Save Translations'}
                </button>
                </div>
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
                    html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">`;
                    html += `<label for="${fieldId}">${key}</label>`;
                    if (lang.code !== 'en') {
                        html += `<button type="button" onclick="translateField('${fieldId}', 'en', '${lang.code}')" class="btn-translate-field" title="${tLangMgmt.translate_field || 'Translate this field'}">`;
                        html += `<span class="material-symbols-rounded" style="font-size: 16px;">translate</span>`;
                        html += `</button>`;
                    }
                    html += `</div>`;
                    
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
    
    // Translate a single field
    window.translateField = async function(fieldId, sourceLang, targetLang) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        // Get English source value
        const enTranslations = await getEnglishTranslations();
        if (!enTranslations) {
            showToast('error', tLangMgmt.failed_to_load_base || 'Failed to load base translations');
            return;
        }
        
        const section = field.dataset.section;
        const key = field.dataset.key;
        
        if (!enTranslations[section] || !enTranslations[section][key]) {
            showToast('warning', tLangMgmt.source_not_found || 'Source translation not found');
            return;
        }
        
        const sourceText = enTranslations[section][key];
        if (!sourceText || sourceText.trim() === '') {
            showToast('warning', tLangMgmt.empty_source || 'Source text is empty');
            return;
        }
        
        // Disable field and show loading
        field.disabled = true;
        const originalValue = field.value;
        field.value = tLangMgmt.translating || 'Translating...';
        
        try {
            const response = await fetch(`${API_BASE}?action=translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: sourceText,
                    source: sourceLang,
                    target: targetLang
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.translatedText) {
                field.value = result.translatedText;
                showToast('success', tLangMgmt.field_translated || 'Field translated successfully');
            } else {
                field.value = originalValue;
                showToast('error', result.message || tLangMgmt.translation_failed || 'Translation failed');
            }
        } catch (error) {
            console.error('Error translating field:', error);
            field.value = originalValue;
            showToast('error', tLangMgmt.translation_failed || 'Translation failed');
        } finally {
            field.disabled = false;
        }
    };
    
    // Get English translations for source
    async function getEnglishTranslations() {
        try {
            const response = await fetch(`${API_BASE}?action=translation&code=en`);
            const result = await response.json();
            
            if (result.success) {
                return result.data;
            }
        } catch (error) {
            console.error('Error loading English translations:', error);
        }
        return null;
    }
    
    // Auto translate all fields
    window.autoTranslateAll = async function(targetLang) {
        if (!currentData.currentLang || currentData.currentLang.code === 'en') {
            showToast('warning', tLangMgmt.cannot_translate_base || 'Cannot translate base language');
            return;
        }
        
        const btn = document.getElementById('autoTranslateBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="material-symbols-rounded" style="animation: spin 1s linear infinite;">sync</span> ${tLangMgmt.translating || 'Translating...'}`;
        }
        
        // Get English translations
        const enTranslations = await getEnglishTranslations();
        if (!enTranslations) {
            showToast('error', tLangMgmt.failed_to_load_base || 'Failed to load base translations');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<span class="material-symbols-rounded">translate</span> ${tLangMgmt.auto_translate_all || 'Auto Translate All'}`;
            }
            return;
        }
        
        const fields = document.querySelectorAll('#editor-content input, #editor-content textarea');
        let translated = 0;
        let failed = 0;
        const total = fields.length;
        
        // Translate fields one by one with delay to avoid rate limiting
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const section = field.dataset.section;
            const key = field.dataset.key;
            
            if (!section || !key) continue;
            if (!enTranslations[section] || !enTranslations[section][key]) continue;
            
            const sourceText = enTranslations[section][key];
            if (!sourceText || sourceText.trim() === '') continue;
            
            // Skip if already has translation
            if (field.value && field.value.trim() !== '') {
                // Check if it's different from source (might already be translated)
                if (field.value.trim() !== sourceText.trim()) {
                    translated++;
                    continue;
                }
            }
            
            try {
                const response = await fetch(`${API_BASE}?action=translate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: sourceText,
                        source: 'en',
                        target: targetLang
                    })
                });
                
                const result = await response.json();
                
                if (result.success && result.translatedText) {
                    field.value = result.translatedText;
                    translated++;
                } else {
                    failed++;
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.error('Error translating field:', error);
                failed++;
            }
            
            // Update button text with progress
            if (btn) {
                btn.innerHTML = `<span class="material-symbols-rounded" style="animation: spin 1s linear infinite;">sync</span> ${tLangMgmt.translating || 'Translating'}... (${translated + failed}/${total})`;
            }
        }
        
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span class="material-symbols-rounded">translate</span> ${tLangMgmt.auto_translate_all || 'Auto Translate All'}`;
        }
        
        const message = (tLangMgmt.translation_complete || 'Translation complete: {translated} translated, {failed} failed')
            .replace('{translated}', translated)
            .replace('{failed}', failed);
        showToast('success', message);
    };
    
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
        const modal = document.getElementById('addLanguageModal');
        if (modal) {
            modal.classList.add('active');
            document.body.classList.add('modal-open');
        }
    };
    
    // Close add modal
    window.closeAddModal = function() {
        const modal = document.getElementById('addLanguageModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        }
        const form = document.getElementById('addLanguageForm');
        if (form) {
            form.reset();
        }
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
        if (form && form.querySelector('input[name="name"]')) {
            form.querySelector('input[name="name"]').value = currentData.editingName;
        }
        if (modal) {
            modal.classList.add('active');
            document.body.classList.add('modal-open');
        }
    };
    
    // Close edit modal
    window.closeEditModal = function() {
        const modal = document.getElementById('editLanguageModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        }
        delete currentData.editingCode;
        delete currentData.editingName;
        const form = document.getElementById('editLanguageForm');
        if (form) {
            form.reset();
        }
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
                const response = await window.apiFetch(`${API_BASE}?action=language&code=${code}`, {
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
    
    // ============================================
    // LANGUAGE LIST SEARCH FUNCTION
    // ============================================
    
    // Filter Languages list
    window.filterLanguagesList = function(searchTerm) {
        const container = document.getElementById('languages-list');
        const clearBtn = document.getElementById('languagesSearchClear');
        
        if (!container) return;
        
        const term = searchTerm.toLowerCase().trim();
        const items = container.querySelectorAll('.lang-item');
        let visibleCount = 0;
        
        items.forEach(item => {
            const name = item.getAttribute('data-name') || '';
            const code = item.getAttribute('data-code-search') || '';
            
            const matches = term === '' || name.includes(term) || code.includes(term);
            
            item.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        });
        
        // Show/hide clear button
        if (clearBtn) {
            clearBtn.style.display = term ? 'flex' : 'none';
        }
        
        // Update count badge
        const countBadge = document.getElementById('languagesCountBadge');
        if (countBadge) {
            countBadge.textContent = visibleCount;
        }
    };
    
    // Clear Languages search
    window.clearLanguagesSearch = function() {
        const input = document.getElementById('languagesSearchInput');
        const clearBtn = document.getElementById('languagesSearchClear');
        
        if (input) {
            input.value = '';
            filterLanguagesList('');
        }
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
    };
    
})();
