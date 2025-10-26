// Merchants Page JavaScript
(function() {
    'use strict';
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/merchants.php';
    
    // Get translations
    const t = window.Translations || {};
    const tMerchants = t.merchants || {};
    const tCommon = t.common || {};
    const tSidebar = t.sidebar || {};
    
    let currentData = {
        sub_regions: [],
        merchants: []
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        // Setup modal close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Setup form submissions
        document.getElementById('merchantForm').addEventListener('submit', handleMerchantSubmit);
        
        // Close modal when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                closeModal();
            }
        });
        
        // Setup search functionality
        setupSearch();
        
        // Load data
        loadData();
    });
    
    // Setup search
    function setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearSearch');
        let searchTimeout;
        
        // Search on input
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            
            // Show/hide clear button
            clearBtn.style.display = query ? 'flex' : 'none';
            
            // Debounce search
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterMerchants(query);
            }, 300);
        });
        
        // Clear search
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            filterMerchants('');
        });
    }
    
    // Filter merchants
    function filterMerchants(query) {
        if (!query) {
            // Show all
            renderTable();
            return;
        }
        
        // Filter data
        const filtered = currentData.merchants.filter(merchant => {
            const searchText = query.toLowerCase();
            return (
                (merchant.name && merchant.name.toLowerCase().includes(searchText)) ||
                (merchant.official_title && merchant.official_title.toLowerCase().includes(searchText)) ||
                (merchant.authorized_person && merchant.authorized_person.toLowerCase().includes(searchText)) ||
                (merchant.authorized_email && merchant.authorized_email.toLowerCase().includes(searchText)) ||
                (merchant.authorized_phone && merchant.authorized_phone.toLowerCase().includes(searchText)) ||
                (merchant.operasyon_name && merchant.operasyon_name.toLowerCase().includes(searchText)) ||
                (merchant.operasyon_email && merchant.operasyon_email.toLowerCase().includes(searchText)) ||
                (merchant.operasyon_phone && merchant.operasyon_phone.toLowerCase().includes(searchText)) ||
                (merchant.country_name && merchant.country_name.toLowerCase().includes(searchText)) ||
                (merchant.region_name && merchant.region_name.toLowerCase().includes(searchText)) ||
                (merchant.city_name && merchant.city_name.toLowerCase().includes(searchText)) ||
                (merchant.sub_region_name && merchant.sub_region_name.toLowerCase().includes(searchText))
            );
        });
        
        // Render filtered results
        console.log('Filtered results:', filtered.length, 'out of', currentData.merchants.length);
        renderTableFiltered(filtered);
    }
    
    // Render table with filtered data
    function renderTableFiltered(data) {
        renderTable(data);
    }
    
    // Load data
    function loadData() {
        showLoading();
        fetchData();
    }
    
    // Fetch data from API
    async function fetchData() {
        try {
            const response = await fetch(`${API_BASE}?action=merchants`);
            const result = await response.json();
            
            if (result.success) {
                currentData.merchants = result.data || [];
                renderTable();
            } else {
                currentData.merchants = [];
                renderTable();
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            currentData.merchants = [];
            renderTable();
            showToast('error', tCommon.failed_to_load_data || 'Failed to load data');
        }
    }
    
    // Render table
    function renderTable(dataToRender = null) {
        const container = document.getElementById('merchants-content');
        const data = dataToRender !== null ? dataToRender : currentData.merchants;
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="merchants-table-container">
                    <div class="merchants-table-header">
                        <div class="merchants-table-title">${tSidebar.merchants || 'Merchants'}</div>
                        <button class="btn-add" onclick="openModal()">
                            <span class="material-symbols-rounded">add</span>
                            ${tMerchants.add_merchant || 'Add Merchant'}
                        </button>
                    </div>
                    <div class="empty-state">
                        <span class="material-symbols-rounded">inventory_2</span>
                        <h3>${tMerchants.no_merchants || 'No merchants found'}</h3>
                        <p>${tMerchants.add_merchant || 'Add your first merchant'}</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '<div class="merchants-table-container">';
        html += '<div class="merchants-table-header">';
        html += `<div class="merchants-table-title">${tSidebar.merchants || 'Merchants'}</div>`;
        html += `<button class="btn-add" onclick="openModal()">
                    <span class="material-symbols-rounded">add</span>
                    ${tMerchants.add_merchant || 'Add Merchant'}
                 </button>`;
        html += '</div>';
        html += '<table class="table">';
        html += '<thead><tr>';
        html += `<th>${tMerchants.merchant_name || 'Name'}</th>`;
        html += `<th>${t.locations.country || 'Country'}</th>`;
        html += `<th>${t.locations.region || 'Region'}</th>`;
        html += `<th>${t.locations.city || 'City'}</th>`;
        html += `<th>${tMerchants.sub_region || 'Sub Region'}</th>`;
        html += `<th>${tMerchants.location || 'Location'}</th>`;
        html += `<th>${t.locations.actions || 'Actions'}</th>`;
        html += '</tr></thead>';
        
        html += '<tbody>';
        data.forEach(item => {
            html += `
                <tr>
                    <td><strong>${item.name}</strong></td>
                    <td>${item.country_name || '-'}</td>
                    <td>${item.region_name || '-'}</td>
                    <td>${item.city_name || '-'}</td>
                    <td>${item.sub_region_name || '-'}</td>
                    <td>
                        ${item.location_url ? `<button class="btn-action" onclick="window.open('${item.location_url}', '_blank')" style="background: #3b82f6; color: white;">
                            <span class="material-symbols-rounded">map</span>
                        </button>` : '-'}
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-action btn-edit" data-item-id="${item.id}">
                                <span class="material-symbols-rounded">edit</span>
                            </button>
                            <button class="btn-action btn-delete" data-item-id="${item.id}">
                                <span class="material-symbols-rounded">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        
        container.innerHTML = html;
        
        // Attach event listeners to action buttons
        attachActionListeners();
    }
    
    // Attach event listeners to action buttons
    function attachActionListeners() {
        // Find all edit buttons and attach click handlers
        document.querySelectorAll('.btn-edit[data-item-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-item-id'));
                window.editItem(id);
            });
        });
        
        // Find all delete buttons and attach click handlers
        document.querySelectorAll('.btn-delete[data-item-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-item-id'));
                window.deleteItem(id);
            });
        });
    }
    
    // Show loading state
    function showLoading() {
        const container = document.getElementById('merchants-content');
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
    
    // Open modal
    window.openModal = async function() {
        const modal = document.getElementById('merchantsModal');
        if (!modal) return;
        
        modal.classList.add('active');
        
        // Reset form
        const form = document.getElementById('merchantForm');
        if (form) {
            form.reset();
            delete form.dataset.id;
        }
        
        // Update modal title
        const title = modal.querySelector('h2');
        if (title) {
            title.textContent = tMerchants.add_merchant || 'Add Merchant';
        }
        
        // Load sub regions
        await loadSubRegionsForSelect();
    };
    
    // Close modal
    window.closeModal = function() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        
        // Reset all forms
        document.querySelectorAll('form').forEach(form => {
            form.reset();
            delete form.dataset.id;
        });
    };
    
    // Edit item
    window.editItem = async function(id) {
        const item = currentData.merchants.find(item => item.id == id);
        if (!item) {
            console.error('Item not found:', id);
            return;
        }
        
        const modal = document.getElementById('merchantsModal');
        if (!modal) {
            console.error('Modal not found: merchantsModal');
            return;
        }
        
        const form = document.getElementById('merchantForm');
        if (!form) {
            console.error('Form not found: merchantForm');
            return;
        }
        
        // Update modal title
        const title = modal.querySelector('h2');
        if (title) {
            title.textContent = tMerchants.edit_merchant || 'Edit Merchant';
        }
        
        // Fill form
        form.dataset.id = id;
        form.querySelector('input[name="name"]').value = item.name || '';
        form.querySelector('input[name="official_title"]').value = item.official_title || '';
        form.querySelector('input[name="authorized_person"]').value = item.authorized_person || '';
        form.querySelector('input[name="authorized_email"]').value = item.authorized_email || '';
        form.querySelector('input[name="authorized_phone"]').value = item.authorized_phone || '';
        form.querySelector('input[name="operasyon_name"]').value = item.operasyon_name || '';
        form.querySelector('input[name="operasyon_email"]').value = item.operasyon_email || '';
        form.querySelector('input[name="operasyon_phone"]').value = item.operasyon_phone || '';
        form.querySelector('input[name="location_url"]').value = item.location_url || '';
        
        await loadSubRegionsForSelect();
        form.querySelector('select[name="sub_region_id"]').value = item.sub_region_id;
        
        modal.classList.add('active');
    };
    
    // Delete item
    window.deleteItem = async function(id) {
        const t = window.Translations || {};
        const tLoc = t.locations || {};
        const tDeps = t.dependencies || {};
        const deleteConfirmMessage = tMerchants.delete_confirm || tLoc.delete_confirm || 'Are you sure you want to delete this item?';
        
        showConfirmDialog(deleteConfirmMessage, async function() {
            try {
                const response = await fetch(`${API_BASE}?action=merchant&id=${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                if (result.success) {
                    currentData.merchants = [];
                    loadData();
                    showToast('success', tCommon.item_deleted_successfully || 'Item deleted successfully');
                } else {
                    // Translate dependency messages
                    let errorMessage = result.message;
                    if (errorMessage && typeof errorMessage === 'string') {
                        // Try to match and translate merchant dependency pattern
                        const tourMatch = errorMessage.match(/merchant.*?(\d+).*?tour/i);
                        if (tourMatch) {
                            errorMessage = (tDeps.merchant_has_tours || errorMessage).replace('{count}', tourMatch[1]);
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
    function handleMerchantSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            official_title: formData.get('official_title'),
            sub_region_id: formData.get('sub_region_id'),
            authorized_person: formData.get('authorized_person'),
            authorized_email: formData.get('authorized_email'),
            authorized_phone: formData.get('authorized_phone'),
            operasyon_name: formData.get('operasyon_name'),
            operasyon_email: formData.get('operasyon_email'),
            operasyon_phone: formData.get('operasyon_phone'),
            location_url: formData.get('location_url')
        };
        
        if (form.dataset.id) {
            data.id = form.dataset.id;
            updateMerchant(data);
        } else {
            createMerchant(data);
        }
    }
    
    // Create merchant
    async function createMerchant(data) {
        try {
            const response = await fetch(`${API_BASE}?action=merchant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.merchants = [];
                loadData();
                closeModal();
                showToast('success', tMerchants.merchant_added || 'Merchant created successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating merchant:', error);
            showToast('error', tCommon.save_failed || 'Failed to create merchant');
        }
    }
    
    // Update merchant
    async function updateMerchant(data) {
        try {
            const response = await fetch(`${API_BASE}?action=merchant`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.merchants = [];
                loadData();
                closeModal();
                showToast('success', tMerchants.merchant_updated || 'Merchant updated successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error updating merchant:', error);
            showToast('error', tCommon.update_failed || 'Failed to update merchant');
        }
    }
    
    // Load sub regions for select
    async function loadSubRegionsForSelect() {
        if (currentData.sub_regions.length === 0) {
            try {
                const response = await fetch(`${API_BASE}?action=sub_regions`);
                const result = await response.json();
                if (result.success) {
                    currentData.sub_regions = result.data || [];
                }
            } catch (error) {
                console.error('Error loading sub regions:', error);
            }
        }
        
        const select = document.querySelector('[name="sub_region_id"]');
        if (select) {
            select.innerHTML = `<option value="">${tMerchants.select_sub_region || 'Select Sub Region'}</option>`;
            currentData.sub_regions.forEach(sr => {
                select.innerHTML += `<option value="${sr.id}">${sr.name} (${sr.city_name || ''} - ${sr.region_name || ''} - ${sr.country_name || ''})</option>`;
            });
        }
    }
    
    // Toast notification function
    function showToast(type, message, duration = 5000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        let title = '';
        if (type === 'error') {
            icon = 'error';
            title = tCommon.error || 'Error';
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
    }
    
    function closeToast(toast) {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }
    
    // Get current location
    window.getCurrentLocation = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const locationUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                
                const input = document.querySelector('input[name="location_url"]');
                if (input) {
                    input.value = locationUrl;
                    showToast('success', tMerchants.location_retrieved || 'Location retrieved');
                }
            }, function(error) {
                showToast('error', tMerchants.location_error || 'Error getting location: ' + error.message);
            });
        } else {
            showToast('error', tMerchants.location_not_supported || 'Geolocation is not supported by your browser');
        }
    };
    
    // Open location in maps
    window.openLocationInMaps = function(url) {
        const input = document.querySelector('input[name="location_url"]');
        const locationUrl = input ? input.value : url;
        
        if (locationUrl) {
            window.open(locationUrl, '_blank');
        } else {
            showToast('error', tMerchants.location_url_required || 'Please enter a location URL first');
        }
    };
})();
