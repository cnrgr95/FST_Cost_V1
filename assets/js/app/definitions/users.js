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
        
        // Setup modal close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });
        });
        
        // Setup form submission
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', handleFormSubmit);
        }
        
        // Load dependencies
        loadDepartments();
        loadCountries();
        
        // Setup cascade dropdowns
        setupCascadeDropdowns();
    });
    
    // Setup cascade dropdowns
    function setupCascadeDropdowns() {
        const countrySelect = document.getElementById('countrySelect');
        const regionSelect = document.getElementById('regionSelect');
        const citySelect = document.getElementById('citySelect');
        
        if (countrySelect) {
            countrySelect.addEventListener('change', function() {
                const countryId = this.value;
                if (countryId) {
                    loadRegions(countryId);
                    regionSelect.disabled = false;
                } else {
                    regionSelect.innerHTML = `<option value="">${tUsers.select_region || 'Select Region'}</option>`;
                    regionSelect.disabled = true;
                    citySelect.innerHTML = `<option value="">${tUsers.select_city || 'Select City'}</option>`;
                    citySelect.disabled = true;
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
                    citySelect.innerHTML = `<option value="">${tUsers.select_city || 'Select City'}</option>`;
                    citySelect.disabled = true;
                }
            });
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
                throw new Error(tCommon.invalid_response_format || 'Invalid response format');
            }
            
            const result = await response.json();
            
            if (result.success) {
                currentData.users = result.data || [];
                renderTable();
            } else {
                showError(result.message || tCommon.failed_to_load_data || 'Failed to load data');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            showError(tCommon.failed_to_load_data || 'Failed to load data');
        }
    }
    
    // Load departments
    async function loadDepartments() {
        try {
            const response = await fetch(`${API_BASE}?action=departments`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(tCommon.invalid_response_format || 'Invalid response format');
            }
            
            const result = await response.json();
            
            if (result.success) {
                currentData.departments = result.data || [];
                const select = document.querySelector('[name="department_id"]');
                if (select) {
                    select.innerHTML = `<option value="">${tUsers.select_department || 'Select Department'}</option>`;
                    result.data.forEach(dept => {
                        select.innerHTML += `<option value="${dept.id}">${dept.name}${dept.city_name ? ' (' + dept.city_name + ')' : ''}</option>`;
                    });
                }
            } else {
                console.error('Failed to load departments:', result.message);
            }
        } catch (error) {
            console.error('Error loading departments:', error);
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
                throw new Error(tCommon.invalid_response_format || 'Invalid response format');
            }
            
            const result = await response.json();
            
            if (result.success) {
                currentData.countries = result.data || [];
                const select = document.getElementById('countrySelect');
                if (select) {
                    select.innerHTML = `<option value="">${tUsers.select_country || 'Select Country'}</option>`;
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
                select.innerHTML = `<option value="">${tUsers.select_region || 'Select Region'}</option>`;
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
                throw new Error(tCommon.invalid_response_format || 'Invalid response format');
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                currentData.regions = result.data;
                const select = document.getElementById('regionSelect');
                if (select) {
                    select.innerHTML = `<option value="">${tUsers.select_region || 'Select Region'}</option>`;
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
                select.innerHTML = `<option value="">${tUsers.select_city || 'Select City'}</option>`;
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
                throw new Error(tCommon.invalid_response_format || 'Invalid response format');
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                currentData.cities = result.data;
                const select = document.getElementById('citySelect');
                if (select) {
                    select.innerHTML = `<option value="">${tUsers.select_city || 'Select City'}</option>`;
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
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-rounded">person</span>
                    <p>${tUsers.no_users || 'No users found'}</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="users-table-container">';
        html += '<div class="users-table-header">';
        html += `<div class="users-table-title">${tUsers.title || 'Users'}</div>`;
        html += '</div>';
        html += '<div class="table-wrapper">';
        html += '<table class="table">';
        html += '<thead><tr>';
        html += `<th>${tUsers.username || 'Username'}</th>`;
        html += `<th>${tUsers.full_name || 'Full Name'}</th>`;
        html += `<th>${tUsers.department || 'Department'}</th>`;
        html += `<th>${tUsers.city || 'City'}</th>`;
        html += `<th>${tUsers.email || 'Email'}</th>`;
        html += `<th>${tUsers.status || 'Status'}</th>`;
        html += `<th>${tUsers.actions || 'Actions'}</th>`;
        html += '</tr></thead>';
        
        html += '<tbody>';
        data.forEach(item => {
            html += `
                <tr>
                    <td><strong>${escapeHtml(item.username)}</strong></td>
                    <td>${escapeHtml(item.full_name || '-')}</td>
                    <td>${escapeHtml(item.department_name || '-')}</td>
                    <td>${escapeHtml(item.city_name || '-')}</td>
                    <td>${escapeHtml(item.email || '-')}</td>
                    <td><span class="status-badge ${item.status === 'active' ? 'active' : 'inactive'}">${item.status === 'active' ? (tUsers.active || 'Active') : (tUsers.inactive || 'Inactive')}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-action btn-edit" data-item-id="${item.id}">
                                <span class="material-symbols-rounded">edit</span>
                            </button>
                            ${item.id === currentUserId ? '' : (item.status === 'active' ? `<button class="btn-action btn-deactivate" data-item-id="${item.id}">
                                <span class="material-symbols-rounded">block</span>
                            </button>` : `<button class="btn-action btn-activate" data-item-id="${item.id}">
                                <span class="material-symbols-rounded">check_circle</span>
                            </button>`)}
                        </div>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div></div>';
        
        container.innerHTML = html;
        
        // Attach event listeners
        attachActionListeners();
    }
    
    // Attach event listeners
    function attachActionListeners() {
        document.querySelectorAll('.btn-edit[data-item-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-item-id'));
                editUser(id);
            });
        });
        
        document.querySelectorAll('.btn-deactivate[data-item-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-item-id'));
                toggleUserStatus(id, 'inactive');
            });
        });
        
        document.querySelectorAll('.btn-activate[data-item-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-item-id'));
                toggleUserStatus(id, 'active');
            });
        });
    }
    
    // Show loading state
    function showLoading() {
        const container = document.getElementById('users-content');
        container.innerHTML = `
            <div class="loading">
                <span class="material-symbols-rounded">sync</span>
                <p>${tCommon.loading || 'Loading...'}</p>
            </div>
        `;
    }
    
    // Show error
    function showError(message) {
        showToast('error', message || tCommon.error || 'Error');
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
    
    // Open modal
    window.openModal = function() {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');
        
        if (modal && form && title) {
            form.reset();
            delete form.dataset.id;
            title.textContent = tUsers.add_user || 'Add User';
            clearFormErrors(form);
            modal.classList.add('active');
        }
    };
    
    // Close modal
    window.closeModal = function() {
        const modal = document.getElementById('userModal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Reset form
        const form = document.getElementById('userForm');
        if (form) {
            form.reset();
            delete form.dataset.id;
            // Clear all errors
            clearFormErrors(form);
        }
    };
    
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
        title.textContent = tUsers.edit_user || 'Edit User';
        
        // Fill form
        form.querySelector('[name="username"]').value = item.username || '';
        form.querySelector('[name="full_name"]').value = item.full_name || '';
        form.querySelector('[name="department_id"]').value = item.department_id || '';
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
        
        // Reset location dropdowns
        const regionSelect = document.getElementById('regionSelect');
        const citySelect = document.getElementById('citySelect');
        
        if (regionSelect) {
            regionSelect.innerHTML = `<option value="">${tUsers.select_region || 'Select Region'}</option>`;
            regionSelect.disabled = true;
        }
        
        if (citySelect) {
            citySelect.innerHTML = `<option value="">${tUsers.select_city || 'Select City'}</option>`;
            citySelect.disabled = true;
        }
        
        // Load city info and cascade dropdowns
        if (item.city_id) {
            try {
                // Load city details (all cities to find the one we need)
                const citiesResponse = await fetch(`${API_BASE}?action=cities`);
                const citiesResult = await citiesResponse.json();
                
                if (citiesResult.success && citiesResult.data) {
                    const city = citiesResult.data.find(c => c.id == item.city_id);
                    if (city && city.country_id) {
                        // Set country first
                        const countrySelect = document.getElementById('countrySelect');
                        if (countrySelect) {
                            countrySelect.value = city.country_id;
                        }
                        
                        // Load regions for the country
                        const regionsResponse = await fetch(`${API_BASE}?action=regions&country_id=${city.country_id}`);
                        const regionsResult = await regionsResponse.json();
                        
                        if (regionsResult.success && regionsResult.data) {
                            if (regionSelect) {
                                regionSelect.innerHTML = `<option value="">${tUsers.select_region || 'Select Region'}</option>`;
                                regionsResult.data.forEach(region => {
                                    regionSelect.innerHTML += `<option value="${region.id}" ${region.id == city.region_id ? 'selected' : ''}>${region.name}</option>`;
                                });
                                regionSelect.disabled = false;
                            }
                            
                            // Load cities for the region and wait for it to complete
                            await loadCities(city.region_id);
                            
                            // Set city after a small delay to ensure select is populated
                            setTimeout(() => {
                                if (citySelect) {
                                    citySelect.value = item.city_id;
                                }
                            }, 100);
                        }
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
                    city_id: user.city_id,
                    email: user.email,
                    phone: user.phone,
                    status: newStatus
                };
                
                const response = await fetch(`${API_BASE}?action=user`, {
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
            const response = await fetch(`${API_BASE}?action=user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                showToast('success', tUsers.user_added || 'User added successfully');
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
                showToast('error', result.message || tCommon.save_failed || 'Failed to create user');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            showToast('error', tCommon.save_failed || 'Failed to create user');
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
            
            const response = await fetch(`${API_BASE}?action=user`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                showToast('success', tUsers.user_updated || 'User updated successfully');
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
                showToast('error', result.message || tCommon.update_failed || 'Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            showToast('error', tCommon.update_failed || 'Failed to update user');
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
})();

