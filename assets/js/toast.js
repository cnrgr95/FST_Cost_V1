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
            if (onConfirm) onConfirm();
        });
        
        overlay.querySelector('.btn-cancel').addEventListener('click', function() {
            closeDialog();
            if (onCancel) onCancel();
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
})();

