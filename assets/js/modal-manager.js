/**
 * Modal Manager - Unified Modal Management System
 * Automates modal opening, closing, form management, and lifecycle events
 * 
 * Usage:
 *   ModalManager.register('userModal', { formId: 'userForm', titleId: 'userModalTitle' });
 *   ModalManager.open('userModal', { titleText: 'Add User', onOpen: () => {...} });
 *   ModalManager.close('userModal');
 */

(function() {
    'use strict';
    
    class ModalManager {
        constructor() {
            this.modals = new Map(); // Store modal configurations
            this.activeModals = new Set(); // Track currently open modals
            this.init();
        }
        
        /**
         * Initialize modal manager
         */
        init() {
            // Setup ESC key handler
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const activeModal = this.getActiveModal();
                    if (activeModal) {
                        this.close(activeModal.id);
                    }
                }
            });
            
            // Auto-register modals on DOMContentLoaded
            document.addEventListener('DOMContentLoaded', () => {
                this.autoRegisterModals();
                this.autoBindCloseButtons();
            });
        }
        
        /**
         * Auto-register all modals in the DOM
         */
        autoRegisterModals() {
            document.querySelectorAll('.modal[id]').forEach(modal => {
                if (!this.modals.has(modal.id)) {
                    const form = modal.querySelector('form[id]');
                    const title = modal.querySelector('h2[id], .modal-header h2');
                    
                    this.register(modal.id, {
                        formId: form ? form.id : null,
                        titleId: title ? title.id : null,
                        titleElement: title || null
                    });
                }
            });
        }
        
        /**
         * Auto-bind close buttons
         */
        autoBindCloseButtons() {
            document.querySelectorAll('.modal .btn-close').forEach(btn => {
                if (!btn.dataset.modalBound) {
                    btn.dataset.modalBound = 'true';
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const modal = btn.closest('.modal');
                        if (modal && modal.id) {
                            this.close(modal.id);
                        }
                    });
                }
            });
            
            // Auto-bind cancel buttons
            document.querySelectorAll('.modal button.btn-secondary[id*="cancel"], .modal button.btn-secondary[id*="Cancel"]').forEach(btn => {
                if (!btn.dataset.modalBound) {
                    btn.dataset.modalBound = 'true';
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const modal = btn.closest('.modal');
                        if (modal && modal.id) {
                            this.close(modal.id);
                        }
                    });
                }
            });
        }
        
        /**
         * Register a modal with configuration
         * @param {string} modalId - Modal element ID
         * @param {Object} config - Configuration object
         */
        register(modalId, config = {}) {
            const modal = document.getElementById(modalId);
            if (!modal) {
                console.warn(`ModalManager: Modal "${modalId}" not found`);
                return;
            }
            
            const defaultConfig = {
                formId: null,
                titleId: null,
                titleElement: null,
                onOpen: null,
                onClose: null,
                autoResetForm: true,
                autoClearErrors: true,
                autoFocus: true,
                preventCloseOnOutsideClick: false // For costs page and similar
            };
            
            this.modals.set(modalId, { ...defaultConfig, ...config, modal });
        }
        
        /**
         * Open a modal
         * @param {string} modalId - Modal element ID
         * @param {Object} options - Options for opening
         */
        open(modalId, options = {}) {
            const config = this.modals.get(modalId);
            if (!config) {
                // Try to auto-register if not found
                const modal = document.getElementById(modalId);
                if (modal) {
                    this.register(modalId);
                    return this.open(modalId, options);
                }
                console.error(`ModalManager: Modal "${modalId}" not registered`);
                return;
            }
            
            const {
                modal,
                formId,
                titleId,
                titleElement,
                autoResetForm,
                autoClearErrors,
                autoFocus,
                onOpen
            } = config;
            
            // Get form if specified
            const form = formId ? document.getElementById(formId) : modal.querySelector('form');
            
            // Reset form if enabled
            if (autoResetForm && form) {
                form.reset();
                delete form.dataset.id;
                // Clear any data attributes
                Array.from(form.elements).forEach(element => {
                    if (element.dataset) {
                        delete element.dataset.error;
                    }
                });
            }
            
            // Clear form errors if enabled
            if (autoClearErrors && form) {
                this.clearFormErrors(form);
            }
            
            // Update title if specified
            if (options.titleText) {
                if (titleId) {
                    const titleEl = document.getElementById(titleId);
                    if (titleEl) titleEl.textContent = options.titleText;
                } else if (titleElement) {
                    titleElement.textContent = options.titleText;
                } else {
                    const titleEl = modal.querySelector('h2, .modal-header h2');
                    if (titleEl) titleEl.textContent = options.titleText;
                }
            }
            
            // Show modal
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            
            this.activeModals.add(modalId);
            
            // Auto-focus first input if enabled
            if (autoFocus) {
                setTimeout(() => {
                    const firstInput = modal.querySelector('input:not([type="hidden"]):not([readonly]), select:not([disabled]), textarea:not([readonly])');
                    if (firstInput) {
                        firstInput.focus();
                    }
                }, 100);
            }
            
            // Call onOpen callback
            if (onOpen) {
                try {
                    onOpen(modal, form, options);
                } catch (error) {
                    console.error('ModalManager: Error in onOpen callback:', error);
                }
            }
            
            // Call custom onOpen from options
            if (options.onOpen) {
                try {
                    options.onOpen(modal, form);
                } catch (error) {
                    console.error('ModalManager: Error in options.onOpen callback:', error);
                }
            }
            
            return modal;
        }
        
        /**
         * Close a modal
         * @param {string} modalId - Modal element ID (optional, closes active if not provided)
         */
        close(modalId = null) {
            let targetModal;
            
            if (modalId) {
                const config = this.modals.get(modalId);
                if (!config) {
                    // Try direct element access
                    targetModal = document.getElementById(modalId);
                    if (!targetModal) {
                        console.warn(`ModalManager: Modal "${modalId}" not found`);
                        return;
                    }
                } else {
                    targetModal = config.modal;
                }
            } else {
                // Close the last active modal
                targetModal = this.getActiveModal();
                if (targetModal) {
                    modalId = targetModal.id;
                }
            }
            
            if (!targetModal || !targetModal.classList.contains('active')) {
                return;
            }
            
            const config = this.modals.get(modalId) || {};
            const {
                formId,
                autoResetForm,
                autoClearErrors,
                onClose
            } = config;
            
            // Get form
            const form = formId ? document.getElementById(formId) : targetModal.querySelector('form');
            
            // Clear form errors if enabled
            if (autoClearErrors && form) {
                this.clearFormErrors(form);
            }
            
            // Reset form if enabled
            if (autoResetForm && form) {
                form.reset();
                delete form.dataset.id;
            }
            
            // Hide modal
            targetModal.classList.remove('active');
            targetModal.setAttribute('aria-hidden', 'true');
            
            // Remove body lock if no other modals are active
            this.activeModals.delete(modalId);
            if (this.activeModals.size === 0) {
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
            }
            
            // Call onClose callback
            if (onClose) {
                try {
                    onClose(targetModal, form);
                } catch (error) {
                    console.error('ModalManager: Error in onClose callback:', error);
                }
            }
        }
        
        /**
         * Close all modals
         */
        closeAll() {
            const activeModals = Array.from(this.activeModals);
            activeModals.forEach(modalId => {
                this.close(modalId);
            });
        }
        
        /**
         * Get currently active modal
         */
        getActiveModal() {
            return document.querySelector('.modal.active');
        }
        
        /**
         * Check if a modal is open
         */
        isOpen(modalId) {
            const modal = document.getElementById(modalId);
            return modal && modal.classList.contains('active');
        }
        
        /**
         * Clear form errors
         * @param {HTMLElement} form - Form element
         */
        clearFormErrors(form) {
            if (!form) return;
            
            // Remove error classes
            form.querySelectorAll('.error, .invalid, .has-error').forEach(el => {
                el.classList.remove('error', 'invalid', 'has-error');
                el.removeAttribute('aria-invalid');
                if (el.setCustomValidity) {
                    el.setCustomValidity('');
                }
            });
            
            // Remove error messages
            form.querySelectorAll('.error-message, .input-error-message').forEach(el => {
                el.remove();
            });
            
            // Remove error styling from inputs
            form.querySelectorAll('input, select, textarea').forEach(el => {
                el.classList.remove('error', 'invalid');
                el.style.borderColor = '';
            });
        }
        
        /**
         * Edit mode - open modal with existing data
         * @param {string} modalId - Modal element ID
         * @param {Object} data - Data to populate form
         * @param {Object} options - Additional options
         */
        edit(modalId, data, options = {}) {
            const config = this.modals.get(modalId);
            if (!config) {
                console.error(`ModalManager: Modal "${modalId}" not registered`);
                return;
            }
            
            const form = config.formId ? document.getElementById(config.formId) : config.modal.querySelector('form');
            
            if (!form) {
                console.error(`ModalManager: Form not found for modal "${modalId}"`);
                return;
            }
            
            // Populate form fields
            Object.keys(data).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = data[key] === true || data[key] === 1 || data[key] === '1' || data[key] === 't';
                    } else if (field.type === 'radio') {
                        const radio = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                        if (radio) radio.checked = true;
                    } else {
                        field.value = data[key] || '';
                    }
                }
            });
            
            // Set form ID if provided
            if (data.id !== undefined) {
                form.dataset.id = data.id;
            }
            
            // Open modal with edit title
            return this.open(modalId, {
                titleText: options.titleText || options.editTitle || 'Edit',
                ...options
            });
        }
    }
    
    // Create singleton instance
    window.ModalManager = new ModalManager();
    
    // Legacy support - maintain global functions for backward compatibility
    // These will delegate to ModalManager
    const originalOpenModal = window.openModal;
    const originalCloseModal = window.closeModal;
    
    window.openModal = function(modalId, options) {
        // If it's a legacy call (just modalId string), try ModalManager first
        if (typeof modalId === 'string' && document.getElementById(modalId)) {
            window.ModalManager.open(modalId, options || {});
        } else if (originalOpenModal) {
            // Fallback to original implementation
            originalOpenModal.apply(this, arguments);
        }
    };
    
    window.closeModal = function(modalId) {
        // If modalId is provided or can be inferred, use ModalManager
        if (typeof modalId === 'string' && document.getElementById(modalId)) {
            window.ModalManager.close(modalId);
        } else if (!modalId) {
            // Try to close active modal
            const active = window.ModalManager.getActiveModal();
            if (active) {
                window.ModalManager.close(active.id);
            }
        } else if (originalCloseModal) {
            // Fallback to original implementation
            originalCloseModal.apply(this, arguments);
        }
    };
    
})();

