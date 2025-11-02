// Locations Page JavaScript
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
    
    // Use global API_BASE if defined, otherwise fallback to relative path
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/locations.php';
    
    // Get translations
    const t = window.Translations || {};
    const tLoc = t.locations || {};
    const tCommon = t.common || {};
    const tSidebar = t.sidebar || {};
    
    // Get initial tab from URL hash or localStorage, default to 'countries'
    function getInitialTab() {
        const validTabs = ['countries', 'regions', 'cities', 'sub_regions'];
        // First, try URL hash
        if (window.location.hash) {
            const hashTab = window.location.hash.replace('#', '');
            if (validTabs.includes(hashTab)) {
                return hashTab;
            }
        }
        // Then, try localStorage
        const savedTab = localStorage.getItem('locations_active_tab');
        if (savedTab && validTabs.includes(savedTab)) {
            return savedTab;
        }
        // Default to countries
        return 'countries';
    }
    
    let currentTab = getInitialTab();
    let currentData = {
        countries: [],
        regions: [],
        cities: [],
        sub_regions: []
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        initTabs();
        
        // Set initial tab based on saved state
        switchTab(currentTab);
        
        // Listen for hash changes (browser back/forward)
        window.addEventListener('hashchange', function() {
            const hashTab = window.location.hash.replace('#', '');
            const validTabs = ['countries', 'regions', 'cities', 'sub_regions'];
            if (validTabs.includes(hashTab) && hashTab !== currentTab) {
                switchTab(hashTab);
            }
        });
        
        // Setup modal close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Setup form submissions
        document.getElementById('countryForm').addEventListener('submit', handleCountrySubmit);
        document.getElementById('regionForm').addEventListener('submit', handleRegionSubmit);
        document.getElementById('cityForm').addEventListener('submit', handleCitySubmit);
        document.getElementById('sub_regionsForm').addEventListener('submit', handleSubRegionSubmit);
        
        // Setup name validation on input fields
        setupNameValidation();
        
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
        document.querySelectorAll('.locations-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        });
    }
    
    // Switch tabs
    function switchTab(tab) {
        const validTabs = ['countries', 'regions', 'cities', 'sub_regions'];
        if (!validTabs.includes(tab)) {
            tab = 'countries'; // Fallback to default
        }
        
        currentTab = tab;
        
        // Save tab state to localStorage and URL hash
        localStorage.setItem('locations_active_tab', tab);
        window.location.hash = tab;
        
        // Update active tab
        document.querySelectorAll('.locations-tab').forEach(t => t.classList.remove('active'));
        const activeTabButton = document.querySelector(`[data-tab="${tab}"]`);
        if (activeTabButton) {
            activeTabButton.classList.add('active');
        }
        
        // Update active content
        document.querySelectorAll('.locations-content').forEach(c => c.classList.remove('active'));
        const activeContent = document.getElementById(`${tab}-content`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
        
        // Load data
        loadData(tab);
    }
    
    // Load data for current tab
    function loadData(type) {
        // Always fetch fresh data
        showLoading(type);
        fetchData(type);
    }
    
    // Fetch data from API
    async function fetchData(type) {
        try {
            const url = `${API_BASE}?action=${type}`;
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                currentData[type] = result.data || [];
                renderTable(type);
            } else {
                // Even on error, show empty state with add button
                currentData[type] = [];
                renderTable(type);
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // Even on error, show empty state with add button
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
            const typeText = type === 'countries' ? tLoc.countries : 
                             (type === 'regions' ? tLoc.regions : 
                             (type === 'cities' ? tLoc.cities : tLoc.sub_regions));
            const noFoundText = type === 'countries' ? tLoc.no_countries : 
                               (type === 'regions' ? tLoc.no_regions : 
                               (type === 'cities' ? tLoc.no_cities : tLoc.no_sub_regions));
            const addNewText = type === 'countries' ? tLoc.add_country : 
                              (type === 'regions' ? tLoc.add_region : 
                              (type === 'cities' ? tLoc.add_city : tLoc.add_sub_region));
            
            container.innerHTML = `
                <div class="locations-table-container">
                    <div class="locations-table-header">
                        <div class="locations-table-title">${typeText}</div>
                        <button class="btn-add" onclick="openModal('${type}')">
                            <span class="material-symbols-rounded">add</span>
                            ${tLoc.add_new || 'Add New'}
                        </button>
                    </div>
                    <div class="empty-state">
                        <span class="material-symbols-rounded">inventory_2</span>
                        <h3>${noFoundText}</h3>
                        <p>${addNewText}</p>
                    </div>
                </div>
            `;
            return;
        }
        
        const typeText = type === 'countries' ? tLoc.countries : 
                         (type === 'regions' ? tLoc.regions : 
                         (type === 'cities' ? tLoc.cities : tLoc.sub_regions));
        
        let html = '<div class="locations-table-container">';
        html += '<div class="locations-table-header">';
        html += `<div class="locations-table-title">${typeText}</div>`;
        html += `<button class="btn-add" onclick="openModal('${type}')">
                    <span class="material-symbols-rounded">add</span>
                    ${tLoc.add_new || 'Add New'}
                 </button>`;
        html += '</div>';
        html += '<div class="currencies-table-section">';
        html += '<table class="currencies-table">';
        
        // Table headers
        if (type === 'countries') {
            html += `<thead><tr>
                        <th>${tLoc.country_name || 'Name'}</th>
                        <th>${tLoc.country_code || 'Code'}</th>
                        <th>${tLoc.actions || 'Actions'}</th>
                     </tr></thead>`;
        } else if (type === 'regions') {
            html += `<thead><tr><th>${tLoc.region_name || 'Name'}</th><th>${tSidebar.country || 'Country'}</th><th>${tLoc.actions || 'Actions'}</th></tr></thead>`;
        } else if (type === 'cities') {
            html += `<thead><tr><th>${tLoc.city_name || 'Name'}</th><th>${tSidebar.region || 'Region'}</th><th>${tSidebar.country || 'Country'}</th><th>${tLoc.actions || 'Actions'}</th></tr></thead>`;
        } else {
            html += `<thead><tr><th>${tLoc.sub_region_name || 'Name'}</th><th>${tSidebar.city || 'City'}</th><th>${tSidebar.region || 'Region'}</th><th>${tSidebar.country || 'Country'}</th><th>${tLoc.actions || 'Actions'}</th></tr></thead>`;
        }
        
        html += '<tbody>';
        data.forEach(item => {
            html += buildTableRow(type, item);
        });
        html += '</tbody></table></div></div>';
        
        container.innerHTML = html;
        
        // Attach event listeners to action buttons
        attachActionListeners();
    }
    
    // Attach event listeners to action buttons
    // Note: Buttons now use onclick handlers directly, so this function is kept for compatibility
    function attachActionListeners() {
        // Event listeners are now inline via onclick handlers
    }
    
    // Build table row
    function buildTableRow(type, item) {
        let html = '<tr>';
        
        if (type === 'countries') {
            html += `<td>${item.name}</td>`;
            html += `<td>${item.code || '-'}</td>`;
        } else if (type === 'regions') {
            html += `<td>${item.name}</td>`;
            html += `<td>${item.country_name || '-'}</td>`;
        } else if (type === 'cities') {
            html += `<td>${item.name}</td>`;
            html += `<td>${item.region_name || '-'}</td>`;
            html += `<td>${item.country_name || '-'}</td>`;
        } else {
            html += `<td>${item.name}</td>`;
            html += `<td>${item.city_name || '-'}</td>`;
            html += `<td>${item.region_name || '-'}</td>`;
            html += `<td>${item.country_name || '-'}</td>`;
        }
        
        html += '<td>';
        html += `<button class="btn-icon" onclick="window.editItem('${type}', ${item.id})" title="${tCommon.edit || 'Edit'}">
                    <span class="material-symbols-rounded">edit</span>
                 </button>`;
        html += `<button class="btn-icon btn-danger" onclick="window.deleteItem('${type}', ${item.id})" title="${tCommon.delete || 'Delete'}">
                    <span class="material-symbols-rounded">delete</span>
                 </button>`;
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
    
    // Show error (using toast now)
    function showError(message) {
        console.error(message);
        showToast('error', message || tCommon.error || 'Error');
    }
    
    // Open modal
    window.openModal = function(type) {
        const modal = document.getElementById(`${type}Modal`);
        if (!modal) return;
        
        modal.classList.add('active');
        
        // Reset form
        const formId = getFormId(type);
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            delete form.dataset.id;
        }
        
        // Update modal title
        const title = modal.querySelector('h2');
        if (title) {
            if (type === 'countries') {
                title.textContent = tLoc.add_country || 'Add Country';
            } else if (type === 'regions') {
                title.textContent = tLoc.add_region || 'Add Region';
            } else if (type === 'cities') {
                title.textContent = tLoc.add_city || 'Add City';
            } else {
                title.textContent = tLoc.add_sub_region || 'Add Sub Region';
            }
        }
        
        // Load dependent data if needed
        if (type === 'regions') {
            loadCountriesForSelect();
        } else if (type === 'cities') {
            loadRegionsForSelect();
        } else if (type === 'sub_regions') {
            loadCitiesForSelect();
        } else if (type === 'countries') {
            loadCurrenciesForSelect();
        }
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
    
    // Helper function to get correct form ID based on type
    function getFormId(type) {
        const formIdMap = {
            'countries': 'countryForm',
            'regions': 'regionForm',
            'cities': 'cityForm',
            'sub_regions': 'sub_regionsForm'
        };
        return formIdMap[type] || `${type}Form`;
    }
    
    // Edit item
    window.editItem = async function(type, id) {
        // If data for this type hasn't been loaded yet, load it first
        if (!currentData[type] || currentData[type].length === 0) {
            await fetchData(type);
        }
        
        const item = currentData[type].find(item => item.id == id);
        if (!item) {
            console.error('Item not found:', type, id);
            return;
        }
        
        const modal = document.getElementById(`${type}Modal`);
        if (!modal) {
            console.error('Modal not found:', `${type}Modal`);
            return;
        }
        
        const formId = getFormId(type);
        const form = document.getElementById(formId);
        if (!form) {
            console.error('Form not found:', formId);
            return;
        }
        
        // Update modal title
        const title = modal.querySelector('h2');
        if (title) {
            if (type === 'countries') {
                title.textContent = tLoc.edit_country || 'Edit Country';
            } else if (type === 'regions') {
                title.textContent = tLoc.edit_region || 'Edit Region';
            } else if (type === 'cities') {
                title.textContent = tLoc.edit_city || 'Edit City';
            } else {
                title.textContent = tLoc.edit_sub_region || 'Edit Sub Region';
            }
        }
        
        // Fill form
        form.dataset.id = id;
        const nameInput = form.querySelector('input[name="name"]');
        if (nameInput) {
            nameInput.value = item.name;
        }
        
        if (type === 'countries') {
            const codeInput = form.querySelector('input[name="code"]');
            if (codeInput) {
                codeInput.value = item.code || '';
            }
        } else if (type === 'regions') {
            await loadCountriesForSelect();
            const countrySelect = form.querySelector('select[name="country_id"]');
            if (countrySelect) {
                countrySelect.value = item.country_id || '';
            }
        } else if (type === 'cities') {
            await loadRegionsForSelect();
            const regionSelect = form.querySelector('select[name="region_id"]');
            if (regionSelect) {
                regionSelect.value = item.region_id || '';
            }
        } else if (type === 'sub_regions') {
            await loadCitiesForSelect();
            const citySelect = form.querySelector('select[name="city_id"]');
            if (citySelect) {
                citySelect.value = item.city_id || '';
            }
        }
        
        modal.classList.add('active');
    };
    
    // Helper function to convert type to API action (singular form)
    function getApiAction(type) {
        const actionMap = {
            'countries': 'country',
            'regions': 'region',
            'cities': 'city',
            'sub_regions': 'sub_region'
        };
        return actionMap[type] || type;
    }
    
    // Delete item
    window.deleteItem = async function(type, id) {
        const tDeps = window.Translations?.dependencies || {};
        const deleteConfirmMessage = tLoc.delete_confirm || 'Are you sure you want to delete this item?';
        
        showConfirmDialog(deleteConfirmMessage, async function() {
            try {
                const action = getApiAction(type);
                const response = await fetch(`${API_BASE}?action=${action}&id=${id}`, {
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
                        // Try to match and translate common dependency patterns
                        // Match: "This country cannot be deleted because it has 2 region(s) associated..."
                        const regionMatch = errorMessage.match(/country.*?(\d+).*?region/i);
                        if (regionMatch) {
                            const count = regionMatch[1];
                            errorMessage = (tDeps.country_has_regions || errorMessage).replace('{count}', count);
                        }
                        
                        // Match: "This region cannot be deleted because it has 2 city/cities associated..."
                        const cityMatch = errorMessage.match(/region.*?(\d+).*?city/i);
                        if (cityMatch) {
                            const count = cityMatch[1];
                            errorMessage = (tDeps.region_has_cities || errorMessage).replace('{count}', count);
                        }
                        
                        // Match: "This city cannot be deleted because it has 2 sub region(s) associated..."
                        const subRegionMatch = errorMessage.match(/city.*?(\d+).*?sub region/i);
                        if (subRegionMatch) {
                            const count = subRegionMatch[1];
                            errorMessage = (tDeps.city_has_sub_regions || errorMessage).replace('{count}', count);
                        }
                        
                        // Match: "This sub region cannot be deleted because it has 2 merchant(s) associated..."
                        const merchantMatch = errorMessage.match(/sub region.*?(\d+).*?merchant/i);
                        if (merchantMatch) {
                            const count = merchantMatch[1];
                            errorMessage = (tDeps.sub_region_has_merchants || errorMessage).replace('{count}', count);
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
    function handleCountrySubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            code: formData.get('code')
        };
        
        if (form.dataset.id) {
            data.id = form.dataset.id;
            updateCountry(data);
        } else {
            createCountry(data);
        }
    }
    
    // Handle success/error toasts
    function handleSuccess(message) {
        showToast('success', message || tCommon.operation_completed_successfully || 'Operation completed successfully');
    }
    
    function handleError(message) {
        showToast('error', message || tCommon.an_error_occurred || 'An error occurred');
    }
    
    function handleRegionSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            country_id: formData.get('country_id')
        };
        
        if (form.dataset.id) {
            data.id = form.dataset.id;
            updateRegion(data);
        } else {
            createRegion(data);
        }
    }
    
    function handleCitySubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            region_id: formData.get('region_id')
        };
        
        if (form.dataset.id) {
            data.id = form.dataset.id;
            updateCity(data);
        } else {
            createCity(data);
        }
    }
    
    function handleSubRegionSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            city_id: formData.get('city_id')
        };
        
        if (form.dataset.id) {
            data.id = form.dataset.id;
            updateSubRegion(data);
        } else {
            createSubRegion(data);
        }
    }
    
    // Create operations
    async function createCountry(data) {
        try {
            const response = await fetch(`${API_BASE}?action=country`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.countries = [];
                loadData('countries');
                closeModal();
                showToast('success', tLoc.country_added || 'Country created successfully');
            } else {
                if (result.message && result.message.toLowerCase().includes('already exists')) {
                    // Show error under input field
                    const input = document.querySelector('#countryForm input[name="name"]');
                    if (input) {
                        input.classList.add('error');
                        input.setCustomValidity(result.message);
                        input.reportValidity();
                    }
                }
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating country:', error);
            showToast('error', tCommon.save_failed || 'Failed to create country');
        }
    }
    
    async function createRegion(data) {
        try {
            const response = await fetch(`${API_BASE}?action=region`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.regions = [];
                loadData('regions');
                closeModal();
                showToast('success', tLoc.region_added || 'Region created successfully');
            } else {
                if (result.message && result.message.toLowerCase().includes('already exists')) {
                    const input = document.querySelector('#regionForm input[name="name"]');
                    if (input) {
                        input.classList.add('error');
                        input.setCustomValidity(result.message);
                        input.reportValidity();
                    }
                }
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating region:', error);
            showToast('error', tCommon.save_failed || 'Failed to create region');
        }
    }
    
    async function createCity(data) {
        try {
            const response = await fetch(`${API_BASE}?action=city`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.cities = [];
                loadData('cities');
                closeModal();
                showToast('success', tLoc.city_added || 'City created successfully');
            } else {
                if (result.message && result.message.toLowerCase().includes('already exists')) {
                    const input = document.querySelector('#cityForm input[name="name"]');
                    if (input) {
                        input.classList.add('error');
                        input.setCustomValidity(result.message);
                        input.reportValidity();
                    }
                }
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating city:', error);
            showToast('error', tCommon.save_failed || 'Failed to create city');
        }
    }
    
    // Update operations
    async function updateCountry(data) {
        try {
            const response = await fetch(`${API_BASE}?action=country`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.countries = [];
                loadData('countries');
                closeModal();
                showToast('success', tLoc.country_updated || 'Country updated successfully');
            } else {
                if (result.message && result.message.toLowerCase().includes('already exists')) {
                    const input = document.querySelector('#countryForm input[name="name"]');
                    if (input) {
                        input.classList.add('error');
                        input.setCustomValidity(result.message);
                        input.reportValidity();
                    }
                }
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error updating country:', error);
            showToast('error', tCommon.update_failed || 'Failed to update country');
        }
    }
    
    async function updateRegion(data) {
        try {
            const response = await fetch(`${API_BASE}?action=region`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.regions = [];
                loadData('regions');
                closeModal();
                showToast('success', tLoc.region_updated || 'Region updated successfully');
            } else {
                if (result.message && result.message.toLowerCase().includes('already exists')) {
                    const input = document.querySelector('#regionForm input[name="name"]');
                    if (input) {
                        input.classList.add('error');
                        input.setCustomValidity(result.message);
                        input.reportValidity();
                    }
                }
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error updating region:', error);
            showToast('error', tCommon.update_failed || 'Failed to update region');
        }
    }
    
    async function updateCity(data) {
        try {
            const response = await fetch(`${API_BASE}?action=city`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.cities = [];
                loadData('cities');
                closeModal();
                showToast('success', tLoc.city_updated || 'City updated successfully');
            } else {
                if (result.message && result.message.toLowerCase().includes('already exists')) {
                    const input = document.querySelector('#cityForm input[name="name"]');
                    if (input) {
                        input.classList.add('error');
                        input.setCustomValidity(result.message);
                        input.reportValidity();
                    }
                }
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error updating city:', error);
            showToast('error', tCommon.update_failed || 'Failed to update city');
        }
    }
    
    // Load dependent data for selects
    async function loadCountriesForSelect() {
        if (currentData.countries.length === 0) {
            await fetchData('countries');
        }
        
        const select = document.querySelector('[name="country_id"]');
        if (select) {
            select.innerHTML = `<option value="">${tLoc.select_country || 'Select Country'}</option>`;
            currentData.countries.forEach(country => {
                select.innerHTML += `<option value="${country.id}">${country.name}</option>`;
            });
        }
    }
    
    async function loadRegionsForSelect() {
        if (currentData.regions.length === 0) {
            await fetchData('regions');
        }
        
        const select = document.querySelector('[name="region_id"]');
        if (select) {
            select.innerHTML = `<option value="">${tLoc.select_region || 'Select Region'}</option>`;
            currentData.regions.forEach(region => {
                const displayName = region.country_name ? 
                    `${region.name} (${region.country_name})` : 
                    region.name;
                select.innerHTML += `<option value="${region.id}">${displayName}</option>`;
            });
        }
    }
    
    async function loadCitiesForSelect() {
        if (currentData.cities.length === 0) {
            await fetchData('cities');
        }
        
        const select = document.querySelector('[name="city_id"]');
        if (select) {
            select.innerHTML = `<option value="">${tLoc.select_city || 'Select City'}</option>`;
            currentData.cities.forEach(city => {
                select.innerHTML += `<option value="${city.id}">${city.name} (${city.region_name || ''} - ${city.country_name || ''})</option>`;
            });
        }
    }

    // Load currencies for country modal select - REMOVED: Local Currency Code is now managed from currency-country.php
    
    // Sub Region CRUD operations
    async function createSubRegion(data) {
        try {
            const response = await fetch(`${API_BASE}?action=sub_region`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.sub_regions = [];
                loadData('sub_regions');
                closeModal();
                showToast('success', tLoc.sub_region_added || 'Sub region created successfully');
            } else {
                if (result.message && result.message.toLowerCase().includes('already exists')) {
                    const input = document.querySelector('#sub_regionsForm input[name="name"]');
                    if (input) {
                        input.classList.add('error');
                        input.setCustomValidity(result.message);
                        input.reportValidity();
                    }
                }
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating sub region:', error);
            showToast('error', tCommon.save_failed || 'Failed to create sub region');
        }
    }
    
    async function updateSubRegion(data) {
        try {
            const response = await fetch(`${API_BASE}?action=sub_region`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.sub_regions = [];
                loadData('sub_regions');
                closeModal();
                showToast('success', tLoc.sub_region_updated || 'Sub region updated successfully');
            } else {
                if (result.message && result.message.toLowerCase().includes('already exists')) {
                    const input = document.querySelector('#sub_regionsForm input[name="name"]');
                    if (input) {
                        input.classList.add('error');
                        input.setCustomValidity(result.message);
                        input.reportValidity();
                    }
                }
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error updating sub region:', error);
            showToast('error', tCommon.update_failed || 'Failed to update sub region');
        }
    }
    
    // Setup name validation
    function setupNameValidation() {
        // Debounce function
        const debounce = (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };
        
        // Country name validation
        const countryNameInput = document.querySelector('#countryForm input[name="name"]');
        if (countryNameInput) {
            countryNameInput.addEventListener('input', function() {
                this.classList.remove('error');
                this.setCustomValidity('');
            });
            
            countryNameInput.addEventListener('blur', debounce(async function() {
                const name = this.value.trim();
                if (name.length < 2) {
                    this.classList.remove('error');
                    this.setCustomValidity('');
                    return;
                }
                await checkNameExists('check_country', { name }, countryNameInput);
            }, 500));
        }
        
        // Region name validation
        const regionNameInput = document.querySelector('#regionForm input[name="name"]');
        if (regionNameInput) {
            regionNameInput.addEventListener('input', function() {
                this.classList.remove('error');
                this.setCustomValidity('');
            });
            
            regionNameInput.addEventListener('blur', debounce(async function() {
                const name = this.value.trim();
                const countryId = document.querySelector('#regionForm select[name="country_id"]').value;
                if (name.length < 2 || !countryId) {
                    this.classList.remove('error');
                    this.setCustomValidity('');
                    return;
                }
                await checkNameExists('check_region', { name, country_id: countryId }, regionNameInput);
            }, 500));
        }
        
        // City name validation
        const cityNameInput = document.querySelector('#cityForm input[name="name"]');
        if (cityNameInput) {
            cityNameInput.addEventListener('input', function() {
                this.classList.remove('error');
                this.setCustomValidity('');
            });
            
            cityNameInput.addEventListener('blur', debounce(async function() {
                const name = this.value.trim();
                const regionId = document.querySelector('#cityForm select[name="region_id"]').value;
                if (name.length < 2 || !regionId) {
                    this.classList.remove('error');
                    this.setCustomValidity('');
                    return;
                }
                await checkNameExists('check_city', { name, region_id: regionId }, cityNameInput);
            }, 500));
        }
        
        // Sub region name validation
        const subRegionNameInput = document.querySelector('#sub_regionsForm input[name="name"]');
        if (subRegionNameInput) {
            subRegionNameInput.addEventListener('input', function() {
                this.classList.remove('error');
                this.setCustomValidity('');
            });
            
            subRegionNameInput.addEventListener('blur', debounce(async function() {
                const name = this.value.trim();
                const cityId = document.querySelector('#sub_regionsForm select[name="city_id"]').value;
                if (name.length < 2 || !cityId) {
                    this.classList.remove('error');
                    this.setCustomValidity('');
                    return;
                }
                await checkNameExists('check_sub_region', { name, city_id: cityId }, subRegionNameInput);
            }, 500));
        }
    }
    
    async function checkNameExists(action, params, inputElement) {
        const id = params.id || null;
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE}?action=${action}&${queryString}`;
        
        try {
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                if (result.exists) {
                    inputElement.classList.add('error');
                    // Set custom validation message
                    let message = '';
                    if (action === 'check_country') message = tCommon.country_exists || 'This country name already exists';
                    else if (action === 'check_region') message = tCommon.region_exists || 'This region name already exists in this country';
                    else if (action === 'check_city') message = tCommon.city_exists || 'This city name already exists in this region';
                    else if (action === 'check_sub_region') message = tCommon.sub_region_exists || 'This sub region name already exists in this city';
                    inputElement.setCustomValidity(message);
                    inputElement.reportValidity();
                } else {
                    inputElement.classList.remove('error');
                    inputElement.setCustomValidity('');
                }
            }
        } catch (error) {
            console.error('Error checking name:', error);
        }
    }
    
    // Toast notifications use global showToast from toast.js
})();

