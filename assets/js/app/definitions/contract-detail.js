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
    let routesSortState = { column: null, direction: 'asc' }; // For sorting
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        setupEventListeners();
        setupFileUploadUI();
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
        
        if (uploadSection) {
            uploadSection.classList.remove('hidden');
            uploadSection.style.display = 'block';
        }
        if (mappingSection) {
            mappingSection.classList.add('hidden');
            mappingSection.style.display = 'none';
        }
        if (modalTitle) {
            modalTitle.textContent = tVehicles.upload_price_list || 'Upload Price List';
        }
        
        // Reset file input
        const fileInput = document.getElementById('excelFile');
        if (fileInput) {
            fileInput.value = '';
            const fileUploadContent = document.querySelector('#fileUploadArea .file-upload-content');
            const fileUploadSelected = document.getElementById('fileUploadSelected');
            if (fileUploadContent) fileUploadContent.style.display = 'flex';
            if (fileUploadSelected) fileUploadSelected.style.display = 'none';
        }
    }
    
    function showMappingStep() {
        const uploadSection = document.getElementById('uploadStepSection');
        const mappingSection = document.getElementById('mappingStepSection');
        const modalTitle = document.getElementById('uploadModalTitle');
        
        if (uploadSection) {
            uploadSection.classList.add('hidden');
            uploadSection.style.display = 'none';
        }
        if (mappingSection) {
            mappingSection.classList.remove('hidden');
            mappingSection.style.display = 'block';
        }
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
                // Format dates as DD/MM/YYYY
                const formatDate = (dateStr) => {
                    if (!dateStr) return '-';
                    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                        const d = new Date(dateStr + 'T00:00:00');
                        if (d && !isNaN(d.getTime())) {
                            const day = d.getDate().toString().padStart(2, '0');
                            const m = (d.getMonth() + 1).toString().padStart(2, '0');
                            return `${day}/${m}/${d.getFullYear()}`;
                        }
                    }
                    return dateStr;
                };
                document.getElementById('startDateDisplay').textContent = formatDate(contractData.start_date);
                document.getElementById('endDateDisplay').textContent = formatDate(contractData.end_date);
                
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
                    
                    // Route prices loaded from database
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
        
        const totalCount = contractRoutes.length;
        
        let html = '<div class="vehicles-table-container">';
        html += '<div class="vehicles-table-header">';
        html += `<div class="vehicles-table-title">
                    <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 8px; font-size: 24px;">route</span>
                    ${tVehicles.routes_price_list || 'Routes & Price List'} 
                    <span class="table-count-badge">${totalCount}</span>
                 </div>`;
        html += '<div class="table-actions-group">';
        html += `<div class="search-box">
                    <span class="material-symbols-rounded search-icon">search</span>
                    <input type="text" 
                           id="routesSearchInput" 
                           placeholder="${tCommon.search || 'Search...'}" 
                           class="search-input"
                           onkeyup="filterRoutesTable(this.value)">
                    <button class="search-clear search-clear-hidden" id="routesSearchClear" onclick="clearRoutesSearch()">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                 </div>`;
        html += '</div>';
        html += '</div>';
        
        if (contractRoutes.length === 0) {
            html += `<div class="empty-state">
                        <span class="material-symbols-rounded">route</span>
                        <h3>${tVehicles.no_routes || 'No routes found'}</h3>
                        <p>${tVehicles.upload_price_list_hint_routes || 'Upload an Excel file to add routes and prices'}</p>
                     </div>`;
            html += '</div>';
            container.innerHTML = html;
            return;
        }
        
        html += '<div class="currencies-table-section">';
        html += '<table class="currencies-table" id="routesTable">';
        html += '<thead><tr>';
        html += `<th class="sortable" onclick="sortRoutesTable('from_location')">
                    ${tVehicles.from_location || 'Nerden'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="sortable" onclick="sortRoutesTable('to_location')">
                    ${tVehicles.to_location || 'Nereye'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        
        // Only show columns for selected vehicle types
        displayTypes.forEach(type => {
            html += `<th class="sortable" onclick="sortRoutesTable('type_${type.id}')">
                        ${type.name || '-'}
                        <span class="sort-icon">⇅</span>
                     </th>`;
        });
        
        html += `<th class="sortable" onclick="sortRoutesTable('currency_code')">
                    ${tVehicles.currency || 'Currency'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="no-sort">${tVehicles.actions || 'Actions'}</th>`;
        html += '</tr></thead>';
        html += '<tbody id="routesTableBody">';
        
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
            
            // Build searchable text for row
            let searchableText = `${(route.from_location || '').toLowerCase()} ${(route.to_location || '').toLowerCase()} ${(route.currency_code || '').toLowerCase()} `;
            
            html += `<tr data-from-location="${(route.from_location || '').toLowerCase()}" 
                          data-to-location="${(route.to_location || '').toLowerCase()}"
                          data-currency="${(route.currency_code || '').toLowerCase()}">`;
            html += `<td><strong>${route.from_location || '-'}</strong></td>`;
            html += `<td><strong>${route.to_location || '-'}</strong></td>`;
            
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
                
                const priceText = formatPrice(price);
                searchableText += `${priceText} `;
                
                // Vehicle type price processing
                if (Object.keys(vehicleTypePrices).length > 0 && price === null) {
                    // Price not found for vehicle type (handled gracefully with default)
                }
                
                html += `<td data-type-${type.id}="${priceText}">${priceText}</td>`;
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
        html += '</div>';
        container.innerHTML = html;
        
        // Attach event listeners to buttons after rendering
        attachRouteActionListeners();
    }
    
    // Filter routes table
    window.filterRoutesTable = function(searchTerm) {
        const tbody = document.getElementById('routesTableBody');
        if (!tbody) return;
        
        const searchLower = searchTerm.toLowerCase().trim();
        const rows = tbody.querySelectorAll('tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            // Search in from_location, to_location, currency
            const fromLocation = (row.getAttribute('data-from-location') || '').toLowerCase();
            const toLocation = (row.getAttribute('data-to-location') || '').toLowerCase();
            const currency = (row.getAttribute('data-currency') || '').toLowerCase();
            
            // Search in all cell text content (including vehicle type prices)
            const cells = row.querySelectorAll('td');
            let cellText = '';
            cells.forEach(cell => {
                cellText += ' ' + (cell.textContent || '').toLowerCase();
            });
            
            const matches = searchLower === '' || 
                fromLocation.includes(searchLower) ||
                toLocation.includes(searchLower) ||
                currency.includes(searchLower) ||
                cellText.includes(searchLower);
            
            if (matches) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Update search clear button visibility
        const clearBtn = document.getElementById('routesSearchClear');
        if (clearBtn) {
            if (searchLower) {
                clearBtn.classList.remove('search-clear-hidden');
            } else {
                clearBtn.classList.add('search-clear-hidden');
            }
        }
        
        // Update count badge
        const badge = document.querySelector('.vehicles-table-title .table-count-badge');
        if (badge) {
            const totalCount = contractRoutes.length;
            badge.textContent = visibleCount === totalCount ? totalCount : `${visibleCount} / ${totalCount}`;
        }
    };
    
    // Clear routes search
    window.clearRoutesSearch = function() {
        const searchInput = document.getElementById('routesSearchInput');
        if (searchInput) {
            searchInput.value = '';
            filterRoutesTable('');
        }
    };
    
    // Sort routes table
    window.sortRoutesTable = function(column) {
        if (!contractRoutes || contractRoutes.length === 0) return;
        
        // Toggle direction if same column
        if (routesSortState.column === column) {
            routesSortState.direction = routesSortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            routesSortState.column = column;
            routesSortState.direction = 'asc';
        }
        
        // Sort the data
        const sorted = [...contractRoutes].sort((a, b) => {
            let aVal, bVal;
            
            if (column === 'from_location') {
                aVal = (a.from_location || '').toLowerCase();
                bVal = (b.from_location || '').toLowerCase();
            } else if (column === 'to_location') {
                aVal = (a.to_location || '').toLowerCase();
                bVal = (b.to_location || '').toLowerCase();
            } else if (column === 'currency_code') {
                aVal = (a.currency_code || '').toLowerCase();
                bVal = (b.currency_code || '').toLowerCase();
            } else if (column.startsWith('type_')) {
                // Vehicle type column sorting
                const typeId = parseInt(column.replace('type_', ''));
                const aPrices = typeof a.vehicle_type_prices === 'object' && a.vehicle_type_prices ? a.vehicle_type_prices : {};
                const bPrices = typeof b.vehicle_type_prices === 'object' && b.vehicle_type_prices ? b.vehicle_type_prices : {};
                aVal = parseFloat(aPrices[typeId] || aPrices[String(typeId)] || 0) || 0;
                bVal = parseFloat(bPrices[typeId] || bPrices[String(typeId)] || 0) || 0;
            } else {
                return 0;
            }
            
            if (typeof aVal === 'string') {
                return routesSortState.direction === 'asc' 
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            } else {
                return routesSortState.direction === 'asc' 
                    ? aVal - bVal
                    : bVal - aVal;
            }
        });
        
        contractRoutes = sorted;
        renderRoutesTable();
        
        // Update sort icons
        const table = document.getElementById('routesTable');
        if (table) {
            const headers = table.querySelectorAll('thead th.sortable');
            headers.forEach(header => {
                const sortIcon = header.querySelector('.sort-icon');
                if (sortIcon) {
                    const headerColumn = header.getAttribute('onclick');
                    if (headerColumn && headerColumn.includes(`'${column}'`)) {
                        sortIcon.textContent = routesSortState.direction === 'asc' ? '↑' : '↓';
                    } else {
                        sortIcon.textContent = '⇅';
                    }
                }
            });
        }
    };
    
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
                // Edit button clicked
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
                // Delete button clicked
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
    
    // Setup file upload UI
    function setupFileUploadUI() {
        const fileInput = document.getElementById('excelFile');
        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileUploadContent = fileUploadArea?.querySelector('.file-upload-content');
        const fileUploadSelected = document.getElementById('fileUploadSelected');
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        const fileRemoveBtn = document.getElementById('fileRemoveBtn');
        
        if (!fileInput || !fileUploadArea || !fileUploadSelected || !fileNameDisplay) return;
        
        // Click to select file
        fileUploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Drag and drop handlers
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileUploadArea.classList.add('drag-over');
        });
        
        fileUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileUploadArea.classList.remove('drag-over');
        });
        
        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileUploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                updateFileDisplay();
            }
        });
        
        // File input change
        fileInput.addEventListener('change', () => {
            updateFileDisplay();
        });
        
        // Remove file button
        if (fileRemoveBtn) {
            fileRemoveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.value = '';
                updateFileDisplay();
            });
        }
        
        function updateFileDisplay() {
            if (fileInput.files && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                fileNameDisplay.textContent = file.name;
                if (fileUploadContent) fileUploadContent.style.display = 'none';
                fileUploadSelected.style.display = 'flex';
            } else {
                if (fileUploadContent) fileUploadContent.style.display = 'flex';
                fileUploadSelected.style.display = 'none';
            }
        }
    }
    
    async function handleExcelUpload(e) {
        e.preventDefault();
        const fileInput = document.getElementById('excelFile');
        const uploadBtn = document.getElementById('uploadSubmitBtn');
        
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
            showToast('warning', tVehicles.select_file || 'Please select a file');
            return;
        }
        
        // Add loading state
        if (uploadBtn) {
            uploadBtn.classList.add('loading');
            uploadBtn.disabled = true;
        }
        
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('excel_file', file);
        formData.append('contract_id', CONTRACT_ID);
        
        // Add CSRF token for FormData
        const token = getCsrfToken();
        if (token) {
            formData.append('csrf_token', token);
        }
        
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
        } finally {
            // Remove loading state
            const uploadBtn = document.getElementById('uploadSubmitBtn');
            if (uploadBtn) {
                uploadBtn.classList.remove('loading');
                uploadBtn.disabled = false;
            }
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
            showConfirmDialog(
                tVehicles.delete_route_confirm || 'Are you sure you want to delete this route?',
                async () => {
                    await performDeleteRoute(routeId);
                }
            );
        }
    };
    
    async function performDeleteRoute(routeId) {
        try {
            const resp = await window.apiFetch(`${API_BASE}?action=contract_route&id=${routeId}`, {
                method: 'DELETE'
            });
            const res = await resp.json();
            
            // Handle CSRF token errors
            if (!res.success && res.message && res.message.toLowerCase().includes('csrf')) {
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
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
        const form = document.getElementById('addRouteForm');
        // Clear form
        if (form) {
            form.reset();
            clearFormErrors(form);
        }
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
                clearFormErrors(form);
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
        
        // Clear previous errors
        clearFormErrors(document.getElementById('addRouteForm'));
        
        // Validate: From ve To ikisi de dolu ve aynıysa girilemez
        if (fromLocation && toLocation && fromLocation === toLocation) {
            highlightFieldError('add_from_location');
            highlightFieldError('add_to_location');
            showToast('error', tVehicles.from_to_same_error || 'From and To locations cannot be the same');
            return;
        }
        
        // Validate: En az biri dolu olmalı
        if (!fromLocation && !toLocation) {
            highlightFieldError('add_from_location');
            highlightFieldError('add_to_location');
            showToast('warning', tVehicles.at_least_one_location_required || 'At least one location (From or To) is required');
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
        
        // Get CSRF token
        const token = getCsrfToken();
        if (!token) {
            showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
            return;
        }
        
        const createData = {
            contract_id: CONTRACT_ID,
            from_location: fromLocation,
            to_location: toLocation,
            vehicle_type_prices: vehicleTypePrices,
            currency_code: currencyCode || null,
            csrf_token: token
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
            
            // Handle CSRF token errors
            if (!res.success && res.message && res.message.toLowerCase().includes('csrf')) {
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            if (res.success) {
                showToast('success', res.message || (tCommon.saved_successfully || 'Route added successfully'));
                closeAddRouteModal();
                await loadContractRoutes();
            } else {
                handleApiError('addRouteForm', res.message || (tCommon.save_failed || 'Save failed'));
            }
        } catch (e) {
            console.error('Error adding route:', e);
            showToast('error', `${tCommon.save_failed || 'Save failed'}: ${e.message || 'Unknown error'}`);
        }
    }
    
    window.openEditRouteModal = async function(routeId) {
        // Open edit route modal
        
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
        
        // Route data loaded
        
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
                        
                        // Setting price for vehicle type
                        
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
        
        // Opening edit route modal
        
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
                clearFormErrors(form);
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
        
        // Clear previous errors
        clearFormErrors(document.getElementById('editRouteForm'));
        
        // Validate: From ve To ikisi de dolu ve aynıysa girilemez
        if (fromLocation && toLocation && fromLocation === toLocation) {
            highlightFieldError('edit_from_location');
            highlightFieldError('edit_to_location');
            showToast('error', tVehicles.from_to_same_error || 'From and To locations cannot be the same');
            return;
        }
        
        // Validate: En az biri dolu olmalı
        if (!fromLocation && !toLocation) {
            highlightFieldError('edit_from_location');
            highlightFieldError('edit_to_location');
            showToast('warning', tVehicles.at_least_one_location_required || 'At least one location (From or To) is required');
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
        
        // Get CSRF token
        const token = getCsrfToken();
        if (!token) {
            showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
            return;
        }
        
        // Updating route with new prices
        
        const updateData = {
            id: routeId,
            from_location: fromLocation,
            to_location: toLocation,
            vehicle_type_prices: vehicleTypePrices,
            currency_code: currencyCode || null,
            csrf_token: token
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
            
            // Handle CSRF token errors
            if (!res.success && res.message && res.message.toLowerCase().includes('csrf')) {
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            if (res.success) {
                showToast('success', res.message || (tCommon.saved_successfully || 'Saved successfully'));
                closeEditRouteModal();
                await loadContractRoutes();
            } else {
                handleApiError('editRouteForm', res.message || (tCommon.save_failed || 'Save failed'));
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
            const sampleText = col.sample ? `(${col.sample})` : '';
            const emptyIndicator = !col.sample ? ' [BOŞ]' : '';
            html += `<option value="${col.index}" ${selected ? 'selected' : ''}>
                Column ${col.index + 1}: ${col.header} ${sampleText}${emptyIndicator}
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
            const sampleText = col.sample ? `(${col.sample})` : '';
            const emptyIndicator = !col.sample ? ' [BOŞ]' : '';
            html += `<option value="${col.index}" ${selected ? 'selected' : ''}>
                Column ${col.index + 1}: ${col.header} ${sampleText}${emptyIndicator}
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
                const sampleText = col.sample ? `(${col.sample})` : '';
                const emptyIndicator = !col.sample ? ' [BOŞ]' : '';
                optionsHtml += `<option value="${col.index}" ${selected ? 'selected' : ''}>
                    Column ${col.index + 1}: ${col.header} ${sampleText}${emptyIndicator}
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
        const fromLocationSelect = document.getElementById('map_from_location');
        const toLocationSelect = document.getElementById('map_to_location');
        
        const fromLocationValue = fromLocationSelect?.value ?? '';
        const toLocationValue = toLocationSelect?.value ?? '';
        
        // Validate required fields - check if values are set (can be "0" which is valid)
        if (fromLocationValue === '' || toLocationValue === '') {
            const fromLocationText = tVehicles.from_location || 'From';
            const toLocationText = tVehicles.to_location || 'To';
            highlightFieldError('map_from_location');
            highlightFieldError('map_to_location');
            showToast('warning', tVehicles.map_required_fields || `Please map all required fields (${fromLocationText}, ${toLocationText})`);
            return;
        }
        
        // Convert to integers - parseInt will handle "0" correctly
        const fromLocationIndex = parseInt(fromLocationValue, 10);
        const toLocationIndex = parseInt(toLocationValue, 10);
        
        // Validate that conversion was successful and indices are non-negative
        if (isNaN(fromLocationIndex) || isNaN(toLocationIndex) || fromLocationIndex < 0 || toLocationIndex < 0) {
            console.error('Invalid column mapping:', {
                fromLocationValue,
                toLocationValue,
                fromLocationIndex,
                toLocationIndex
            });
            const fromLocationText = tVehicles.from_location || 'From';
            const toLocationText = tVehicles.to_location || 'To';
            highlightFieldError('map_from_location');
            highlightFieldError('map_to_location');
            showToast('error', `Invalid column mapping. Please select valid columns for "${fromLocationText}" and "${toLocationText}".`);
            return;
        }
        
        // Validate: From ve To aynı kolonu seçerse eklemesin
        if (fromLocationIndex === toLocationIndex) {
            highlightFieldError('map_from_location');
            highlightFieldError('map_to_location');
            showToast('error', tVehicles.from_to_same_error || 'From and To locations cannot be mapped to the same column');
            return;
        }
        
        // Debug logging (only in development)
        if (window.DEBUG_MODE) {
            console.log('Column mapping validated:', {
                from_location: fromLocationIndex,
                to_location: toLocationIndex
            });
        }
        
        // Collect vehicle type mappings dynamically
        // Use the correct selector: rows with data-vehicle-type-row attribute
        const vehicleTypeMappings = {};
        const vehicleTypeRows = document.querySelectorAll('#mappingTableSection tr[data-vehicle-type-row]');
        
        vehicleTypeRows.forEach(row => {
            const select = row.querySelector('select');
            if (select && select.id.startsWith('map_vehicle_type_')) {
                const typeId = select.id.replace('map_vehicle_type_', '');
                const colIndex = select.value;
                // Vehicle type mapping found - colIndex can be "0" which is valid
                if (colIndex !== '' && colIndex !== null && colIndex !== undefined) {
                    const colIndexInt = parseInt(colIndex);
                    if (!isNaN(colIndexInt)) {
                        // Store typeId as integer key to match backend expectation
                        vehicleTypeMappings[parseInt(typeId)] = colIndexInt;
                    }
                } else if (window.DEBUG_MODE) {
                    console.warn('Vehicle type', typeId, 'has no column selected');
                }
            }
        });
        
        // Get manual currency (only option now)
        const manualCurrency = document.getElementById('map_currency_manual')?.value;
        
        // Convert to integers and ensure proper format
        const cleanMapping = {
            from_location: fromLocationIndex,
            to_location: toLocationIndex,
            vehicle_types: vehicleTypeMappings // Object with type_id (int) => column_index (int)
        };
        
        // Debug logging (only in development)
        if (window.DEBUG_MODE) {
            console.log('Clean mapping:', cleanMapping);
        }
        
        // Complete mapping prepared
        
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
        
        // Add CSRF token for FormData
        const tokenForMapping = getCsrfToken();
        if (tokenForMapping) {
            formData.append('csrf_token', tokenForMapping);
        }
        
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
                has_header: fullDataRes.has_header !== undefined ? fullDataRes.has_header : hasHeader, // Use server's has_header value
                manual_currency: manualCurrency || null // Manual currency for all rows
            };
            
            // Debug logging - detailed (only in development mode)
            if (window.DEBUG_MODE && fullDataRes.excel_rows && fullDataRes.excel_rows.length > 0) {
                const firstRow = fullDataRes.excel_rows[0] || [];
                console.log('Sending save request with:', {
                    contract_id: CONTRACT_ID,
                    column_mapping: cleanMapping,
                    excel_rows_count: fullDataRes.excel_rows.length,
                    has_header: saveData.has_header,
                    first_row_preview: firstRow.slice(0, 10)
                });
            }
            
            // Add CSRF token to saveData
            const token2 = getCsrfToken();
            if (token2) {
                saveData.csrf_token = token2;
            }
            
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
            
            // Debug: Log save response
            // Debug logging (only in development)
            if (window.DEBUG_MODE) {
                console.log('Save response:', saveRes);
            }
            
            if (saveRes.success) {
                const message = saveRes.message || (tVehicles.routes_uploaded || 'Routes uploaded successfully');
                if (window.DEBUG_MODE) {
                    console.log('✅ Import successful:', {
                        saved_count: saveRes.saved_count || 0,
                        skipped_count: saveRes.skipped_count || 0,
                        skip_reasons: saveRes.skip_reasons || {}
                    });
                }
                showToast('success', message);
                closeUploadModal();
                await loadContractRoutes();
                // Clear stored file
                excelFileData = null;
            } else {
                console.error('❌ Import failed:', saveRes.message);
                showToast('error', saveRes.message || (tCommon.save_failed || 'Save failed'));
            }
        } catch (e) {
            console.error('Error saving mapping:', e);
            showToast('error', `${tCommon.save_failed || 'Save failed'}: ${e.message || 'Unknown error'}`);
        }
    }
    
    // ============================================
    // FORM ERROR HANDLING FUNCTIONS
    // ============================================
    
    // Clear form errors
    function clearFormErrors(form) {
        if (!form) return;
        const errorFields = form.querySelectorAll('input.error, select.error, textarea.error, input.invalid, select.invalid, textarea.invalid');
        errorFields.forEach(field => {
            if (field && (field.tagName === 'INPUT' || field.tagName === 'SELECT' || field.tagName === 'TEXTAREA')) {
                field.classList.remove('error', 'invalid', 'has-error');
                field.style.borderColor = '';
                field.style.backgroundColor = '';
                field.removeAttribute('aria-invalid');
            }
        });
    }
    
    // Highlight field error (red border/background)
    function highlightFieldError(fieldName) {
        // Try to find field by ID first
        let field = document.getElementById(fieldName);
        
        // If not found by ID, try by name attribute in active modal
        if (!field) {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                field = activeModal.querySelector(`[name="${fieldName}"]`);
            }
        }
        
        // Fallback to global search
        if (!field) {
            field = document.querySelector(`[name="${fieldName}"]`);
        }
        
        // If still not found, try by ID without prefix
        if (!field && fieldName.startsWith('add_')) {
            field = document.getElementById(fieldName.replace('add_', ''));
        }
        if (!field && fieldName.startsWith('edit_')) {
            field = document.getElementById(fieldName.replace('edit_', ''));
        }
        
        if (!field) {
            console.warn('Field not found:', fieldName);
            return;
        }
        
        // Add error classes for red border/background
        field.classList.add('error');
        field.classList.add('invalid');
        field.classList.add('has-error');
        field.setAttribute('aria-invalid', 'true');
        
        // Force redraw with inline styles
        field.style.borderColor = '#dc2626';
        field.style.backgroundColor = '#fef2f2';
        field.offsetHeight; // Force reflow
        
        // Clear error when user starts typing
        const clearError = () => {
            field.classList.remove('error', 'invalid', 'has-error');
            field.removeAttribute('aria-invalid');
            field.style.borderColor = '';
            field.style.backgroundColor = '';
            field.removeEventListener('input', clearError);
            field.removeEventListener('change', clearError);
        };
        
        field.addEventListener('input', clearError, { once: true });
        field.addEventListener('change', clearError, { once: true });
        
        // Scroll to error field
        setTimeout(() => {
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                field.focus();
            }, 200);
        }, 50);
    }
    
    // Handle API errors and show on appropriate field
    function handleApiError(formId, errorMessage) {
        if (!errorMessage) return;
        
        const lowerMessage = errorMessage.toLowerCase();
        const form = document.getElementById(formId);
        
        if (!form) {
            // Fallback to toast if form not found
            showToast('error', errorMessage);
            return;
        }
        
        // Clear previous errors first
        clearFormErrors(form);
        
        // Route form errors
        if (formId === 'addRouteForm' || formId === 'editRouteForm') {
            // From/To location errors
            if (lowerMessage.includes('from') || lowerMessage.includes('to') || lowerMessage.includes('location')) {
                if (formId === 'addRouteForm') {
                    if (lowerMessage.includes('from')) highlightFieldError('add_from_location');
                    if (lowerMessage.includes('to')) highlightFieldError('add_to_location');
                    if (!lowerMessage.includes('from') && !lowerMessage.includes('to')) {
                        highlightFieldError('add_from_location');
                        highlightFieldError('add_to_location');
                    }
                } else {
                    if (lowerMessage.includes('from')) highlightFieldError('edit_from_location');
                    if (lowerMessage.includes('to')) highlightFieldError('edit_to_location');
                    if (!lowerMessage.includes('from') && !lowerMessage.includes('to')) {
                        highlightFieldError('edit_from_location');
                        highlightFieldError('edit_to_location');
                    }
                }
                showToast('error', errorMessage);
            }
            // Same location error
            else if (lowerMessage.includes('same') || lowerMessage.includes('cannot be the same')) {
                if (formId === 'addRouteForm') {
                    highlightFieldError('add_from_location');
                    highlightFieldError('add_to_location');
                } else {
                    highlightFieldError('edit_from_location');
                    highlightFieldError('edit_to_location');
                }
                showToast('error', errorMessage);
            }
            // Duplicate route error
            else if (lowerMessage.includes('already exists') || lowerMessage.includes('duplicate')) {
                if (formId === 'addRouteForm') {
                    highlightFieldError('add_from_location');
                    highlightFieldError('add_to_location');
                } else {
                    highlightFieldError('edit_from_location');
                    highlightFieldError('edit_to_location');
                }
                showToast('error', errorMessage);
            }
            // Show toast as fallback
            else {
                showToast('error', errorMessage);
            }
        } else {
            // Fallback to toast for unknown forms
            showToast('error', errorMessage);
        }
    }
    
    // Toast notifications use global showToast from toast.js
    // Ensure showToast is available globally
    if (typeof window.showToast !== 'function') {
        console.error('showToast function not available. Make sure toast.js is loaded before this script.');
    }
})();

