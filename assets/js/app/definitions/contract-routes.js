// Contract Routes Page JavaScript
(function() {
    'use strict';
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/contract-routes.php';
    const CONTRACT_ID = (typeof window.CONTRACT_ID !== 'undefined') ? window.CONTRACT_ID : 0;
    
    // Debug: Log CONTRACT_ID
    console.log('CONTRACT_ID initialized:', CONTRACT_ID);
    
    // Get translations
    const t = window.Translations || {};
    const tVehicles = t.vehicles || {};
    const tCommon = t.common || {};
    
    let contractInfo = null;
    let routes = [];
    let currencies = [];
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        loadContractInfo();
        loadRoutes();
        loadCurrencies();
        
        // Setup modal close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Setup form submission
        const routeForm = document.getElementById('routeForm');
        const excelUploadForm = document.getElementById('excelUploadForm');
        
        if (routeForm) {
            routeForm.addEventListener('submit', handleRouteSubmit);
        }
        if (excelUploadForm) {
            excelUploadForm.addEventListener('submit', handleExcelUpload);
        }
        
        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });
        });
    });
    
    // Load contract info
    async function loadContractInfo() {
        try {
            const response = await fetch(`../../api/definitions/vehicles.php?action=contracts&id=${CONTRACT_ID}`);
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                contractInfo = result.data[0];
                displayContractInfo();
            } else {
                showToast('error', tVehicles.contract_not_found || 'Contract not found');
            }
        } catch (error) {
            console.error('Error loading contract info:', error);
            showToast('error', tCommon.failed_to_load_data || 'Failed to load contract info');
        }
    }
    
    // Display contract info
    function displayContractInfo() {
        if (!contractInfo) return;
        
        document.getElementById('contractCode').textContent = contractInfo.contract_code || '-';
        document.getElementById('contractCompany').textContent = contractInfo.company_name || '-';
        document.getElementById('contractStartDate').textContent = contractInfo.start_date || '-';
        document.getElementById('contractEndDate').textContent = contractInfo.end_date || '-';
    }
    
    // Load routes
    async function loadRoutes() {
        try {
            const response = await fetch(`${API_BASE}?action=routes&contract_id=${CONTRACT_ID}`);
            const result = await response.json();
            
            if (result.success) {
                routes = result.data || [];
                renderRoutes();
            } else {
                routes = [];
                renderRoutes();
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error loading routes:', error);
            routes = [];
            renderRoutes();
            showToast('error', tCommon.failed_to_load_data || 'Failed to load routes');
        }
    }
    
    // Render routes table
    function renderRoutes() {
        const container = document.getElementById('routesContent');
        
        if (routes.length === 0) {
            container.innerHTML = `
                <div class="vehicles-table-container">
                    <div class="empty-state">
                        <span class="material-symbols-rounded">route</span>
                        <h3>${tVehicles.no_routes || 'No routes found'}</h3>
                        <p>${tVehicles.add_route || 'Add Route'}</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '<div class="vehicles-table-container">';
        html += '<table class="table">';
        html += `<thead><tr>
            <th>${tVehicles.from_location || 'From'}</th>
            <th>${tVehicles.to_location || 'To'}</th>
            <th>${tVehicles.vip_mini || 'Vip Mini'}</th>
            <th>${tVehicles.mini || 'Mini'}</th>
            <th>${tVehicles.midi || 'Midi'}</th>
            <th>${tVehicles.bus || 'Bus'}</th>
            <th>${tVehicles.actions || 'Actions'}</th>
        </tr></thead>`;
        html += '<tbody>';
        
        routes.forEach(route => {
            const currency = route.currency || 'USD';
            const formatPrice = (price) => {
                if (!price) return '-';
                const numPrice = parseFloat(price);
                const formatted = numPrice.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                return formatted + ' ' + currency;
            };
            
            html += `
                <tr>
                    <td>${escapeHtml(route.from_location || '-')}</td>
                    <td>${escapeHtml(route.to_location || '-')}</td>
                    <td>${formatPrice(route.vip_mini_price)}</td>
                    <td>${formatPrice(route.mini_price)}</td>
                    <td>${formatPrice(route.midi_price)}</td>
                    <td>${formatPrice(route.bus_price)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-action btn-edit" onclick="editRoute(${route.id})" title="${tCommon.edit || 'Edit'}">
                                <span class="material-symbols-rounded">edit</span>
                            </button>
                            <button class="btn-action btn-delete" onclick="deleteRoute(${route.id})" title="${tCommon.delete || 'Delete'}">
                                <span class="material-symbols-rounded">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Open route modal
    window.openRouteModal = function() {
        const modal = document.getElementById('routeModal');
        const form = document.getElementById('routeForm');
        
        if (!modal || !form) return;
        
        modal.classList.add('active');
        form.reset();
        document.getElementById('routeId').value = '';
        document.getElementById('routeContractId').value = CONTRACT_ID;
        
        const title = document.getElementById('routeModalTitle');
        if (title) {
            title.textContent = tVehicles.add_route || 'Add Route';
        }
    };
    
    // Load currencies
    async function loadCurrencies() {
        try {
            const response = await fetch('../../api/definitions/currencies.php?action=currencies');
            const result = await response.json();
            
            if (result.success) {
                currencies = result.data || [];
                populateCurrencyDropdown();
            } else {
                // Use default currencies if API fails
                currencies = [
                    {code: 'USD', name: 'US Dollar', symbol: '$'},
                    {code: 'EUR', name: 'Euro', symbol: '€'},
                    {code: 'TL', name: 'Turkish Lira', symbol: '₺'},
                    {code: 'GBP', name: 'British Pound', symbol: '£'}
                ];
                populateCurrencyDropdown();
            }
        } catch (error) {
            console.error('Error loading currencies:', error);
            // Use default currencies
            currencies = [
                {code: 'USD', name: 'US Dollar', symbol: '$'},
                {code: 'EUR', name: 'Euro', symbol: '€'},
                {code: 'TL', name: 'Turkish Lira', symbol: '₺'},
                {code: 'GBP', name: 'British Pound', symbol: '£'}
            ];
            populateCurrencyDropdown();
        }
    }
    
    // Populate currency dropdown
    function populateCurrencyDropdown() {
        const select = document.getElementById('excel_currency');
        if (!select) return;
        
        select.innerHTML = `<option value="">${tVehicles.select || tCommon.select || 'Select...'}</option>`;
        currencies.forEach(currency => {
            const option = document.createElement('option');
            option.value = currency.code;
            const displayText = currency.symbol ? 
                `${currency.code} (${currency.symbol})` : 
                currency.code;
            option.textContent = displayText;
            select.appendChild(option);
        });
    }
    
    // Open Excel upload modal
    window.openExcelUploadModal = function() {
        const modal = document.getElementById('excelUploadModal');
        if (!modal) return;
        
        modal.classList.add('active');
        const form = document.getElementById('excelUploadForm');
        if (form) {
            form.reset();
        }
        
        // Ensure currencies are loaded
        if (currencies.length === 0) {
            loadCurrencies();
        }
    };
    
    // Edit route
    window.editRoute = async function(id) {
        const route = routes.find(r => r.id == id);
        if (!route) return;
        
        const modal = document.getElementById('routeModal');
        const form = document.getElementById('routeForm');
        
        if (!modal || !form) return;
        
        modal.classList.add('active');
        
        document.getElementById('routeId').value = route.id;
        document.getElementById('routeContractId').value = route.vehicle_contract_id;
        document.getElementById('route_from_location').value = route.from_location || '';
        document.getElementById('route_to_location').value = route.to_location || '';
        document.getElementById('route_vip_mini_price').value = route.vip_mini_price || '';
        document.getElementById('route_mini_price').value = route.mini_price || '';
        document.getElementById('route_midi_price').value = route.midi_price || '';
        document.getElementById('route_bus_price').value = route.bus_price || '';
        document.getElementById('route_currency').value = route.currency || 'USD';
        
        const title = document.getElementById('routeModalTitle');
        if (title) {
            title.textContent = tVehicles.edit_route || 'Edit Route';
        }
    };
    
    // Close modal
    window.closeModal = function() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        const form = document.getElementById('routeForm');
        if (form) {
            form.reset();
            document.getElementById('routeId').value = '';
        }
    };
    
    // Handle route form submission
    function handleRouteSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const data = {
            vehicle_contract_id: document.getElementById('routeContractId').value,
            from_location: document.getElementById('route_from_location').value,
            to_location: document.getElementById('route_to_location').value,
            vip_mini_price: document.getElementById('route_vip_mini_price').value,
            mini_price: document.getElementById('route_mini_price').value,
            midi_price: document.getElementById('route_midi_price').value,
            bus_price: document.getElementById('route_bus_price').value,
            currency: document.getElementById('route_currency').value
        };
        
        const routeId = document.getElementById('routeId').value;
        if (routeId) {
            data.id = routeId;
            updateRoute(data);
        } else {
            createRoute(data);
        }
    }
    
    // Create route
    async function createRoute(data) {
        try {
            const response = await fetch(`${API_BASE}?action=route`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                await loadRoutes();
                closeModal();
                showToast('success', tVehicles.route_added || 'Route added successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating route:', error);
            showToast('error', tCommon.save_failed || 'Failed to create route');
        }
    }
    
    // Update route
    async function updateRoute(data) {
        try {
            const response = await fetch(`${API_BASE}?action=route`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                await loadRoutes();
                closeModal();
                showToast('success', tVehicles.route_updated || 'Route updated successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error updating route:', error);
            showToast('error', tCommon.update_failed || 'Failed to update route');
        }
    }
    
    // Handle Excel upload
    function handleExcelUpload(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        // Add contract_id and currency explicitly
        formData.append('contract_id', CONTRACT_ID);
        
        const currency = document.getElementById('excel_currency').value;
        if (!currency) {
            showToast('error', tVehicles.select_currency || 'Please select a currency');
            return;
        }
        formData.append('currency', currency);
        
        // Debug: Check values
        console.log('Contract ID:', CONTRACT_ID);
        console.log('Currency:', currency);
        
        uploadExcel(formData);
    }
    
    // Upload Excel
    async function uploadExcel(formData) {
        try {
            // Debug: Log form data
            console.log('Uploading Excel with contract_id:', CONTRACT_ID);
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
            }
            
            const response = await fetch(`${API_BASE}?action=upload_excel`, {
                method: 'POST',
                body: formData
                // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
            });
            
            // Get response text first to debug
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.error('JSON parse error:', e);
                console.error('Response text:', responseText);
                showToast('error', 'Server error: ' + responseText.substring(0, 200));
                return;
            }
            
            console.log('Upload response:', result);
            
            if (result.success) {
                await loadRoutes();
                closeModal();
                showToast('success', result.message || 'Excel uploaded successfully');
            } else {
                showToast('error', result.message || 'Failed to upload Excel');
            }
        } catch (error) {
            console.error('Error uploading Excel:', error);
            showToast('error', tCommon.upload_failed || 'Failed to upload Excel: ' + error.message);
        }
    }
    
    // Delete route
    window.deleteRoute = async function(id) {
        if (typeof showConfirmDialog === 'function') {
            showConfirmDialog(tCommon.delete_confirm || 'Are you sure you want to delete this route?', async function() {
                try {
                    const response = await fetch(`${API_BASE}?action=route&id=${id}`, {
                        method: 'DELETE'
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        await loadRoutes();
                        showToast('success', tVehicles.route_deleted || 'Route deleted successfully');
                    } else {
                        showToast('error', result.message);
                    }
                } catch (error) {
                    console.error('Error deleting route:', error);
                    showToast('error', tCommon.delete_failed || 'Failed to delete route');
                }
            });
        } else {
            if (confirm(tCommon.delete_confirm || 'Are you sure you want to delete this route?')) {
                try {
                    const response = await fetch(`${API_BASE}?action=route&id=${id}`, {
                        method: 'DELETE'
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        await loadRoutes();
                        showToast('success', tVehicles.route_deleted || 'Route deleted successfully');
                    } else {
                        showToast('error', result.message);
                    }
                } catch (error) {
                    console.error('Error deleting route:', error);
                    showToast('error', tCommon.delete_failed || 'Failed to delete route');
                }
            }
        }
    };
    
    // Toast notification function
    function showToast(type, message, duration = 5000) {
        if (typeof window.showToast === 'function') {
            window.showToast(type, message, duration);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
})();

