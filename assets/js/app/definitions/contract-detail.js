// Contract Detail Page JavaScript
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
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/vehicles.php';
    const CONTRACT_ID = pageConfig.contractId || 0;
    
    // Get translations
    let t = {};
    if (typeof window.Translations !== 'undefined') {
        t = window.Translations;
    } else if (pageConfig.translations) {
        t = pageConfig.translations;
    }
    const tVehicles = t.vehicles || {};
    const tCommon = t.common || {};
    
    let contractData = null;
    let vehicleTypes = [];
    let contractRoutes = []; // Routes with prices
    let excelColumns = []; // Excel columns for mapping
    let excelData = []; // Raw Excel data
    let excelFileData = null; // Store uploaded file for reuse
    let hasHeader = false; // Whether Excel has header row
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        setupEventListeners();
        loadContractInfo();
        loadVehicleTypes();
        loadContractRoutes();
    });
    
    function setupEventListeners() {
        // Open upload modal button
        const openUploadBtn = document.getElementById('openUploadModalBtn');
        if (openUploadBtn) {
            openUploadBtn.addEventListener('click', openUploadModal);
        }
        
        // Close upload modal button
        const closeUploadBtn = document.getElementById('closeUploadModal');
        if (closeUploadBtn) {
            closeUploadBtn.addEventListener('click', closeUploadModal);
        }
        
        // Cancel upload button
        const cancelUploadBtn = document.getElementById('cancelUploadBtn');
        if (cancelUploadBtn) {
            cancelUploadBtn.addEventListener('click', closeUploadModal);
        }
        
        // Back to upload button
        const backToUploadBtn = document.getElementById('backToUploadBtn');
        if (backToUploadBtn) {
            backToUploadBtn.addEventListener('click', backToUploadStep);
        }
        
        // Excel upload form
        const excelForm = document.getElementById('excelUploadForm');
        if (excelForm) {
            excelForm.addEventListener('submit', handleExcelUpload);
        }
        
        // Column mapping save button
        const saveMappingBtn = document.getElementById('saveColumnMappingBtn');
        if (saveMappingBtn) {
            saveMappingBtn.addEventListener('click', saveColumnMapping);
        }
        
        // Add route modal button
        const openAddRouteBtn = document.getElementById('openAddRouteModalBtn');
        if (openAddRouteBtn) {
            openAddRouteBtn.addEventListener('click', openAddRouteModal);
        }
        
        // Add route modal event listeners
        const closeAddRouteBtn = document.getElementById('closeAddRouteModal');
        if (closeAddRouteBtn) {
            closeAddRouteBtn.addEventListener('click', closeAddRouteModal);
        }
        
        const cancelAddRouteBtn = document.getElementById('cancelAddRouteBtn');
        if (cancelAddRouteBtn) {
            cancelAddRouteBtn.addEventListener('click', closeAddRouteModal);
        }
        
        const addRouteForm = document.getElementById('addRouteForm');
        if (addRouteForm) {
            addRouteForm.addEventListener('submit', handleAddRouteSubmit);
        }
        
        // Edit route modal event listeners
        const closeEditRouteBtn = document.getElementById('closeEditRouteModal');
        if (closeEditRouteBtn) {
            closeEditRouteBtn.addEventListener('click', closeEditRouteModal);
        }
        
        const cancelEditRouteBtn = document.getElementById('cancelEditRouteBtn');
        if (cancelEditRouteBtn) {
            cancelEditRouteBtn.addEventListener('click', closeEditRouteModal);
        }
        
        const editRouteForm = document.getElementById('editRouteForm');
        if (editRouteForm) {
            editRouteForm.addEventListener('submit', handleEditRouteSubmit);
        }
        
        // Close modal on outside click
        const uploadModal = document.getElementById('uploadMappingModal');
        if (uploadModal) {
            uploadModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeUploadModal();
                }
            });
        }
    }
    
    function openUploadModal() {
        const modal = document.getElementById('uploadMappingModal');
        if (!modal) return;
        
        // Reset to upload step
        showUploadStep();
        
        // Reset form
        const form = document.getElementById('excelUploadForm');
        if (form) {
            form.reset();
        }
        const fileInput = document.getElementById('excelFile');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Show modal
        modal.style.display = 'flex';
    }
    
    function closeUploadModal() {
        const modal = document.getElementById('uploadMappingModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Reset to upload step
        showUploadStep();
        
        // Clear stored file
        excelFileData = null;
    }
    
    function showUploadStep() {
        const uploadSection = document.getElementById('uploadStepSection');
        const mappingSection = document.getElementById('mappingStepSection');
        const modalTitle = document.getElementById('uploadModalTitle');
        
        if (uploadSection) uploadSection.style.display = 'block';
        if (mappingSection) mappingSection.style.display = 'none';
        if (modalTitle) {
            modalTitle.textContent = tVehicles.upload_price_list || 'Upload Price List';
        }
    }
    
    function showMappingStep() {
        const uploadSection = document.getElementById('uploadStepSection');
        const mappingSection = document.getElementById('mappingStepSection');
        const modalTitle = document.getElementById('uploadModalTitle');
        
        if (uploadSection) uploadSection.style.display = 'none';
        if (mappingSection) mappingSection.style.display = 'block';
        if (modalTitle) {
            modalTitle.textContent = tVehicles.map_columns || 'Map Columns';
        }
    }
    
    function backToUploadStep() {
        showUploadStep();
    }
    
    async function loadContractInfo() {
        try {
            const resp = await fetch(`${API_BASE}?action=contracts&id=${CONTRACT_ID}`);
            const res = await resp.json();
            if (res.success && res.data && res.data.length > 0) {
                contractData = res.data[0];
                document.getElementById('contractCodeDisplay').textContent = contractData.contract_code || '-';
                document.getElementById('companyNameDisplay').textContent = contractData.company_name || '-';
                document.getElementById('startDateDisplay').textContent = contractData.start_date || '-';
                document.getElementById('endDateDisplay').textContent = contractData.end_date || '-';
                
                const title = document.getElementById('contractDetailTitle');
                if (title) {
                    title.textContent = `${tVehicles.contract_detail || 'Contract Detail'}: ${contractData.contract_code || ''}`;
                }
            }
        } catch (e) {
            console.error('Error loading contract info:', e);
            showToast('error', tCommon.load_failed || 'Failed to load contract information');
        }
    }
    
    async function loadVehicleTypes() {
        try {
            const resp = await fetch(`${API_BASE}?action=types`);
            const res = await resp.json();
            if (res.success) {
                vehicleTypes = res.data || [];
            }
        } catch (e) {
            console.error('Error loading vehicle types:', e);
        }
    }
    
    async function loadVehicleTypesForContract() {
        if (!contractData) return [];
        
        try {
            const resp = await fetch(`${API_BASE}?action=types&company_id=${contractData.vehicle_company_id}`);
            const res = await resp.json();
            if (res.success) {
                return res.data || [];
            }
        } catch (e) {
            console.error('Error loading vehicle types for contract:', e);
        }
        return [];
    }
    
    async function loadContractRoutes() {
        try {
            const resp = await fetch(`${API_BASE}?action=contract_routes&contract_id=${CONTRACT_ID}`);
            const res = await resp.json();
            if (res.success) {
                contractRoutes = res.data || [];
                // Ensure vehicle_type_prices is properly parsed
                contractRoutes.forEach(route => {
                    if (route.vehicle_type_prices) {
                        // If it's a string, parse it
                        if (typeof route.vehicle_type_prices === 'string') {
                            try {
                                route.vehicle_type_prices = JSON.parse(route.vehicle_type_prices);
                            } catch (e) {
                                console.error('Error parsing vehicle_type_prices:', e, route.vehicle_type_prices);
                                route.vehicle_type_prices = {};
                            }
                        }
                        // Ensure it's an object
                        if (typeof route.vehicle_type_prices !== 'object' || route.vehicle_type_prices === null) {
                            route.vehicle_type_prices = {};
                        }
                    } else {
                        route.vehicle_type_prices = {};
                    }
                    
                    // Debug: Log route prices for troubleshooting
                    if (Object.keys(route.vehicle_type_prices).length > 0) {
                        console.log('Route loaded:', route.from_location, '->', route.to_location, 'Prices:', route.vehicle_type_prices);
                    }
                });
                await renderRoutesTable();
            } else {
                contractRoutes = [];
                await renderRoutesTable();
            }
        } catch (e) {
            console.error('Error loading contract routes:', e);
            contractRoutes = [];
            await renderRoutesTable();
        }
    }
    
    async function renderRoutesTable() {
        const container = document.getElementById('contractRoutesContainer');
        if (!container) return;
        
        // Load vehicle types for the contract's company
        let vehicleTypeMap = {}; // Maps vehicle_type_id => { id, name }
        if (contractData && contractData.vehicle_company_id) {
            try {
                const typesResp = await fetch(`${API_BASE}?action=types&company_id=${contractData.vehicle_company_id}`);
                const typesRes = await typesResp.json();
                if (typesRes.success) {
                    const allTypes = typesRes.data || [];
                    allTypes.forEach(type => {
                        vehicleTypeMap[type.id] = { id: type.id, name: type.name || '-' };
                    });
                }
            } catch (e) {
                console.error('Error loading vehicle types for table:', e);
            }
        }
        
        // Use all active vehicle types from the company automatically (no selection needed)
        const displayTypes = Object.values(vehicleTypeMap).map(typeInfo => ({
            id: typeInfo.id,
            name: typeInfo.name
        }));
        
        if (contractRoutes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-rounded">route</span>
                    <h3>${tVehicles.no_routes || 'No routes found'}</h3>
                    <p>${tVehicles.upload_price_list_hint || 'Upload an Excel file to add routes and prices'}</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="table-wrapper" style="overflow-x: auto;"><table class="table" style="font-size: 13px; min-width: 900px;"><thead><tr>';
        html += `<th style="min-width: 120px;">${tVehicles.from_location || 'Nerden'}</th>`;
        html += `<th style="min-width: 120px;">${tVehicles.to_location || 'Nereye'}</th>`;
        
        // Only show columns for selected vehicle types
        displayTypes.forEach(type => {
            html += `<th style="min-width: 80px;">${type.name || '-'}</th>`;
        });
        
        html += `<th style="min-width: 60px;">${tVehicles.currency || 'Currency'}</th>`;
        html += `<th style="min-width: 100px;">${tVehicles.actions || 'Actions'}</th>`;
        html += '</tr></thead><tbody>';
        
        contractRoutes.forEach(route => {
            const formatPrice = (price) => {
                if (price === null || price === undefined || price === '' || price === 'NULL') return '-';
                const numPrice = parseFloat(price);
                if (isNaN(numPrice)) return '-';
                // Format with thousand separators: 1000.00 -> 1,000.00
                return numPrice.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            };
            
            // Ensure vehicle_type_prices is parsed (it should be already parsed in loadContractRoutes, but double-check)
            let vehicleTypePrices = {};
            if (route.vehicle_type_prices) {
                if (typeof route.vehicle_type_prices === 'string') {
                    try {
                        vehicleTypePrices = JSON.parse(route.vehicle_type_prices);
                    } catch (e) {
                        console.error('Error parsing vehicle_type_prices in render:', e, route.vehicle_type_prices);
                        vehicleTypePrices = {};
                    }
                } else if (typeof route.vehicle_type_prices === 'object' && route.vehicle_type_prices !== null) {
                    vehicleTypePrices = route.vehicle_type_prices;
                }
            }
            
            html += `<tr>
                <td><strong>${route.from_location || '-'}</strong></td>
                <td><strong>${route.to_location || '-'}</strong></td>`;
            
            // Only show prices for selected vehicle types (from JSONB vehicle_type_prices)
            displayTypes.forEach(type => {
                // Try multiple key formats to handle different ID types (JSON keys are strings)
                // Try: string key first (most common in JSON), then number key
                const typeIdStr = String(type.id);
                const typeIdNum = parseInt(type.id);
                
                const price = vehicleTypePrices[typeIdStr] 
                    || vehicleTypePrices[typeIdNum] 
                    || vehicleTypePrices[type.id] 
                    || null;
                
                // Debug logging for troubleshooting
                if (Object.keys(vehicleTypePrices).length > 0 && price === null) {
                    console.log('Price not found for type', type.id, 'Available keys:', Object.keys(vehicleTypePrices), 'Prices:', vehicleTypePrices);
                }
                
                html += `<td>${formatPrice(price)}</td>`;
            });
            
            html += `<td>${route.currency_code || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-action btn-edit" data-route-id="${route.id}" title="${tVehicles.edit || 'Edit'}">
                            <span class="material-symbols-rounded">edit</span>
                        </button>
                        <button class="btn-action btn-delete" data-route-id="${route.id}" title="${tVehicles.delete || 'Delete'}">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                </td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        // Attach event listeners to buttons after rendering
        attachRouteActionListeners();
    }
    
    // Attach event listeners to route action buttons
    function attachRouteActionListeners() {
        // Remove existing listeners to prevent duplicates
        document.querySelectorAll('#contractRoutesContainer .btn-edit').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        document.querySelectorAll('#contractRoutesContainer .btn-delete').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        
        // Edit buttons
        document.querySelectorAll('#contractRoutesContainer .btn-edit').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const routeId = this.getAttribute('data-route-id');
                console.log('Edit button clicked, route ID:', routeId);
                if (routeId) {
                    if (typeof window.openEditRouteModal === 'function') {
                        window.openEditRouteModal(parseInt(routeId));
                    } else {
                        console.error('openEditRouteModal function not found on window object');
                        showToast('error', 'Edit function not available');
                    }
                } else {
                    console.error('Route ID not found on button');
                }
            });
        });
        
        // Delete buttons
        document.querySelectorAll('#contractRoutesContainer .btn-delete').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const routeId = this.getAttribute('data-route-id');
                console.log('Delete button clicked, route ID:', routeId);
                if (routeId) {
                    if (typeof window.deleteRoute === 'function') {
                        window.deleteRoute(parseInt(routeId));
                    } else {
                        console.error('deleteRoute function not found on window object');
                        showToast('error', 'Delete function not available');
                    }
                } else {
                    console.error('Route ID not found on button');
                }
            });
        });
    }
    
    async function handleExcelUpload(e) {
        e.preventDefault();
        const fileInput = document.getElementById('excelFile');
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
            showToast('warning', tVehicles.select_file || 'Please select a file');
            return;
        }
        
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('excel_file', file);
        formData.append('contract_id', CONTRACT_ID);
        
        try {
            const resp = await fetch(`${API_BASE}?action=upload_contract_prices`, {
                method: 'POST',
                body: formData
            });
            
            // Check if response is OK
            if (!resp.ok) {
                const errorText = await resp.text();
                console.error('Server error response:', errorText);
                showToast('error', `Server error (${resp.status}): ${tCommon.upload_failed || 'Upload failed'}. Please check server logs.`);
                return;
            }
            
            // Try to parse JSON
            let res;
            try {
                const text = await resp.text();
                if (!text || text.trim() === '') {
                    throw new Error('Empty response from server');
                }
                res = JSON.parse(text);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text:', await resp.clone().text());
                showToast('error', tCommon.upload_failed || 'Upload failed: Invalid response from server. Please check server logs.');
                return;
            }
            
            if (res.success) {
                if (res.mapping_required) {
                    // Show column mapping interface
                    excelColumns = res.excel_columns || [];
                    hasHeader = res.has_header || false;
                    excelData = res.sample_data || [];
                    
                    // Store file for later use
                    excelFileData = fileInput.files[0];
                    
                    // Show mapping step in modal
                    showMappingStep();
                    await showColumnMappingScreen();
                } else {
                    // Routes are saved directly, no mapping needed
                    showToast('success', res.message || (tVehicles.routes_uploaded || 'Routes uploaded successfully'));
                    closeUploadModal();
                    await loadContractRoutes();
                }
            } else {
                showToast('error', res.message || (tCommon.upload_failed || 'Upload failed'));
            }
        } catch (e) {
            console.error('Error uploading Excel:', e);
            showToast('error', `${tCommon.upload_failed || 'Upload failed'}: ${e.message || 'Unknown error'}`);
        }
    }
    
    window.deleteRoute = function(routeId) {
        if (typeof window.showConfirmDialog === 'function') {
            const confirmMessage = (tVehicles.delete_route || 'Delete Route') + '\n\n' + (tVehicles.delete_route_confirm || 'Are you sure you want to delete this route?');
            window.showConfirmDialog(
                confirmMessage,
                async () => {
                    await performDeleteRoute(routeId);
                },
                null // onCancel is optional
            );
        } else {
            if (confirm(tVehicles.delete_route_confirm || 'Are you sure you want to delete this route?')) {
                performDeleteRoute(routeId);
            }
        }
    };
    
    async function performDeleteRoute(routeId) {
        try {
            const resp = await fetch(`${API_BASE}?action=contract_route&id=${routeId}`, {
                method: 'DELETE'
            });
            const res = await resp.json();
            
            if (res.success) {
                showToast('success', tCommon.deleted_successfully || 'Deleted');
                await loadContractRoutes();
            } else {
                showToast('error', res.message || (tCommon.delete_failed || 'Delete failed'));
            }
        } catch (e) {
            console.error('Error deleting route:', e);
            showToast('error', tCommon.delete_failed || 'Delete failed');
        }
    }
    
    // Open add route modal
    window.openAddRouteModal = async function() {
        // Clear form
        document.getElementById('addRouteForm').reset();
        document.getElementById('addVehicleTypesContainer').innerHTML = '';
        
        // Load currencies
        try {
            const currenciesResp = await fetch(`${(pageConfig.basePath || '../../')}api/definitions/currencies.php?action=currencies`);
            const currenciesRes = await currenciesResp.json();
            if (currenciesRes.success) {
                const currencySelect = document.getElementById('add_currency_code');
                currencySelect.innerHTML = '<option value="">' + (tCommon.select || 'Select...') + '</option>';
                (currenciesRes.data || []).filter(c => c.is_active).forEach(currency => {
                    const option = document.createElement('option');
                    option.value = currency.code;
                    option.textContent = `${currency.code} - ${currency.name || ''}`;
                    currencySelect.appendChild(option);
                });
            }
        } catch (e) {
            console.error('Error loading currencies:', e);
        }
        
        // Load vehicle types for the contract's company
        const vehicleTypesContainer = document.getElementById('addVehicleTypesContainer');
        vehicleTypesContainer.innerHTML = '';
        
        if (contractData && contractData.vehicle_company_id) {
            try {
                const typesResp = await fetch(`${API_BASE}?action=types&company_id=${contractData.vehicle_company_id}`);
                const typesRes = await typesResp.json();
                if (typesRes.success) {
                    const allTypes = (typesRes.data || []).filter(t => t.is_active !== false);
                    
                    // Use all active vehicle types from the company (automatic, no selection needed)
                    const displayTypes = allTypes.map(t => ({ id: t.id, name: t.name }));
                    
                    // Create price inputs for each vehicle type
                    displayTypes.forEach(type => {
                        const div = document.createElement('div');
                        div.className = 'form-group';
                        
                        div.innerHTML = `
                            <label>${type.name || '-'} ${tVehicles.price || 'Price'}</label>
                            <input type="number" 
                                   step="0.01" 
                                   min="0" 
                                   id="add_price_${type.id}" 
                                   data-type-id="${type.id}"
                                   value="" 
                                   placeholder="0.00">
                        `;
                        vehicleTypesContainer.appendChild(div);
                    });
                }
            } catch (e) {
                console.error('Error loading vehicle types:', e);
            }
        }
        
        // Show modal
        const modal = document.getElementById('addRouteModal');
        if (!modal) {
            console.error('Add route modal not found in DOM');
            showToast('error', 'Modal element not found');
            return;
        }
        
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input[type="text"]');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    };
    
    // Close add route modal
    window.closeAddRouteModal = function() {
        const modal = document.getElementById('addRouteModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
            document.body.style.overflow = '';
            
            const form = document.getElementById('addRouteForm');
            if (form) {
                form.reset();
            }
            document.getElementById('addVehicleTypesContainer').innerHTML = '';
        }
    };
    
    // Handle add route form submit
    async function handleAddRouteSubmit(e) {
        e.preventDefault();
        
        const fromLocation = document.getElementById('add_from_location').value.trim();
        const toLocation = document.getElementById('add_to_location').value.trim();
        const currencyCode = document.getElementById('add_currency_code').value.trim();
        
        if (!fromLocation || !toLocation) {
            showToast('warning', tVehicles.map_required_fields || 'Please fill all required fields');
            return;
        }
        
        // Collect vehicle type prices
        const vehicleTypePrices = {};
        const priceInputs = document.querySelectorAll('#addVehicleTypesContainer input[data-type-id]');
        priceInputs.forEach(input => {
            const typeId = input.getAttribute('data-type-id');
            const value = input.value.trim();
            if (value !== '') {
                const price = parseFloat(value);
                if (!isNaN(price) && price >= 0) {
                    vehicleTypePrices[String(typeId)] = price;
                }
            }
        });
        
        const createData = {
            contract_id: CONTRACT_ID,
            from_location: fromLocation,
            to_location: toLocation,
            vehicle_type_prices: vehicleTypePrices,
            currency_code: currencyCode || null
        };
        
        try {
            const resp = await fetch(`${API_BASE}?action=contract_route`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createData)
            });
            
            if (!resp.ok) {
                const errorText = await resp.text();
                console.error('Server error response:', errorText);
                throw new Error(`Server error (${resp.status})`);
            }
            
            const res = await resp.json();
            
            if (res.success) {
                showToast('success', res.message || (tCommon.saved_successfully || 'Route added successfully'));
                closeAddRouteModal();
                await loadContractRoutes();
            } else {
                showToast('error', res.message || (tCommon.save_failed || 'Save failed'));
            }
        } catch (e) {
            console.error('Error adding route:', e);
            showToast('error', `${tCommon.save_failed || 'Save failed'}: ${e.message || 'Unknown error'}`);
        }
    }
    
    window.openEditRouteModal = async function(routeId) {
        console.log('openEditRouteModal called with routeId:', routeId, 'Type:', typeof routeId);
        
        // Ensure routeId is an integer
        const routeIdInt = parseInt(routeId);
        if (isNaN(routeIdInt) || routeIdInt <= 0) {
            console.error('Invalid route ID:', routeId);
            showToast('error', tCommon.not_found || 'Invalid route ID');
            return;
        }
        
        // Find route - try both string and number comparison
        const route = contractRoutes.find(r => {
            const rId = parseInt(r.id);
            return rId === routeIdInt || r.id === routeIdInt || r.id === routeId;
        });
        
        if (!route) {
            console.error('Route not found. Route ID:', routeIdInt, 'Available routes:', contractRoutes.map(r => ({ id: r.id, from: r.from_location, to: r.to_location })));
            showToast('error', tCommon.not_found || 'Route not found. Please refresh the page.');
            return;
        }
        
        console.log('Route found:', route);
        
        // Set route ID
        document.getElementById('edit_route_id').value = routeIdInt;
        document.getElementById('edit_from_location').value = route.from_location || '';
        document.getElementById('edit_to_location').value = route.to_location || '';
        
        // Load currencies
        try {
            const currenciesResp = await fetch(`${(pageConfig.basePath || '../../')}api/definitions/currencies.php?action=currencies`);
            const currenciesRes = await currenciesResp.json();
            if (currenciesRes.success) {
                const currencySelect = document.getElementById('edit_currency_code');
                currencySelect.innerHTML = '<option value="">' + (tCommon.select || 'Select...') + '</option>';
                (currenciesRes.data || []).filter(c => c.is_active).forEach(currency => {
                    const option = document.createElement('option');
                    option.value = currency.code;
                    option.textContent = `${currency.code} - ${currency.name || ''}`;
                    if (route.currency_code === currency.code) {
                        option.selected = true;
                    }
                    currencySelect.appendChild(option);
                });
            }
        } catch (e) {
            console.error('Error loading currencies:', e);
        }
        
        // Load vehicle types for the contract's company
        const vehicleTypesContainer = document.getElementById('editVehicleTypesContainer');
        vehicleTypesContainer.innerHTML = '';
        
        if (contractData && contractData.vehicle_company_id) {
            try {
                const typesResp = await fetch(`${API_BASE}?action=types&company_id=${contractData.vehicle_company_id}`);
                const typesRes = await typesResp.json();
                if (typesRes.success) {
                    const allTypes = (typesRes.data || []).filter(t => t.is_active !== false);
                    
                    // Use all active vehicle types from the company automatically (no selection needed)
                    const displayTypes = allTypes.map(t => ({ id: t.id, name: t.name }));
                    
                    // Ensure route.vehicle_type_prices is parsed
                    let routePrices = {};
                    if (route.vehicle_type_prices) {
                        if (typeof route.vehicle_type_prices === 'string') {
                            try {
                                routePrices = JSON.parse(route.vehicle_type_prices);
                            } catch (e) {
                                console.error('Error parsing prices in edit modal:', e);
                                routePrices = {};
                            }
                        } else if (typeof route.vehicle_type_prices === 'object' && route.vehicle_type_prices !== null) {
                            routePrices = route.vehicle_type_prices;
                        }
                    }
                    
                    // Create price inputs for each vehicle type
                    displayTypes.forEach(type => {
                        const div = document.createElement('div');
                        div.className = 'form-group';
                        
                        // Try multiple key formats to find price
                        const typeIdStr = String(type.id);
                        const typeIdNum = parseInt(type.id);
                        const price = routePrices[typeIdStr] 
                            || routePrices[typeIdNum] 
                            || routePrices[type.id]
                            || '';
                        
                        console.log('Setting price for type', type.id, ':', price, 'from', routePrices);
                        
                        div.innerHTML = `
                            <label>${type.name || '-'} ${tVehicles.price || 'Price'}</label>
                            <input type="number" 
                                   step="0.01" 
                                   min="0" 
                                   id="edit_price_${type.id}" 
                                   data-type-id="${type.id}"
                                   value="${price || ''}" 
                                   placeholder="0.00">
                        `;
                        vehicleTypesContainer.appendChild(div);
                    });
                }
            } catch (e) {
                console.error('Error loading vehicle types:', e);
            }
        }
        
        // Show modal
        const modal = document.getElementById('editRouteModal');
        if (!modal) {
            console.error('Edit route modal not found in DOM');
            showToast('error', 'Modal element not found');
            return;
        }
        
        console.log('Opening edit route modal for route ID:', routeIdInt);
        
        // Show modal - use both display and class
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input[type="text"]');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    };
    
    // Close edit route modal
    window.closeEditRouteModal = function() {
        const modal = document.getElementById('editRouteModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
            document.body.style.overflow = '';
            
            const form = document.getElementById('editRouteForm');
            if (form) {
                form.reset();
            }
        }
    };
    
    // Handle edit route form submit
    async function handleEditRouteSubmit(e) {
        e.preventDefault();
        
        const routeId = parseInt(document.getElementById('edit_route_id').value);
        const fromLocation = document.getElementById('edit_from_location').value.trim();
        const toLocation = document.getElementById('edit_to_location').value.trim();
        const currencyCode = document.getElementById('edit_currency_code').value.trim();
        
        if (!fromLocation || !toLocation) {
            showToast('warning', tVehicles.map_required_fields || 'Please fill all required fields');
            return;
        }
        
        // Collect vehicle type prices
        const vehicleTypePrices = {};
        const priceInputs = document.querySelectorAll('#editVehicleTypesContainer input[data-type-id]');
        priceInputs.forEach(input => {
            const typeId = input.getAttribute('data-type-id');
            const value = input.value.trim();
            if (value !== '') {
                const price = parseFloat(value);
                if (!isNaN(price) && price >= 0) { // Allow 0 prices too
                    vehicleTypePrices[String(typeId)] = price;
                }
            }
        });
        
        console.log('Updating route with prices:', vehicleTypePrices);
        
        const updateData = {
            id: routeId,
            from_location: fromLocation,
            to_location: toLocation,
            vehicle_type_prices: vehicleTypePrices,
            currency_code: currencyCode || null
        };
        
        try {
            const resp = await fetch(`${API_BASE}?action=contract_route`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            
            if (!resp.ok) {
                const errorText = await resp.text();
                console.error('Server error response:', errorText);
                throw new Error(`Server error (${resp.status})`);
            }
            
            const res = await resp.json();
            
            if (res.success) {
                showToast('success', res.message || (tCommon.saved_successfully || 'Saved successfully'));
                closeEditRouteModal();
                await loadContractRoutes();
            } else {
                showToast('error', res.message || (tCommon.save_failed || 'Save failed'));
            }
        } catch (e) {
            console.error('Error updating route:', e);
            showToast('error', `${tCommon.save_failed || 'Save failed'}: ${e.message || 'Unknown error'}`);
        }
    }
    
    async function showColumnMappingScreen() {
        const container = document.getElementById('columnMappingContainer');
        if (!container) return;
        
        // Ensure translations are loaded
        if (typeof window.Translations === 'undefined' && pageConfig && pageConfig.translations) {
            window.Translations = pageConfig.translations;
        }
        
        // Refresh translation references
        let currentTranslations = {};
        if (typeof window.Translations !== 'undefined') {
            currentTranslations = window.Translations;
        } else if (pageConfig && pageConfig.translations) {
            currentTranslations = pageConfig.translations;
        }
        const currentTVehicles = currentTranslations.vehicles || tVehicles || {};
        const currentTCommon = currentTranslations.common || tCommon || {};
        
        // Load currencies and vehicle types
        let currenciesList = [];
        let availableVehicleTypes = [];
        
        try {
            const currenciesResp = await fetch(`${(pageConfig.basePath || '../../')}api/definitions/currencies.php?action=currencies`);
            const currenciesRes = await currenciesResp.json();
            if (currenciesRes.success) {
                currenciesList = (currenciesRes.data || []).filter(c => c.is_active);
            }
        } catch (e) {
            console.error('Error loading currencies:', e);
        }
        
        try {
            // Get contract info to find vehicle_company_id
            let vehicleCompanyId = null;
            if (contractData && contractData.vehicle_company_id) {
                vehicleCompanyId = contractData.vehicle_company_id;
            } else {
                // Try to load contract info if not already loaded
                const contractResp = await fetch(`${API_BASE}?action=contracts&id=${CONTRACT_ID}`);
                const contractRes = await contractResp.json();
                if (contractRes.success && contractRes.data && contractRes.data.length > 0) {
                    contractData = contractRes.data[0];
                    vehicleCompanyId = contractData.vehicle_company_id;
                }
            }
            
            // Load vehicle types for the specific company
            let typesUrl = `${API_BASE}?action=types`;
            if (vehicleCompanyId) {
                typesUrl += `&company_id=${vehicleCompanyId}`;
            }
            
            const typesResp = await fetch(typesUrl);
            const typesRes = await typesResp.json();
            if (typesRes.success) {
                availableVehicleTypes = (typesRes.data || []).filter(t => t.is_active !== false);
            }
        } catch (e) {
            console.error('Error loading vehicle types:', e);
        }
        
        // Directly show mapping table (no selection step needed)
        // All active vehicle types from the company will be used automatically
        let html = '<div id="mappingTableSection">';
        html += '<table class="table" style="width: 100%; margin-bottom: 20px;"><thead><tr>';
        html += '<th style="width: 200px;">' + (currentTVehicles.system_field || 'System Field') + '</th>';
        html += '<th style="width: 250px;">' + (currentTVehicles.excel_column || 'Excel Column') + '</th>';
        html += '</tr></thead><tbody>';
        
        // From and To are fixed
        html += `<tr>
            <td>
                <strong>${currentTVehicles.from_location || 'Nerden'}</strong>
                <span style="color: red;">*</span>
            </td>
            <td>
                <select id="map_from_location" class="form-control" style="width: 100%;" required>
                    <option value="">${currentTVehicles.select_column || 'Select Column...'}</option>`;
        
        excelColumns.forEach(col => {
            const selected = autoDetectColumn('from_location', col);
            html += `<option value="${col.index}" ${selected ? 'selected' : ''}>
                ${col.header} ${col.sample ? `(${col.sample})` : ''}
            </option>`;
        });
        
        html += `</select>
            </td>
        </tr>`;
        
        html += `<tr>
            <td>
                <strong>${currentTVehicles.to_location || 'Nereye'}</strong>
                <span style="color: red;">*</span>
            </td>
            <td>
                <select id="map_to_location" class="form-control" style="width: 100%;" required>
                    <option value="">${currentTVehicles.select_column || 'Select Column...'}</option>`;
        
        excelColumns.forEach(col => {
            const selected = autoDetectColumn('to_location', col);
            html += `<option value="${col.index}" ${selected ? 'selected' : ''}>
                ${col.header} ${col.sample ? `(${col.sample})` : ''}
            </option>`;
        });
        
        html += `</select>
            </td>
        </tr>`;
        
        // Vehicle types will be inserted dynamically here (before currency)
        
        // Currency row
        html += `<tr>
            <td>
                <strong>${currentTVehicles.currency || 'Currency'}</strong>
            </td>
            <td>
                <select id="map_currency_manual" class="form-control" style="width: 100%;">
                    <option value="">${currentTVehicles.select_currency_manual || 'Select Currency...'}</option>`;
        
        currenciesList.forEach(currency => {
            html += `<option value="${currency.code}">${currency.code} - ${currency.name || ''}</option>`;
        });
        
        html += `</select>
            </td>
        </tr>`;
        html += '</tbody></table>';
        html += '</div>';
        
        container.innerHTML = html;
        
        // Directly render vehicle type mapping rows with all available vehicle types
        renderVehicleTypeMappingRows(availableVehicleTypes);
    }
    
    function renderVehicleTypeMappingRows(vehicleTypes) {
        const table = document.querySelector('#mappingTableSection table tbody');
        if (!table) return;
        
        // Find where to insert (before currency row)
        const currencyRow = table.querySelector('tr:has(#map_currency_manual)');
        
        // Remove existing vehicle type rows first
        const existingRows = table.querySelectorAll('tr[data-vehicle-type-row]');
        existingRows.forEach(row => row.remove());
        
        // Insert vehicle type rows before currency row
        // Use all active vehicle types from the company automatically
        vehicleTypes.forEach(type => {
            const fieldId = `map_vehicle_type_${type.id}`;
            // Get fresh translations
            const freshT = (typeof window.Translations !== 'undefined') ? window.Translations : (pageConfig.translations || {});
            const freshTVehicles = freshT.vehicles || {};
            
            const rowHtml = `<tr data-vehicle-type-row>
                <td>
                    <strong>${type.name || '-'}</strong>
                </td>
                <td>
                    <select id="${fieldId}" class="form-control" style="width: 100%;">
                        <option value="">${freshTVehicles.select_column || 'Select Column...'}</option>`;
            
            let optionsHtml = '';
            excelColumns.forEach(col => {
                // Try to auto-detect by vehicle type name
                const typeNameLower = (type.name || '').toLowerCase();
                const headerLower = (col.header || '').toLowerCase();
                const sampleLower = (col.sample || '').toLowerCase();
                const selected = headerLower.includes(typeNameLower) || sampleLower.includes(typeNameLower);
                
                optionsHtml += `<option value="${col.index}" ${selected ? 'selected' : ''}>
                    ${col.header} ${col.sample ? `(${col.sample})` : ''}
                </option>`;
            });
            
            const fullRowHtml = rowHtml + optionsHtml + `</select>
                </td>
            </tr>`;
            
            if (currencyRow) {
                currencyRow.insertAdjacentHTML('beforebegin', fullRowHtml);
            } else {
                table.insertAdjacentHTML('beforeend', fullRowHtml);
            }
        });
    }
    
    function autoDetectColumn(fieldKey, col) {
        const header = (col.header || '').toLowerCase();
        const sample = (col.sample || '').toLowerCase();
        
        const patterns = {
            'from_location': ['nerden', 'from', 'kaynak', 'başlangıç'],
            'to_location': ['nereye', 'to', 'hedef', 'bitiş'],
            'vip_vito_price': ['vip vito', 'vipvito', 'vip_vito'],
            'vip_mini_price': ['vip mini', 'vipmini', 'vip_mini'],
            'vito_price': ['vito'],
            'mini_price': ['mini'],
            'midi_price': ['midi'],
            'bus_price': ['bus']
        };
        
        const fieldPatterns = patterns[fieldKey] || [];
        for (const pattern of fieldPatterns) {
            if (header.includes(pattern) || sample.includes(pattern)) {
                return true;
            }
        }
        return false;
    }
    
    
    async function saveColumnMapping() {
        // Collect mapping for from and to
        const columnMapping = {
            from_location: document.getElementById('map_from_location')?.value,
            to_location: document.getElementById('map_to_location')?.value
        };
        
        // Collect vehicle type mappings dynamically
        // Use the correct selector: rows with data-vehicle-type-row attribute
        const vehicleTypeMappings = {};
        const vehicleTypeRows = document.querySelectorAll('#mappingTableSection tr[data-vehicle-type-row]');
        
        console.log('Found vehicle type rows:', vehicleTypeRows.length);
        
        vehicleTypeRows.forEach(row => {
            const select = row.querySelector('select');
            if (select && select.id.startsWith('map_vehicle_type_')) {
                const typeId = select.id.replace('map_vehicle_type_', '');
                const colIndex = select.value;
                console.log('Found vehicle type mapping:', typeId, '-> column', colIndex);
                if (colIndex && colIndex !== '') {
                    // Store typeId as integer key to match backend expectation
                    vehicleTypeMappings[parseInt(typeId)] = parseInt(colIndex);
                } else {
                    console.warn('Vehicle type', typeId, 'has no column selected');
                }
            }
        });
        
        // Debug: Log vehicle type mappings
        console.log('Vehicle type mappings:', vehicleTypeMappings);
        
        // Get manual currency (only option now)
        const manualCurrency = document.getElementById('map_currency_manual')?.value;
        
        // Validate required fields
        if (!columnMapping.from_location || !columnMapping.to_location) {
            showToast('warning', tVehicles.map_required_fields || 'Please map all required fields (Nerden, Nereye)');
            return;
        }
        
        // Convert to integers and ensure proper format
        const cleanMapping = {
            from_location: parseInt(columnMapping.from_location),
            to_location: parseInt(columnMapping.to_location),
            vehicle_types: vehicleTypeMappings // Object with type_id (int) => column_index (int)
        };
        
        // Debug: Log complete mapping
        console.log('Complete mapping to send:', cleanMapping);
        
        // Re-upload file with mapping - we need full Excel data
        const fileInput = document.getElementById('excelFile');
        let file = excelFileData; // Use stored file
        
        // Fallback to file input if stored file not available
        if (!file && fileInput && fileInput.files && fileInput.files[0]) {
            file = fileInput.files[0];
        }
        
        if (!file) {
            showToast('error', tVehicles.file_required_for_mapping || 'Please select the Excel file again');
            return;
        }
        
        // First, get full Excel data
        const formData = new FormData();
        formData.append('excel_file', file);
        formData.append('contract_id', CONTRACT_ID);
        formData.append('get_full_data', '1');
        
        try {
            const resp = await fetch(`${API_BASE}?action=upload_contract_prices`, {
                method: 'POST',
                body: formData
            });
            
            if (!resp.ok) {
                const errorText = await resp.text();
                console.error('Server error response:', errorText);
                throw new Error(`Server error (${resp.status}): ${tCommon.upload_failed || 'Upload failed'}`);
            }
            
            // Try to parse JSON
            let fullDataRes;
            try {
                const text = await resp.text();
                if (!text || text.trim() === '') {
                    throw new Error('Empty response from server');
                }
                fullDataRes = JSON.parse(text);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error(tCommon.upload_failed || 'Upload failed: Invalid response from server');
            }
            
            if (!fullDataRes.success) {
                throw new Error(fullDataRes.message || 'Failed to get Excel data');
            }
            
            if (!fullDataRes.excel_rows || !Array.isArray(fullDataRes.excel_rows)) {
                throw new Error('Invalid Excel data format received from server');
            }
            
            // Now send mapping + full data to save
            const saveData = {
                contract_id: CONTRACT_ID,
                column_mapping: cleanMapping,
                excel_data: fullDataRes.excel_rows,
                has_header: hasHeader,
                manual_currency: manualCurrency || null // Manual currency for all rows
            };
            
            const saveResp = await fetch(`${API_BASE}?action=save_contract_routes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saveData)
            });
            
            if (!saveResp.ok) {
                const errorText = await saveResp.text();
                console.error('Save error response:', errorText);
                throw new Error(`Server error (${saveResp.status}): ${tCommon.save_failed || 'Save failed'}`);
            }
            
            let saveRes;
            try {
                const text = await saveResp.text();
                if (!text || text.trim() === '') {
                    throw new Error('Empty response from server');
                }
                saveRes = JSON.parse(text);
            } catch (parseError) {
                console.error('JSON parse error on save:', parseError);
                throw new Error(tCommon.save_failed || 'Save failed: Invalid response from server');
            }
            
            if (saveRes.success) {
                showToast('success', saveRes.message || (tVehicles.routes_uploaded || 'Routes uploaded successfully'));
                closeUploadModal();
                await loadContractRoutes();
                // Clear stored file
                excelFileData = null;
            } else {
                showToast('error', saveRes.message || (tCommon.save_failed || 'Save failed'));
            }
        } catch (e) {
            console.error('Error saving mapping:', e);
            showToast('error', `${tCommon.save_failed || 'Save failed'}: ${e.message || 'Unknown error'}`);
        }
    }
    
    function showToast(type, message) {
        if (typeof window.showToast === 'function') {
            window.showToast(type, message);
        } else {
            alert(message || type);
        }
    }
})();

