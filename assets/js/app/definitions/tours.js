// Tours Page JavaScript
(function() {
    'use strict';
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/tours.php';
    
    // Get translations
    const t = window.Translations || {};
    const tTours = t.tours || {};
    const tCommon = t.common || {};
    const tSidebar = t.sidebar || {};
    const tVehicles = t.vehicles || {};
    
    let currentData = {
        sub_regions: [],
        merchants: [],
        tours: []
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        // Setup modal close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Setup form submissions
        document.getElementById('tourForm').addEventListener('submit', handleTourSubmit);
        
        // Setup sub region change listener
        document.addEventListener('change', function(e) {
            if (e.target.name === 'sub_region_id') {
                loadMerchantsBySubRegion(e.target.value);
            }
            // Cascading dropdowns for tour regions filter
            if (e.target.id === 'filter_country_id') {
                loadRegions(e.target.value);
            }
            if (e.target.id === 'filter_region_id') {
                loadCities(e.target.value);
            }
            if (e.target.id === 'filter_city_id') {
                loadTourSubRegions(e.target.value);
            }
        });
        
        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });
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
        
        if (!searchInput) return;
        
        // Search on input
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            
            // Show/hide clear button
            clearBtn.style.display = query ? 'flex' : 'none';
            
            // Debounce search
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterTours(query);
            }, 300);
        });
        
        // Clear search
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            filterTours('');
        });
    }
    
    // Filter tours
    function filterTours(query) {
        if (!query) {
            // Show all
            renderTable();
            return;
        }
        
        // Filter data
        const filtered = currentData.tours.filter(item => {
            const searchText = query.toLowerCase();
            return (
                (item.sejour_tour_code && item.sejour_tour_code.toLowerCase().includes(searchText)) ||
                (item.name && item.name.toLowerCase().includes(searchText)) ||
                (item.country_name && item.country_name.toLowerCase().includes(searchText)) ||
                (item.region_name && item.region_name.toLowerCase().includes(searchText)) ||
                (item.city_name && item.city_name.toLowerCase().includes(searchText)) ||
                (item.sub_region_name && item.sub_region_name.toLowerCase().includes(searchText)) ||
                (item.merchant_name && item.merchant_name.toLowerCase().includes(searchText))
            );
        });
        
        // Render filtered results
        renderTable(filtered);
    }
    
    // Load data
    function loadData() {
        showLoading();
        fetchData();
    }
    
    // Fetch data from API
    async function fetchData() {
        try {
            const response = await fetch(`${API_BASE}?action=tours`);
            const result = await response.json();
            
            if (result.success) {
                currentData.tours = result.data || [];
                renderTable();
            } else {
                currentData.tours = [];
                renderTable();
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            currentData.tours = [];
            renderTable();
            showToast('error', tCommon.failed_to_load_data || 'Failed to load data');
        }
    }
    
    // Render table
    function renderTable(dataToRender = null) {
        const container = document.getElementById('tours-content');
        const data = dataToRender !== null ? dataToRender : currentData.tours;
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="tours-table-container">
                    <div class="tours-table-header">
                        <div class="tours-table-title">${tTours.title || 'Tours'}</div>
                        <button class="btn-add" onclick="openModal()">
                            <span class="material-symbols-rounded">add</span>
                            ${tTours.add_tour || 'Add Tour'}
                        </button>
                    </div>
                    <div class="empty-state">
                        <span class="material-symbols-rounded">tour</span>
                        <h3>${tTours.no_tours || 'No tours found'}</h3>
                        <p>${tTours.add_tour || 'Add your first tour'}</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '<div class="tours-table-container">';
        html += '<div class="tours-table-header">';
        html += `<div class="tours-table-title">${tTours.title || 'Tours'}</div>`;
        html += `<button class="btn-add" onclick="openModal()">
                    <span class="material-symbols-rounded">add</span>
                    ${tTours.add_tour || 'Add Tour'}
                 </button>`;
        html += '</div>';
        html += '<div class="table-wrapper">';
        html += '<table class="table">';
        html += '<thead><tr>';
        html += `<th>${tTours.sejour_tour_code || 'Sejour Tour Code'}</th>`;
        html += `<th>${tTours.tour_name || 'Tour Name'}</th>`;
        html += `<th>${tSidebar.merchant || 'Merchant'}</th>`;
        html += `<th>${tTours.tour_regions || 'Bu Turun Gerçekleştiği Bölgeler'}</th>`;
        html += `<th>${tCommon.actions || 'Actions'}</th>`;
        html += '</tr></thead>';
        
        html += '<tbody>';
        data.forEach(item => {
            // Build tour regions display
            let tourRegionsHtml = '-';
            if (item.sub_regions && item.sub_regions.length > 0) {
                const regionNames = item.sub_regions.map(sr => escapeHtml(sr.sub_region_name || '')).filter(name => name);
                tourRegionsHtml = regionNames.length > 0 ? regionNames.join(', ') : '-';
            }
            
            // Create link to contract-routes page if vehicle_contract_id exists
            let contractLink = '';
            if (item.vehicle_contract_id) {
                const contractRouteUrl = `../../app/definitions/contract-routes.php?id=${item.vehicle_contract_id}`;
                contractLink = `<a href="${contractRouteUrl}" class="btn-action btn-link" title="${tVehicles.view_routes || 'View Routes'}" style="background: #3b82f6; color: white;">
                    <span class="material-symbols-rounded">route</span>
                </a>`;
            }
            
            html += `
                <tr>
                    <td><strong>${escapeHtml(item.sejour_tour_code || '-')}</strong></td>
                    <td><strong>${escapeHtml(item.name)}</strong></td>
                    <td>${escapeHtml(item.merchant_name || '-')}</td>
                    <td>${tourRegionsHtml}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-action btn-link" data-item-id="${item.id}" title="${tVehicles.link_prices || 'Link Prices'}" style="background: #10b981; color: white;">
                                <span class="material-symbols-rounded">link</span>
                            </button>
                            ${contractLink}
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
        html += '</tbody></table></div></div>';
        
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
        
        // Find all link buttons and attach click handlers
        document.querySelectorAll('.btn-link[data-item-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-item-id'));
                window.linkContract(id);
            });
        });
    }
    
    // Show loading state
    function showLoading() {
        const container = document.getElementById('tours-content');
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
        const modal = document.getElementById('toursModal');
        if (!modal) {
            console.error('Modal not found: toursModal');
            return;
        }
        
        // Reset form first
        const form = document.getElementById('tourForm');
        if (form) {
            form.reset();
            delete form.dataset.id;
        }
        
        // Update modal title
        const title = document.getElementById('tourModalTitle');
        if (title) {
            title.textContent = tTours.add_tour || 'Add Tour';
        }
        
        // Load data first, then show modal
        try {
            await loadSubRegionsForSelect();
            await loadCountries();
            
            // Show modal after data is loaded
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error loading modal data:', error);
            showToast('error', tCommon.failed_to_load_data || 'Failed to load data');
        }
    };
    
    // Close modal
    window.closeModal = function() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = '';
        
        // Reset all forms
        document.querySelectorAll('form').forEach(form => {
            form.reset();
            delete form.dataset.id;
        });
    };
    
    // Edit item
    window.editItem = async function(id) {
        const item = currentData.tours.find(item => item.id == id);
        if (!item) {
            console.error('Item not found:', id);
            return;
        }
        
        const modal = document.getElementById('toursModal');
        if (!modal) {
            console.error('Modal not found: toursModal');
            return;
        }
        
        const form = document.getElementById('tourForm');
        if (!form) {
            console.error('Form not found: tourForm');
            return;
        }
        
        // Update modal title
        const title = modal.querySelector('h2');
        if (title) {
            title.textContent = tTours.edit_tour || 'Edit Tour';
        }
        
        // Fill form
        form.dataset.id = id;
        form.querySelector('input[name="sejour_tour_code"]').value = item.sejour_tour_code || '';
        form.querySelector('input[name="name"]').value = item.name || '';
        
        await loadSubRegionsForSelect();
        form.querySelector('select[name="sub_region_id"]').value = item.sub_region_id;
        
        // Load merchants for the selected sub region
        await loadMerchantsBySubRegion(item.sub_region_id);
        form.querySelector('select[name="merchant_id"]').value = item.merchant_id;
        
        // Load and select tour sub regions - need to find city_id from first sub_region
        if (item.sub_regions && item.sub_regions.length > 0) {
            // Get city_id from first sub_region (we need to fetch sub_regions with city info)
            const firstSubRegion = item.sub_regions[0];
            // We need to load sub_regions to get city_id, but for now use the stored sub_region_id
            // Find the city_id from sub_regions data
            const subRegionId = firstSubRegion.sub_region_id;
            // Load all sub_regions to find the city_id
            try {
                const subRegionsResponse = await fetch(`${API_BASE}?action=sub_regions`);
                const subRegionsResult = await subRegionsResponse.json();
                if (subRegionsResult.success) {
                    const foundSubRegion = subRegionsResult.data.find(sr => sr.id == subRegionId);
                    if (foundSubRegion && foundSubRegion.city_id) {
                        // Set cascading dropdowns
                        // First find country and region from city
                        const citiesResponse = await fetch(`${API_BASE}?action=cities&region_id=${foundSubRegion.region_id || ''}`);
                        const citiesResult = await citiesResponse.json();
                        if (citiesResult.success) {
                            const foundCity = citiesResult.data.find(c => c.id == foundSubRegion.city_id);
                            if (foundCity) {
                                await loadCountries();
                                document.getElementById('filter_country_id').value = foundCity.country_id || '';
                                await loadRegions(foundCity.country_id);
                                document.getElementById('filter_region_id').value = foundCity.region_id || '';
                                await loadCities(foundCity.region_id);
                                document.getElementById('filter_city_id').value = foundSubRegion.city_id || '';
                                await loadTourSubRegions(foundSubRegion.city_id);
                                
                                // Select tour sub regions checkboxes
                                const subRegionIds = item.sub_regions.map(sr => sr.sub_region_id.toString());
                                subRegionIds.forEach(id => {
                                    const checkbox = document.getElementById(`sub_region_${id}`);
                                    if (checkbox) checkbox.checked = true;
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading sub regions for edit:', error);
            }
        } else {
            await loadCountries();
        }
        
        // Show modal after data is loaded
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    
    // Delete item
    window.deleteItem = async function(id) {
        const t = window.Translations || {};
        const tLoc = t.locations || {};
        const deleteConfirmMessage = tTours.delete_confirm || tLoc.delete_confirm || 'Are you sure you want to delete this item?';
        
        showConfirmDialog(deleteConfirmMessage, async function() {
            try {
                const response = await fetch(`${API_BASE}?action=tour&id=${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                if (result.success) {
                    currentData.tours = [];
                    await loadData();
                    showToast('success', tCommon.item_deleted_successfully || 'Item deleted successfully');
                } else {
                    showToast('error', result.message);
                }
            } catch (error) {
                console.error('Error deleting item:', error);
                showToast('error', tCommon.delete_failed || 'Failed to delete item');
            }
        });
    };
    
    // Handle form submission
    function handleTourSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = {
            sejour_tour_code: formData.get('sejour_tour_code').toUpperCase(),
            name: formData.get('name'),
            sub_region_id: formData.get('sub_region_id'),
            merchant_id: formData.get('merchant_id')
        };
        
        // Get selected sub region IDs for tour regions from checkboxes
        const checkboxes = document.querySelectorAll('#sub_regions_checkbox_container input[type="checkbox"]:checked');
        data.sub_region_ids = Array.from(checkboxes).map(cb => cb.value).filter(id => id);
        
        if (form.dataset.id) {
            data.id = form.dataset.id;
            updateTour(data);
        } else {
            createTour(data);
        }
    }
    
    // Create tour
    async function createTour(data) {
        try {
            const response = await fetch(`${API_BASE}?action=tour`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.tours = [];
                await loadData();
                closeModal();
                showToast('success', tTours.tour_added || 'Tour created successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating tour:', error);
            showToast('error', tCommon.save_failed || 'Failed to create tour');
        }
    }
    
    // Update tour
    async function updateTour(data) {
        try {
            const response = await fetch(`${API_BASE}?action=tour`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.tours = [];
                await loadData();
                closeModal();
                showToast('success', tTours.tour_updated || 'Tour updated successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error updating tour:', error);
            showToast('error', tCommon.update_failed || 'Failed to update tour');
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
            select.innerHTML = `<option value="">${tTours.select_sub_region || 'Select Sub Region'}</option>`;
            currentData.sub_regions.forEach(sr => {
                select.innerHTML += `<option value="${sr.id}">${sr.name} (${sr.city_name || ''} - ${sr.region_name || ''} - ${sr.country_name || ''})</option>`;
            });
        }
    }
    
    // Load countries
    async function loadCountries() {
        const select = document.getElementById('filter_country_id');
        if (!select) return;
        
        try {
            const response = await fetch(`${API_BASE}?action=countries`);
            const result = await response.json();
            if (result.success) {
                select.innerHTML = '<option value="">Select...</option>';
                (result.data || []).forEach(country => {
                    const option = document.createElement('option');
                    option.value = country.id;
                    option.textContent = country.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading countries:', error);
        }
    }
    
    // Load regions by country
    async function loadRegions(country_id) {
        const select = document.getElementById('filter_region_id');
        const citySelect = document.getElementById('filter_city_id');
        const subRegionSelect = document.getElementById('sub_region_ids');
        
        if (!select) return;
        
        if (!country_id) {
            select.innerHTML = '<option value="">Select...</option>';
            if (citySelect) citySelect.innerHTML = '<option value="">Select...</option>';
            if (subRegionSelect) subRegionSelect.innerHTML = '<option value="">Önce ülke, bölge ve şehir seçin</option>';
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=regions&country_id=${country_id}`);
            const result = await response.json();
            if (result.success) {
                select.innerHTML = '<option value="">Select...</option>';
                (result.data || []).forEach(region => {
                    const option = document.createElement('option');
                    option.value = region.id;
                    option.textContent = region.name;
                    select.appendChild(option);
                });
            }
            
            // Reset dependent dropdowns
            if (citySelect) citySelect.innerHTML = '<option value="">Select...</option>';
            const checkboxContainer = document.getElementById('sub_regions_checkbox_container');
            if (checkboxContainer) checkboxContainer.innerHTML = '<div class="checkbox-message">Önce ülke, bölge ve şehir seçin</div>';
        } catch (error) {
            console.error('Error loading regions:', error);
        }
    }
    
    // Load cities by region
    async function loadCities(region_id) {
        const select = document.getElementById('filter_city_id');
        const subRegionSelect = document.getElementById('sub_region_ids');
        
        if (!select) return;
        
        if (!region_id) {
            select.innerHTML = '<option value="">Select...</option>';
            if (subRegionSelect) subRegionSelect.innerHTML = '<option value="">Önce ülke, bölge ve şehir seçin</option>';
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=cities&region_id=${region_id}`);
            const result = await response.json();
            if (result.success) {
                select.innerHTML = '<option value="">Select...</option>';
                (result.data || []).forEach(city => {
                    const option = document.createElement('option');
                    option.value = city.id;
                    option.textContent = city.name;
                    select.appendChild(option);
                });
            }
            
            // Reset dependent dropdown
            const checkboxContainer = document.getElementById('sub_regions_checkbox_container');
            if (checkboxContainer) checkboxContainer.innerHTML = '<div class="checkbox-message">Önce ülke, bölge ve şehir seçin</div>';
        } catch (error) {
            console.error('Error loading cities:', error);
        }
    }
    
    // Load tour sub regions as checkboxes by city
    async function loadTourSubRegions(city_id) {
        const container = document.getElementById('sub_regions_checkbox_container');
        const searchBox = document.querySelector('.checkbox-search');
        const selectAllBtn = document.querySelector('.btn-select-all');
        const deselectAllBtn = document.querySelector('.btn-deselect-all');
        const selectedCount = document.getElementById('selected_count');
        
        if (!container) return;
        
        if (!city_id) {
            container.innerHTML = '<div class="checkbox-message">Önce ülke, bölge ve şehir seçin</div>';
            if (searchBox) searchBox.style.display = 'none';
            if (selectAllBtn) selectAllBtn.style.display = 'none';
            if (deselectAllBtn) deselectAllBtn.style.display = 'none';
            if (selectedCount) selectedCount.style.display = 'none';
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=sub_regions&city_id=${city_id}`);
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
                container.innerHTML = '';
                result.data.forEach(sr => {
                    const checkboxItem = document.createElement('div');
                    checkboxItem.className = 'checkbox-item';
                    checkboxItem.dataset.regionName = sr.name.toLowerCase();
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `sub_region_${sr.id}`;
                    checkbox.name = 'sub_region_ids[]';
                    checkbox.value = sr.id;
                    checkbox.addEventListener('change', updateSelectedCount);
                    
                    const label = document.createElement('label');
                    label.htmlFor = `sub_region_${sr.id}`;
                    label.textContent = sr.name;
                    
                    checkboxItem.appendChild(checkbox);
                    checkboxItem.appendChild(label);
                    container.appendChild(checkboxItem);
                });
                
                // Show controls
                if (searchBox) searchBox.style.display = 'block';
                if (selectAllBtn) selectAllBtn.style.display = 'flex';
                if (deselectAllBtn) deselectAllBtn.style.display = 'flex';
                updateSelectedCount();
            } else {
                container.innerHTML = '<div class="checkbox-message">Bu şehir için alt bölge bulunamadı</div>';
                if (searchBox) searchBox.style.display = 'none';
                if (selectAllBtn) selectAllBtn.style.display = 'none';
                if (deselectAllBtn) deselectAllBtn.style.display = 'none';
                if (selectedCount) selectedCount.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading sub regions:', error);
            container.innerHTML = '<div class="checkbox-message">Bölgeler yüklenirken hata oluştu</div>';
            if (searchBox) searchBox.style.display = 'none';
            if (selectAllBtn) selectAllBtn.style.display = 'none';
            if (deselectAllBtn) deselectAllBtn.style.display = 'none';
            if (selectedCount) selectedCount.style.display = 'none';
        }
    }
    
    // Update selected count
    function updateSelectedCount() {
        const checkboxes = document.querySelectorAll('#sub_regions_checkbox_container input[type="checkbox"]:checked');
        const selectedCount = document.getElementById('selected_count');
        const total = document.querySelectorAll('#sub_regions_checkbox_container input[type="checkbox"]').length;
        
        if (selectedCount && total > 0) {
            const count = checkboxes.length;
            selectedCount.textContent = `${count} / ${total} seçili`;
            selectedCount.style.display = 'block';
        }
        
        // Update item styling
        document.querySelectorAll('.checkbox-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    // Select all regions
    window.selectAllRegions = function() {
        const checkboxes = document.querySelectorAll('#sub_regions_checkbox_container input[type="checkbox"]:not(.hidden)');
        checkboxes.forEach(cb => {
            cb.checked = true;
        });
        updateSelectedCount();
    };
    
    // Deselect all regions
    window.deselectAllRegions = function() {
        const checkboxes = document.querySelectorAll('#sub_regions_checkbox_container input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
        updateSelectedCount();
    };
    
    // Filter regions
    window.filterRegions = function(searchTerm) {
        const items = document.querySelectorAll('.checkbox-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const regionName = item.dataset.regionName || '';
            if (regionName.includes(term)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    };
    
    // Load merchants by sub region
    async function loadMerchantsBySubRegion(sub_region_id) {
        if (!sub_region_id) {
            const select = document.querySelector('[name="merchant_id"]');
            if (select) {
                select.innerHTML = `<option value="">${tTours.select_merchant || 'Select Merchant'}</option>`;
            }
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=merchants&sub_region_id=${sub_region_id}`);
            const result = await response.json();
            
            const select = document.querySelector('[name="merchant_id"]');
            if (select && result.success) {
                select.innerHTML = `<option value="">${tTours.select_merchant || 'Select Merchant'}</option>`;
                (result.data || []).forEach(merchant => {
                    select.innerHTML += `<option value="${merchant.id}">${merchant.name}</option>`;
                });
            }
        } catch (error) {
            console.error('Error loading merchants:', error);
        }
    }
    // Link contract to tour - region-based pricing
    window.linkContract = async function(tourId) {
        const tour = currentData.tours.find(t => t.id == tourId);
        if (!tour) {
            showToast('error', tCommon.item_not_found || 'Tour not found');
            return;
        }
        
        try {
            // Load vehicle contracts
            const contractsResponse = await fetch(`${API_BASE}?action=vehicle_contracts`);
            const contractsResult = await contractsResponse.json();
            
            if (!contractsResult.success) {
                showToast('error', contractsResult.message || tCommon.failed_to_load_data || 'Failed to load contracts');
                return;
            }
            
            const contracts = contractsResult.data || [];
            
            // Load tour's existing route mappings
            const tourRoutesResponse = await fetch(`${API_BASE}?action=tour_routes&tour_id=${tourId}`);
            const tourRoutesResult = await tourRoutesResponse.json();
            const existingRoutes = tourRoutesResult.success ? tourRoutesResult.data || [] : [];
            
            // Build route map by sub_region_id
            const routeMap = {};
            existingRoutes.forEach(r => {
                routeMap[r.sub_region_id] = r.vehicle_contract_route_id;
            });
            
            // Get tour's sub regions
            const subRegions = tour.sub_regions || [];
            
            // Build regions section HTML
            let regionsHtml = '';
            if (subRegions.length === 0) {
                regionsHtml = '<div style="padding: 20px; text-align: center; color: #6b7280;">No regions found for this tour</div>';
            } else {
                // Group by contract for efficiency
                const contractSelect = document.createElement('div');
                contractSelect.className = 'form-group';
                contractSelect.innerHTML = `
                    <label>${tVehicles.select_contract || 'Select Contract'}</label>
                    <select id="contractSelect" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 20px;">
                        <option value="">${tCommon.select || 'Select Contract...'}</option>
                        ${contracts.map(c => `<option value="${c.id}">${escapeHtml(c.contract_code || '')} - ${escapeHtml(c.company_name || '')}</option>`).join('')}
                    </select>
                `;
                
                regionsHtml = subRegions.map(sr => {
                    const existingRouteId = routeMap[sr.sub_region_id] || '';
                    return `
                        <div class="form-group" style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <label style="font-weight: 600; margin-bottom: 10px; display: block;">
                                ${escapeHtml(sr.sub_region_name || 'Unknown Region')}
                            </label>
                            <select class="region-route-select" data-sub-region-id="${sr.sub_region_id}" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px;">
                                <option value="">${tCommon.none || 'None'}</option>
                            </select>
                        </div>
                    `;
                }).join('');
            }
            
            // Create modal HTML
            let modalHtml = `
                <div class="modal" id="linkContractModal" style="display: flex;">
                    <div class="modal-content" style="max-width: 700px; max-height: 90vh;">
                        <div class="modal-header">
                            <h2>${tVehicles.link_prices || 'Link Prices by Region'}</h2>
                            <button class="btn-close" onclick="closeLinkModal()">
                                <span class="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <form id="linkContractForm" style="overflow-y: auto; max-height: calc(90vh - 150px);">
                            <div class="form-group">
                                <label>${tTours.tour_name || 'Tour'}</label>
                                <input type="text" value="${escapeHtml(tour.name || '')}" readonly style="background: #f3f4f6; width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px;">
                            </div>
                            <div class="form-group">
                                <label>${tVehicles.select_contract || 'Select Contract'}</label>
                                <select id="contractSelect" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 20px;">
                                    <option value="">${tCommon.select || 'Select Contract...'}</option>
                                    ${contracts.map(c => `<option value="${c.id}">${escapeHtml(c.contract_code || '')} - ${escapeHtml(c.company_name || '')}</option>`).join('')}
                                </select>
                            </div>
                            <div style="margin-top: 20px;">
                                <label style="font-weight: 600; margin-bottom: 15px; display: block;">${tTours.tour_regions || 'Link Routes for Each Region'}</label>
                                ${regionsHtml}
                            </div>
                            <div class="modal-footer" style="position: sticky; bottom: 0; background: white; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                                <button type="button" class="btn-secondary" onclick="closeLinkModal()">
                                    ${tCommon.cancel || 'Cancel'}
                                </button>
                                <button type="submit" class="btn-primary">
                                    ${tCommon.save || 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            // Add modal to body
            const existingModal = document.getElementById('linkContractModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Load routes when contract is selected
            document.getElementById('contractSelect').addEventListener('change', async function() {
                const contractId = this.value;
                if (!contractId) {
                    // Clear all selects
                    document.querySelectorAll('.region-route-select').forEach(select => {
                        select.innerHTML = '<option value="">None</option>';
                    });
                    return;
                }
                
                try {
                    const routesResponse = await fetch(`${API_BASE}?action=contract_routes&contract_id=${contractId}`);
                    const routesResult = await routesResponse.json();
                    
                    if (routesResult.success) {
                        const routes = routesResult.data || [];
                        const routesOptions = routes.map(r => 
                            `<option value="${r.id}">${escapeHtml(r.from_location || '')} → ${escapeHtml(r.to_location || '')}</option>`
                        ).join('');
                        
                        // Update all region selects
                        document.querySelectorAll('.region-route-select').forEach(select => {
                            const currentValue = select.value;
                            select.innerHTML = '<option value="">None</option>' + routesOptions;
                            select.value = currentValue;
                        });
                    }
                } catch (error) {
                    console.error('Error loading routes:', error);
                }
            });
            
            // Pre-select contract if tour has one
            if (tour.vehicle_contract_id) {
                document.getElementById('contractSelect').value = tour.vehicle_contract_id;
                document.getElementById('contractSelect').dispatchEvent(new Event('change'));
                
                // Wait a bit for routes to load, then set existing mappings
                setTimeout(() => {
                    existingRoutes.forEach(er => {
                        const select = document.querySelector(`.region-route-select[data-sub-region-id="${er.sub_region_id}"]`);
                        if (select) {
                            select.value = er.vehicle_contract_route_id;
                        }
                    });
                }, 500);
            }
            
            // Setup form submission
            document.getElementById('linkContractForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                const contractId = document.getElementById('contractSelect').value;
                
                if (!contractId) {
                    showToast('error', tVehicles.select_contract || 'Please select a contract');
                    return;
                }
                
                // Collect all region-route mappings
                const routes = [];
                document.querySelectorAll('.region-route-select').forEach(select => {
                    const subRegionId = select.getAttribute('data-sub-region-id');
                    const routeId = select.value;
                    if (routeId) {
                        routes.push({
                            sub_region_id: subRegionId,
                            vehicle_contract_route_id: routeId
                        });
                    }
                });
                
                try {
                    // Save contract link first
                    const linkResponse = await fetch(`${API_BASE}?action=link_contract`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tour_id: tourId,
                            vehicle_contract_id: contractId
                        })
                    });
                    
                    const linkResult = await linkResponse.json();
                    if (!linkResult.success) {
                        showToast('error', linkResult.message || tCommon.save_failed || 'Failed to link contract');
                        return;
                    }
                    
                    // Save region routes
                    const routesResponse = await fetch(`${API_BASE}?action=save_tour_routes`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tour_id: tourId,
                            routes: routes
                        })
                    });
                    
                    const routesResult = await routesResponse.json();
                    
                    if (routesResult.success) {
                        showToast('success', tCommon.saved_successfully || 'Saved successfully');
                        closeLinkModal();
                        await loadData();
                    } else {
                        showToast('error', routesResult.message || tCommon.save_failed || 'Save failed');
                        console.error('Save error:', routesResult);
                    }
                } catch (error) {
                    console.error('Error saving routes:', error);
                    showToast('error', error.message || tCommon.save_failed || 'Save failed');
                }
            });
            
            // Close modal handlers
            window.closeLinkModal = function() {
                const modal = document.getElementById('linkContractModal');
                if (modal) {
                    modal.remove();
                }
            };
            
            document.querySelectorAll('#linkContractModal .btn-close').forEach(btn => {
                btn.addEventListener('click', closeLinkModal);
            });
            
            document.getElementById('linkContractModal').addEventListener('click', function(e) {
                if (e.target === this) {
                    closeLinkModal();
                }
            });
            
        } catch (error) {
            console.error('Error loading contracts:', error);
            showToast('error', tCommon.failed_to_load_data || 'Failed to load contracts');
        }
    };
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();
