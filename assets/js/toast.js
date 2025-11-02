// Global Toast Notification System
(function() {
    'use strict';
    
    // Toast notification function
    window.showToast = function(type, message, duration = 5000) {
        console.log('showToast called:', { type, message, duration });
        const container = document.getElementById('toastContainer');
        console.log('toastContainer found?', !!container);
        if (!container) {
            console.error('toastContainer not found in DOM!');
            // Try to create it if it doesn't exist
            const newContainer = document.createElement('div');
            newContainer.id = 'toastContainer';
            newContainer.className = 'toast-container';
            document.body.appendChild(newContainer);
            console.log('Created toastContainer');
            return window.showToast(type, message, duration); // Retry
        }
        
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
            title = tCommon.warning || 'Warning';
        } else if (type === 'info') {
            icon = 'info';
            title = tCommon.information || 'Information';
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
        console.log('Toast appended to container');
        console.log('Toast element:', toast);
        console.log('Toast classes:', toast.className);
        
        // Force a reflow to ensure styles are applied
        void toast.offsetHeight;
        
        // Add show class first
        toast.classList.add('show');
        
        // Force immediate display with inline styles - override everything
        const existingStyle = toast.getAttribute('style') || '';
        toast.setAttribute('style', existingStyle + `
            display: flex !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 16px !important;
            background: white !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            min-width: 320px !important;
            max-width: 500px !important;
            pointer-events: auto !important;
            opacity: 1 !important;
            transform: translateX(0) !important;
            visibility: visible !important;
            position: relative !important;
            z-index: 100001 !important;
            margin-bottom: 12px !important;
        `);
        
        // Use requestAnimationFrame to check and force visibility
        requestAnimationFrame(() => {
            const computed = window.getComputedStyle(toast);
            console.log('Toast computed styles check:');
            console.log('  opacity:', computed.opacity);
            console.log('  transform:', computed.transform);
            console.log('  display:', computed.display);
            console.log('  visibility:', computed.visibility);
            console.log('  z-index:', computed.zIndex);
            console.log('  position:', computed.position);
            
            const containerComputed = window.getComputedStyle(container);
            console.log('Container computed styles:');
            console.log('  z-index:', containerComputed.zIndex);
            console.log('  display:', containerComputed.display);
            console.log('  visibility:', containerComputed.visibility);
            
            // Check if toast is actually in viewport first
            const rect = toast.getBoundingClientRect();
            
            // Force visibility if needed - use setAttribute to fully override
            if (computed.opacity === '0' || computed.visibility === 'hidden' || computed.display === 'none' || rect.width === 0 || rect.height === 0) {
                console.warn('Toast not visible, forcing with inline styles');
                toast.setAttribute('style', `
                    display: flex !important;
                    align-items: flex-start !important;
                    gap: 12px !important;
                    padding: 16px !important;
                    background: white !important;
                    border-radius: 8px !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                    min-width: 320px !important;
                    max-width: 500px !important;
                    pointer-events: auto !important;
                    opacity: 1 !important;
                    transform: translateX(0) !important;
                    visibility: visible !important;
                    position: relative !important;
                    z-index: 100001 !important;
                    margin-bottom: 12px !important;
                `);
                
                // Also force container visibility
                container.setAttribute('style', `
                    position: fixed !important;
                    top: 20px !important;
                    right: 20px !important;
                    z-index: 999999 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 12px !important;
                    pointer-events: none !important;
                    visibility: visible !important;
                    overflow: visible !important;
                `);
            }
            console.log('Toast position:', {
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                visible: rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0
            });
        });
        
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeToast(toast));
        } else {
            console.warn('Toast close button not found!');
        }
        
        if (duration > 0) {
            setTimeout(() => {
                console.log('Closing toast after duration');
                closeToast(toast);
            }, duration);
        }
        
        console.log('Toast created and displayed - check DOM:', container.innerHTML);
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
                    <h3>${tCommon.confirm || 'Confirm'}</h3>
                </div>
                <div class="confirm-dialog-body">
                    <p>${message}</p>
                </div>
                <div class="confirm-dialog-footer">
                    <button class="btn-cancel">${tCommon.no || 'No'}</button>
                    <button class="btn-confirm">${tCommon.yes || 'Yes'}</button>
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
                        ${tCommon.close || 'Close'}
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

