// Users Page JavaScript
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
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/users.php';
    
    // Get current user ID (prevent self-deactivation)
    const currentUserId = pageConfig.currentUserId ? parseInt(pageConfig.currentUserId) : null;
    
    // Get translations
    const t = window.Translations || {};
    const tUsers = t.users || {};
    const tCommon = t.common || {};
    
    let currentData = {
        users: [],
        departments: [],
        countries: [],
        regions: [],
        cities: []
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        loadData();
        
        // Modal close buttons are set up in the closeModal setup above
        
        // Setup form submission
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', handleFormSubmit);
        }
        
        // Load dependencies
        loadCountries();
        
        // Setup cascade dropdowns
        setupCascadeDropdowns();
    });
    
    // Setup cascade dropdowns - Full cascade: Country -> Region -> City -> Department -> Position
    function setupCascadeDropdowns() {
        const countrySelect = document.getElementById('countrySelect');
        const regionSelect = document.getElementById('regionSelect');
        const citySelect = document.getElementById('citySelect');
        const departmentSelect = document.getElementById('departmentSelect');
        const positionSelect = document.getElementById('positionSelect');
        
        if (countrySelect) {
            countrySelect.addEventListener('change', function() {
                const countryId = this.value;
                if (countryId) {
                    loadRegions(countryId);
                    regionSelect.disabled = false;
                } else {
                    // Reset all downstream dropdowns
                    resetDropdown(regionSelect, tUsers.select_region);
                    resetDropdown(citySelect, tUsers.select_city);
                    resetDropdown(departmentSelect, tUsers.select_department);
                    resetDropdown(positionSelect, tUsers.select_position);
                }
            });
        }
        
        if (regionSelect) {
            regionSelect.addEventListener('change', function() {
                const regionId = this.value;
                if (regionId) {
                    loadCities(regionId);
                    citySelect.disabled = false;
                } else {
                    // Reset downstream dropdowns
                    resetDropdown(citySelect, tUsers.select_city);
                    resetDropdown(departmentSelect, tUsers.select_department);
                    resetDropdown(positionSelect, tUsers.select_position);
                }
            });
        }
        
        if (citySelect) {
            citySelect.addEventListener('change', function() {
                const cityId = this.value;
                if (cityId) {
                    loadDepartments(cityId);
                    departmentSelect.disabled = false;
                } else {
                    // Reset downstream dropdowns
                    resetDropdown(departmentSelect, tUsers.select_department);
                    resetDropdown(positionSelect, tUsers.select_position);
                }
            });
        }
        
        if (departmentSelect) {
            departmentSelect.addEventListener('change', function() {
                const departmentId = this.value;
                if (departmentId) {
                    loadPositions(departmentId);
                    positionSelect.disabled = false;
                } else {
                    resetDropdown(positionSelect, tUsers.select_position);
                }
            });
        }
    }
    
    // Helper function to reset dropdown
    function resetDropdown(selectElement, defaultText) {
        if (selectElement) {
            selectElement.innerHTML = `<option value="">${defaultText}</option>`;
            selectElement.disabled = true;
            selectElement.value = '';
        }
    }
    
    // Fetch data from API
    async function loadData() {
        try {
            showLoading();
            const response = await fetch(`${API_BASE}?action=users`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(tCommon.invalid_response_format);
            }
            
            const result = await response.json();
            
            if (result.success) {
                currentData.users = result.data || [];
                renderTable();
            } else {
                showError(result.message || tCommon.failed_to_load_data);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            showError(tCommon.failed_to_load_data);
        }
    }
    
    // Load departments by city
    async function loadDepartments(cityId = null) {
        try {
            const url = cityId 
                ? `${API_BASE}?action=departments&city_id=${cityId}`
                : `${API_BASE}?action=departments`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(tCommon.invalid_response_format);
            }
            
            const result = await response.json();
            
            if (result.success) {
                currentData.departments = result.data || [];
                const select = document.getElementById('departmentSelect');
                if (select) {
                    select.innerHTML = `<option value="">${tUsers.select_department}</option>`;
                    result.data.forEach(dept => {
                        select.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
                    });
                }
            } else {
                console.error('Failed to load departments:', result.message);
            }
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    }
    
    // Load positions
    async function loadPositions(departmentId = null) {
        try {
            const url = departmentId 
                ? `${API_BASE}?action=positions&department_id=${departmentId}`
                : `${API_BASE}?action=positions`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(tCommon.invalid_response_format);
            }
            
            const result = await response.json();
            
            if (result.success) {
                currentData.positions = result.data || [];
                const select = document.getElementById('positionSelect');
                if (select) {
                    select.innerHTML = `<option value="">${tUsers.select_position}</option>`;
                    result.data.forEach(pos => {
                        select.innerHTML += `<option value="${pos.id}">${pos.name}</option>`;
                    });
                }
            } else {
                console.error('Failed to load positions:', result.message);
            }
        } catch (error) {
            console.error('Error loading positions:', error);
        }
    }
    
    // Load countries
    async function loadCountries() {
        try {
            const response = await fetch(`${API_BASE}?action=countries`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(tCommon.invalid_response_format);
            }
            
            const result = await response.json();
            
            if (result.success) {
                currentData.countries = result.data || [];
                const select = document.getElementById('countrySelect');
                if (select) {
                    select.innerHTML = `<option value="">${tUsers.select_country}</option>`;
                    result.data.forEach(country => {
                        select.innerHTML += `<option value="${country.id}">${country.name}</option>`;
                    });
                }
            } else {
                console.error('Failed to load countries:', result.message);
            }
        } catch (error) {
            console.error('Error loading countries:', error);
        }
    }
    
    // Load regions by country
    async function loadRegions(countryId) {
        if (!countryId) {
            const select = document.getElementById('regionSelect');
            if (select) {
                select.innerHTML = `<option value="">${tUsers.select_region}</option>`;
                select.disabled = true;
            }
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=regions&country_id=${countryId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(tCommon.invalid_response_format);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                currentData.regions = result.data;
                const select = document.getElementById('regionSelect');
                if (select) {
                    select.innerHTML = `<option value="">${tUsers.select_region}</option>`;
                    result.data.forEach(region => {
                        select.innerHTML += `<option value="${region.id}">${region.name}</option>`;
                    });
                    select.disabled = false;
                }
            } else {
                console.error('Failed to load regions:', result.message);
            }
        } catch (error) {
            console.error('Error loading regions:', error);
        }
    }
    
    // Load cities by region
    async function loadCities(regionId) {
        if (!regionId) {
            const select = document.getElementById('citySelect');
            if (select) {
                select.innerHTML = `<option value="">${tUsers.select_city}</option>`;
                select.disabled = true;
            }
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=cities&region_id=${regionId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(tCommon.invalid_response_format);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                currentData.cities = result.data;
                const select = document.getElementById('citySelect');
                if (select) {
                    select.innerHTML = `<option value="">${tUsers.select_city}</option>`;
                    result.data.forEach(city => {
                        select.innerHTML += `<option value="${city.id}">${city.name}</option>`;
                    });
                    select.disabled = false;
                }
            } else {
                console.error('Failed to load cities:', result.message);
            }
        } catch (error) {
            console.error('Error loading cities:', error);
        }
    }
    
    // Render table
    function renderTable(dataToRender = null) {
        const container = document.getElementById('users-content');
        const data = dataToRender !== null ? dataToRender : currentData.users;
        const escapedHtml = window.escapeHtml || function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="users-table-container">
                    <div class="users-table-header">
                        <div class="users-table-title">
                            <span class="material-symbols-rounded users-title-icon">people</span>
                            <span class="users-title-text">${tUsers.title || 'Users'}</span>
                        </div>
                    </div>
                    <div class="empty-state">
                        <span class="material-symbols-rounded">person</span>
                        <h3>${tUsers.no_users || 'No users found'}</h3>
                        <p>${tUsers.add_user || 'Add your first user'}</p>
                    </div>
                </div>
            `;
            return;
        }
        
        const totalCount = data.length;
        
        let html = '<div class="users-table-container">';
        html += '<div class="users-table-header">';
        html += `<div class="users-table-title">
                    <span class="material-symbols-rounded users-title-icon">people</span>
                    <span class="users-title-text">${tUsers.title || 'Users'}</span>
                    <span class="table-count-badge">${totalCount}</span>
                 </div>`;
        html += '<div class="table-actions-group">';
        html += `<div class="search-box">
                    <span class="material-symbols-rounded search-icon">search</span>
                    <input type="text" 
                           id="usersSearchInput" 
                           placeholder="${tCommon.search || 'Search...'}" 
                           class="search-input"
                           onkeyup="filterUsersTable(this.value)">
                    <button class="search-clear search-clear-hidden" id="usersSearchClear" onclick="clearUsersSearch()">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                 </div>`;
        html += '</div>';
        html += '</div>';
        html += '<div class="currencies-table-section">';
        html += '<table class="currencies-table" id="usersTable">';
        html += '<thead><tr>';
        html += `<th class="sortable" onclick="sortUsersTable('username')">
                    ${tUsers.username || 'Username'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="sortable" onclick="sortUsersTable('full_name')">
                    ${tUsers.full_name || 'Full Name'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="sortable" onclick="sortUsersTable('department_name')">
                    ${tUsers.department || 'Department'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="sortable" onclick="sortUsersTable('position_name')">
                    ${tUsers.position || 'Position'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="sortable" onclick="sortUsersTable('city_name')">
                    ${tUsers.city || 'City'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="sortable" onclick="sortUsersTable('email')">
                    ${tUsers.email || 'Email'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="sortable" onclick="sortUsersTable('status')">
                    ${tUsers.status || 'Status'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="no-sort">${tUsers.actions || 'Actions'}</th>`;
        html += '</tr></thead>';
        
        html += '<tbody id="usersTableBody">';
        data.forEach((item, index) => {
            const escapedUsername = escapedHtml(item.username);
            const escapedFullName = escapedHtml(item.full_name || '');
            const escapedEmail = escapedHtml(item.email || '');
            html += `
                <tr data-index="${index}" 
                     data-username="${((item.username || '') + '').toLowerCase()}" 
                     data-full-name="${((item.full_name || '') + '').toLowerCase()}" 
                     data-department="${((item.department_name || '') + '').toLowerCase()}" 
                     data-position="${((item.position_name || '') + '').toLowerCase()}" 
                     data-city="${((item.city_name || '') + '').toLowerCase()}" 
                     data-email="${((item.email || '') + '').toLowerCase()}" 
                     data-status="${((item.status || '') + '').toLowerCase()}">
                    <td class="users-username-cell"><strong>${escapedUsername}</strong></td>
                    <td class="users-info-cell">${escapedFullName || '<span class="text-muted">-</span>'}</td>
                    <td class="users-info-cell">${item.department_name ? escapedHtml(item.department_name) : '<span class="text-muted">-</span>'}</td>
                    <td class="users-info-cell">${item.position_name ? escapedHtml(item.position_name) : '<span class="text-muted">-</span>'}</td>
                    <td class="users-location-cell">${item.city_name ? escapedHtml(item.city_name) : '<span class="text-muted">-</span>'}</td>
                    <td class="users-contact-cell">${escapedEmail ? `<a href="mailto:${encodeURIComponent(escapedEmail)}" class="contact-link">${escapedEmail}</a>` : '<span class="text-muted">-</span>'}</td>
                    <td class="users-status-cell"><span class="status-badge ${item.status === 'active' ? 'active' : 'inactive'}">${item.status === 'active' ? tUsers.active : tUsers.inactive}</span></td>
                    <td class="users-actions-cell">
                        <div class="action-buttons">
                            <button class="btn-icon" data-action="edit" data-id="${item.id}" title="${tCommon.edit || 'Edit'} ${escapedUsername}">
                                <span class="material-symbols-rounded">edit</span>
                            </button>
                            ${item.id === currentUserId ? '' : (item.status === 'active' ? `<button class="btn-icon btn-danger" data-action="deactivate" data-id="${item.id}" title="${tUsers.deactivate || 'Deactivate'} ${escapedUsername}">
                                <span class="material-symbols-rounded">block</span>
                            </button>` : `<button class="btn-icon btn-success" data-action="activate" data-id="${item.id}" title="${tUsers.activate || 'Activate'} ${escapedUsername}">
                                <span class="material-symbols-rounded">check_circle</span>
                            </button>`)}
                        </div>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        html += '<div class="table-footer">';
        html += `<div class="table-info">${tCommon.showing || 'Showing'} <strong>${totalCount}</strong> ${totalCount === 1 ? 'user' : 'users'}</div>`;
        html += '</div>';
        html += '</div></div>';
        
        container.innerHTML = html;
        
        // Store original data for filtering and sorting
        window.usersTableData = data;
        
        // Attach event listeners
        attachActionListeners();
    }
    
    // Attach event listeners
    function attachActionListeners() {
        // Action button listeners
        document.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (id) editUser(id);
            });
        });
        
        document.querySelectorAll('[data-action="activate"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (id) toggleUserStatus(id, 'active');
            });
        });
        
        document.querySelectorAll('[data-action="deactivate"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (id) toggleUserStatus(id, 'inactive');
            });
        });
    }
    
    // Toggle user status - wrapper function
    window.toggleUserStatus = function(userId, newStatus) {
        toggleUserStatus(userId, newStatus);
    }
    
    // Edit user - wrapper function (make it global)
    window.editUser = function(id) {
        editUser(id);
    }
    
    // Show loading state
    function showLoading() {
        const container = document.getElementById('users-content');
        container.innerHTML = `
            <div class="loading">
                <span class="material-symbols-rounded">sync</span>
                <p>${tCommon.loading}</p>
            </div>
        `;
    }
    
    // Show error
    function showError(message) {
        showToast('error', message || tCommon.error);
    }
    
    // Clear form errors
    function clearFormErrors(form) {
        if (!form) return;
        
        // Remove error classes
        form.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
            el.setCustomValidity('');
        });
        
        // Remove error messages
        form.querySelectorAll('.error-message').forEach(el => {
            el.remove();
        });
    }
    
    // Show field error
    function showFieldError(fieldName, message) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (!field) return;
        
        // Add error class
        field.classList.add('error');
        field.setCustomValidity(message);
        field.reportValidity();
        
        // Remove existing error message
        const existingError = field.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message below field
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '4px';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
    }
    
    // Open modal - Enhanced with body lock and focus management
    window.openModal = function() {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');
        
        if (!modal || !form || !title) {
            console.warn('Modal elements not found');
            return;
        }
        
        form.reset();
        delete form.dataset.id;
        title.textContent = tUsers.add_user || 'Add User';
        clearFormErrors(form);
        
        // Reset all cascade dropdowns
        const countrySelect = document.getElementById('countrySelect');
        const regionSelect = document.getElementById('regionSelect');
        const citySelect = document.getElementById('citySelect');
        const departmentSelect = document.getElementById('departmentSelect');
        const positionSelect = document.getElementById('positionSelect');
        
        // Reset country (others will be reset by cascade)
        if (countrySelect) {
            countrySelect.value = '';
        }
        resetDropdown(regionSelect, tUsers.select_region);
        resetDropdown(citySelect, tUsers.select_city);
        resetDropdown(departmentSelect, tUsers.select_department);
        resetDropdown(positionSelect, tUsers.select_position);
        
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        const firstInput = modal.querySelector('input:not([readonly]), select:not([disabled]), textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    };
    
    // Close modal - Enhanced to work with specific modal IDs
    window.closeModal = function(modalId) {
        const targetModal = modalId ? document.getElementById(modalId) : document.getElementById('userModal');
        if (targetModal) {
            targetModal.classList.remove('active');
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            
            // Reset form
            const form = targetModal.querySelector('form');
            if (form) {
                form.reset();
                delete form.dataset.id;
                clearFormErrors(form);
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
    
    // Edit user
    async function editUser(id) {
        const item = currentData.users.find(u => u.id == id);
        if (!item) {
            showError(tUsers.user_not_found);
            return;
        }
        
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');
        
        if (!modal || !form || !title) {
            console.error(tCommon.modal_form_not_found || tCommon.error);
            return;
        }
        
        // Clear previous errors
        clearFormErrors(form);
        
        // Open modal first
        modal.classList.add('active');
        
        form.dataset.id = id;
        title.textContent = tUsers.edit_user;
        
        // Fill form
        form.querySelector('[name="username"]').value = item.username || '';
        form.querySelector('[name="full_name"]').value = item.full_name || '';
        
        form.querySelector('[name="email"]').value = item.email || '';
        form.querySelector('[name="phone"]').value = item.phone || '';
        
        // Status field - disable if user is editing themselves
        const statusSelect = form.querySelector('[name="status"]');
        if (statusSelect) {
            statusSelect.value = item.status || 'active';
            if (id === currentUserId) {
                // User cannot change their own status
                statusSelect.disabled = true;
                statusSelect.title = tUsers.cannot_change_own_status;
            } else {
                statusSelect.disabled = false;
                statusSelect.removeAttribute('title');
            }
        }
        
        // Reset all cascade dropdowns first
        const regionSelect = document.getElementById('regionSelect');
        const citySelect = document.getElementById('citySelect');
        const departmentSelect = document.getElementById('departmentSelect');
        const positionSelect = document.getElementById('positionSelect');
        
        resetDropdown(regionSelect, tUsers.select_region);
        resetDropdown(citySelect, tUsers.select_city);
        resetDropdown(departmentSelect, tUsers.select_department);
        resetDropdown(positionSelect, tUsers.select_position);
        
        // Load city info and cascade all dropdowns
        if (item.city_id) {
            try {
                // Use country_id directly from user item if available (from API)
                let countryId = item.country_id;
                
                // If not available, load city details to get country_id
                if (!countryId) {
                    const citiesResponse = await fetch(`${API_BASE}?action=cities`);
                    const citiesResult = await citiesResponse.json();
                    
                    if (citiesResult.success && citiesResult.data) {
                        const city = citiesResult.data.find(c => c.id == item.city_id);
                        if (city && city.country_id) {
                            countryId = city.country_id;
                        }
                    }
                }
                
                if (countryId) {
                    // Set country first
                    const countrySelect = document.getElementById('countrySelect');
                    if (countrySelect) {
                        countrySelect.value = countryId;
                        // Trigger change event to update select-search trigger
                        countrySelect.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    
                    // Load regions for the country
                    const regionsResponse = await fetch(`${API_BASE}?action=regions&country_id=${countryId}`);
                    const regionsResult = await regionsResponse.json();
                    
                    if (regionsResult.success && regionsResult.data) {
                        // Use region_id from user item if available
                        const regionId = item.region_id;
                        
                        if (regionSelect) {
                            regionSelect.innerHTML = `<option value="">${tUsers.select_region}</option>`;
                            regionsResult.data.forEach(region => {
                                const isSelected = region.id == regionId;
                                regionSelect.innerHTML += `<option value="${region.id}" ${isSelected ? 'selected' : ''}>${region.name}</option>`;
                            });
                            regionSelect.disabled = false;
                            
                            // Trigger change if region is set
                            if (regionId) {
                                regionSelect.value = regionId;
                                regionSelect.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // Load cities for the region and wait for it to complete
                        if (regionId) {
                            await loadCities(regionId);
                        }
                        
                        // Set city after a small delay to ensure select is populated, then load departments
                        setTimeout(async () => {
                            if (citySelect) {
                                citySelect.value = item.city_id;
                                // Trigger change to load departments for this city
                                citySelect.dispatchEvent(new Event('change'));
                                
                                // Wait for departments to load, then set department
                                await new Promise(resolve => setTimeout(resolve, 300));
                                const deptSelect = document.getElementById('departmentSelect');
                                if (deptSelect && item.department_id) {
                                    deptSelect.value = item.department_id;
                                    // Trigger change to load positions for this department
                                    deptSelect.dispatchEvent(new Event('change'));
                                    
                                    // Wait for positions to load, then set position
                                    await new Promise(resolve => setTimeout(resolve, 300));
                                    const posSelect = document.getElementById('positionSelect');
                                    if (posSelect && item.position_id) {
                                        posSelect.value = item.position_id;
                                    }
                                }
                            }
                        }, 100);
                    }
                }
            } catch (error) {
                console.error('Error loading city info:', error);
            }
        }
    }
    
    // Toggle user status
    async function toggleUserStatus(id, newStatus) {
        // Prevent users from deactivating themselves
        if (id === currentUserId) {
            showToast('error', tUsers.cannot_deactivate_self);
            return;
        }
        
        const statusText = newStatus === 'active' ? tUsers.activate_user : tUsers.deactivate_user;
        const confirmMessage = newStatus === 'active' 
            ? tUsers.activate_user_confirm
            : tUsers.deactivate_user_confirm;
        
        showConfirmDialog(confirmMessage, async () => {
            try {
                const user = currentData.users.find(u => u.id == id);
                if (!user) {
                    showError(tUsers.user_not_found);
                    return;
                }
                
                // Double-check: prevent self-deactivation
                if (id === currentUserId) {
                    showToast('error', tUsers.cannot_deactivate_self);
                    return;
                }
                
                const data = {
                    id: id,
                    username: user.username,
                    full_name: user.full_name,
                    department_id: user.department_id,
                    position_id: user.position_id,
                    city_id: user.city_id,
                    email: user.email,
                    phone: user.phone,
                    status: newStatus
                };
                
                const response = await window.apiFetch(`${API_BASE}?action=user`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                
                if (result.success) {
                    const successMessage = newStatus === 'active' 
                        ? tUsers.user_activated
                        : tUsers.user_deactivated;
                    showToast('success', successMessage);
                    await loadData();
                } else {
                    const errorMessage = newStatus === 'active'
                        ? (result.message || tUsers.failed_to_activate_user)
                        : (result.message || tUsers.failed_to_deactivate_user);
                    showToast('error', errorMessage);
                }
            } catch (error) {
                console.error(`Error ${statusText} user:`, error);
                const errorMessage = newStatus === 'active'
                    ? tUsers.failed_to_activate_user
                    : tUsers.failed_to_deactivate_user;
                showToast('error', errorMessage);
            }
        });
    }
    
    // Handle form submit
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const userId = form.dataset.id;
        
        const data = {
            username: formData.get('username'),
            full_name: formData.get('full_name'),
            department_id: formData.get('department_id') || null,
            position_id: formData.get('position_id') || null,
            city_id: formData.get('city_id') || null,
            email: formData.get('email') || null,
            phone: formData.get('phone') || null,
            status: formData.get('status') || 'active'
        };
        
        if (userId) {
            data.id = parseInt(userId);
            
            // Prevent users from changing their own status
            if (data.id === currentUserId) {
                const statusSelect = form.querySelector('[name="status"]');
                if (statusSelect && statusSelect.disabled) {
                    // Keep status as active for self
                    data.status = 'active';
                } else if (data.status !== 'active') {
                    showToast('error', tUsers.cannot_deactivate_self);
                    return;
                }
            }
            
            await updateUser(data);
        } else {
            await createUser(data);
        }
    }
    
    // Create user
    async function createUser(data) {
        try {
                const response = await window.apiFetch(`${API_BASE}?action=user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            const result = await response.json();
            
            if (result.success) {
                showToast('success', tUsers.user_added);
                closeModal();
                await loadData();
            } else {
                // Clear previous errors
                const form = document.getElementById('userForm');
                if (form) {
                    clearFormErrors(form);
                }
                
                // Show field-specific errors if available
                if (result.errors && typeof result.errors === 'object') {
                    Object.keys(result.errors).forEach(fieldName => {
                        showFieldError(fieldName, result.errors[fieldName]);
                    });
                } else if (result.message) {
                    // Show general error on relevant field
                    const message = result.message.toLowerCase();
                    if (message.includes('username')) {
                        showFieldError('username', result.message);
                    } else if (message.includes('email')) {
                        showFieldError('email', result.message);
                    } else if (message.includes('phone')) {
                        showFieldError('phone', result.message);
                    }
                }
                
                // Show toast notification
                showToast('error', result.message || tCommon.save_failed);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            showToast('error', tCommon.save_failed);
        }
    }
    
    // Update user
    async function updateUser(data) {
        try {
            // Prevent users from changing their own status
            if (data.id === currentUserId && data.status && data.status !== 'active') {
                showToast('error', tUsers.cannot_deactivate_self);
                return;
            }
            
            const response = await window.apiFetch(`${API_BASE}?action=user`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                showToast('success', tUsers.user_updated);
                closeModal();
                await loadData();
            } else {
                // Clear previous errors
                const form = document.getElementById('userForm');
                if (form) {
                    clearFormErrors(form);
                }
                
                // Show field-specific errors if available
                if (result.errors && typeof result.errors === 'object') {
                    Object.keys(result.errors).forEach(fieldName => {
                        showFieldError(fieldName, result.errors[fieldName]);
                    });
                } else if (result.message) {
                    // Show general error on relevant field
                    const message = result.message.toLowerCase();
                    if (message.includes('username')) {
                        showFieldError('username', result.message);
                    } else if (message.includes('email')) {
                        showFieldError('email', result.message);
                    } else if (message.includes('phone')) {
                        showFieldError('phone', result.message);
                    }
                }
                
                // Show toast notification
                showToast('error', result.message || tCommon.update_failed);
            }
        } catch (error) {
            console.error('Error updating user:', error);
            showToast('error', tCommon.update_failed);
        }
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Setup country/region/city cascade
    document.addEventListener('DOMContentLoaded', function() {
        const countrySelect = document.getElementById('countrySelect');
        const regionSelect = document.getElementById('regionSelect');
        const citySelect = document.getElementById('citySelect');
        
        if (countrySelect) {
            countrySelect.addEventListener('change', function() {
                const countryId = this.value;
                loadRegions(countryId);
                if (regionSelect) regionSelect.value = '';
                if (citySelect) citySelect.value = '';
            });
        }
        
        if (regionSelect) {
            regionSelect.addEventListener('change', function() {
                const regionId = this.value;
                loadCities(regionId);
                if (citySelect) citySelect.value = '';
            });
        }
    });
    
    // ============================================
    // TABLE SEARCH AND SORT FUNCTIONS
    // ============================================
    
    // Filter Users table
    window.filterUsersTable = function(searchTerm) {
        const tbody = document.getElementById('usersTableBody');
        const clearBtn = document.getElementById('usersSearchClear');
        
        if (!tbody) return;
        
        // Use generic filterTable function
        window.filterTable('usersTableBody', searchTerm, ['username', 'full-name', 'department', 'position', 'city', 'email', 'status'], 'usersSearchClear', function(visibleCount) {
            // Update footer count
            const footer = document.querySelector('#users-content .table-info');
            if (footer) {
                footer.innerHTML = `${tCommon.showing || 'Showing'} <strong>${visibleCount}</strong> ${visibleCount === 1 ? 'user' : 'users'}`;
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
    
    // Clear Users search
    window.clearUsersSearch = function() {
        const input = document.getElementById('usersSearchInput');
        const clearBtn = document.getElementById('usersSearchClear');
        
        if (input) {
            input.value = '';
            filterUsersTable('');
        }
        if (clearBtn) {
            clearBtn.classList.add('search-clear-hidden');
        }
    };
    
    // Sort Users table
    let usersSortState = { column: null, direction: 'asc' };
    
    window.sortUsersTable = function(column) {
        const data = window.usersTableData;
        if (!data || data.length === 0) return;
        
        const result = window.sortTableData(data, column, usersSortState.column, usersSortState.direction);
        
        // Update sort state
        usersSortState.column = result.newColumn;
        usersSortState.direction = result.newDirection;
        
        // Re-render table with sorted data
        renderTable(result.sortedData);
        
        // Update sort icons
        const table = document.getElementById('usersTable');
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

