// Positions Page JavaScript
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
            // Store CSRF token in page config for easy access
            if (pageConfig.csrfToken) {
                window.pageConfig = window.pageConfig || {};
                window.pageConfig.csrfToken = pageConfig.csrfToken;
            }
        } catch (e) {
            console.error('Failed to parse page config:', e);
        }
    }
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/positions.php';
    
    // Get translations
    const t = window.Translations || {};
    const tPos = t.positions || {};
    const tCommon = t.common || {};
    const tSidebar = t.sidebar || {};
    
    // Get initial tab from URL hash or localStorage, default to 'departments'
    function getInitialTab() {
        const validTabs = ['departments', 'positions'];
        // First, try URL hash
        if (window.location.hash) {
            const hashTab = window.location.hash.replace('#', '');
            if (validTabs.includes(hashTab)) {
                return hashTab;
            }
        }
        // Then, try localStorage
        const savedTab = localStorage.getItem('positions_active_tab');
        if (savedTab && validTabs.includes(savedTab)) {
            return savedTab;
        }
        // Default to departments
        return 'departments';
    }
    
    let currentTab = getInitialTab();
    let currentData = {
        cities: [],
        departments: [],
        positions: []
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        initTabs();
        
        // Set initial tab based on saved state
        switchTab(currentTab);
        
        // Listen for hash changes (browser back/forward)
        window.addEventListener('hashchange', function() {
            const hashTab = window.location.hash.replace('#', '');
            const validTabs = ['departments', 'positions'];
            if (validTabs.includes(hashTab) && hashTab !== currentTab) {
                switchTab(hashTab);
            }
        });
        
        // Setup modal close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Setup form submissions
        const departmentForm = document.getElementById('departmentForm');
        const positionForm = document.getElementById('positionForm');
        
        if (departmentForm) {
            departmentForm.addEventListener('submit', handleDepartmentSubmit);
        }
        if (positionForm) {
            positionForm.addEventListener('submit', handlePositionSubmit);
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
        document.querySelectorAll('.positions-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        });
    }
    
    // Switch tabs
    function switchTab(tab) {
        const validTabs = ['departments', 'positions'];
        if (!validTabs.includes(tab)) {
            tab = 'departments'; // Fallback to default
        }
        
        currentTab = tab;
        
        // Save tab state to localStorage and URL hash
        localStorage.setItem('positions_active_tab', tab);
        window.location.hash = tab;
        
        // Update active tab
        document.querySelectorAll('.positions-tab').forEach(t => t.classList.remove('active'));
        const activeTabButton = document.querySelector(`[data-tab="${tab}"]`);
        if (activeTabButton) {
            activeTabButton.classList.add('active');
        }
        
        // Update active content
        document.querySelectorAll('.positions-content').forEach(c => c.classList.remove('active'));
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
        try {
            let url;
            if (type === 'cities') {
                url = API_BASE.replace('positions.php', 'locations.php') + '?action=cities';
            } else {
                url = `${API_BASE}?action=${type}`;
            }
            
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                currentData[type] = result.data || [];
                renderTable(type);
            } else {
                currentData[type] = [];
                renderTable(type);
                showToast('error', result.message);
            }
        } catch (error) {
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
            const noFoundText = type === 'departments' ? tPos.no_departments : tPos.no_positions;
            const addText = type === 'departments' ? tPos.add_new_dept : tPos.add_new_pos;
            const typeText = type === 'departments' ? tSidebar.department : tSidebar.position;
            
            container.innerHTML = `
                <div class="positions-table-container">
                    <div class="positions-table-header">
                        <div class="positions-table-title">${typeText}</div>
                        <button class="btn-add" onclick="window.openModal('${type}')">
                            <span class="material-symbols-rounded">add</span>
                            ${tPos.add_new_dept || 'Add New'}
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
        
        const typeText = type === 'departments' ? tSidebar.department : tSidebar.position;
        const totalCount = data.length;
        const iconMap = {
            'departments': 'business_center',
            'positions': 'work'
        };
        
        let html = '<div class="positions-table-container">';
        html += '<div class="positions-table-header">';
        html += `<div class="positions-table-title">
                    <span class="material-symbols-rounded positions-title-icon">${iconMap[type] || 'list'}</span>
                    <span class="positions-title-text">${typeText}</span>
                    <span class="table-count-badge">${totalCount}</span>
                 </div>`;
        html += '<div class="table-actions-group">';
        html += `<div class="search-box">
                    <span class="material-symbols-rounded search-icon">search</span>
                    <input type="text" 
                           id="${type}SearchInput" 
                           placeholder="${tCommon.search || 'Search...'}" 
                           class="search-input"
                           onkeyup="filterPositionsTable('${type}', this.value)">
                    <button class="search-clear search-clear-hidden" id="${type}SearchClear" onclick="clearPositionsSearch('${type}')">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                 </div>`;
        html += `<button class="btn-add" id="addPositionBtn_${type}" title="${tPos.add_new_dept || 'Add New'}">
                    <span class="material-symbols-rounded">add</span>
                    ${tPos.add_new_dept || 'Add New'}
                 </button>`;
        html += '</div>';
        html += '</div>';
        html += '<div class="currencies-table-section">';
        html += `<table class="currencies-table" id="${type}Table">`;
        
        // Table headers with sortable
        if (type === 'departments') {
            html += `<thead><tr>
                        <th class="sortable" onclick="sortPositionsTable('${type}', 'name')">
                            ${tPos.department_name || 'Name'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortPositionsTable('${type}', 'city_name')">
                            ${tPos.city || 'City'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortPositionsTable('${type}', 'region_name')">
                            ${tPos.region || 'Region'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortPositionsTable('${type}', 'country_name')">
                            ${tPos.country || 'Country'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="no-sort">${tPos.actions || 'Actions'}</th>
                     </tr></thead>`;
        } else {
            html += `<thead><tr>
                        <th class="sortable" onclick="sortPositionsTable('${type}', 'name')">
                            ${tPos.position_name || 'Name'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortPositionsTable('${type}', 'department_name')">
                            ${tSidebar.department || 'Department'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortPositionsTable('${type}', 'city_name')">
                            ${tPos.city || 'City'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortPositionsTable('${type}', 'region_name')">
                            ${tPos.region || 'Region'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="sortable" onclick="sortPositionsTable('${type}', 'country_name')">
                            ${tPos.country || 'Country'}
                            <span class="sort-icon">⇅</span>
                        </th>
                        <th class="no-sort">${tPos.actions || 'Actions'}</th>
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
        // Add button listeners
        document.querySelectorAll('[id^="addPositionBtn_"]').forEach(btn => {
            const type = btn.id.replace('addPositionBtn_', '');
            btn.addEventListener('click', () => window.openModal(type));
        });
        
        // Action button listeners
        document.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                const id = parseInt(this.getAttribute('data-id'));
                if (type && id) window.editItem(type, id);
            });
        });
        
        document.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                const id = parseInt(this.getAttribute('data-id'));
                if (type && id) window.deleteItem(type, id);
            });
        });
    }
    
    // Build table row with data attributes for filtering
    function buildTableRow(type, item, index) {
        const escapedName = window.escapeHtml ? window.escapeHtml(item.name) : escapeHtml(item.name);
        
        let html = `<tr data-index="${index}" 
                     data-name="${(item.name || '').toLowerCase()}"`;
        
        if (type === 'departments') {
            html += ` data-city="${(item.city_name || '').toLowerCase()}" 
                     data-region="${(item.region_name || '').toLowerCase()}" 
                     data-country="${(item.country_name || '').toLowerCase()}">`;
            html += `<td class="positions-name-cell"><strong>${escapedName}</strong></td>`;
            html += `<td class="positions-location-cell">${item.city_name ? (window.escapeHtml ? window.escapeHtml(item.city_name) : escapeHtml(item.city_name)) : '<span class="text-muted">-</span>'}</td>`;
            html += `<td class="positions-location-cell">${item.region_name ? (window.escapeHtml ? window.escapeHtml(item.region_name) : escapeHtml(item.region_name)) : '<span class="text-muted">-</span>'}</td>`;
            html += `<td class="positions-location-cell">${item.country_name ? `<span class="location-badge">${window.escapeHtml ? window.escapeHtml(item.country_name) : escapeHtml(item.country_name)}</span>` : '<span class="text-muted">-</span>'}</td>`;
        } else {
            html += ` data-department="${(item.department_name || '').toLowerCase()}" 
                     data-city="${(item.city_name || '').toLowerCase()}" 
                     data-region="${(item.region_name || '').toLowerCase()}" 
                     data-country="${(item.country_name || '').toLowerCase()}">`;
            html += `<td class="positions-name-cell"><strong>${escapedName}</strong></td>`;
            html += `<td class="positions-info-cell">${item.department_name ? (window.escapeHtml ? window.escapeHtml(item.department_name) : escapeHtml(item.department_name)) : '<span class="text-muted">-</span>'}</td>`;
            html += `<td class="positions-location-cell">${item.city_name ? (window.escapeHtml ? window.escapeHtml(item.city_name) : escapeHtml(item.city_name)) : '<span class="text-muted">-</span>'}</td>`;
            html += `<td class="positions-location-cell">${item.region_name ? (window.escapeHtml ? window.escapeHtml(item.region_name) : escapeHtml(item.region_name)) : '<span class="text-muted">-</span>'}</td>`;
            html += `<td class="positions-location-cell">${item.country_name ? `<span class="location-badge">${window.escapeHtml ? window.escapeHtml(item.country_name) : escapeHtml(item.country_name)}</span>` : '<span class="text-muted">-</span>'}</td>`;
        }
        
        html += '<td class="positions-actions-cell">';
        html += `<div class="action-buttons">`;
        html += `<button class="btn-icon" data-action="edit" data-type="${type}" data-id="${item.id}" title="${tCommon.edit || 'Edit'} ${escapedName}">
                    <span class="material-symbols-rounded">edit</span>
                 </button>`;
        html += `<button class="btn-icon btn-danger" data-action="delete" data-type="${type}" data-id="${item.id}" title="${tCommon.delete || 'Delete'} ${escapedName}">
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
        container.innerHTML = `
            <div class="loading">
                <span class="material-symbols-rounded">sync</span>
                <p>${tCommon.loading || 'Loading...'}</p>
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
        // Fix modal ID - departments -> departmentModal, positions -> positionModal
        const modalId = type === 'departments' ? 'departmentModal' : 'positionModal';
        const formId = type === 'departments' ? 'departmentForm' : 'positionForm';
        
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
            if (type === 'departments') {
                title.textContent = tPos.add_new_dept || 'Add Department';
            } else {
                title.textContent = tPos.add_new_pos || 'Add Position';
            }
        }
        
        // Focus first input
        const firstInput = modal.querySelector('input:not([type="hidden"]), select:not([disabled]), textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Load dependent data if needed
        if (type === 'departments') {
            await loadCitiesForSelect();
        } else {
            await loadDepartmentsForSelect();
        }
    };
    
    // Close modal - Enhanced to work with specific modal IDs
    window.closeModal = function(modalId) {
        const targetModal = modalId ? document.getElementById(modalId) : document.querySelector('.modal.active');
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
        } else {
            // Close all modals if no active modal found
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            
            // Reset all forms
            document.querySelectorAll('form').forEach(form => {
                form.reset();
                delete form.dataset.id;
            });
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
            console.error('Item not found:', type, id);
            return;
        }
        
        // Fix modal ID - departments -> departmentModal, positions -> positionModal
        const modalId = type === 'departments' ? 'departmentModal' : 'positionModal';
        const formId = type === 'departments' ? 'departmentForm' : 'positionForm';
        
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
            if (type === 'departments') {
                title.textContent = tPos.edit_dept || 'Edit Department';
            } else {
                title.textContent = tPos.edit_pos || 'Edit Position';
            }
        }
        
        // Fill form
        form.dataset.id = id;
        form.querySelector('input[name="name"]').value = escapeHtml(item.name);
        
        if (type === 'departments') {
            await loadCitiesForSelect();
            form.querySelector('select[name="city_id"]').value = item.city_id;
        } else {
            await loadDepartmentsForSelect();
            form.querySelector('select[name="department_id"]').value = item.department_id;
        }
        
        modal.classList.add('active');
    };
    
    // Helper function to convert type to API action (singular form)
    function getApiAction(type) {
        const actionMap = {
            'departments': 'department',
            'positions': 'position'
        };
        return actionMap[type] || type;
    }
    
    // Delete item
    window.deleteItem = async function(type, id) {
        const t = window.Translations || {};
        const tLoc = t.locations || {};
        const tDeps = t.dependencies || {};
        const deleteConfirmMessage = tPos.delete_confirm || tLoc.delete_confirm || 'Are you sure you want to delete this item?';
        
        showConfirmDialog(deleteConfirmMessage, async function() {
            try {
                const action = getApiAction(type);
                const response = await window.apiFetch(`${API_BASE}?action=${action}&id=${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                if (result.success) {
                    currentData[type] = [];
                    loadData(type);
                    showToast('success', tCommon.item_deleted_successfully || 'Item deleted successfully');
                } else {
                    // Translate dependency messages
                    let errorMessage = result.message;
                    if (errorMessage && typeof errorMessage === 'string') {
                        // Try to match and translate department dependency pattern
                        const positionMatch = errorMessage.match(/department.*?(\d+).*?position/i);
                        if (positionMatch) {
                            errorMessage = (tDeps.department_has_positions || errorMessage).replace('{count}', positionMatch[1]);
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
    function handleDepartmentSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        // Clear previous errors
        clearFormErrors(form);
        
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            city_id: formData.get('city_id')
        };
        
        if (form.dataset.id) {
            data.id = form.dataset.id;
            updateDepartment(data);
        } else {
            createDepartment(data);
        }
    }
    
    function handlePositionSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        // Clear previous errors
        clearFormErrors(form);
        
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            department_id: formData.get('department_id')
        };
        
        if (form.dataset.id) {
            data.id = form.dataset.id;
            updatePosition(data);
        } else {
            createPosition(data);
        }
    }
    
    // Create operations
    async function createDepartment(data) {
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
            
            const response = await fetch(`${API_BASE}?action=department`, {
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
                currentData.departments = [];
                loadData('departments');
                closeModal();
                showToast('success', tPos.dept_added || 'Department created successfully');
            } else {
                handleApiError('departmentForm', result.message);
            }
        } catch (error) {
            console.error('Error creating department:', error);
            showToast('error', tCommon.save_failed || 'Failed to create department');
        }
    }
    
    async function createPosition(data) {
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
            
            const response = await fetch(`${API_BASE}?action=position`, {
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
                currentData.positions = [];
                loadData('positions');
                closeModal();
                showToast('success', tPos.pos_added || 'Position created successfully');
            } else {
                handleApiError('positionForm', result.message);
            }
        } catch (error) {
            console.error('Error creating position:', error);
            showToast('error', tCommon.save_failed || 'Failed to create position');
        }
    }
    
    // Update operations
    async function updateDepartment(data) {
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
            
            const response = await fetch(`${API_BASE}?action=department`, {
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
                currentData.departments = [];
                loadData('departments');
                closeModal();
                showToast('success', tPos.dept_updated || 'Department updated successfully');
            } else {
                handleApiError('departmentForm', result.message);
            }
        } catch (error) {
            console.error('Error updating department:', error);
            showToast('error', tCommon.update_failed || 'Failed to update department');
        }
    }
    
    async function updatePosition(data) {
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
            
            const response = await fetch(`${API_BASE}?action=position`, {
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
                currentData.positions = [];
                loadData('positions');
                closeModal();
                showToast('success', tPos.pos_updated || 'Position updated successfully');
            } else {
                handleApiError('positionForm', result.message);
            }
        } catch (error) {
            console.error('Error updating position:', error);
            showToast('error', tCommon.update_failed || 'Failed to update position');
        }
    }
    
    // Error handling functions
    function clearFormErrors(form) {
        if (!form) return;
        
        const errorFields = form.querySelectorAll('input.error, select.error, textarea.error, input.invalid, select.invalid, textarea.invalid, input.has-error, select.has-error, textarea.has-error');
        errorFields.forEach(field => {
            field.classList.remove('error', 'invalid', 'has-error');
            field.removeAttribute('aria-invalid');
            field.setCustomValidity('');
            field.style.borderColor = '';
            field.style.backgroundColor = '';
        });
        
        const errorMessages = form.querySelectorAll('.input-error-message');
        errorMessages.forEach(msg => {
            msg.textContent = '';
            msg.classList.remove('show', 'has-error');
            msg.style.display = '';
        });
    }
    
    function highlightFieldError(fieldName) {
        let field = document.getElementById(fieldName);
        
        if (!field) {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                field = activeModal.querySelector(`[name="${fieldName}"]`);
            }
        }
        
        if (!field) {
            field = document.querySelector(`[name="${fieldName}"]`);
        }
        
        if (!field) {
            console.warn('Field not found:', fieldName);
            return;
        }
        
        field.classList.add('error', 'invalid', 'has-error');
        field.setAttribute('aria-invalid', 'true');
        field.style.borderColor = '#dc2626';
        field.style.backgroundColor = '#fef2f2';
        field.offsetHeight; // Force reflow
        
        setTimeout(() => {
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                field.focus();
            }, 200);
        }, 50);
    }
    
    function handleApiError(formId, errorMessage) {
        if (!errorMessage) return;
        
        const lowerMessage = errorMessage.toLowerCase();
        const form = document.getElementById(formId);
        
        if (!form) {
            showToast('error', errorMessage);
            return;
        }
        
        clearFormErrors(form);
        
        if (formId === 'departmentForm') {
            // Department name errors (duplicate names in same city - only red field + toast popup)
            if ((lowerMessage.includes('department') && lowerMessage.includes('name') && lowerMessage.includes('already exists')) ||
                (lowerMessage.includes('name') && lowerMessage.includes('already exists') && lowerMessage.includes('department'))) {
                highlightFieldError('name');
                showToast('error', errorMessage);
            }
            // City errors
            else if (lowerMessage.includes('city') && (lowerMessage.includes('required') || lowerMessage.includes('invalid'))) {
                highlightFieldError('city_id');
                showToast('error', errorMessage);
            }
            // Generic name error (fallback)
            else if (lowerMessage.includes('name') && (lowerMessage.includes('required') || lowerMessage.includes('invalid'))) {
                highlightFieldError('name');
                showToast('error', errorMessage);
            }
            // Show toast as fallback
            else {
                showToast('error', errorMessage);
            }
        }
        else if (formId === 'positionForm') {
            // Position name errors (duplicate names in same department - only red field + toast popup)
            if ((lowerMessage.includes('position') && lowerMessage.includes('name') && lowerMessage.includes('already exists')) ||
                (lowerMessage.includes('name') && lowerMessage.includes('already exists') && lowerMessage.includes('position'))) {
                highlightFieldError('name');
                showToast('error', errorMessage);
            }
            // Department errors
            else if (lowerMessage.includes('department') && (lowerMessage.includes('required') || lowerMessage.includes('invalid'))) {
                highlightFieldError('department_id');
                showToast('error', errorMessage);
            }
            // Generic name error (fallback)
            else if (lowerMessage.includes('name') && (lowerMessage.includes('required') || lowerMessage.includes('invalid'))) {
                highlightFieldError('name');
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
    
    // Load dependent data for selects
    async function loadCitiesForSelect() {
        // Fetch cities from locations API
        try {
            const locationsApi = API_BASE.replace('positions.php', 'locations.php');
            const response = await fetch(`${locationsApi}?action=cities`);
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                const select = document.querySelector('[name="city_id"]');
                if (select) {
                    select.innerHTML = `<option value="">${tPos.select_city || 'Select City'}</option>`;
                    result.data.forEach(city => {
                        select.innerHTML += `<option value="${city.id}">${city.name} (${city.region_name || ''} - ${city.country_name || ''})</option>`;
                    });
                }
            } else {
                console.warn('No cities found or API error');
                const select = document.querySelector('[name="city_id"]');
                if (select) {
                    select.innerHTML = `<option value="">${tPos.no_cities_found || tCommon.no_results || 'No results found'}</option>`;
                }
            }
        } catch (error) {
            console.error('Error loading cities:', error);
            const select = document.querySelector('[name="city_id"]');
            if (select) {
                select.innerHTML = `<option value="">${tCommon.error_cities_load || tCommon.load_failed || 'Error loading data'}</option>`;
            }
        }
    }
    
    async function loadDepartmentsForSelect() {
        if (currentData.departments.length === 0) {
            await fetchData('departments');
        }
        
        const select = document.querySelector('[name="department_id"]');
        if (select) {
            select.innerHTML = `<option value="">${tPos.select_dept || 'Select Department'}</option>`;
            currentData.departments.forEach(dept => {
                select.innerHTML += `<option value="${dept.id}">${dept.name} (${dept.city_name || ''})</option>`;
            });
        }
    }
    
    // Toast notifications use global showToast from toast.js
    
    // showToast is now from toast.js
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Filter Positions table
    window.filterPositionsTable = function(type, searchTerm) {
        const tbody = document.getElementById(`${type}TableBody`);
        const clearBtn = document.getElementById(`${type}SearchClear`);
        
        if (!tbody) return;
        
        // Get data attributes based on type
        let dataAttributes = ['name'];
        if (type === 'departments') {
            dataAttributes.push('city', 'region', 'country');
        } else {
            dataAttributes.push('department', 'city', 'region', 'country');
        }
        
        // Use generic filterTable function
        window.filterTable(`${type}TableBody`, searchTerm, dataAttributes, `${type}SearchClear`, function(visibleCount) {
            // Update footer count
            const footer = document.querySelector(`#${type}-content .table-info`);
            if (footer) {
                footer.innerHTML = `${tCommon.showing || 'Showing'} <strong>${visibleCount}</strong> ${visibleCount === 1 ? 'item' : 'items'}`;
            }
        });
        
        // Update clear button using classList
        if (clearBtn) {
            if (searchTerm && searchTerm.trim()) {
                clearBtn.classList.remove('search-clear-hidden');
            } else {
                clearBtn.classList.add('search-clear-hidden');
            }
        }
    };
    
    // Clear Positions search
    window.clearPositionsSearch = function(type) {
        const input = document.getElementById(`${type}SearchInput`);
        const clearBtn = document.getElementById(`${type}SearchClear`);
        
        if (input) {
            input.value = '';
            filterPositionsTable(type, '');
        }
        if (clearBtn) {
            clearBtn.classList.add('search-clear-hidden');
        }
    };
})();

