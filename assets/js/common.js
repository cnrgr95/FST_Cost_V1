/**
 * Common JavaScript Functions
 * Shared functionality for all pages
 */

(function() {
    'use strict';
    
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
        
        const tCommon = window.Translations?.common || {};
        const confirmMessage = message || tCommon.delete_confirm || 'Are you sure you want to delete this item?';
        
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
                        showToast('success', tCommon.item_deleted_successfully || 'Item deleted successfully');
                        // Reload page data if loadData function exists
                        if (typeof window.loadData === 'function') {
                            window.loadData();
                        }
                    }
                } else {
                    const errorMsg = result.message || tCommon.delete_failed || 'Failed to delete item';
                    showToast('error', errorMsg);
                    if (onError) onError(result);
                }
            } catch (error) {
                console.error('Error deleting item:', error);
                showToast('error', tCommon.delete_failed || 'Failed to delete item');
                if (onError) onError(error);
            }
        });
    };
    
    // ============================================
    // SEARCH FUNCTION HELPER - REMOVED
    // ============================================
    
    // ============================================
    // FORM SUBMISSION HELPER
    // ============================================
    
    /**
     * Submit form via AJAX
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
            const response = await fetch(url, {
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
                const tCommon = window.Translations?.common || {};
                const errorMsg = result.message || tCommon.an_error_occurred || 'An error occurred';
                showToast('error', errorMsg);
                if (onError) onError(result);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            const tCommon = window.Translations?.common || {};
            showToast('error', tCommon.an_error_occurred || 'An error occurred');
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

