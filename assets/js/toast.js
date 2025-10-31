// Global Toast Notification System
(function() {
    'use strict';
    
    // Toast notification function
    window.showToast = function(type, message, duration = 5000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        let title = '';
        const tCommon = window.Translations?.common || {};
        
        if (type === 'error') {
            icon = 'error';
            title = tCommon.error || 'Error';
        } else if (type === 'warning') {
            icon = 'warning';
            title = 'Warning';
        } else if (type === 'info') {
            icon = 'info';
            title = 'Information';
        } else if (type === 'success') {
            icon = 'check_circle';
            title = tCommon.success || 'Success';
        }
        
        toast.innerHTML = `
            <span class="material-symbols-rounded toast-icon">${icon}</span>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        container.appendChild(toast);
        toast.querySelector('.toast-close').addEventListener('click', () => closeToast(toast));
        if (duration > 0) {
            setTimeout(() => closeToast(toast), duration);
        }
    };

    function closeToast(toast) {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }

    // Global Confirm Dialog Function
    window.showConfirmDialog = function(message, onConfirm, onCancel) {
        const tCommon = window.Translations?.common || {};
        
        // Remove existing confirm dialog if any
        const existingDialog = document.getElementById('confirmDialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        // Create dialog overlay
        const overlay = document.createElement('div');
        overlay.id = 'confirmDialog';
        overlay.className = 'confirm-dialog-overlay';
        
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-dialog-header">
                    <span class="material-symbols-rounded confirm-icon">help</span>
                    <h3>${tCommon.confirm || 'Onay'}</h3>
                </div>
                <div class="confirm-dialog-body">
                    <p>${message}</p>
                </div>
                <div class="confirm-dialog-footer">
                    <button class="btn-cancel">${tCommon.no || 'Hayır'}</button>
                    <button class="btn-confirm">${tCommon.yes || 'Evet'}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Fade in animation
        setTimeout(() => overlay.classList.add('show'), 10);
        
        // Define closeDialog and handleEscKey functions first
        function closeDialog() {
            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                document.removeEventListener('keydown', handleEscKey);
            }, 200);
        }
        
        function handleEscKey(e) {
            if (e.key === 'Escape') {
                closeDialog();
                if (onCancel) onCancel();
                document.removeEventListener('keydown', handleEscKey);
            }
        }
        
        // Button handlers
        overlay.querySelector('.btn-confirm').addEventListener('click', function() {
            closeDialog();
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        });
        
        overlay.querySelector('.btn-cancel').addEventListener('click', function() {
            closeDialog();
            if (typeof onCancel === 'function') {
                onCancel();
            }
        });
        
        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeDialog();
                if (onCancel) onCancel();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', handleEscKey);
    };
    
    // Show dates dialog - for displaying list of dates with no rates
    window.showDatesDialog = function(title, dates, onClose, additionalMessage) {
        const tCommon = window.Translations?.common || {};
        const tCurrencies = window.Translations?.currencies || {};
        
        // Remove existing dialog if any
        const existingDialog = document.getElementById('datesDialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        // Create dialog overlay
        const overlay = document.createElement('div');
        overlay.id = 'datesDialog';
        overlay.className = 'confirm-dialog-overlay';
        overlay.style.display = 'flex';
        overlay.style.zIndex = '99999';
        
        let contentHtml = '';
        if (additionalMessage) {
            contentHtml = `<p style="margin-bottom: 12px; color: #495057;">${additionalMessage}</p>`;
        }
        
        if (dates && dates.length > 0) {
            const datesList = dates.map(d => `<li style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">${d}</li>`).join('');
            contentHtml += `
                <p style="margin-bottom: 12px; font-weight: 500; margin-top: ${additionalMessage ? '16px' : '0'};">
                    ${tCurrencies.dates_without_rates || 'Dates without rates'} (${dates.length}):
                </p>
                <ul style="list-style: none; padding: 0; margin: 0; max-height: 300px; overflow-y: auto;">
                    ${datesList}
                </ul>
            `;
        } else if (!additionalMessage) {
            contentHtml = `<p style="margin-bottom: 12px; color: #495057;">${tCurrencies.no_dates_found || 'No dates found'}</p>`;
        }
        
        overlay.innerHTML = `
            <div class="confirm-dialog" style="max-width: 500px;">
                <div class="confirm-dialog-header">
                    <span class="material-symbols-rounded confirm-icon" style="color: #ff9800;">warning</span>
                    <h3>${title || (tCurrencies.rates_not_available || 'Rates not available')}</h3>
                </div>
                <div class="confirm-dialog-body">
                    ${contentHtml}
                </div>
                <div class="confirm-dialog-footer">
                    <button class="btn-cancel" style="background: #3b82f6; color: white;">
                        ${tCommon.close || 'Kapat'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Force display immediately
        overlay.style.display = 'flex';
        overlay.style.opacity = '0';
        
        // Fade in animation
        requestAnimationFrame(() => {
            setTimeout(() => {
                overlay.classList.add('show');
                overlay.style.opacity = '1';
            }, 10);
        });
        
        function closeDialog() {
            overlay.classList.remove('show');
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                document.removeEventListener('keydown', handleEscKey);
            }, 200);
        }
        
        function handleEscKey(e) {
            if (e.key === 'Escape') {
                closeDialog();
                if (onClose) onClose();
                document.removeEventListener('keydown', handleEscKey);
            }
        }
        
        // Attach event handlers immediately
        const cancelBtn = overlay.querySelector('.btn-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                closeDialog();
                if (onClose) onClose();
            });
        }
        
        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeDialog();
                if (onClose) onClose();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', handleEscKey);
    };
})();

