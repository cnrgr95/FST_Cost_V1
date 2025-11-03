/**
 * Form Handler - Unified Form Submission System
 * Automates form submission, CSRF handling, loading states, and error management
 * 
 * Usage:
 *   FormHandler.submit('userForm', {
 *     apiUrl: 'api/definitions/users.php',
 *     action: 'user',
 *     method: 'POST',
 *     onSuccess: () => { showToast('success', 'Success!'); }
 *   });
 */

(function() {
    'use strict';
    
    class FormHandler {
        constructor() {
            this.submittingForms = new Set(); // Track forms being submitted
        }
        
        /**
         * Submit a form
         * @param {HTMLElement|string} form - Form element or form ID
         * @param {Object} options - Submission options
         */
        async submit(form, options = {}) {
            const formElement = typeof form === 'string' 
                ? document.getElementById(form) 
                : form;
            
            if (!formElement) {
                console.error('FormHandler: Form not found');
                return;
            }
            
            const {
                apiUrl,
                action,
                method = 'POST',
                modalId = null,
                refreshData = null,
                transformData = null,
                validate = true,
                loadingButtonId = null,
                onSuccess = null,
                onError = null,
                showSuccessToast = true,
                showErrorToast = true,
                successMessage = null,
                errorMessage = null
            } = options;
            
            // Prevent double submission
            if (this.submittingForms.has(formElement.id || formElement)) {
                console.warn('FormHandler: Form already being submitted');
                return;
            }
            
            // Validate form if enabled
            if (validate && window.FormValidator) {
                const isValid = window.FormValidator.validate(formElement, {
                    scrollToFirstError: true,
                    focusFirstError: true
                });
                
                if (!isValid) {
                    return;
                }
            }
            
            // Show loading state
            const loadingButton = loadingButtonId 
                ? document.getElementById(loadingButtonId) 
                : formElement.querySelector('button[type="submit"]');
            
            const originalButtonText = loadingButton ? loadingButton.innerHTML : null;
            const originalButtonDisabled = loadingButton ? loadingButton.disabled : null;
            
            if (loadingButton) {
                loadingButton.disabled = true;
                if (loadingButton.querySelector('.loading-spinner')) {
                    // Already has loading spinner
                } else {
                    const spinner = document.createElement('span');
                    spinner.className = 'loading-spinner';
                    spinner.innerHTML = '<span class="material-symbols-rounded" style="animation: spin 1s linear infinite;">sync</span>';
                    loadingButton.appendChild(spinner);
                }
            }
            
            this.submittingForms.add(formElement.id || formElement);
            
            try {
                // Get form data
                const formData = new FormData(formElement);
                let data = Object.fromEntries(formData);
                
                // Get ID from form dataset if exists (for updates)
                if (formElement.dataset.id) {
                    data.id = parseInt(formElement.dataset.id);
                }
                
                // Add action
                if (action) {
                    data.action = action;
                }
                
                // Transform data if function provided
                if (transformData && typeof transformData === 'function') {
                    data = transformData(data);
                }
                
                // Build URL
                const url = action 
                    ? `${apiUrl}?action=${action}` 
                    : apiUrl;
                
                // Submit via apiFetch (handles CSRF automatically)
                const response = await window.apiFetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                // Remove loading state
                this.submittingForms.delete(formElement.id || formElement);
                
                if (loadingButton) {
                    loadingButton.disabled = originalButtonDisabled;
                    const spinner = loadingButton.querySelector('.loading-spinner');
                    if (spinner) {
                        spinner.remove();
                    }
                }
                
                // Handle response
                if (result.success) {
                    // Clear form errors
                    if (window.FormValidator) {
                        window.FormValidator.clearErrors(formElement);
                    }
                    
                    // Show success message
                    if (showSuccessToast) {
                        const message = successMessage || result.message || 'Operation completed successfully';
                        window.showToast('success', message);
                    }
                    
                    // Close modal if specified
                    if (modalId && window.ModalManager) {
                        window.ModalManager.close(modalId);
                    }
                    
                    // Reset form if create operation (no ID in dataset)
                    if (!formElement.dataset.id && modalId) {
                        formElement.reset();
                        delete formElement.dataset.id;
                    }
                    
                    // Refresh data if function provided
                    if (refreshData && typeof refreshData === 'function') {
                        await refreshData(result);
                    }
                    
                    // Call success callback
                    if (onSuccess) {
                        onSuccess(result);
                    }
                    
                    return { success: true, result };
                } else {
                    // Handle errors
                    return await this.handleError(result, formElement, {
                        showErrorToast,
                        errorMessage,
                        onError
                    });
                }
            } catch (error) {
                // Remove loading state
                this.submittingForms.delete(formElement.id || formElement);
                
                if (loadingButton) {
                    loadingButton.disabled = originalButtonDisabled;
                    const spinner = loadingButton.querySelector('.loading-spinner');
                    if (spinner) {
                        spinner.remove();
                    }
                }
                
                console.error('FormHandler: Submission error:', error);
                
                const errorMsg = errorMessage || error.message || 'An error occurred while submitting the form';
                
                if (showErrorToast) {
                    window.showToast('error', errorMsg);
                }
                
                if (onError) {
                    onError(error);
                }
                
                return { success: false, error };
            }
        }
        
        /**
         * Handle API errors
         */
        async handleError(result, formElement, options = {}) {
            const {
                showErrorToast = true,
                errorMessage = null,
                onError = null
            } = options;
            
            const errorMsg = result.message || errorMessage || 'An error occurred';
            
            // Show toast if enabled
            if (showErrorToast) {
                window.showToast('error', errorMsg);
            }
            
            // Handle field-specific errors
            if (result.errors && typeof result.errors === 'object' && window.FormValidator) {
                Object.keys(result.errors).forEach(fieldName => {
                    const fieldError = result.errors[fieldName];
                    window.FormValidator.showError(fieldName, fieldError);
                });
            } else if (result.message && window.FormValidator) {
                // Try to map error to field based on message content
                const lowerMessage = result.message.toLowerCase();
                
                if (lowerMessage.includes('username')) {
                    window.FormValidator.showError('username', result.message);
                } else if (lowerMessage.includes('email')) {
                    window.FormValidator.showError('email', result.message);
                } else if (lowerMessage.includes('phone')) {
                    window.FormValidator.showError('phone', result.message);
                } else if (lowerMessage.includes('name')) {
                    window.FormValidator.showError('name', result.message);
                } else if (lowerMessage.includes('password')) {
                    window.FormValidator.showError('password', result.message);
                }
            }
            
            // Call error callback
            if (onError) {
                onError(result);
            }
            
            return { success: false, error: result };
        }
        
        /**
         * Setup form submission handler
         * @param {HTMLElement|string} form - Form element or form ID
         * @param {Object} options - Submission options
         */
        setup(form, options = {}) {
            const formElement = typeof form === 'string' 
                ? document.getElementById(form) 
                : form;
            
            if (!formElement) {
                console.error('FormHandler: Form not found');
                return;
            }
            
            // Remove existing listener if any
            const newForm = formElement.cloneNode(true);
            formElement.parentNode.replaceChild(newForm, formElement);
            
            // Add submit listener
            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submit(newForm, options);
            });
            
            return newForm;
        }
        
        /**
         * Handle delete operation (special case for delete buttons)
         */
        async delete(options = {}) {
            const {
                id,
                apiUrl,
                action,
                message = 'Are you sure you want to delete this item?',
                onSuccess = null,
                onError = null,
                refreshData = null
            } = options;
            
            // Show confirm dialog
            if (typeof window.showConfirmDialog === 'function') {
                window.showConfirmDialog(message, async () => {
                    try {
                        const url = `${apiUrl}?action=${action}&id=${id}`;
                        const response = await window.apiFetch(url, {
                            method: 'DELETE'
                        });
                        
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            window.showToast('success', result.message || 'Item deleted successfully');
                            
                            if (refreshData && typeof refreshData === 'function') {
                                await refreshData(result);
                            }
                            
                            if (onSuccess) {
                                onSuccess(result);
                            }
                        } else {
                            window.showToast('error', result.message || 'Failed to delete item');
                            if (onError) onError(result);
                        }
                    } catch (error) {
                        console.error('FormHandler: Delete error:', error);
                        window.showToast('error', 'Failed to delete item');
                        if (onError) onError(error);
                    }
                });
            } else {
                console.error('FormHandler: showConfirmDialog not available');
            }
        }
    }
    
    // Create singleton instance
    window.FormHandler = new FormHandler();
    
})();

