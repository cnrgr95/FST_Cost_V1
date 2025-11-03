// vehicles Page JavaScript
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
    
    // Get translations
    const t = window.Translations || {};
    const tVehicles = t.vehicles || {};
    const tCommon = t.common || {};
    const tSidebar = t.sidebar || {};
    
    // Get initial tab from URL hash or localStorage, default to 'companies'
    function getInitialTab() {
        // First, try URL hash
        if (window.location.hash) {
            const hashTab = window.location.hash.replace('#', '');
            if (['companies', 'types', 'contracts'].includes(hashTab)) {
                return hashTab;
            }
        }
        // Then, try localStorage
        const savedTab = localStorage.getItem('vehicles_active_tab');
        if (savedTab && ['companies', 'types', 'contracts'].includes(savedTab)) {
            return savedTab;
        }
        // Default to companies
        return 'companies';
    }
    
    let currentTab = getInitialTab();
    let currentData = {
        cities: [],
        companies: [],
        types: [],
        contracts: []
    };
    let activeRequests = new Map(); // Track active requests for cancellation
    
    // Initialize date range picker helper functions (from global library)
    function formatDateDisplay(isoStr){
        if (!isoStr) return '';
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoStr)) return isoStr;
        if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
            const d = new Date(isoStr + 'T00:00:00');
            if (d && !isNaN(d.getTime())) {
                const day=d.getDate().toString().padStart(2,'0'); 
                const m=(d.getMonth()+1).toString().padStart(2,'0'); 
                return `${day}/${m}/${d.getFullYear()}`;
            }
        }
        return isoStr;
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        initTabs();
        
        // Set initial tab based on saved state
        switchTab(currentTab);
        
        // Listen for hash changes (browser back/forward)
        window.addEventListener('hashchange', function() {
            const hashTab = window.location.hash.replace('#', '');
            if (['companies', 'types', 'contracts'].includes(hashTab) && hashTab !== currentTab) {
                switchTab(hashTab);
            }
        });
        
        // Initialize date range picker for contract form
        if (typeof window.initializeDateRangePicker === 'function') {
            const translations = {
                common: tCommon
            };
            window.initializeDateRangePicker('contract_date_range', 'contract_start_date', 'contract_end_date', 'contractRangePicker', translations);
        }
        
        // Initialize select search for all selects
        if (typeof window.initializeSelectSearch === 'function') {
            document.querySelectorAll('select:not([data-search="false"])').forEach(select => {
                window.initializeSelectSearch(select);
            });
        }
        
        // Setup modal close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Setup form submissions
        const companyForm = document.getElementById('companyForm');
        const typeForm = document.getElementById('typeForm');
        const contractForm = document.getElementById('contractForm');
        
        if (companyForm) {
            companyForm.addEventListener('submit', handleCompanySubmit);
        }
        if (typeForm) {
            typeForm.addEventListener('submit', handleTypeSubmit);
        }
        if (contractForm) {
            contractForm.addEventListener('submit', handleContractSubmit);
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
    
    // Tab initialization
    function initTabs() {
        document.querySelectorAll('.vehicles-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        });
    }
    
    // Switch tabs
    function switchTab(tab) {
        if (!['companies', 'types', 'contracts'].includes(tab)) {
            tab = 'companies'; // Fallback to default
        }
        
        currentTab = tab;
        
        // Save tab state to localStorage and URL hash
        localStorage.setItem('vehicles_active_tab', tab);
        window.location.hash = tab;
        
        // Update active tab
        document.querySelectorAll('.vehicles-tab').forEach(t => t.classList.remove('active'));
        const activeTabButton = document.querySelector(`[data-tab="${tab}"]`);
        if (activeTabButton) {
            activeTabButton.classList.add('active');
        }
        
        // Update active content
        document.querySelectorAll('.vehicles-content').forEach(c => c.classList.remove('active'));
        const activeContent = document.getElementById(`${tab}-content`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
        
        // Load data
        loadData(tab);
    }
    
    // Load data for current tab
    function loadData(type) {
        showLoading(type);
        fetchData(type);
    }
    
    // Fetch data from API
    async function fetchData(type) {
        // Cancel previous request for this type if still pending
        if (activeRequests.has(type)) {
            const controller = activeRequests.get(type);
            controller.abort();
        }
        
        // Create new AbortController for this request
        const controller = new AbortController();
        activeRequests.set(type, controller);
        
        try {
            let url;
            if (type === 'cities') {
                url = API_BASE.replace('vehicles.php', 'locations.php') + '?action=cities';
            } else {
                url = `${API_BASE}?action=${type}`;
            }
            
            const startTime = performance.now();
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            const result = await response.json();
            const loadTime = performance.now() - startTime;
            
            // Remove from active requests
            activeRequests.delete(type);
            
            if (result.success) {
                currentData[type] = result.data || [];
                renderTable(type);
                // Log performance (can be removed in production)
                if (loadTime > 500) {
                    // Performance monitoring: Slow load detected (removed in production)
                }
            } else {
                currentData[type] = [];
                renderTable(type);
                showToast('error', result.message);
            }
        } catch (error) {
            // Remove from active requests
            activeRequests.delete(type);
            
            // Don't show error if request was cancelled
            if (error.name === 'AbortError') {
                return;
            }
            
            console.error('Error fetching data:', error);
            currentData[type] = [];
            renderTable(type);
            showToast('error', tCommon.failed_to_load_data || 'Failed to load data');
        }
    }
    
    // Render table
    function renderTable(type, dataToRender = null) {
        const container = document.getElementById(`${type}-content`);
        const data = dataToRender !== null ? dataToRender : currentData[type];
        
        if (data.length === 0) {
            let noFoundText, addText, typeText;
            if (type === 'companies') {
                noFoundText = tVehicles.no_companies;
                addText = tVehicles.add_company;
                typeText = tVehicles.vehicle_company;
            } else if (type === 'types') {
                noFoundText = tVehicles.no_types;
                addText = tVehicles.add_type;
                typeText = tVehicles.vehicle_type;
            } else if (type === 'contracts') {
                noFoundText = tVehicles.no_contracts;
                addText = tVehicles.add_contract;
                typeText = tVehicles.contracts;
            }
            
            container.innerHTML = `
                <div class="vehicles-table-container">
                    <div class="vehicles-table-header">
                        <div class="vehicles-table-title">${typeText}</div>
                        <button class="btn-add" onclick="window.openModal('${type}')">
                            <span class="material-symbols-rounded">add</span>
                            ${addText || 'Add New'}
                        </button>
                    </div>
                    <div class="empty-state">
                        <span class="material-symbols-rounded">inventory_2</span>
                        <h3>${noFoundText}</h3>
                        <p>${addText}</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let typeText, addText;
        if (type === 'companies') {
            typeText = tVehicles.vehicle_company;
            addText = tVehicles.add_company;
        } else if (type === 'types') {
            typeText = tVehicles.vehicle_type;
            addText = tVehicles.add_type;
        } else if (type === 'contracts') {
            typeText = tVehicles.contracts;
            addText = tVehicles.add_contract;
        }
        
        const totalCount = data.length;
        const iconMap = {
            'companies': 'business',
            'types': 'directions_car',
            'contracts': 'description'
        };
        
        let html = '<div class="vehicles-table-container">';
        html += '<div class="vehicles-table-header">';
        html += `<div class="vehicles-table-title">
                    <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 8px; font-size: 24px;">${iconMap[type] || 'list'}</span>
                    ${typeText} 
                    <span class="table-count-badge">${totalCount}</span>
                 </div>`;
        html += '<div class="table-actions-group">';
        html += `<div class="search-box">
                    <span class="material-symbols-rounded search-icon">search</span>
                    <input type="text" 
                           id="${type}SearchInput" 
                           placeholder="${tCommon.search || 'Search...'}" 
                           class="search-input"
                           onkeyup="filterVehiclesTable('${type}', this.value)">
                    <button class="search-clear search-clear-hidden" id="${type}SearchClear" onclick="clearVehiclesSearch('${type}')">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                 </div>`;
        html += `<button class="btn-add" onclick="window.openModal('${type}')" title="${addText || 'Add New'}">
                    <span class="material-symbols-rounded">add</span>
                    ${addText || 'Add New'}
                 </button>`;
        html += '</div>';
        html += '</div>';
        html += '<div class="currencies-table-section">';
        html += `<table class="currencies-table" id="${type}Table">`;
        
         // Table headers with sortable
         if (type === 'companies') {
             html += `<thead><tr>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'name')">
                            ${tVehicles.company_name || 'Name'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'city_name')">
                            ${tVehicles.city || 'City'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'region_name')">
                            ${tVehicles.region || 'Region'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'country_name')">
                            ${tVehicles.country || 'Country'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="no-sort">${tVehicles.actions || 'Actions'}</th>
                     </tr></thead>`;
         } else if (type === 'types') {
             html += `<thead><tr>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'name')">
                            ${tVehicles.type_name || 'Name'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'company_name')">
                            ${tVehicles.vehicle_company || 'Vehicle Company'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'min_pax')">
                            ${tVehicles.min_pax || 'Min Pax'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'max_pax')">
                            ${tVehicles.max_pax || 'Max Pax'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'city_name')">
                            ${tVehicles.city || 'City'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'region_name')">
                            ${tVehicles.region || 'Region'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'country_name')">
                            ${tVehicles.country || 'Country'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="no-sort">${tVehicles.actions || 'Actions'}</th>
                     </tr></thead>`;
        } else if (type === 'contracts') {
            html += `<thead><tr>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'contract_code')">
                            ${tVehicles.contract_code || 'Contract Code'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'company_name')">
                            ${tVehicles.vehicle_company || 'Company'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'start_date')">
                            ${tVehicles.start_date || 'Start Date'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortVehiclesTable('${type}', 'end_date')">
                            ${tVehicles.end_date || 'End Date'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="no-sort">${tVehicles.actions || 'Actions'}</th>
                     </tr></thead>`;
         }
        
        html += `<tbody id="${type}TableBody">`;
        data.forEach((item, index) => {
            html += buildTableRow(type, item, index);
        });
        html += '</tbody></table>';
        html += '<div class="table-footer">';
        html += `<div class="table-info">${tCommon.showing || 'Showing'} <strong>${totalCount}</strong> ${totalCount === 1 ? 'item' : 'items'}</div>`;
        html += '</div>';
        html += '</div></div>';
        
        container.innerHTML = html;
        
        // Store original data for filtering and sorting
        window[`${type}TableData`] = data;
        
        // Attach event listeners to action buttons
        attachActionListeners();
    }
    
    // Attach event listeners to action buttons
    function attachActionListeners() {
        // Find all edit buttons and attach click handlers
        document.querySelectorAll('.btn-edit[data-item-type][data-item-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.getAttribute('data-item-type');
                const id = parseInt(this.getAttribute('data-item-id'));
                window.editItem(type, id);
            });
        });
        
        // Find all delete buttons and attach click handlers
        document.querySelectorAll('.btn-delete[data-item-type][data-item-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.getAttribute('data-item-type');
                const id = parseInt(this.getAttribute('data-item-id'));
                window.deleteItem(type, id);
            });
        });
    }
    
    // Build table row with data attributes for filtering
    function buildTableRow(type, item, index) {
        const escapedName = window.escapeHtml ? window.escapeHtml(item.name || '') : (item.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const escapedCode = item.contract_code ? (window.escapeHtml ? window.escapeHtml(item.contract_code) : item.contract_code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')) : '';
        
        let html = `<tr data-index="${index}" 
                     data-name="${(item.name || '').toLowerCase()}"`;
        
        if (type === 'companies') {
            html += ` data-city="${(item.city_name || '').toLowerCase()}" 
                     data-region="${(item.region_name || '').toLowerCase()}" 
                     data-country="${(item.country_name || '').toLowerCase()}">`;
            html += `<td><strong>${escapedName}</strong></td>`;
            html += `<td>${window.escapeHtml ? window.escapeHtml(item.city_name || '-') : (item.city_name || '-')}</td>`;
            html += `<td>${window.escapeHtml ? window.escapeHtml(item.region_name || '-') : (item.region_name || '-')}</td>`;
            html += `<td><span class="location-badge">${window.escapeHtml ? window.escapeHtml(item.country_name || '-') : (item.country_name || '-')}</span></td>`;
        } else if (type === 'types') {
            html += ` data-company="${(item.company_name || '').toLowerCase()}" 
                     data-city="${(item.city_name || '').toLowerCase()}" 
                     data-region="${(item.region_name || '').toLowerCase()}" 
                     data-country="${(item.country_name || '').toLowerCase()}">`;
            html += `<td><strong>${escapedName}</strong></td>`;
            html += `<td>${window.escapeHtml ? window.escapeHtml(item.company_name || '-') : (item.company_name || '-')}</td>`;
            html += `<td>${item.min_pax !== null && item.min_pax !== undefined ? item.min_pax : '-'}</td>`;
            html += `<td>${item.max_pax !== null && item.max_pax !== undefined ? item.max_pax : '-'}</td>`;
            html += `<td>${window.escapeHtml ? window.escapeHtml(item.city_name || '-') : (item.city_name || '-')}</td>`;
            html += `<td>${window.escapeHtml ? window.escapeHtml(item.region_name || '-') : (item.region_name || '-')}</td>`;
            html += `<td><span class="location-badge">${window.escapeHtml ? window.escapeHtml(item.country_name || '-') : (item.country_name || '-')}</span></td>`;
        } else if (type === 'contracts') {
            html += ` data-code="${((item.contract_code || '') + '').toLowerCase()}" 
                     data-company="${(item.company_name || '').toLowerCase()}">`;
            html += `<td><span class="code-badge">${escapedCode || '-'}</span></td>`;
            html += `<td>${window.escapeHtml ? window.escapeHtml(item.company_name || '-') : (item.company_name || '-')}</td>`;
            html += `<td>${formatDateDisplay(item.start_date) || '-'}</td>`;
            html += `<td>${formatDateDisplay(item.end_date) || '-'}</td>`;
        }
        
        html += '<td>';
        html += `<div class="action-buttons">`;
        if (type === 'contracts') {
            html += `<a href="${(pageConfig.basePath || '../../')}app/definitions/contract-detail.php?id=${item.id}" class="btn-icon" title="${tVehicles.manage_contract || 'Manage Contract'}" style="color: #3b82f6;">
                        <span class="material-symbols-rounded">settings</span>
                    </a>`;
        }
        html += `<button class="btn-icon" onclick="window.editItem('${type}', ${item.id})" title="${tCommon.edit || 'Edit'} ${escapedName}">
                    <span class="material-symbols-rounded">edit</span>
                 </button>`;
        html += `<button class="btn-icon btn-danger" onclick="window.deleteItem('${type}', ${item.id})" title="${tCommon.delete || 'Delete'} ${escapedName}">
                    <span class="material-symbols-rounded">delete</span>
                 </button>`;
        html += `</div>`;
        html += '</td>';
        html += '</tr>';
        
        return html;
    }
    
    // Show loading state
    function showLoading(type) {
        const container = document.getElementById(`${type}-content`);
        const loadingText = (() => {
            if (type === 'companies') return tVehicles.loading_companies || tCommon.loading;
            if (type === 'types') return tVehicles.loading_types || tCommon.loading;
            if (type === 'contracts') return tVehicles.loading_contracts || tCommon.loading;
            return tCommon.loading || 'Loading...';
        })();
        
        container.innerHTML = `
            <div class="loading" role="status" aria-live="polite">
                <span class="material-symbols-rounded loading-spinner">sync</span>
                <p>${loadingText}</p>
            </div>
        `;
    }
    
    // Show error
    function showError(message) {
        console.error(message);
        showToast('error', message || tCommon.error || 'Error');
    }
    
    // Open modal - Enhanced with body lock and focus management
    window.openModal = async function(type) {
        // Fix modal ID - companies -> companyModal, types -> typeModal, contracts -> contractModal
        let modalId, formId;
        if (type === 'companies') {
            modalId = 'companyModal';
            formId = 'companyForm';
        } else if (type === 'types') {
            modalId = 'typeModal';
            formId = 'typeForm';
        } else if (type === 'contracts') {
            modalId = 'contractModal';
            formId = 'contractForm';
        } else {
            console.warn('Unknown modal type:', type);
            return;
        }
        
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error('Modal not found:', modalId);
            return;
        }
        
        const form = document.getElementById(formId);
        if (!form) {
            console.error('Form not found:', formId);
            return;
        }
        
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        
        // Reset form
        form.reset();
        delete form.dataset.id;
        
        // Update modal title
        const title = modal.querySelector('h2');
        if (title) {
            if (type === 'companies') {
                title.textContent = tVehicles.add_company || 'Add Vehicle Company';
            } else if (type === 'types') {
                title.textContent = tVehicles.add_type || 'Add Vehicle Type';
            } else if (type === 'contracts') {
                title.textContent = tVehicles.add_contract || 'Add Contract';
            }
        }
        
        // Focus first input
        const firstInput = modal.querySelector('input:not([type="hidden"]):not([readonly]), select:not([disabled]), textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Load dependent data if needed
        if (type === 'companies') {
            await loadCitiesForSelect();
        } else if (type === 'types') {
            await loadCompaniesForSelect();
        } else if (type === 'contracts') {
            await loadCompaniesForContractSelect();
            // Clear contract code to show placeholder (code will be generated on save)
            const contractCodeInput = document.getElementById('contract_code');
            if (contractCodeInput) {
                contractCodeInput.value = '';
            }
            // Initialize date range picker when modal opens (important for contract modal)
            // Use setTimeout to ensure DOM is ready after modal opens
            setTimeout(() => {
                if (typeof window.initializeDateRangePicker === 'function') {
                    const translations = {
                        common: tCommon
                    };
                    // Re-initialize date range picker when contract modal opens
                    window.initializeDateRangePicker('contract_date_range', 'contract_start_date', 'contract_end_date', 'contractRangePicker', translations);
                }
            }, 100);
        }
    };
    
    // Close modal - Enhanced to work with specific modal IDs
    window.closeModal = function(modalId) {
        let targetModal;
        if (modalId) {
            targetModal = document.getElementById(modalId);
        } else {
            // Close all modals if no ID specified
            document.querySelectorAll('.modal.active').forEach(m => {
                m.classList.remove('active');
            });
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            
            // Reset all forms
            document.querySelectorAll('form').forEach(form => {
                form.reset();
                delete form.dataset.id;
            });
            
            // Reset contract form specifically
            const contractId = document.getElementById('contractId');
            if (contractId) {
                contractId.value = '';
            }
            
            const contractCodeInput = document.getElementById('contract_code');
            if (contractCodeInput && (!contractId || !contractId.value)) {
                contractCodeInput.readOnly = true;
                contractCodeInput.value = ''; // Clear value to show placeholder
            }
            return;
        }
        
        if (targetModal) {
            targetModal.classList.remove('active');
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            
            // Reset form in this modal
            const form = targetModal.querySelector('form');
            if (form) {
                form.reset();
                delete form.dataset.id;
            }
            
            // Reset contract form specifically if closing contract modal
            if (modalId === 'contractModal') {
                const contractId = document.getElementById('contractId');
                if (contractId) {
                    contractId.value = '';
                }
                
                const contractCodeInput = document.getElementById('contract_code');
                if (contractCodeInput && (!contractId || !contractId.value)) {
                    contractCodeInput.readOnly = true;
                    contractCodeInput.value = ''; // Clear value to show placeholder
                }
            }
        }
    };
    
    // Setup modal close buttons
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.modal .btn-close').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    closeModal(modal.id);
                }
            });
        });
    });
    
    // Edit item
    window.editItem = async function(type, id) {
        // If data for this type hasn't been loaded yet, load it first
        if (!currentData[type] || currentData[type].length === 0) {
            await fetchData(type);
        }
        
        const item = (currentData[type] || []).find(item => item.id == id);
        if (!item) {
            console.error((tCommon.item_not_found || 'Item not found') + ':', type, id);
            return;
        }
        
        // Fix modal ID - companies -> companyModal, types -> typeModal, contracts -> contractModal
        let modalId, formId;
        if (type === 'companies') {
            modalId = 'companyModal';
            formId = 'companyForm';
        } else if (type === 'types') {
            modalId = 'typeModal';
            formId = 'typeForm';
        } else if (type === 'contracts') {
            modalId = 'contractModal';
            formId = 'contractForm';
        }
        
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error('Modal not found:', modalId);
            return;
        }
        
        const form = document.getElementById(formId);
        if (!form) {
            console.error('Form not found:', formId);
            return;
        }
        
         // Update modal title
         const title = modal.querySelector('h2');
         if (title) {
             if (type === 'companies') {
                 title.textContent = tVehicles.edit_company || 'Edit Vehicle Company';
             } else if (type === 'types') {
                 title.textContent = tVehicles.edit_type || 'Edit Vehicle Type';
             } else if (type === 'contracts') {
                 title.textContent = tVehicles.edit_contract || 'Edit Contract';
             }
         }
        
        // Fill form
        form.dataset.id = id;
        
        if (type === 'companies') {
            form.querySelector('input[name="name"]').value = item.name;
            await loadCitiesForSelect();
            form.querySelector('select[name="city_id"]').value = item.city_id;
            // Fill contact information
            if (form.querySelector('input[name="contact_person"]')) {
                form.querySelector('input[name="contact_person"]').value = item.contact_person || '';
            }
            if (form.querySelector('input[name="contact_email"]')) {
                form.querySelector('input[name="contact_email"]').value = item.contact_email || '';
            }
            if (form.querySelector('input[name="contact_phone"]')) {
                form.querySelector('input[name="contact_phone"]').value = item.contact_phone || '';
            }
        } else if (type === 'types') {
            form.querySelector('input[name="name"]').value = item.name;
            await loadCompaniesForSelect();
            form.querySelector('select[name="vehicle_company_id"]').value = item.vehicle_company_id;
            const minPaxInput = form.querySelector('input[name="min_pax"]');
            if (minPaxInput) {
                minPaxInput.value = item.min_pax !== null && item.min_pax !== undefined ? item.min_pax : '';
            }
            const maxPaxInput = form.querySelector('input[name="max_pax"]');
            if (maxPaxInput) {
                maxPaxInput.value = item.max_pax !== null && item.max_pax !== undefined ? item.max_pax : '';
            }
        } else if (type === 'contracts') {
            document.getElementById('contractId').value = item.id;
            
            // First load companies, then set the value
            await loadCompaniesForContractSelect();
            
            // Set vehicle company after dropdown is populated
            const vehicleCompanySelect = document.getElementById('contract_vehicle_company_id');
            if (vehicleCompanySelect && item.vehicle_company_id) {
                vehicleCompanySelect.value = item.vehicle_company_id;
            }
            
            const contractCodeInput = document.getElementById('contract_code');
            if (contractCodeInput) {
                contractCodeInput.value = item.contract_code || '';
                // Keep readonly in edit mode too
                contractCodeInput.readOnly = true;
            }
            const startDate = item.start_date || '';
            const endDate = item.end_date || '';
            document.getElementById('contract_start_date').value = startDate;
            document.getElementById('contract_end_date').value = endDate;
            const rangeInput = document.getElementById('contract_date_range');
            if (rangeInput) {
                if (startDate && endDate) {
                    if (startDate === endDate) {
                        rangeInput.value = formatDateDisplay(startDate);
                    } else {
                        rangeInput.value = `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`;
                    }
                } else {
                    rangeInput.value = '';
                }
            }
        }
        
        modal.classList.add('active');
    };
    
     // Helper function to convert type to API action (singular form)
     function getApiAction(type) {
         const actionMap = {
             'companies': 'company',
             'types': 'type',
             'contracts': 'contract'
         };
         return actionMap[type] || type;
     }
    
    // Delete item
    window.deleteItem = async function(type, id) {
        const t = window.Translations || {};
        const tLoc = t.locations || {};
        const tDeps = t.dependencies || {};
        const deleteConfirmMessage = tVehicles.delete_confirm || tLoc.delete_confirm || 'Are you sure you want to delete this item?';
        
        showConfirmDialog(deleteConfirmMessage, async function() {
            try {
                // Get CSRF token from multiple sources
                let token = null;
                if (typeof window.getCsrfToken === 'function') {
                    token = window.getCsrfToken();
                } else if (window.pageConfig && window.pageConfig.csrfToken) {
                    token = window.pageConfig.csrfToken;
                } else if (pageConfig && pageConfig.csrfToken) {
                    token = pageConfig.csrfToken;
                }
                
                if (!token) {
                    console.error('CSRF token not found');
                    showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                    return;
                }
                
                const action = getApiAction(type);
                const response = await window.apiFetch(`${API_BASE}?action=${action}&id=${id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ csrf_token: token })
                });
                const result = await response.json();
                
                // Handle CSRF token errors
                if (!result.success && result.message && result.message.toLowerCase().includes('csrf')) {
                    showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                    console.error('CSRF token error:', result.message);
                    return;
                }
                
                if (result.success) {
                    currentData[type] = [];
                    loadData(type);
                    showToast('success', tCommon.item_deleted_successfully || 'Item deleted successfully');
                } else {
                    // Translate dependency messages
                    let errorMessage = result.message;
                    
                    // If API provides dependency_type and count, use them directly
                    if (result.dependency_type && result.count !== undefined) {
                        const depKey = result.dependency_type;
                        if (tDeps[depKey]) {
                            errorMessage = tDeps[depKey].replace('{count}', result.count);
                        }
                    } else if (errorMessage && typeof errorMessage === 'string') {
                        // Fallback: Try to match and translate dependency patterns from message
                        const companyTypesMatch = errorMessage.match(/company.*?(\d+).*?vehicle type/i);
                        if (companyTypesMatch) {
                            errorMessage = (tDeps.company_has_vehicle_types || errorMessage).replace('{count}', companyTypesMatch[1]);
                        }
                        
                        const companyContractsMatch = errorMessage.match(/company.*?(\d+).*?contract/i);
                        if (companyContractsMatch) {
                            errorMessage = (tDeps.company_has_contracts || errorMessage).replace('{count}', companyContractsMatch[1]);
                        }
                        
                        const typeContractsMatch = errorMessage.match(/vehicle type.*?(\d+).*?contract/i);
                        if (typeContractsMatch) {
                            errorMessage = (tDeps.type_has_contracts || errorMessage).replace('{count}', typeContractsMatch[1]);
                        }
                        
                        const contractRoutesMatch = errorMessage.match(/contract.*?(\d+).*?route/i);
                        if (contractRoutesMatch) {
                            errorMessage = (tDeps.contract_has_routes || errorMessage).replace('{count}', contractRoutesMatch[1]);
                        }
                    }
                    showToast('error', errorMessage);
                }
            } catch (error) {
                console.error('Error deleting item:', error);
                showToast('error', tCommon.delete_failed || 'Failed to delete item');
            }
        });
    };
    
     // Handle form submission
     function handleCompanySubmit(e) {
         e.preventDefault();
         const form = e.target;
         
         // Clear previous errors
         clearFormErrors(form);
         
         const formData = new FormData(form);
         const data = {
             name: formData.get('name'),
             city_id: formData.get('city_id'),
             contact_person: formData.get('contact_person'),
             contact_email: formData.get('contact_email'),
             contact_phone: formData.get('contact_phone')
         };
         
         if (form.dataset.id) {
             data.id = form.dataset.id;
             updateCompany(data);
         } else {
             createCompany(data);
         }
     }
     
    function handleTypeSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        // Clear previous errors
        clearFormErrors(form);
        
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            vehicle_company_id: formData.get('vehicle_company_id')
        };
        
        const minPax = formData.get('min_pax');
        const maxPax = formData.get('max_pax');
        if (minPax) {
            data.min_pax = minPax;
        }
        if (maxPax) {
            data.max_pax = maxPax;
        }
        
        if (form.dataset.id) {
            data.id = form.dataset.id;
            updateType(data);
        } else {
            createType(data);
        }
    }
    
    async function handleContractSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        // Clear previous errors
        clearFormErrors(form);
        
        // Validate date range input
        const dateRangeInput = document.getElementById('contract_date_range');
        const startDateInput = document.getElementById('contract_start_date');
        const endDateInput = document.getElementById('contract_end_date');
        
        // Check if date range is filled
        if (!dateRangeInput || !dateRangeInput.value || !dateRangeInput.value.trim()) {
            highlightFieldError('contract_date_range');
            showToast('error', tCommon.fill_required_fields || 'Please fill all required fields');
            return;
        }
        
        // Validate that start date is filled
        if (!startDateInput || !startDateInput.value) {
            highlightFieldError('contract_date_range');
            showToast('error', tCommon.fill_required_fields || 'Start date is required');
            return;
        }
        
        // If start is set but end is not, auto-fill end with same date (single day)
        if (startDateInput.value && !endDateInput.value) {
            endDateInput.value = startDateInput.value;
        }
        
        // Final validation - both must be set
        if (!endDateInput || !endDateInput.value) {
            highlightFieldError('contract_date_range');
            showToast('error', tCommon.end_date_required || 'End date is required');
            return;
        }
        
        // Generate contract code if empty
        let contractCode = document.getElementById('contract_code').value;
        if (!contractCode || contractCode.trim() === '') {
            try {
                const response = await fetch(`${API_BASE}?action=generate_contract_code`);
                const result = await response.json();
                if (result.success && result.contract_code) {
                    contractCode = result.contract_code;
                    document.getElementById('contract_code').value = contractCode;
                } else {
                    showToast('error', tCommon.error || 'Failed to generate contract code');
                    return;
                }
            } catch (error) {
                console.error('Error generating contract code:', error);
                showToast('error', tCommon.error || 'Failed to generate contract code');
                return;
            }
        }
        
        const data = {
            vehicle_company_id: document.getElementById('contract_vehicle_company_id').value,
            contract_code: contractCode,
            start_date: startDateInput.value,
            end_date: endDateInput.value
        };
        
        const contractId = document.getElementById('contractId').value;
        if (contractId) {
            data.id = contractId;
            updateContract(data);
        } else {
            createContract(data);
        }
    }
    
    // Note: editContractRoutes function removed - contract-routes.php page no longer exists
    
    // Create operations
    async function createCompany(data) {
        try {
            // Get CSRF token from multiple sources
            let token = null;
            if (typeof window.getCsrfToken === 'function') {
                token = window.getCsrfToken();
            } else if (window.pageConfig && window.pageConfig.csrfToken) {
                token = window.pageConfig.csrfToken;
            } else if (pageConfig && pageConfig.csrfToken) {
                token = pageConfig.csrfToken;
            }
            
            if (!token) {
                console.error('CSRF token not found');
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            data.csrf_token = token;
            
            const response = await fetch(`${API_BASE}?action=company`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            // Handle CSRF token errors
            if (!result.success && result.message && result.message.toLowerCase().includes('csrf')) {
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                console.error('CSRF token error:', result.message);
                return;
            }
            
            if (result.success) {
                currentData.companies = [];
                loadData('companies');
                closeModal();
                showToast('success', tVehicles.company_added || 'Vehicle company created successfully');
            } else {
                // Parse error message and show on appropriate field
                handleApiError('companyForm', result.message);
            }
        } catch (error) {
            console.error('Error creating company:', error);
            showToast('error', tCommon.save_failed || 'Failed to create company');
        }
    }
    
    async function createType(data) {
        try {
            // Get CSRF token from multiple sources
            let token = null;
            if (typeof window.getCsrfToken === 'function') {
                token = window.getCsrfToken();
            } else if (window.pageConfig && window.pageConfig.csrfToken) {
                token = window.pageConfig.csrfToken;
            } else if (pageConfig && pageConfig.csrfToken) {
                token = pageConfig.csrfToken;
            }
            
            if (!token) {
                console.error('CSRF token not found');
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            data.csrf_token = token;
            
            const response = await fetch(`${API_BASE}?action=type`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            // Handle CSRF token errors
            if (!result.success && result.message && result.message.toLowerCase().includes('csrf')) {
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                console.error('CSRF token error:', result.message);
                return;
            }
            
            if (result.success) {
                currentData.types = [];
                loadData('types');
                closeModal();
                showToast('success', tVehicles.type_added || 'Vehicle type created successfully');
            } else {
                // Parse error message and show on appropriate field
                handleApiError('typeForm', result.message);
            }
        } catch (error) {
            console.error('Error creating type:', error);
            showToast('error', tCommon.save_failed || 'Failed to create type');
        }
    }
    
    // Update operations
    async function updateCompany(data) {
        try {
            // Get CSRF token from multiple sources
            let token = null;
            if (typeof window.getCsrfToken === 'function') {
                token = window.getCsrfToken();
            } else if (window.pageConfig && window.pageConfig.csrfToken) {
                token = window.pageConfig.csrfToken;
            } else if (pageConfig && pageConfig.csrfToken) {
                token = pageConfig.csrfToken;
            }
            
            if (!token) {
                console.error('CSRF token not found');
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            data.csrf_token = token;
            
            const response = await fetch(`${API_BASE}?action=company`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            // Handle CSRF token errors
            if (!result.success && result.message && result.message.toLowerCase().includes('csrf')) {
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                console.error('CSRF token error:', result.message);
                return;
            }
            
            if (result.success) {
                currentData.companies = [];
                loadData('companies');
                closeModal();
                showToast('success', tVehicles.company_updated || 'Vehicle company updated successfully');
            } else {
                // Parse error message and show on appropriate field
                handleApiError('companyForm', result.message);
            }
        } catch (error) {
            console.error('Error updating company:', error);
            showToast('error', tCommon.update_failed || 'Failed to update company');
        }
    }
    
    async function updateType(data) {
        try {
            // Get CSRF token from multiple sources
            let token = null;
            if (typeof window.getCsrfToken === 'function') {
                token = window.getCsrfToken();
            } else if (window.pageConfig && window.pageConfig.csrfToken) {
                token = window.pageConfig.csrfToken;
            } else if (pageConfig && pageConfig.csrfToken) {
                token = pageConfig.csrfToken;
            }
            
            if (!token) {
                console.error('CSRF token not found');
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            data.csrf_token = token;
            
            const response = await fetch(`${API_BASE}?action=type`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            // Handle CSRF token errors
            if (!result.success && result.message && result.message.toLowerCase().includes('csrf')) {
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                console.error('CSRF token error:', result.message);
                return;
            }
            
            if (result.success) {
                currentData.types = [];
                loadData('types');
                closeModal();
                showToast('success', tVehicles.type_updated || 'Vehicle type updated successfully');
            } else {
                // Parse error message and show on appropriate field
                handleApiError('typeForm', result.message);
            }
        } catch (error) {
            console.error('Error updating type:', error);
            showToast('error', tCommon.update_failed || 'Failed to update type');
        }
    }
    
    // Contract operations
    async function createContract(data) {
        try {
            // Get CSRF token from multiple sources
            let token = null;
            if (typeof window.getCsrfToken === 'function') {
                token = window.getCsrfToken();
            } else if (window.pageConfig && window.pageConfig.csrfToken) {
                token = window.pageConfig.csrfToken;
            } else if (pageConfig && pageConfig.csrfToken) {
                token = pageConfig.csrfToken;
            }
            
            if (!token) {
                console.error('CSRF token not found');
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            data.csrf_token = token;
            
            const response = await fetch(`${API_BASE}?action=contract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            // Handle CSRF token errors
            if (!result.success && result.message && result.message.toLowerCase().includes('csrf')) {
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                console.error('CSRF token error:', result.message);
                return;
            }
            
            if (result.success) {
                currentData.contracts = [];
                loadData('contracts');
                closeModal();
                showToast('success', tVehicles.contract_added || 'Contract created successfully');
            } else {
                // Parse error message and show on appropriate field
                handleApiError('contractForm', result.message);
            }
        } catch (error) {
            console.error('Error creating contract:', error);
            showToast('error', tCommon.save_failed || 'Failed to create contract');
        }
    }
    
    async function updateContract(data) {
        try {
            // Get CSRF token from multiple sources
            let token = null;
            if (typeof window.getCsrfToken === 'function') {
                token = window.getCsrfToken();
            } else if (window.pageConfig && window.pageConfig.csrfToken) {
                token = window.pageConfig.csrfToken;
            } else if (pageConfig && pageConfig.csrfToken) {
                token = pageConfig.csrfToken;
            }
            
            if (!token) {
                console.error('CSRF token not found');
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            data.csrf_token = token;
            
            const response = await fetch(`${API_BASE}?action=contract`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            // Handle CSRF token errors
            if (!result.success && result.message && result.message.toLowerCase().includes('csrf')) {
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                console.error('CSRF token error:', result.message);
                return;
            }
            
            if (result.success) {
                currentData.contracts = [];
                loadData('contracts');
                closeModal();
                showToast('success', tVehicles.contract_updated || 'Contract updated successfully');
            } else {
                // Parse error message and show on appropriate field
                handleApiError('contractForm', result.message);
            }
        } catch (error) {
            console.error('Error updating contract:', error);
            showToast('error', tCommon.update_failed || 'Failed to update contract');
        }
    }
    
    // Load dependent data for selects
    async function loadCitiesForSelect() {
        // Fetch cities from locations API
        try {
            const locationsApi = API_BASE.replace('vehicles.php', 'locations.php');
            const response = await fetch(`${locationsApi}?action=cities`);
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                const select = document.querySelector('[name="city_id"]');
                if (select) {
                    select.innerHTML = `<option value="">${tVehicles.select_city || 'Select City'}</option>`;
                    result.data.forEach(city => {
                        select.innerHTML += `<option value="${city.id}">${city.name} (${city.region_name || ''} - ${city.country_name || ''})</option>`;
                    });
                }
            } else {
                console.warn('No cities found or API error');
                const select = document.querySelector('[name="city_id"]');
                if (select) {
                    select.innerHTML = `<option value="">${tVehicles.no_cities_found || 'No cities found'}</option>`;
                }
            }
        } catch (error) {
            console.error('Error loading cities:', error);
            const select = document.querySelector('[name="city_id"]');
            if (select) {
                select.innerHTML = `<option value="">${tVehicles.error_cities_load || 'Error loading cities'}</option>`;
            }
        }
    }
    
    async function loadCompaniesForSelect() {
        if (currentData.companies.length === 0) {
            await fetchData('companies');
        }
        
        const select = document.querySelector('[name="vehicle_company_id"]');
        if (select) {
             select.innerHTML = `<option value="">${tVehicles.select_dept || 'Select Vehicle Company'}</option>`;
            currentData.companies.forEach(company => {
                select.innerHTML += `<option value="${company.id}">${company.name} (${company.city_name || ''})</option>`;
            });
        }
    }
    
    async function loadCompaniesForContractSelect(selectId = 'contract_vehicle_company_id') {
        if (currentData.companies.length === 0) {
            await fetchData('companies');
        }
        
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = `<option value="">${tVehicles.select_dept || 'Select Vehicle Company'}</option>`;
            currentData.companies.forEach(company => {
                select.innerHTML += `<option value="${company.id}">${company.name} (${company.city_name || ''})</option>`;
            });
        }
    }
    
    // Generate contract code automatically
    async function generateAndSetContractCode() {
        try {
            const response = await fetch(`${API_BASE}?action=generate_contract_code`);
            const result = await response.json();
            
            if (result.success && result.contract_code) {
                const contractCodeInput = document.getElementById('contract_code');
                if (contractCodeInput) {
                    contractCodeInput.value = result.contract_code;
                }
            }
        } catch (error) {
            console.error('Error generating contract code:', error);
        }
    }
    
    // showToast is from toast.js
    
    // ============================================
    // ERROR HANDLING FUNCTIONS (from tours.js pattern)
    // ============================================
    
    // Clear form errors
    function clearFormErrors(form) {
        if (!form) return;
        
        // Remove error classes from all form fields
        const errorFields = form.querySelectorAll('input.error, select.error, textarea.error, input.invalid, select.invalid, textarea.invalid, input.has-error, select.has-error, textarea.has-error');
        errorFields.forEach(field => {
            field.classList.remove('error', 'invalid', 'has-error');
            field.removeAttribute('aria-invalid');
            field.setCustomValidity('');
            field.style.borderColor = '';
            field.style.backgroundColor = '';
        });
        
        // Clear error messages
        const errorMessages = form.querySelectorAll('.input-error-message');
        errorMessages.forEach(msg => {
            msg.textContent = '';
            msg.classList.remove('show', 'has-error');
            msg.style.display = '';
        });
    }
    
    // Show field error - IMMEDIATE VISUAL FEEDBACK
    function showFieldError(fieldName, message) {
        // Try to find field in active modal first
        const activeModal = document.querySelector('.modal.active');
        let field = null;
        
        if (activeModal) {
            field = activeModal.querySelector(`[name="${fieldName}"]`);
        }
        
        // Fallback to global search
        if (!field) {
            field = document.querySelector(`[name="${fieldName}"]`);
        }
        
        if (!field) {
            console.warn('Field not found:', fieldName);
            return;
        }
        
        // Apply error IMMEDIATELY
        applyFieldError(field, message);
    }
    
    // Highlight field error (only red border/background, no message below)
    function highlightFieldError(fieldName) {
        // Try to find field by ID first (for date-range-input)
        let field = document.getElementById(fieldName);
        
        // If not found by ID, try by name attribute
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
        
        // If still not found, try by ID
        if (!field) {
            field = document.getElementById(fieldName);
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
        
        // Scroll to error field
        setTimeout(() => {
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                field.focus();
            }, 200);
        }, 50);
    }
    
    // Apply field error with immediate visual feedback
    function applyFieldError(field, message) {
        if (!field) return;
        
        // Add multiple error classes IMMEDIATELY
        field.classList.add('error');
        field.classList.add('invalid');
        field.classList.add('has-error');
        field.setAttribute('aria-invalid', 'true');
        field.setCustomValidity(message);
        
        // Force validation report
        try {
            field.reportValidity();
        } catch (e) {
            // Ignore if not supported
        }
        
        // Show custom error message IMMEDIATELY
        const errorMsg = field.parentElement.querySelector('.input-error-message');
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.classList.add('show');
            errorMsg.classList.add('has-error');
            errorMsg.setAttribute('role', 'alert');
            errorMsg.style.display = 'block';
        }
        
        // Force redraw with inline styles
        field.style.borderColor = '#dc2626';
        field.style.backgroundColor = '#fef2f2';
        field.offsetHeight; // Force reflow
        
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
        
        if (formId === 'companyForm') {
            // Company name errors (duplicate names - only red field + toast popup, no field message)
            if (lowerMessage.includes('company') && lowerMessage.includes('name') && lowerMessage.includes('already exists') ||
                lowerMessage.includes('name') && lowerMessage.includes('already exists') && lowerMessage.includes('company') ||
                (lowerMessage.includes('already exists') && !lowerMessage.includes('contract') && !lowerMessage.includes('date'))) {
                // Show red field (no message below) and toast notification
                highlightFieldError('name');
                showToast('error', errorMessage);
            }
            // City errors
            else if (lowerMessage.includes('city') && (lowerMessage.includes('required') || lowerMessage.includes('invalid'))) {
                showFieldError('city_id', errorMessage);
                showToast('error', errorMessage);
            }
            // Generic name error (fallback)
            else if (lowerMessage.includes('name') && (lowerMessage.includes('required') || lowerMessage.includes('invalid'))) {
                showFieldError('name', errorMessage);
                showToast('error', errorMessage);
            }
            // Show toast as fallback
            else {
                showToast('error', errorMessage);
            }
        }
        else if (formId === 'typeForm') {
            // Type name errors (duplicate names - only red field + toast popup, no field message)
            // Check for "vehicle type" or "type" with "already exists" in the same company
            if ((lowerMessage.includes('vehicle type') || lowerMessage.includes('type')) && 
                (lowerMessage.includes('name') || lowerMessage.includes('already exists')) && 
                lowerMessage.includes('already exists') && 
                !lowerMessage.includes('contract')) {
                // Show red field (no message below) and toast notification
                highlightFieldError('name');
                showToast('error', errorMessage);
            }
            // Vehicle company errors
            else if (lowerMessage.includes('vehicle company') && (lowerMessage.includes('required') || lowerMessage.includes('invalid'))) {
                showFieldError('vehicle_company_id', errorMessage);
                showToast('error', errorMessage);
            }
            // Generic name error (fallback)
            else if (lowerMessage.includes('name') && (lowerMessage.includes('required') || lowerMessage.includes('invalid'))) {
                showFieldError('name', errorMessage);
                showToast('error', errorMessage);
            }
            // Show toast as fallback
            else {
                showToast('error', errorMessage);
            }
        }
        else if (formId === 'contractForm') {
            // Contract code errors
            if (lowerMessage.includes('contract code') && lowerMessage.includes('already exists')) {
                showFieldError('contract_code', errorMessage);
                showToast('error', errorMessage);
            }
            // Date range overlap errors
            else if (lowerMessage.includes('overlapping') || lowerMessage.includes('date range') || lowerMessage.includes('date')) {
                // Highlight date range input field
                highlightFieldError('contract_date_range');
                showToast('error', errorMessage);
            }
            // Vehicle company errors
            else if (lowerMessage.includes('vehicle company') && (lowerMessage.includes('required') || lowerMessage.includes('invalid'))) {
                showFieldError('vehicle_company_id', errorMessage);
                showToast('error', errorMessage);
            }
            // Date required errors
            else if (lowerMessage.includes('date') && (lowerMessage.includes('required') || lowerMessage.includes('invalid'))) {
                highlightFieldError('contract_date_range');
                showToast('error', errorMessage);
            }
            // Show toast as fallback
            else {
                showToast('error', errorMessage);
            }
        }
        else {
            // Fallback to toast for unknown forms
            showToast('error', errorMessage);
        }
    }
    
    // ============================================
    // TABLE SEARCH AND SORT FUNCTIONS
    // ============================================
    
    // Filter Vehicles table
    window.filterVehiclesTable = function(type, searchTerm) {
        const tbody = document.getElementById(`${type}TableBody`);
        const clearBtn = document.getElementById(`${type}SearchClear`);
        
        if (!tbody) return;
        
        // Get data attributes based on type
        let dataAttributes = ['name'];
        if (type === 'companies') {
            dataAttributes.push('city', 'region', 'country');
        } else if (type === 'types') {
            dataAttributes.push('company', 'city', 'region', 'country');
        } else if (type === 'contracts') {
            dataAttributes.push('code', 'company');
        }
        
        // Use generic filterTable function
        window.filterTable(`${type}TableBody`, searchTerm, dataAttributes, `${type}SearchClear`, function(visibleCount) {
            // Update footer count
            const footer = document.querySelector(`#${type}-content .table-info`);
            if (footer) {
                footer.innerHTML = `${tCommon.showing || 'Showing'} <strong>${visibleCount}</strong> ${visibleCount === 1 ? 'item' : 'items'}`;
            }
        });
    };
    
    // Clear Vehicles search
    window.clearVehiclesSearch = function(type) {
        const input = document.getElementById(`${type}SearchInput`);
        const clearBtn = document.getElementById(`${type}SearchClear`);
        
        if (input) {
            input.value = '';
            filterVehiclesTable(type, '');
        }
        if (clearBtn) {
            clearBtn.classList.add('search-clear-hidden');
        }
    };
    
    // Sort Vehicles table
    let vehiclesSortState = {};
    
    window.sortVehiclesTable = function(type, column) {
        const data = window[`${type}TableData`];
        if (!data || data.length === 0) return;
        
        const currentState = vehiclesSortState[type] || { column: null, direction: 'asc' };
        const result = window.sortTableData(data, column, currentState.column, currentState.direction);
        
        // Update sort state
        vehiclesSortState[type] = {
            column: result.newColumn,
            direction: result.newDirection
        };
        
        // Re-render table with sorted data
        renderTable(type, result.sortedData);
        
        // Update sort icons
        const table = document.getElementById(`${type}Table`);
        if (table) {
            const headers = table.querySelectorAll('th.sortable .sort-icon');
            headers.forEach(icon => {
                icon.textContent = '⇅';
                icon.style.color = '';
            });
            
            const activeHeader = table.querySelector(`th[onclick*="${column}"] .sort-icon`);
            if (activeHeader) {
                activeHeader.textContent = result.newDirection === 'asc' ? '↑' : '↓';
                activeHeader.style.color = '#151A2D';
            }
        }
    };
    
})();

