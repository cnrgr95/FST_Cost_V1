// Locations Page JavaScript
(function() {
    'use strict';
    
    // Use global API_BASE if defined, otherwise fallback to relative path
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/locations.php';
    
    // Get translations
    const t = window.Translations || {};
    const tLoc = t.locations || {};
    const tCommon = t.common || {};
    const tSidebar = t.sidebar || {};
    
    let currentTab = 'countries';
    let currentData = {
        countries: [],
        regions: [],
        cities: [],
        sub_regions: []
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        initTabs();
        loadData(currentTab);
        
        // Setup modal close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Setup form submissions
        document.getElementById('countryForm').addEventListener('submit', handleCountrySubmit);
        document.getElementById('regionForm').addEventListener('submit', handleRegionSubmit);
        document.getElementById('cityForm').addEventListener('submit', handleCitySubmit);
        document.getElementById('sub_regionsForm').addEventListener('submit', handleSubRegionSubmit);
        
        // Close modal when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                closeModal();
            }
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
        currentTab = tab;
        
        // Update active tab
        document.querySelectorAll('.locations-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update active content
        document.querySelectorAll('.locations-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tab}-content`).classList.add('active');
        
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
                showError(result.message);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // Even on error, show empty state with add button
            currentData[type] = [];
            renderTable(type);
            showError('Failed to load data');
        }
    }
    
    // Render table
    function renderTable(type) {
        const container = document.getElementById(`${type}-content`);
        const data = currentData[type];
        
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
        html += '<table class="table">';
        
        // Table headers
        if (type === 'countries') {
            html += `<thead><tr><th>${tLoc.country_name || 'Name'}</th><th>${tLoc.country_code || 'Code'}</th><th>${tLoc.actions || 'Actions'}</th></tr></thead>`;
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
        html += '</tbody></table></div>';
        
        container.innerHTML = html;
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
        html += '<div class="table-actions">';
        html += `<button class="btn-action btn-edit" onclick="editItem('${type}', ${item.id})">
                    <span class="material-symbols-rounded">edit</span>
                 </button>`;
        html += `<button class="btn-action btn-delete" onclick="deleteItem('${type}', ${item.id})">
                    <span class="material-symbols-rounded">delete</span>
                 </button>`;
        html += '</div>';
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
                <p>Loading...</p>
            </div>
        `;
    }
    
    // Show error
    function showError(message) {
        console.error(message);
        alert(message || (tCommon.error || 'Error'));
    }
    
    // Open modal
    window.openModal = function(type) {
        const modal = document.getElementById(`${type}Modal`);
        if (!modal) return;
        
        modal.classList.add('active');
        
        // Reset form
        const form = document.getElementById(`${type}Form`);
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
    
    // Edit item
    window.editItem = async function(type, id) {
        const item = currentData[type].find(item => item.id == id);
        if (!item) return;
        
        const modal = document.getElementById(`${type}Modal`);
        if (!modal) return;
        
        const form = document.getElementById(`${type}Form`);
        if (!form) return;
        
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
        form.querySelector('input[name="name"]').value = item.name;
        
        if (type === 'countries') {
            form.querySelector('input[name="code"]').value = item.code || '';
        } else if (type === 'regions') {
            await loadCountriesForSelect();
            form.querySelector('select[name="country_id"]').value = item.country_id;
        } else if (type === 'cities') {
            await loadRegionsForSelect();
            form.querySelector('select[name="region_id"]').value = item.region_id;
        } else if (type === 'sub_regions') {
            await loadCitiesForSelect();
            form.querySelector('select[name="city_id"]').value = item.city_id;
        }
        
        modal.classList.add('active');
    };
    
    // Delete item
    window.deleteItem = async function(type, id) {
        if (!confirm(tLoc.delete_confirm || 'Are you sure you want to delete this item?')) return;
        
        try {
            const response = await fetch(`${API_BASE}?action=${type}&id=${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                currentData[type] = [];
                loadData(type);
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            showError('Failed to delete item');
        }
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
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('Error creating country:', error);
            showError('Failed to create country');
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
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('Error creating region:', error);
            showError('Failed to create region');
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
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('Error creating city:', error);
            showError('Failed to create city');
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
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('Error updating country:', error);
            showError('Failed to update country');
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
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('Error updating region:', error);
            showError('Failed to update region');
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
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('Error updating city:', error);
            showError('Failed to update city');
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
                select.innerHTML += `<option value="${region.id}">${region.name}</option>`;
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
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('Error creating sub region:', error);
            showError('Failed to create sub region');
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
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('Error updating sub region:', error);
            showError('Failed to update sub region');
        }
    }
})();

