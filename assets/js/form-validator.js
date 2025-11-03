/**
 * Form Validator - Unified Form Validation System
 * Automates form validation, error display, and field management
 * 
 * Usage:
 *   const isValid = FormValidator.validate(formElement);
 *   FormValidator.showError('email', 'Invalid email format');
 *   FormValidator.clearErrors(formElement);
 */

(function() {
    'use strict';
    
    class FormValidator {
        constructor() {
            this.defaultRules = {
                required: (value, field) => {
                    if (field.hasAttribute('required')) {
                        if (field.type === 'checkbox') {
                            return field.checked ? null : 'This field is required';
                        }
                        if (field.tagName === 'SELECT') {
                            return value && value !== '' ? null : 'This field is required';
                        }
                        return value && value.trim() ? null : 'This field is required';
                    }
                    return null;
                },
                email: (value) => {
                    if (!value) return null; // Let required rule handle empty
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return emailRegex.test(value) ? null : 'Please enter a valid email address';
                },
                tel: (value) => {
                    if (!value) return null;
                    const telRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
                    return telRegex.test(value) ? null : 'Please enter a valid phone number';
                },
                number: (value, field) => {
                    if (!value && !field.hasAttribute('required')) return null;
                    const num = parseFloat(value);
                    return !isNaN(num) ? null : 'Please enter a valid number';
                },
                minLength: (value, field, min) => {
                    if (!value) return null;
                    return value.length >= min ? null : `Must be at least ${min} characters`;
                },
                maxLength: (value, field, max) => {
                    if (!value) return null;
                    return value.length <= max ? null : `Must be no more than ${max} characters`;
                }
            };
        }
        
        /**
         * Validate a form
         * @param {HTMLElement} form - Form element
         * @param {Object} options - Validation options
         * @returns {boolean} - True if valid, false otherwise
         */
        validate(form, options = {}) {
            if (!form) {
                console.error('FormValidator: Form element not provided');
                return false;
            }
            
            const {
                rules = {},
                scrollToFirstError = true,
                focusFirstError = true,
                onError = null,
                onSuccess = null
            } = options;
            
            // Clear previous errors
            this.clearErrors(form);
            
            let isValid = true;
            const errorFields = [];
            
            // Get all form fields
            const fields = form.querySelectorAll('input, select, textarea');
            
            fields.forEach(field => {
                // Skip disabled, hidden, or readonly fields (unless validating on change)
                if (field.disabled || field.type === 'hidden' || (field.hasAttribute('readonly') && !options.validateReadonly)) {
                    return;
                }
                
                const fieldName = field.name;
                const value = this.getFieldValue(field);
                
                // Get field-specific rules
                const fieldRules = rules[fieldName] || {};
                
                // Check required rule (default or custom)
                if (field.hasAttribute('required') || fieldRules.required) {
                    const requiredRule = this.defaultRules.required;
                    const error = requiredRule(value, field);
                    if (error) {
                        this.showFieldError(field, error);
                        errorFields.push({ field, error });
                        isValid = false;
                        return;
                    }
                }
                
                // Check type-specific rules
                if (field.type === 'email' || fieldRules.type === 'email') {
                    const error = this.defaultRules.email(value);
                    if (error) {
                        this.showFieldError(field, error);
                        errorFields.push({ field, error });
                        isValid = false;
                        return;
                    }
                }
                
                if (field.type === 'tel' || fieldRules.type === 'tel') {
                    const error = this.defaultRules.tel(value);
                    if (error) {
                        this.showFieldError(field, error);
                        errorFields.push({ field, error });
                        isValid = false;
                        return;
                    }
                }
                
                if (field.type === 'number' || fieldRules.type === 'number') {
                    const error = this.defaultRules.number(value, field);
                    if (error) {
                        this.showFieldError(field, error);
                        errorFields.push({ field, error });
                        isValid = false;
                        return;
                    }
                }
                
                // Check custom rules
                if (fieldRules.minLength) {
                    const error = this.defaultRules.minLength(value, field, fieldRules.minLength);
                    if (error) {
                        this.showFieldError(field, error);
                        errorFields.push({ field, error });
                        isValid = false;
                        return;
                    }
                }
                
                if (fieldRules.maxLength) {
                    const error = this.defaultRules.maxLength(value, field, fieldRules.maxLength);
                    if (error) {
                        this.showFieldError(field, error);
                        errorFields.push({ field, error });
                        isValid = false;
                        return;
                    }
                }
                
                // Check custom validation function
                if (fieldRules.validate && typeof fieldRules.validate === 'function') {
                    const error = fieldRules.validate(value, field);
                    if (error) {
                        this.showFieldError(field, error);
                        errorFields.push({ field, error });
                        isValid = false;
                        return;
                    }
                }
                
                // Native HTML5 validation
                if (!field.checkValidity()) {
                    const error = field.validationMessage || 'This field is invalid';
                    this.showFieldError(field, error);
                    errorFields.push({ field, error });
                    isValid = false;
                }
            });
            
            // Handle errors
            if (!isValid) {
                if (scrollToFirstError && errorFields.length > 0) {
                    setTimeout(() => {
                        const firstError = errorFields[0].field;
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        if (focusFirstError) {
                            setTimeout(() => {
                                firstError.focus();
                            }, 200);
                        }
                    }, 50);
                }
                
                if (onError) {
                    onError(errorFields);
                }
            } else {
                if (onSuccess) {
                    onSuccess();
                }
            }
            
            return isValid;
        }
        
        /**
         * Get field value
         */
        getFieldValue(field) {
            if (field.type === 'checkbox') {
                return field.checked;
            }
            if (field.type === 'radio') {
                const radio = document.querySelector(`[name="${field.name}"]:checked`);
                return radio ? radio.value : '';
            }
            return field.value || '';
        }
        
        /**
         * Show error for a specific field
         * @param {HTMLElement|string} field - Field element or field name
         * @param {string} message - Error message
         */
        showError(field, message) {
            const fieldElement = typeof field === 'string' 
                ? document.querySelector(`[name="${field}"]`) 
                : field;
            
            if (!fieldElement) {
                console.warn(`FormValidator: Field not found: ${typeof field === 'string' ? field : fieldElement}`);
                return;
            }
            
            this.showFieldError(fieldElement, message);
        }
        
        /**
         * Show field error (internal method)
         */
        showFieldError(field, message) {
            if (!field || !message) return;
            
            // Add error class
            field.classList.add('error', 'invalid');
            field.setAttribute('aria-invalid', 'true');
            
            // Set custom validity
            if (field.setCustomValidity) {
                field.setCustomValidity(message);
                field.reportValidity();
            }
            
            // Add error styling
            field.style.borderColor = '#dc3545';
            
            // Remove existing error message
            const existingError = field.parentElement?.querySelector('.error-message, .input-error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Add error message below field
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = `
                color: #dc3545;
                font-size: 12px;
                margin-top: 4px;
                display: block;
            `;
            errorDiv.textContent = message;
            
            // Insert after field or in parent element
            const parent = field.parentElement;
            if (parent) {
                // Check if field is in a form-group
                if (parent.classList.contains('form-group')) {
                    parent.appendChild(errorDiv);
                } else {
                    field.insertAdjacentElement('afterend', errorDiv);
                }
            }
        }
        
        /**
         * Clear all errors in a form
         * @param {HTMLElement} form - Form element
         */
        clearErrors(form) {
            if (!form) return;
            
            // Remove error classes
            form.querySelectorAll('.error, .invalid, .has-error').forEach(el => {
                el.classList.remove('error', 'invalid', 'has-error');
                el.removeAttribute('aria-invalid');
                if (el.setCustomValidity) {
                    el.setCustomValidity('');
                }
                el.style.borderColor = '';
            });
            
            // Remove error messages
            form.querySelectorAll('.error-message, .input-error-message').forEach(el => {
                el.remove();
            });
        }
        
        /**
         * Clear error for a specific field
         * @param {HTMLElement|string} field - Field element or field name
         */
        clearFieldError(field) {
            const fieldElement = typeof field === 'string' 
                ? document.querySelector(`[name="${field}"]`) 
                : field;
            
            if (!fieldElement) return;
            
            // Remove error classes
            fieldElement.classList.remove('error', 'invalid', 'has-error');
            fieldElement.removeAttribute('aria-invalid');
            if (fieldElement.setCustomValidity) {
                fieldElement.setCustomValidity('');
            }
            fieldElement.style.borderColor = '';
            
            // Remove error message
            const existingError = fieldElement.parentElement?.querySelector('.error-message, .input-error-message');
            if (existingError) {
                existingError.remove();
            }
        }
        
        /**
         * Validate a single field
         * @param {HTMLElement} field - Field element
         * @param {Object} rules - Validation rules for this field
         * @returns {Object|null} - Error object or null if valid
         */
        validateField(field, rules = {}) {
            if (!field) return null;
            
            const value = this.getFieldValue(field);
            
            // Check required
            if (field.hasAttribute('required') || rules.required) {
                const error = this.defaultRules.required(value, field);
                if (error) {
                    return { field, message: error, invalid: true };
                }
            }
            
            // Check type-specific rules
            if (rules.type && this.defaultRules[rules.type]) {
                const error = this.defaultRules[rules.type](value, field);
                if (error) {
                    return { field, message: error, invalid: true };
                }
            }
            
            // Check custom validation
            if (rules.validate && typeof rules.validate === 'function') {
                const error = rules.validate(value, field);
                if (error) {
                    return { field, message: error, invalid: true };
                }
            }
            
            return null;
        }
        
        /**
         * Setup real-time validation for a form
         * @param {HTMLElement} form - Form element
         * @param {Object} rules - Validation rules
         */
        setupRealTimeValidation(form, rules = {}) {
            if (!form) return;
            
            const fields = form.querySelectorAll('input, select, textarea');
            
            fields.forEach(field => {
                if (field.type === 'hidden' || field.hasAttribute('readonly')) {
                    return;
                }
                
                const fieldName = field.name;
                const fieldRules = rules[fieldName] || {};
                
                // Validate on blur
                field.addEventListener('blur', () => {
                    this.validateField(field, fieldRules);
                });
                
                // Clear error on input (optional)
                if (fieldRules.clearOnInput !== false) {
                    field.addEventListener('input', () => {
                        this.clearFieldError(field);
                    });
                }
            });
        }
    }
    
    // Create singleton instance
    window.FormValidator = new FormValidator();
    
})();

