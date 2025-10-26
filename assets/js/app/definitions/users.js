// Users Page JavaScript
(function() {
    'use strict';
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/users.php';
    
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
        setupSearch();
        
        // Setup modal close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
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
    
    // Setup search
    function setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearSearch');
        let searchTimeout;
        
        if (!searchInput) return;
        
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            clearBtn.style.display = query ? 'flex' : 'none';
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterData(query);
            }, 300);
        });
        
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            renderTable();
        });
    }
    
    // Filter data
    function filterData(searchText) {
        if (!searchText) {
            renderTable();
            return;
        }
        
        const searchLower = searchText.toLowerCase();
        const filtered = currentData.users.filter(item => {
            return (
                (item.username && item.username.toLowerCase().includes(searchLower)) ||
                (item.full_name && item.full_name.toLowerCase().includes(searchLower)) ||
                (item.department_name && item.department_name.toLowerCase().includes(searchLower)) ||
                (item.city_name && item.city_name.toLowerCase().includes(searchLower))
            );
        });
        
        renderTable(filtered);
    }
    
    // Fetch data from API
    async function loadData() {
        try {
            showLoading();
            const response = await fetch(`${API_BASE}?action=users`);
            const result = await response.json();
            
            if (result.success) {
                currentData.users = result.data || [];
                renderTable();
            } else {
                showError(result.message || tCommon.failed_to_load_data || 'Failed to load data');
            }
        } catch (error) {
            showError(tCommon.failed_to_load_data || 'Failed to load data');
        }
    }
    
    // Load departments
    async function loadDepartments() {
        try {
            const response = await fetch(`${API_BASE}?action=departments`);
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
            }
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    }
    
    // Load countries
    async function loadCountries() {
        try {
            const response = await fetch(`${API_BASE}?action=countries`);
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
                            ${item.status === 'active' ? `<button class="btn-action btn-deactivate" data-item-id="${item.id}">
                                <span class="material-symbols-rounded">block</span>
                            </button>` : `<button class="btn-action btn-activate" data-item-id="${item.id}">
                                <span class="material-symbols-rounded">check_circle</span>
                            </button>`}
                        </div>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        
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
    
    // Open modal
    window.openModal = function() {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');
        
        if (modal && form && title) {
            form.reset();
            form.dataset.id = '';
            title.textContent = tUsers.add_user || 'Add User';
            modal.classList.add('active');
        }
    };
    
    // Close modal
    window.closeModal = function() {
        const modal = document.getElementById('userModal');
        if (modal) {
            modal.classList.remove('active');
        }
    };
    
    // Edit user
    async function editUser(id) {
        const item = currentData.users.find(u => u.id == id);
        if (!item) {
            showError('User not found');
            return;
        }
        
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');
        
        if (!modal || !form || !title) {
            console.error('Modal, form or title not found');
            return;
        }
        
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
        form.querySelector('[name="status"]').value = item.status || 'active';
        
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
        const statusText = newStatus === 'active' ? 'activate' : 'deactivate';
        const confirmMessage = `Are you sure you want to ${statusText} this user?`;
        
        showConfirmDialog(confirmMessage, async () => {
            try {
                const user = currentData.users.find(u => u.id == id);
                if (!user) {
                    showError('User not found');
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
                    showToast('success', `User ${statusText}d successfully`);
                    await loadData();
                } else {
                    showToast('error', result.message || `Failed to ${statusText} user`);
                }
            } catch (error) {
                showToast('error', `Failed to ${statusText} user`);
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
            data.id = userId;
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
                showToast('error', result.message || tCommon.save_failed || 'Failed to create user');
            }
        } catch (error) {
            showToast('error', tCommon.save_failed || 'Failed to create user');
        }
    }
    
    // Update user
    async function updateUser(data) {
        try {
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
                showToast('error', result.message || tCommon.update_failed || 'Failed to update user');
            }
        } catch (error) {
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

