/**
 * Common JavaScript Functions
 * Shared functionality for all pages
 */

(function() {
    'use strict';
    
    // ============================================
    // PAGE CONFIG INITIALIZATION
    // ============================================
    
    // Load page configuration and set as global
    const configElement = document.getElementById('page-config');
    if (configElement) {
        try {
            window.pageConfig = JSON.parse(configElement.textContent);
        } catch (e) {
            console.error('Failed to parse page config:', e);
            window.pageConfig = {};
        }
    } else {
        window.pageConfig = {};
    }
    
    // ============================================
    // UNIVERSAL TRANSLATION HELPER
    // ============================================
    /**
     * Universal translation function that works on all platforms
     * Supports multiple fallback mechanisms for maximum compatibility
     * @param {string} section - Translation section (e.g., 'common', 'login')
     * @param {string} key - Translation key
     * @param {string} defaultValue - Default value if translation not found
     * @returns {string} Translated string or default value
     */
    window.getTranslation = function(section, key, defaultValue) {
        // Ensure we have a default value
        if (typeof defaultValue === 'undefined' || defaultValue === null) {
            defaultValue = key;
        }
        
        try {
            // Try multiple sources in order of preference
            const sources = [];
            
            // 1. window.pageConfig.translations (most common, loaded via page-config script tag)
            if (window.pageConfig && window.pageConfig.translations) {
                sources.push(window.pageConfig.translations);
            }
            
            // 2. window.Translations (legacy support, some pages set this directly)
            if (typeof window.Translations !== 'undefined' && window.Translations) {
                sources.push(window.Translations);
            }
            
            // 3. window[section] (legacy support for direct section objects like window.tCommon)
            const sectionVar = 't' + section.charAt(0).toUpperCase() + section.slice(1);
            if (typeof window[sectionVar] !== 'undefined' && window[sectionVar]) {
                const legacyObj = {};
                legacyObj[section] = window[sectionVar];
                sources.push(legacyObj);
            }
            
            // Try each source
            for (let i = 0; i < sources.length; i++) {
                const source = sources[i];
                if (source && typeof source === 'object') {
                    const sectionData = source[section];
                    if (sectionData && typeof sectionData === 'object') {
                        const value = sectionData[key];
                        if (value !== undefined && value !== null && value !== '') {
                            return String(value);
                        }
                    }
                }
            }
            
            // Fallback to default
            return String(defaultValue);
        } catch (error) {
            // If anything fails, return default value
            return String(defaultValue);
        }
    };
    
    /**
     * Get translation section object (for compatibility with existing code)
     * Works on all browsers including old ones (no Proxy dependency)
     * @param {string} section - Translation section
     * @returns {object} Translation section object
     */
    window.getTranslationSection = function(section) {
        const sectionObj = {};
        
        // Return object with get method (no Proxy needed for compatibility)
        sectionObj.getTranslation = function(key, defaultValue) {
            return window.getTranslation(section, key, defaultValue);
        };
        
        // For direct property access, return translation helper function
        // This creates properties on-demand when accessed
        return sectionObj;
    };
    
    // ============================================
    // MODAL FUNCTIONS
    // ============================================
    
    /**
     * Open modal
     */
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus first input
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    };
    
    /**
     * Close modal
     */
    window.closeModal = function(modalId) {
        const modal = modalId ? document.getElementById(modalId) : document.querySelector('.modal.active');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Clear form if exists
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }
    };
    
    /**
     * Close modal on overlay click
     */
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    /**
     * Close modal on ESC key
     */
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                closeModal();
            }
        }
    });
    
    // ============================================
    // CONFIRM DIALOG FUNCTIONS
    // ============================================
    
    /**
     * Show confirm dialog
     * This function is defined in toast.js
     * We just ensure it's available globally
     */
    // Function is already defined in toast.js which loads before this file
    
    // ============================================
    // DELETE FUNCTION HELPER
    // ============================================
    
    /**
     * Standard delete function for all pages
     */
    window.deleteItem = function(options) {
        const {
            id,
            apiUrl,
            action,
            message,
            onSuccess,
            onError
        } = options;
        
        const getT = typeof window.getTranslation === 'function' ? window.getTranslation : function(s, k, d) {
            const t = window.Translations || {};
            return (t[s] && t[s][k]) || d || k;
        };
        const confirmMessage = message || getT('common', 'delete_confirm', 'Are you sure you want to delete this item?');
        
        showConfirmDialog(confirmMessage, async function() {
            try {
                const url = `${apiUrl}?action=${action}&id=${id}`;
                const response = await fetch(url, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                
                const result = await response.json();
                
                if (result.success) {
                    if (onSuccess) {
                        onSuccess(result);
                    } else {
                        showToast('success', getT('common', 'item_deleted_successfully', 'Item deleted successfully'));
                        // Reload page data if loadData function exists
                        if (typeof window.loadData === 'function') {
                            window.loadData();
                        }
                    }
                } else {
                    const errorMsg = result.message || getT('common', 'delete_failed', 'Failed to delete item');
                    showToast('error', errorMsg);
                    if (onError) onError(result);
                }
            } catch (error) {
                console.error('Error deleting item:', error);
                showToast('error', getT('common', 'delete_failed', 'Failed to delete item'));
                if (onError) onError(error);
            }
        });
    };
    
    // ============================================
    // SEARCH FUNCTION HELPER - REMOVED
    // ============================================
    
    // ============================================
    // CSRF TOKEN MANAGEMENT
    // ============================================
    
    /**
     * Get CSRF token from page config or meta tag
     */
    function getCsrfToken() {
        // Try from page config first
        const pageConfig = window.pageConfig || {};
        if (pageConfig.csrfToken) {
            return pageConfig.csrfToken;
        }
        
        // Try from meta tag
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            return metaTag.getAttribute('content');
        }
        
        return null;
    }
    
    /**
     * Enhanced fetch with automatic CSRF token injection
     * This wrapper automatically adds CSRF token to POST, PUT, DELETE requests
     */
    window.apiFetch = async function(url, options = {}) {
        const method = (options.method || 'GET').toUpperCase();
        
        // Only add token for state-changing methods
        if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
            const token = getCsrfToken();
            
            if (!token) {
                console.warn('CSRF token not found. Request may fail validation.');
            }
            
            // Set headers if not provided
            if (!options.headers) {
                options.headers = {};
            }
            
            // Ensure Content-Type is set for JSON requests
            if (!options.headers['Content-Type'] && !options.headers['content-type']) {
                options.headers['Content-Type'] = 'application/json';
            }
            
            // Parse existing body if it's a string (JSON)
            let bodyData = {};
            if (options.body) {
                if (typeof options.body === 'string') {
                    try {
                        bodyData = JSON.parse(options.body);
                    } catch (e) {
                        // If not JSON, use as-is
                        bodyData = options.body;
                    }
                } else if (options.body instanceof FormData) {
                    // For FormData, append token
                    options.body.append('csrf_token', token);
                    return fetch(url, options);
                } else {
                    bodyData = options.body;
                }
            }
            
            // Add CSRF token to JSON body
            if (token && typeof bodyData === 'object' && !(bodyData instanceof FormData)) {
                bodyData.csrf_token = token;
                options.body = JSON.stringify(bodyData);
            }
        }
        
        return fetch(url, options);
    };
    
    // ============================================
    // FORM SUBMISSION HELPER
    // ============================================
    
    /**
     * Submit form via AJAX (with CSRF token)
     */
    window.submitForm = async function(options) {
        const {
            form,
            apiUrl,
            method = 'POST',
            action,
            onSuccess,
            onError,
            transformData
        } = options;
        
        try {
            const formData = new FormData(form);
            let data = Object.fromEntries(formData);
            
            // Transform data if function provided
            if (transformData) {
                data = transformData(data);
            }
            
            // Add action
            data.action = action;
            
            const url = `${apiUrl}?action=${action}`;
            const response = await window.apiFetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (onSuccess) {
                    onSuccess(result);
                }
            } else {
                const getT = typeof window.getTranslation === 'function' ? window.getTranslation : function(s, k, d) {
                    const t = window.Translations || {};
                    return (t[s] && t[s][k]) || d || k;
                };
                const errorMsg = result.message || getT('common', 'an_error_occurred', 'An error occurred');
                showToast('error', errorMsg);
                if (onError) onError(result);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            const getT = typeof window.getTranslation === 'function' ? window.getTranslation : function(s, k, d) {
                const t = window.Translations || {};
                return (t[s] && t[s][k]) || d || k;
            };
            showToast('error', getT('common', 'an_error_occurred', 'An error occurred'));
            if (onError) onError(error);
        }
    };
    
    // ============================================
    // TABLE RENDERING HELPER
    // ============================================
    
    /**
     * Render table rows safely (XSS protection)
     */
    window.renderTableRow = function(rowData, columns, actions) {
        const row = document.createElement('tr');
        
        columns.forEach(col => {
            const cell = document.createElement('td');
            const value = col.render ? col.render(rowData) : (rowData[col.key] || '-');
            
            if (typeof value === 'string') {
                cell.textContent = value;
            } else {
                cell.appendChild(value);
            }
            
            row.appendChild(cell);
        });
        
        // Add actions column
        if (actions) {
            const actionsCell = document.createElement('td');
            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = action.class || 'btn-icon';
                btn.innerHTML = `<span class="material-symbols-rounded">${action.icon}</span>`;
                btn.title = action.title || '';
                btn.onclick = () => action.onClick(rowData);
                actionsCell.appendChild(btn);
            });
            row.appendChild(actionsCell);
        }
        
        return row;
    };
    
})();

