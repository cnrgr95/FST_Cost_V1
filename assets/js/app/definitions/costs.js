// Costs Page JavaScript
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
            if (pageConfig.csrfToken) {
                window.pageConfig = window.pageConfig || {};
                window.pageConfig.csrfToken = pageConfig.csrfToken;
            }
        } catch (e) {
            console.error('Failed to parse page config:', e);
        }
    }
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/costs.php';
    
    // Get translations
    const t = window.Translations || {};
    const tCosts = t.costs || {};
    const tCommon = t.common || {};
    const tSidebar = t.sidebar || {};
    
    let currentData = {
        costs: []
    };
    
    let currencies = [];
    let periodCounter = 0;
    
    // Helper function to format date range display
    function getPeriodDateRangeDisplay(startDate, endDate) {
        if (!startDate && !endDate) return '';
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const datePart = dateStr.split(' ')[0]; // Get only date part
            const d = new Date(datePart + 'T00:00:00');
            if (isNaN(d.getTime())) return dateStr;
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            return `${day}/${month}/${d.getFullYear()}`;
        };
        const start = formatDate(startDate);
        const end = formatDate(endDate);
        if (start && end) return `${start} - ${end}`;
        if (start) return start;
        if (end) return end;
        return '';
    }
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        loadData();
        
        // Setup modal close button
        const costModalCloseBtn = document.querySelector('#costsModal .btn-close');
        if (costModalCloseBtn) {
            costModalCloseBtn.addEventListener('click', function() {
                closeModal('costsModal');
            });
        }
        
        // Setup cancel button
        const cancelCostBtn = document.getElementById('cancelCostBtn');
        if (cancelCostBtn) {
            cancelCostBtn.addEventListener('click', function() {
                closeModal('costsModal');
            });
        }
        
        // Setup add period button
        const addPeriodBtn = document.getElementById('addPeriodBtn');
        if (addPeriodBtn) {
            addPeriodBtn.addEventListener('click', function() {
                window.addPeriod();
            });
        }
        
        // Setup form submission
        const costForm = document.getElementById('costForm');
        if (costForm) {
            costForm.addEventListener('submit', handleCostSubmit);
        }
        
        // Clear errors on input/change
        if (costForm) {
            costForm.addEventListener('input', function(e) {
                if (e.target.classList.contains('error') || e.target.classList.contains('invalid') || e.target.classList.contains('has-error')) {
                    e.target.classList.remove('error', 'invalid', 'has-error');
                    e.target.removeAttribute('aria-invalid');
                    e.target.setCustomValidity('');
                    const errorMsg = e.target.parentElement.querySelector('.input-error-message');
                    if (errorMsg) {
                        errorMsg.classList.remove('show', 'has-error');
                        errorMsg.textContent = '';
                        errorMsg.removeAttribute('role');
                    }
                }
            });
            
            costForm.addEventListener('change', function(e) {
                if (e.target.classList.contains('error') || e.target.classList.contains('invalid') || e.target.classList.contains('has-error')) {
                    e.target.classList.remove('error', 'invalid', 'has-error');
                    e.target.removeAttribute('aria-invalid');
                    e.target.setCustomValidity('');
                    const errorMsg = e.target.parentElement.querySelector('.input-error-message');
                    if (errorMsg) {
                        errorMsg.classList.remove('show', 'has-error');
                        errorMsg.textContent = '';
                        errorMsg.removeAttribute('role');
                    }
                }
            });
        }
        
        // Setup hierarchical location change listeners
        document.addEventListener('change', function(e) {
            if (e.target.id === 'countrySelect') {
                loadRegions(e.target.value);
            }
            if (e.target.id === 'regionSelect') {
                loadCities(e.target.value);
            }
        });
        
        // Close modal on ESC key only (no click outside to close)
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal && activeModal.id === 'costsModal') {
                    closeModal(activeModal.id);
                    e.stopPropagation();
                    e.preventDefault();
                }
            }
        });
        
        // Load currencies
        loadCurrencies();
    });
    
    // Load data
    async function loadData() {
        showLoading();
        await fetchData();
    }
    
    // Fetch data from API
    async function fetchData() {
        try {
            const response = await fetch(`${API_BASE}?action=costs`);
            const result = await response.json();
            
            if (result.success) {
                currentData.costs = result.data || [];
                renderTable();
            } else {
                currentData.costs = [];
                renderTable();
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            currentData.costs = [];
            renderTable();
            showToast('error', tCommon.failed_to_load_data || 'Failed to load data');
        }
    }
    
    // Show loading state
    function showLoading() {
        const container = document.getElementById('costs-content');
        if (!container) return;
        container.innerHTML = `
            <div class="loading">
                <span class="material-symbols-rounded">sync</span>
                <p>${tCommon.loading || 'Loading...'}</p>
            </div>
        `;
    }
    
    // Render costs table
    function renderTable() {
        const container = document.getElementById('costs-content');
        if (!container) return;
        
        const data = currentData.costs || [];
        const totalCount = data.length;
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="costs-table-container">
                    <div class="costs-table-header">
                        <div class="costs-table-title">
                            <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 8px; font-size: 24px;">payments</span>
                            ${tCosts.costs || 'Costs'}
                        </div>
                        <button class="btn-add" onclick="openModal()">
                            <span class="material-symbols-rounded">add</span>
                            ${tCosts.add_cost || 'Add Cost'}
                        </button>
                    </div>
                    <div class="empty-state">
                        <span class="material-symbols-rounded">payments</span>
                        <h3>${tCosts.no_costs || 'No costs found'}</h3>
                        <p>${tCosts.add_cost || 'Add your first cost to get started'}</p>
                        <button class="btn-add" onclick="openModal()" style="margin-top: 20px;">
                            <span class="material-symbols-rounded">add</span>
                            ${tCosts.add_cost || 'Add Cost'}
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '<div class="costs-table-container">';
        html += '<div class="costs-table-header">';
        html += `<div class="costs-table-title">
                    <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 8px; font-size: 24px;">payments</span>
                    ${tCosts.costs || 'Costs'} 
                    <span class="table-count-badge">${totalCount}</span>
                 </div>`;
        html += '<div class="table-actions-group">';
        html += `<div class="search-box">
                    <span class="material-symbols-rounded search-icon">search</span>
                    <input type="text" 
                           id="costsSearchInput" 
                           placeholder="${tCommon.search || 'Search costs...'}" 
                           class="search-input"
                           onkeyup="filterCostsTable(this.value)">
                    <button class="search-clear" id="costsSearchClear" onclick="clearCostsSearch()" style="display: none;">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                 </div>`;
        html += `<button class="btn-add" onclick="openModal()" title="${tCosts.add_cost || 'Add Cost'}">
                    <span class="material-symbols-rounded">add</span>
                    ${tCosts.add_cost || 'Add Cost'}
                 </button>`;
        html += '</div>';
        html += '</div>';
        html += '<div class="costs-table-section">';
        html += '<table class="costs-table" id="costsTable">';
        html += '<thead><tr>';
        html += `<th class="sortable" onclick="sortTable('cost_code')">
                    ${tCosts.cost_code || 'Cost Code'}
                    <span class="sort-icon"><span class="material-symbols-rounded">swap_vert</span></span>
                 </th>`;
        html += `<th class="sortable" onclick="sortTable('name')">
                    ${tCosts.cost_name || 'Cost Name'}
                    <span class="sort-icon"><span class="material-symbols-rounded">swap_vert</span></span>
                 </th>`;
        html += `<th class="sortable" onclick="sortTable('country_name')">
                    ${tSidebar.country || 'Country'}
                    <span class="sort-icon"><span class="material-symbols-rounded">swap_vert</span></span>
                 </th>`;
        html += `<th class="sortable" onclick="sortTable('region_name')">
                    ${tSidebar.region || 'Region'}
                    <span class="sort-icon"><span class="material-symbols-rounded">swap_vert</span></span>
                 </th>`;
        html += `<th class="sortable" onclick="sortTable('city_name')">
                    ${tSidebar.city || 'City'}
                    <span class="sort-icon"><span class="material-symbols-rounded">swap_vert</span></span>
                 </th>`;
        html += `<th class="no-sort">${tCommon.actions || 'Actions'}</th>`;
        html += '</tr></thead>';
        html += '<tbody id="costsTableBody">';
        
        data.forEach((item, index) => {
            html += `
                <tr data-index="${index}" 
                     data-code="${escapeHtml((item.cost_code || '').toLowerCase())}" 
                     data-name="${escapeHtml((item.name || '').toLowerCase())}"
                     data-country="${escapeHtml((item.country_name || '').toLowerCase())}"
                     data-region="${escapeHtml((item.region_name || '').toLowerCase())}"
                     data-city="${escapeHtml((item.city_name || '').toLowerCase())}">
                    <td>
                        <span class="code-badge">${escapeHtml(item.cost_code || '-')}</span>
                    </td>
                    <td>
                        <strong class="cost-name">${escapeHtml(item.name)}</strong>
                    </td>
                    <td>
                        <span class="location-badge">${escapeHtml(item.country_name || '-')}</span>
                    </td>
                    <td>${escapeHtml(item.region_name || '-')}</td>
                    <td>${escapeHtml(item.city_name || '-')}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="editItem(${item.id})" title="${tCommon.edit || 'Edit'} ${escapeHtml(item.name)}">
                                <span class="material-symbols-rounded">edit</span>
                            </button>
                            <button class="btn-icon btn-danger" onclick="deleteItem(${item.id})" title="${tCommon.delete || 'Delete'} ${escapeHtml(item.name)}">
                                <span class="material-symbols-rounded">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        html += '<div class="table-footer">';
        html += `<div class="table-info">${tCommon.showing || 'Showing'} <strong>${totalCount}</strong> ${totalCount === 1 ? (tCosts.cost || 'cost') : (tCosts.costs || 'costs')}</div>`;
        html += '</div>';
        html += '</div></div>';
        container.innerHTML = html;
        
        // Store original data for filtering
        window.costsTableData = data;
    }
    
    // Close modal
    function closeModal(modalId) {
        const modal = document.getElementById(modalId || 'costsModal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        
        // Reset forms
        if (modalId === 'costsModal' || !modalId) {
            const costForm = document.getElementById('costForm');
            if (costForm) {
                costForm.reset();
                delete costForm.dataset.id;
                const costCodeInput = document.getElementById('costCodeInput');
                if (costCodeInput) costCodeInput.value = '';
                const periodsContainer = document.getElementById('periodsContainer');
                if (periodsContainer) periodsContainer.innerHTML = '';
                periodCounter = 0;
                clearFormErrors(costForm);
            }
            
            // Reset loading state
            const saveBtn = document.getElementById('saveCostBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
                const spinner = saveBtn.querySelector('.btn-loading-spinner');
                if (spinner) spinner.style.display = 'none';
                const saveIcon = saveBtn.querySelector('.material-symbols-rounded:not(.btn-loading-spinner .material-symbols-rounded)');
                if (saveIcon) saveIcon.style.display = 'inline-flex';
            }
        }
    }
    
    // Open modal for Costs
    window.openModal = async function() {
        const modal = document.getElementById('costsModal');
        if (!modal) {
            console.error('Modal not found: costsModal');
            return;
        }
        
        // Reset form
        const form = document.getElementById('costForm');
        if (form) {
            form.reset();
            delete form.dataset.id;
            clearFormErrors(form);
            document.getElementById('costCodeInput').value = '';
            document.getElementById('periodsContainer').innerHTML = '';
            periodCounter = 0;
        }
        
        // Update modal title
        const title = document.getElementById('costModalTitle');
        if (title) {
            title.textContent = tCosts.add_cost || 'Add Cost';
        }
        
        // Load countries and show modal
        try {
            await loadCountries();
            
            // Reset location selects
            const regionSelect = document.getElementById('regionSelect');
            const citySelect = document.getElementById('citySelect');
            if (regionSelect) {
                regionSelect.innerHTML = '<option value="">' + (tCosts.select_region || 'Select Region') + '</option>';
                regionSelect.disabled = true;
            }
            if (citySelect) {
                citySelect.innerHTML = '<option value="">' + (tCosts.select_city || 'Select City') + '</option>';
                citySelect.disabled = true;
            }
            
            // Show modal
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            
            // Focus on first input after modal opens
            setTimeout(() => {
                const firstInput = modal.querySelector('input[name="name"]');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        } catch (error) {
            console.error('Error loading modal data:', error);
            showToast('error', tCommon.failed_to_load_data || 'Failed to load data');
        }
    };
    
    // Edit item
    window.editItem = async function(id) {
        const item = currentData.costs.find(item => item.id == id);
        if (!item) {
            console.error('Item not found:', id);
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=cost&id=${id}`);
            const result = await response.json();
            
            // Debug: Log full API response
            console.log('Full API response:', result);
            
            if (result.success && result.data) {
                const cost = result.data;
                
                // Debug: Log cost data
                console.log('Cost data from API:', cost);
                const modal = document.getElementById('costsModal');
                const form = document.getElementById('costForm');
                
                if (!modal || !form) return;
                
                // Update modal title
                document.getElementById('costModalTitle').textContent = tCosts.edit_cost || 'Edit Cost';
                
                // Fill form
                form.dataset.id = id;
                document.getElementById('costCodeInput').value = cost.cost_code || '';
                form.querySelector('input[name="name"]').value = cost.name || '';
                
                // Load and set location fields
                await loadCountries();
                
                if (cost.country_id) {
                    document.getElementById('countrySelect').value = cost.country_id;
                    await loadRegions(cost.country_id);
                }
                
                if (cost.region_id) {
                    document.getElementById('regionSelect').value = cost.region_id;
                    await loadCities(cost.region_id);
                }
                
                if (cost.city_id) {
                    document.getElementById('citySelect').value = cost.city_id;
                }
                
                // Show modal first to ensure DOM is ready
                modal.classList.add('active');
                modal.setAttribute('aria-hidden', 'false');
                document.body.classList.add('modal-open');
                document.body.style.overflow = 'hidden';
                
                // Wait a bit for modal to be fully rendered
                setTimeout(async () => {
                    // Load periods
                    const periodsContainer = document.getElementById('periodsContainer');
                    if (!periodsContainer) {
                        console.error('periodsContainer not found after modal open!');
                        return;
                    }
                    
                    periodsContainer.innerHTML = '';
                    periodCounter = 0;
                    
                    // Debug: Check if periods exist
                    // Debug logs removed for production
                    
                    if (cost.periods && Array.isArray(cost.periods) && cost.periods.length > 0) {
                        // Sort periods: 
                        // 1. Periods with dates first (by start_date DESC - newest first)
                        // 2. Periods without dates after (by created_at DESC - newest first)
                        const sortedPeriods = [...cost.periods].sort((a, b) => {
                            const hasDateA = a.start_date ? true : false;
                            const hasDateB = b.start_date ? true : false;
                            
                            // If one has date and other doesn't, date comes first
                            if (hasDateA && !hasDateB) return -1;
                            if (!hasDateA && hasDateB) return 1;
                            
                            // Both have dates - sort by start_date DESC (newest first)
                            if (hasDateA && hasDateB) {
                                const dateA = new Date(a.start_date.split(' ')[0]);
                                const dateB = new Date(b.start_date.split(' ')[0]);
                                return dateB - dateA; // DESC - newest first
                            }
                            
                            // Both don't have dates - sort by created_at DESC (newest first)
                            const createdA = a.created_at ? new Date(a.created_at) : new Date(0);
                            const createdB = b.created_at ? new Date(b.created_at) : new Date(0);
                            return createdB - createdA;
                        });
                        
                        for (let i = 0; i < sortedPeriods.length; i++) {
                               const period = sortedPeriods[i];
                    try {
                        await addPeriod(period);
                    } catch (error) {
                        console.error(`Error adding period ${i + 1}:`, error);
                    }
                        }
                    }
                    
                    // After all periods are loaded, load sub regions for regional items if city is selected
                    if (cost.city_id) {
                        // Wait a bit for DOM to be fully ready
                        setTimeout(() => {
                            document.querySelectorAll('#costsModal [data-item-id]').forEach(itemBlock => {
                                const itemTypeSelect = itemBlock.querySelector('.item-type-select');
                                if (itemTypeSelect && itemTypeSelect.value === 'regional') {
                                    const itemId = itemBlock.dataset.itemId;
                                    loadSubRegionsForItem(itemId, cost.city_id);
                                }
                            });
                        }, 200);
                    }
                }, 100);
            } else {
                showToast('error', result.message || 'Failed to load cost');
            }
        } catch (error) {
            console.error('Error loading cost:', error);
            showToast('error', tCommon.failed_to_load_data || 'Failed to load data');
        }
    };
    
    // Delete item
    window.deleteItem = async function(id) {
        const cost = currentData.costs.find(item => item.id == id);
        const costName = cost ? cost.name : '';
        const deleteConfirmMessage = costName 
            ? `${tCosts.delete_confirm || 'Are you sure you want to delete this cost?'}\n\n"${escapeHtml(costName)}"`
            : (tCosts.delete_confirm || 'Are you sure you want to delete this cost?');
        
        showConfirmDialog(deleteConfirmMessage, async function() {
            try {
                showToast('info', tCommon.deleting || 'Deleting...');
                const response = await window.apiFetch(`${API_BASE}?action=cost&id=${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                if (result.success) {
                    currentData.costs = [];
                    closeModal('costsModal');
                    showToast('success', tCommon.deleted_successfully || 'Item deleted successfully');
                    await loadData();
                } else {
                    showToast('error', result.message || (tCommon.delete_failed || 'Failed to delete item'));
                }
            } catch (error) {
                console.error('Error deleting item:', error);
                showToast('error', tCommon.delete_failed || 'Failed to delete item');
            }
        });
    };
    
    // Load countries
    async function loadCountries() {
        const select = document.getElementById('countrySelect');
        if (!select) return;
        
        try {
            const response = await fetch(`${API_BASE}?action=countries`);
            const result = await response.json();
            if (result.success) {
                const selectText = tCosts.select_country || 'Select Country';
                select.innerHTML = '<option value="">' + selectText + '</option>';
                (result.data || []).forEach(country => {
                    const option = document.createElement('option');
                    option.value = country.id;
                    option.textContent = country.name;
                    select.appendChild(option);
                });
                
                if (typeof window.initializeSelectSearch === 'function') {
                    window.initializeSelectSearch(select);
                }
            }
        } catch (error) {
            console.error('Error loading countries:', error);
        }
    }
    
    // Load regions by country
    async function loadRegions(country_id) {
        const select = document.getElementById('regionSelect');
        const citySelect = document.getElementById('citySelect');
        
        if (!select) return;
        
        if (!country_id) {
            select.innerHTML = '<option value="">' + (tCosts.select_region || 'Select Region') + '</option>';
            select.disabled = true;
            if (citySelect) {
                citySelect.innerHTML = '<option value="">' + (tCosts.select_city || 'Select City') + '</option>';
                citySelect.disabled = true;
            }
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=regions&country_id=${country_id}`);
            const result = await response.json();
            if (result.success) {
                select.innerHTML = '<option value="">' + (tCosts.select_region || 'Select Region') + '</option>';
                select.disabled = false;
                
                (result.data || []).forEach(region => {
                    const option = document.createElement('option');
                    option.value = region.id;
                    option.textContent = region.name;
                    select.appendChild(option);
                });
                
                if (typeof window.initializeSelectSearch === 'function') {
                    window.initializeSelectSearch(select);
                }
            }
            
            if (citySelect) {
                citySelect.innerHTML = '<option value="">' + (tCosts.select_city || 'Select City') + '</option>';
                citySelect.disabled = true;
            }
        } catch (error) {
            console.error('Error loading regions:', error);
        }
    }
    
    // Load cities by region
    async function loadCities(region_id) {
        const select = document.getElementById('citySelect');
        
        if (!select) return;
        
        if (!region_id) {
            select.innerHTML = '<option value="">' + (tCosts.select_city || 'Select City') + '</option>';
            select.disabled = true;
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=cities&region_id=${region_id}`);
            const result = await response.json();
            if (result.success) {
                select.innerHTML = '<option value="">' + (tCosts.select_city || 'Select City') + '</option>';
                select.disabled = false;
                
                (result.data || []).forEach(city => {
                    const option = document.createElement('option');
                    option.value = city.id;
                    option.textContent = city.name;
                    select.appendChild(option);
                });
                
                if (typeof window.initializeSelectSearch === 'function') {
                    window.initializeSelectSearch(select);
                }
            }
        } catch (error) {
            console.error('Error loading cities:', error);
        }
    }
    
    // Load currencies
    async function loadCurrencies() {
        try {
            const response = await fetch(`${API_BASE}?action=currencies`);
            const result = await response.json();
            if (result.success) {
                currencies = result.data || [];
            }
        } catch (error) {
            console.error('Error loading currencies:', error);
        }
    }
    
    // Add period
    window.addPeriod = async function(periodData = null) {
        const container = document.getElementById('periodsContainer');
        if (!container) {
            console.error('periodsContainer not found!');
            return;
        }
        
        const periodId = `period_${++periodCounter}`;
        const period = periodData || {};
        
        // Render items HTML first
        let itemsHtml = '';
        
        if (period.items && Array.isArray(period.items) && period.items.length > 0) {
            for (let i = 0; i < period.items.length; i++) {
                itemsHtml += renderItem(periodId, period.items[i], i + 1);
            }
        }
        
           const periodName = period.period_name || '';
           const periodDateRange = period.start_date || period.end_date 
               ? `${period.start_date ? (period.start_date.split(' ')[0] || period.start_date) : ''} ${period.end_date ? ' - ' + (period.end_date.split(' ')[0] || period.end_date) : ''}`
               : '';
           const periodTitle = periodName || `${tCosts.period || 'Period'} ${periodCounter}`;
           
           const periodHtml = `
               <div class="period-item" data-period-id="${periodId}">
                   <div class="period-header" onclick="togglePeriod('${periodId}')">
                       <div class="period-header-content">
                           <div class="period-header-left">
                               <button type="button" class="btn-icon period-toggle" title="${tCommon.expand || 'Expand'}/${tCommon.collapse || 'Collapse'}">
                                   <span class="material-symbols-rounded period-toggle-icon">expand_more</span>
                               </button>
                               <h4 class="period-title">${escapeHtml(periodTitle)}</h4>
                           </div>
                           <div class="period-header-right">
                               ${periodDateRange ? `<span class="period-dates">${escapeHtml(periodDateRange)}</span>` : ''}
                               <button type="button" class="btn-icon btn-danger period-delete-btn" onclick="event.stopPropagation(); removePeriod('${periodId}')" title="${tCommon.remove || 'Remove'}">
                                   <span class="material-symbols-rounded">delete</span>
                               </button>
                           </div>
                       </div>
                   </div>
                   <div class="period-body" style="display: none;">
                    <div class="form-row">
                        <div class="form-group">
                            <label>${tCosts.period_name || 'Period Name'} *</label>
                            <input type="text" name="periods[${periodCounter}][period_name]" 
                                   value="${escapeHtml(period.period_name || '')}" 
                                   placeholder="${tCosts.period_name || 'Period Name'}" required>
                        </div>
                        <div class="form-group">
                            <label>${(tCosts.start_date || 'Start Date') + ' - ' + (tCosts.end_date || 'End Date')}</label>
                            <div class="date-range-wrapper" style="position: relative;">
                                <input type="text" id="period_date_range_${periodCounter}" 
                                       placeholder="${tCommon.date_range_placeholder || 'Select date range'}" 
                                       style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;" 
                                       value="${getPeriodDateRangeDisplay(period.start_date, period.end_date)}" />
                                <input type="date" id="period_start_date_${periodCounter}" 
                                       name="periods[${periodCounter}][start_date]" 
                                       value="${period.start_date ? (period.start_date.split(' ')[0] || '') : ''}" 
                                       style="display: none;" />
                                <input type="date" id="period_end_date_${periodCounter}" 
                                       name="periods[${periodCounter}][end_date]" 
                                       value="${period.end_date ? (period.end_date.split(' ')[0] || '') : ''}" 
                                       style="display: none;" />
                                <div id="periodRangePicker_${periodCounter}" class="range-picker" 
                                     style="display: none; position: absolute; top: 100%; left: 0; z-index: 2000; background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top: 4px;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="period-items-container" id="items_${periodId}">
                        ${itemsHtml}
                    </div>
                    <button type="button" class="btn-secondary btn-sm" id="addItemBtn_${periodId}" onclick="addItem('${periodId}')" ${period.items && period.items.length >= 1 ? 'style="display: none;"' : ''}>
                        <span class="material-symbols-rounded" style="font-size: 18px;">add</span>
                        ${tCosts.add_item || 'Add Item'}
                    </button>
                </div>
            </div>
        `;
        
        const periodDiv = document.createElement('div');
        periodDiv.innerHTML = periodHtml;
        const periodElement = periodDiv.firstElementChild;
        
        if (!periodElement) {
            console.error('Failed to create period element from HTML');
            return;
        }
        
        // Add period to the top of container (prepend) - newest period appears first
        if (container.firstChild) {
            container.insertBefore(periodElement, container.firstChild);
        } else {
            container.appendChild(periodElement);
        }
        
        // If this is a new period (not loading from edit), expand it automatically
        if (!periodData || !periodData.id) {
            const periodBody = periodElement.querySelector('.period-body');
            if (periodBody) {
                periodBody.style.display = 'block';
                const toggleIcon = periodElement.querySelector('.period-toggle-icon');
                if (toggleIcon) {
                    toggleIcon.style.transform = 'rotate(180deg)';
                }
            }
        }
        
        // Initialize period header update functionality
        updatePeriodHeader(periodId);
        
        // Initialize date range picker for this period
        if (typeof window.initializeDateRangePicker === 'function') {
            const translations = {
                common: tCommon
            };
            window.initializeDateRangePicker(
                `period_date_range_${periodCounter}`,
                `period_start_date_${periodCounter}`,
                `period_end_date_${periodCounter}`,
                `periodRangePicker_${periodCounter}`,
                translations
            );
        }
        
        // Initialize sub regions for regional items if city is selected
        const citySelect = document.getElementById('citySelect');
        if (citySelect && citySelect.value) {
            // Wait a bit for DOM to be ready
            setTimeout(() => {
                const itemsContainer = document.getElementById(`items_${periodId}`);
                if (itemsContainer) {
                    itemsContainer.querySelectorAll('.item-block').forEach(itemBlock => {
                        const itemId = itemBlock.dataset.itemId;
                        const itemTypeSelect = itemBlock.querySelector('.item-type-select');
                        if (itemTypeSelect && itemTypeSelect.value === 'regional') {
                            loadSubRegionsForItem(itemId, citySelect.value);
                        }
                    });
                }
            }, 100);
        }
    };
    
    // Remove period
    window.removePeriod = function(periodId) {
        const periodElement = document.querySelector(`[data-period-id="${periodId}"]`);
        if (periodElement) {
            periodElement.remove();
        }
    };
    
    // Toggle period (expand/collapse)
    window.togglePeriod = function(periodId) {
        const periodElement = document.querySelector(`[data-period-id="${periodId}"]`);
        if (!periodElement) return;
        
        const periodBody = periodElement.querySelector('.period-body');
        const toggleIcon = periodElement.querySelector('.period-toggle-icon');
        
        if (periodBody && toggleIcon) {
            if (periodBody.style.display === 'none') {
                periodBody.style.display = 'block';
                toggleIcon.textContent = 'expand_less';
            } else {
                periodBody.style.display = 'none';
                toggleIcon.textContent = 'expand_more';
            }
        }
    };
    
    // Update period header when period name or dates change
    function updatePeriodHeader(periodId) {
        const periodElement = document.querySelector(`[data-period-id="${periodId}"]`);
        if (!periodElement) return;
        
        const periodNameInput = periodElement.querySelector('input[name*="[period_name]"]');
        const startDateInput = periodElement.querySelector('input[name*="[start_date]"]');
        const endDateInput = periodElement.querySelector('input[name*="[end_date]"]');
        const periodTitleElement = periodElement.querySelector('.period-title');
        const periodDatesElement = periodElement.querySelector('.period-dates');
        
        if (!periodNameInput || !periodTitleElement) return;
        
        // Update on input
        const updateTitle = () => {
            const periodName = periodNameInput.value || '';
            const startDate = startDateInput ? startDateInput.value : '';
            const endDate = endDateInput ? endDateInput.value : '';
            
            // Format date display
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const d = new Date(dateStr + 'T00:00:00');
                if (isNaN(d.getTime())) return dateStr;
                const day = d.getDate().toString().padStart(2, '0');
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                return `${day}/${month}/${d.getFullYear()}`;
            };
            
            const periodDateRange = startDate || endDate 
                ? `${formatDate(startDate)}${endDate ? ' - ' + formatDate(endDate) : ''}`
                : '';
            
            periodTitleElement.textContent = periodName || `${tCosts.period || 'Period'} ${periodId.split('_')[1]}`;
            
            if (periodDatesElement) {
                if (periodDateRange) {
                    periodDatesElement.textContent = periodDateRange;
                    periodDatesElement.style.display = 'inline';
                } else {
                    periodDatesElement.style.display = 'none';
                }
            } else if (periodDateRange) {
                // Create dates element if it doesn't exist
                const datesSpan = document.createElement('span');
                datesSpan.className = 'period-dates';
                datesSpan.textContent = periodDateRange;
                periodTitleElement.insertAdjacentElement('afterend', datesSpan);
            }
        };
        
        periodNameInput.addEventListener('input', updateTitle);
        if (startDateInput) {
            startDateInput.addEventListener('change', updateTitle);
            // Also listen to the date range picker input
            const periodCounter = periodId.split('_')[1];
            const dateRangeInput = document.getElementById(`period_date_range_${periodCounter}`);
            if (dateRangeInput) {
                dateRangeInput.addEventListener('change', updateTitle);
            }
        }
        if (endDateInput) endDateInput.addEventListener('change', updateTitle);
        
        // Initial update
        updateTitle();
    }
    
    // Render period items
    function renderPeriodItems(periodId, items = []) {
        if (items.length === 0) {
            return '';
        }
        
        let html = '';
        for (let index = 0; index < items.length; index++) {
            html += renderItem(periodId, items[index], index + 1);
        }
        return html;
    }
    
    // Add item to period
    window.addItem = function(periodId, itemData = null) {
        const container = document.getElementById(`items_${periodId}`);
        if (!container) return;
        
        // Check if period already has an item (max 1 item per period)
        const existingItems = container.querySelectorAll('.item-block');
        if (existingItems.length >= 1) {
            showToast('error', tCosts.max_one_item_per_period || 'A period can have maximum one item');
            return;
        }
        
        const item = itemData || {};
        const itemIndex = container.querySelectorAll('.item-block').length + 1;
        const itemHtml = renderItem(periodId, item, itemIndex);
        
        const itemDiv = document.createElement('div');
        itemDiv.innerHTML = itemHtml;
        container.appendChild(itemDiv.firstElementChild);
        
        // Initialize item controls
        const newItemBlock = container.lastElementChild;
        if (newItemBlock) {
            // Check if item is regional and city is selected
            const itemTypeSelect = newItemBlock.querySelector('.item-type-select');
            if (itemTypeSelect) {
                const itemId = newItemBlock.dataset.itemId;
                // Wait for the next tick to ensure DOM is ready
                setTimeout(() => {
                    const citySelect = document.getElementById('citySelect');
                    if (itemTypeSelect.value === 'regional' && citySelect && citySelect.value) {
                        loadSubRegionsForItem(itemId, citySelect.value);
                    }
                }, 100);
            }
            initializeItemControls(newItemBlock);
        }
        
        // Update add item button visibility
        updateAddItemButton(periodId);
    };
    
    // Render item
    function renderItem(periodId, item = {}, itemIndex = 1) {
        const itemType = item.item_type || 'fixed';
        const pricingType = item.pricing_type || 'general';
        const itemId = `item_${periodId}_${itemIndex}`;
        // Extract period number from periodId (e.g., "period_1" -> "1")
        const periodNum = periodId.split('_')[1] || '1';
        
        return `
            <div class="item-block" data-item-id="${itemId}">
                <div class="item-header">
                    <h5>${tCosts.item || 'Item'} ${itemIndex}</h5>
                    <button type="button" class="btn-icon btn-danger" onclick="removeItem('${itemId}')" title="${tCommon.remove || 'Remove'}">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
                <div class="item-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label>${tCosts.item_type || 'Item Type'} *</label>
                            <select name="periods[${periodNum}][items][${itemIndex}][item_type]" 
                                    class="item-type-select" 
                                    onchange="handleItemTypeChange('${itemId}', this.value)" required>
                                <option value="fixed" ${itemType === 'fixed' ? 'selected' : ''}>${tCosts.fixed_amount || 'Fixed Amount'}</option>
                                <option value="regional" ${itemType === 'regional' ? 'selected' : ''}>${tCosts.regional_amount || 'Regional Amount'}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${tCosts.pricing_type || 'Pricing Type'} *</label>
                            <select name="periods[${periodNum}][items][${itemIndex}][pricing_type]" 
                                    class="pricing-type-select" 
                                    onchange="handlePricingTypeChange('${itemId}', this.value)" required>
                                <option value="general" ${pricingType === 'general' ? 'selected' : ''}>${tCosts.general_price || 'General Price'}</option>
                                <option value="person_based" ${pricingType === 'person_based' ? 'selected' : ''}>${tCosts.person_based_price || 'Person Based Price'}</option>
                            </select>
                        </div>
                    </div>
                    <div class="item-prices" id="prices_${itemId}">
                        ${renderPrices(itemId, itemType, pricingType, item.prices || [], periodNum, itemIndex)}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Render prices based on type
    function renderPrices(itemId, itemType, pricingType, prices = [], periodNum, itemNum) {
        if (itemType === 'fixed') {
            if (pricingType === 'general') {
                return renderGeneralPrice(itemId, prices[0] || {}, periodNum, itemNum);
            } else {
                return renderPersonPrices(itemId, prices, periodNum, itemNum);
            }
        } else { // regional
            if (pricingType === 'general') {
                return renderRegionalGeneralPrices(itemId, prices, periodNum, itemNum);
            } else {
                return renderRegionalPersonPrices(itemId, prices, periodNum, itemNum);
            }
        }
    }
    
    // Render general price (fixed)
    function renderGeneralPrice(itemId, price = {}, periodNum, itemNum) {
        
        return `
            <div class="price-block">
                <div class="form-row">
                    <div class="form-group">
                        <label>${tCosts.amount || 'Amount'} *</label>
                        <input type="number" 
                               name="periods[${periodNum}][items][${itemNum}][prices][0][amount]" 
                               value="${price.amount || ''}" 
                               step="0.01" 
                               min="0" 
                               placeholder="0.00" 
                               required>
                    </div>
                    <div class="form-group">
                        <label>${tCosts.currency || 'Currency'} *</label>
                        <select name="periods[${periodNum}][items][${itemNum}][prices][0][currency_id]" required>
                            <option value="">${tCosts.select_currency || 'Select Currency'}</option>
                            ${currencies.map(currency => `
                                <option value="${currency.id}" ${price.currency_id == currency.id ? 'selected' : ''}>
                                    ${currency.code} - ${currency.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Render person prices (fixed)
    function renderPersonPrices(itemId, prices = [], periodNum, itemNum) {
        const ageGroups = ['adult', 'child', 'infant'];
        const ageGroupLabels = {
            adult: tCosts.adult || 'Adult',
            child: tCosts.child || 'Child',
            infant: tCosts.infant || 'Infant'
        };
        
        let html = '<div class="price-block person-prices">';
        ageGroups.forEach((ageGroup, index) => {
            const price = prices.find(p => p.age_group === ageGroup) || {};
            html += `
                <div class="person-price-row">
                    <label class="age-group-label">${ageGroupLabels[ageGroup]}:</label>
                    <div class="form-row" style="flex: 1;">
                        <div class="form-group">
                            <input type="number" 
                                   name="periods[${periodNum}][items][${itemNum}][prices][${index}][amount]" 
                                   value="${price.amount || ''}" 
                                   step="0.01" 
                                   min="0" 
                                   placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <select name="periods[${periodNum}][items][${itemNum}][prices][${index}][currency_id]">
                                <option value="">${tCosts.select_currency || 'Select Currency'}</option>
                                ${currencies.map(currency => `
                                    <option value="${currency.id}" ${price.currency_id == currency.id ? 'selected' : ''}>
                                        ${currency.code}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <input type="hidden" name="periods[${periodNum}][items][${itemNum}][prices][${index}][age_group]" value="${ageGroup}">
                </div>
            `;
        });
        html += '</div>';
        return html;
    }
    
    // Render regional general prices
    function renderRegionalGeneralPrices(itemId, prices = [], periodNum, itemNum) {
        
        // Get selected sub region IDs from prices
        const selectedSubRegionIds = prices.map(p => parseInt(p.sub_region_id)).filter(id => !isNaN(id));
        
        let html = `
            <div class="price-block regional-prices">
                <div class="form-group">
                    <label>${tCosts.select_regions || 'Select Regions'} *</label>
                    <div id="sub_regions_${itemId}" class="sub-regions-container">
                        <div class="checkbox-message">${tCosts.select_city_first || 'Please select city first'}</div>
                    </div>
                </div>
                <div id="regional_general_prices_${itemId}" class="regional-prices-list">
                    ${prices.map((price, index) => `
                        <div class="regional-price-row" data-sub-region-id="${price.sub_region_id}">
                            <label>${escapeHtml(price.sub_region_name || 'Region')}:</label>
                            <div class="form-row" style="flex: 1;">
                                <div class="form-group">
                                    <input type="number" 
                                           name="periods[${periodNum}][items][${itemNum}][prices][${index}][amount]" 
                                           value="${price.amount || ''}" 
                                           step="0.01" 
                                           min="0" 
                                           placeholder="0.00">
                                </div>
                                <div class="form-group">
                                    <select name="periods[${periodNum}][items][${itemNum}][prices][${index}][currency_id]">
                                        <option value="">${tCosts.select_currency || 'Select Currency'}</option>
                                        ${currencies.map(currency => `
                                            <option value="${currency.id}" ${price.currency_id == currency.id ? 'selected' : ''}>
                                                ${currency.code}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                            <input type="hidden" name="periods[${periodNum}][items][${itemNum}][prices][${index}][sub_region_id]" value="${price.sub_region_id}">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        return html;
    }
    
    // Render regional person prices
    function renderRegionalPersonPrices(itemId, prices = [], periodNum, itemNum) {
        const ageGroups = ['adult', 'child', 'infant'];
        const ageGroupLabels = {
            adult: tCosts.adult || 'Adult',
            child: tCosts.child || 'Child',
            infant: tCosts.infant || 'Infant'
        };
        
        // Group prices by sub_region_id
        const pricesByRegion = {};
        prices.forEach(price => {
            if (!pricesByRegion[price.sub_region_id]) {
                pricesByRegion[price.sub_region_id] = {};
            }
            pricesByRegion[price.sub_region_id][price.age_group] = price;
        });
        
        // Get selected sub region IDs from prices
        const selectedSubRegionIds = Object.keys(pricesByRegion).map(id => parseInt(id)).filter(id => !isNaN(id));
        
        let html = `
            <div class="price-block regional-person-prices">
                <div class="form-group">
                    <label>${tCosts.select_regions || 'Select Regions'} *</label>
                    <div id="sub_regions_${itemId}" class="sub-regions-container">
                        <div class="checkbox-message">${tCosts.select_city_first || 'Please select city first'}</div>
                    </div>
                </div>
                <div id="regional_person_prices_${itemId}" class="regional-person-prices-list">
                    ${Object.keys(pricesByRegion).map((subRegionId, regionIndex) => {
                        const regionPrices = pricesByRegion[subRegionId];
                        const firstPrice = Object.values(regionPrices)[0];
                        return `
                            <div class="regional-person-price-group" data-sub-region-id="${subRegionId}">
                                <h6>${escapeHtml(firstPrice.sub_region_name || 'Region')}</h6>
                                ${ageGroups.map((ageGroup, ageIndex) => {
                                    const price = regionPrices[ageGroup] || {};
                                    const globalIndex = regionIndex * ageGroups.length + ageIndex;
                                    return `
                                        <div class="person-price-row">
                                            <label class="age-group-label">${ageGroupLabels[ageGroup]}:</label>
                                            <div class="form-row" style="flex: 1;">
                                                <div class="form-group">
                                                    <input type="number" 
                                                           name="periods[${periodNum}][items][${itemNum}][prices][${globalIndex}][amount]" 
                                                           value="${price.amount || ''}" 
                                                           step="0.01" 
                                                           min="0" 
                                                           placeholder="0.00">
                                                </div>
                                                <div class="form-group">
                                                    <select name="periods[${periodNum}][items][${itemNum}][prices][${globalIndex}][currency_id]">
                                                        <option value="">${tCosts.select_currency || 'Select Currency'}</option>
                                                        ${currencies.map(currency => `
                                                            <option value="${currency.id}" ${price.currency_id == currency.id ? 'selected' : ''}>
                                                                ${currency.code}
                                                            </option>
                                                        `).join('')}
                                                    </select>
                                                </div>
                                            </div>
                                            <input type="hidden" name="periods[${periodNum}][items][${itemNum}][prices][${globalIndex}][sub_region_id]" value="${subRegionId}">
                                            <input type="hidden" name="periods[${periodNum}][items][${itemNum}][prices][${globalIndex}][age_group]" value="${ageGroup}">
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        return html;
    }
    
    // Handle item type change
    window.handleItemTypeChange = function(itemId, itemType) {
        const itemBlock = document.querySelector(`[data-item-id="${itemId}"]`);
        if (!itemBlock) return;
        
        // Get period and item numbers from form field names
        const itemTypeSelect = itemBlock.querySelector('.item-type-select');
        if (!itemTypeSelect) return;
        const fieldName = itemTypeSelect.name; // periods[1][items][1][item_type]
        const match = fieldName.match(/periods\[(\d+)\]\[items\]\[(\d+)\]/);
        if (!match) return;
        const periodNum = match[1];
        const itemNum = match[2];
        
        const pricesContainer = itemBlock.querySelector('.item-prices');
        const pricingTypeSelect = itemBlock.querySelector('.pricing-type-select');
        const pricingType = pricingTypeSelect ? pricingTypeSelect.value : 'general';
        
        pricesContainer.innerHTML = renderPrices(itemId, itemType, pricingType, [], periodNum, itemNum);
        
        // Re-initialize controls if regional
        if (itemType === 'regional') {
            const citySelect = document.getElementById('citySelect');
            if (citySelect && citySelect.value) {
                loadSubRegionsForItem(itemId, citySelect.value);
            } else {
                // Show message that city must be selected first
                const subRegionsContainer = document.getElementById(`sub_regions_${itemId}`);
                if (subRegionsContainer) {
                    subRegionsContainer.innerHTML = '<div class="checkbox-message">' + (tCosts.select_city_first || 'Please select city first') + '</div>';
                }
            }
        }
    };
    
    // Handle pricing type change
    window.handlePricingTypeChange = function(itemId, pricingType) {
        const itemBlock = document.querySelector(`[data-item-id="${itemId}"]`);
        if (!itemBlock) return;
        
        // Get period and item numbers from form field names
        const itemTypeSelect = itemBlock.querySelector('.item-type-select');
        if (!itemTypeSelect) return;
        const fieldName = itemTypeSelect.name; // periods[1][items][1][item_type]
        const match = fieldName.match(/periods\[(\d+)\]\[items\]\[(\d+)\]/);
        if (!match) return;
        const periodNum = match[1];
        const itemNum = match[2];
        
        const pricesContainer = itemBlock.querySelector('.item-prices');
        const itemTypeSelect2 = itemBlock.querySelector('.item-type-select');
        const itemType = itemTypeSelect2 ? itemTypeSelect2.value : 'fixed';
        
        pricesContainer.innerHTML = renderPrices(itemId, itemType, pricingType, [], periodNum, itemNum);
        
        // Re-initialize controls if regional
        if (itemType === 'regional') {
            const citySelect = document.getElementById('citySelect');
            if (citySelect && citySelect.value) {
                loadSubRegionsForItem(itemId, citySelect.value);
            } else {
                // Show message that city must be selected first
                const subRegionsContainer = document.getElementById(`sub_regions_${itemId}`);
                if (subRegionsContainer) {
                    subRegionsContainer.innerHTML = '<div class="checkbox-message">' + (tCosts.select_city_first || 'Please select city first') + '</div>';
                }
            }
        }
    };
    
    // Initialize item controls (for regional items - load sub regions)
    function initializeItemControls(itemBlock) {
        const citySelect = document.getElementById('citySelect');
        if (!citySelect || !citySelect.value) {
            // If city not selected yet, wait for city selection
            return;
        }
        
        // If itemBlock is a single item block
        const itemId = itemBlock.dataset.itemId;
        if (itemId) {
            const itemTypeSelect = itemBlock.querySelector('.item-type-select');
            if (itemTypeSelect && itemTypeSelect.value === 'regional') {
                loadSubRegionsForItem(itemId, citySelect.value);
            }
        } else {
            // Find all regional items in this block (if it's a container)
            const regionalItems = itemBlock.querySelectorAll('[data-item-id]');
            regionalItems.forEach(itemElement => {
                const itemId = itemElement.dataset.itemId;
                const itemTypeSelect = itemElement.querySelector('.item-type-select');
                if (itemTypeSelect && itemTypeSelect.value === 'regional') {
                    loadSubRegionsForItem(itemId, citySelect.value);
                }
            });
        }
    }
    
    // Load sub regions for item
    async function loadSubRegionsForItem(itemId, cityId) {
        const container = document.getElementById(`sub_regions_${itemId}`);
        if (!container || !cityId) return;
        
        try {
            const response = await fetch(`${API_BASE}?action=sub_regions&city_id=${cityId}`);
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                container.innerHTML = '';
                
                // Get previously selected sub regions if editing
                const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
                let selectedSubRegionIds = [];
                if (itemElement && itemElement.dataset.selectedSubRegions) {
                    try {
                        selectedSubRegionIds = JSON.parse(itemElement.dataset.selectedSubRegions);
                    } catch (e) {
                        // If parsing fails, check existing price rows
                        const pricesContainer = document.getElementById(`regional_general_prices_${itemId}`) || 
                                                document.getElementById(`regional_person_prices_${itemId}`);
                        if (pricesContainer) {
                            pricesContainer.querySelectorAll('[data-sub-region-id]').forEach(row => {
                                selectedSubRegionIds.push(parseInt(row.dataset.subRegionId));
                            });
                        }
                    }
                }
                
                result.data.forEach(subRegion => {
                    const subRegionIdNum = parseInt(subRegion.id);
                    const isChecked = selectedSubRegionIds.includes(subRegionIdNum);
                    
                    // Also check if price row already exists (for edit mode)
                    let priceRowExists = false;
                    if (itemElement) {
                        const pricingTypeSelect = itemElement.querySelector('.pricing-type-select');
                        const pricingType = pricingTypeSelect ? pricingTypeSelect.value : 'general';
                        const pricesContainer = document.getElementById(`regional_general_prices_${itemId}`) || 
                                                document.getElementById(`regional_person_prices_${itemId}`);
                        if (pricesContainer) {
                            priceRowExists = pricesContainer.querySelector(`[data-sub-region-id="${subRegionIdNum}"]`) !== null;
                        }
                    }
                    
                    const finalChecked = isChecked || priceRowExists;
                    
                    const checkboxDiv = document.createElement('div');
                    checkboxDiv.className = 'checkbox-item';
                    checkboxDiv.innerHTML = `
                        <label>
                            <input type="checkbox" 
                                   name="sub_regions_${itemId}[]" 
                                   value="${subRegion.id}" 
                                   id="sub_region_${itemId}_${subRegion.id}"
                                   ${finalChecked ? 'checked' : ''}
                                   onchange="handleSubRegionChange('${itemId}', ${subRegion.id}, '${escapeHtml(subRegion.name)}', this.checked)">
                            <span>${escapeHtml(subRegion.name)}</span>
                        </label>
                    `;
                    container.appendChild(checkboxDiv);
                    
                    // If checked and price row doesn't exist, create it
                    if (finalChecked && !priceRowExists) {
                        const pricingTypeSelect = itemElement ? itemElement.querySelector('.pricing-type-select') : null;
                        const pricingType = pricingTypeSelect ? pricingTypeSelect.value : 'general';
                        const pricesContainer = document.getElementById(`regional_general_prices_${itemId}`) || 
                                                document.getElementById(`regional_person_prices_${itemId}`);
                        
                        if (pricesContainer && !pricesContainer.querySelector(`[data-sub-region-id="${subRegionIdNum}"]`)) {
                            handleSubRegionChange(itemId, subRegion.id, subRegion.name, true);
                        }
                    }
                });
            } else {
                container.innerHTML = '<div class="checkbox-message">' + (tCosts.no_sub_regions || 'No sub regions found') + '</div>';
            }
        } catch (error) {
            console.error('Error loading sub regions:', error);
            container.innerHTML = '<div class="checkbox-message">' + (tCommon.error || 'Error') + '</div>';
        }
    }
    
    // Handle sub region change for regional items
    window.handleSubRegionChange = function(itemId, subRegionId, subRegionName, isChecked) {
        const itemBlock = document.querySelector(`[data-item-id="${itemId}"]`);
        if (!itemBlock) return;
        
        const pricingTypeSelect = itemBlock.querySelector('.pricing-type-select');
        const pricingType = pricingTypeSelect ? pricingTypeSelect.value : 'general';
        
        let pricesContainer;
        if (pricingType === 'general') {
            pricesContainer = document.getElementById(`regional_general_prices_${itemId}`);
        } else {
            pricesContainer = document.getElementById(`regional_person_prices_${itemId}`);
        }
        
        if (!pricesContainer) return;
        
        if (isChecked) {
            // Add price row
            if (pricingType === 'general') {
                // Get period and item numbers from form field names
                const itemTypeSelect = itemBlock.querySelector('.item-type-select');
                if (!itemTypeSelect) return;
                const fieldName = itemTypeSelect.name; // periods[1][items][1][item_type]
                const match = fieldName.match(/periods\[(\d+)\]\[items\]\[(\d+)\]/);
                if (!match) return;
                const periodNum = match[1];
                const itemNum = match[2];
                
                const existingRows = pricesContainer.querySelectorAll('.regional-price-row').length;
                
                const row = document.createElement('div');
                row.className = 'regional-price-row';
                row.dataset.subRegionId = subRegionId;
                row.innerHTML = `
                    <label>${escapeHtml(subRegionName)}:</label>
                    <div class="form-row" style="flex: 1;">
                        <div class="form-group">
                            <input type="number" 
                                   name="periods[${periodNum}][items][${itemNum}][prices][${existingRows}][amount]" 
                                   step="0.01" 
                                   min="0" 
                                   placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <select name="periods[${periodNum}][items][${itemNum}][prices][${existingRows}][currency_id]">
                                <option value="">${tCosts.select_currency || 'Select Currency'}</option>
                                ${currencies.map(currency => `
                                    <option value="${currency.id}">${currency.code}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <input type="hidden" name="periods[${periodNum}][items][${itemNum}][prices][${existingRows}][sub_region_id]" value="${subRegionId}">
                `;
                pricesContainer.appendChild(row);
            } else {
                // Person based regional prices
                // Get period and item numbers from form field names
                const itemTypeSelect = itemBlock.querySelector('.item-type-select');
                if (!itemTypeSelect) return;
                const fieldName = itemTypeSelect.name; // periods[1][items][1][item_type]
                const match = fieldName.match(/periods\[(\d+)\]\[items\]\[(\d+)\]/);
                if (!match) return;
                const periodNum = match[1];
                const itemNum = match[2];
                
                const existingGroups = pricesContainer.querySelectorAll('.regional-person-price-group').length;
                const ageGroups = ['adult', 'child', 'infant'];
                const ageGroupLabels = {
                    adult: tCosts.adult || 'Adult',
                    child: tCosts.child || 'Child',
                    infant: tCosts.infant || 'Infant'
                };
                
                const group = document.createElement('div');
                group.className = 'regional-person-price-group';
                group.dataset.subRegionId = subRegionId;
                group.innerHTML = `
                    <h6>${escapeHtml(subRegionName)}</h6>
                    ${ageGroups.map((ageGroup, ageIndex) => {
                        const globalIndex = existingGroups * ageGroups.length + ageIndex;
                        return `
                            <div class="person-price-row">
                                <label class="age-group-label">${ageGroupLabels[ageGroup]}:</label>
                                <div class="form-row" style="flex: 1;">
                                    <div class="form-group">
                                        <input type="number" 
                                               name="periods[${periodNum}][items][${itemNum}][prices][${globalIndex}][amount]" 
                                               step="0.01" 
                                               min="0" 
                                               placeholder="0.00">
                                    </div>
                                    <div class="form-group">
                                        <select name="periods[${periodNum}][items][${itemNum}][prices][${globalIndex}][currency_id]">
                                            <option value="">${tCosts.select_currency || 'Select Currency'}</option>
                                            ${currencies.map(currency => `
                                                <option value="${currency.id}">${currency.code}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                </div>
                                <input type="hidden" name="periods[${periodNum}][items][${itemNum}][prices][${globalIndex}][sub_region_id]" value="${subRegionId}">
                                <input type="hidden" name="periods[${periodNum}][items][${itemNum}][prices][${globalIndex}][age_group]" value="${ageGroup}">
                            </div>
                        `;
                    }).join('')}
                `;
                pricesContainer.appendChild(group);
            }
        } else {
            // Remove price row
            const row = pricesContainer.querySelector(`[data-sub-region-id="${subRegionId}"]`);
            if (row) {
                row.remove();
            }
        }
    };
    
    // Remove item
    window.removeItem = function(itemId) {
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemElement) {
            // Find parent period
            const periodItem = itemElement.closest('.period-item');
            if (periodItem) {
                const periodId = periodItem.dataset.periodId;
                itemElement.remove();
                // Show add item button again
                updateAddItemButton(periodId);
            } else {
                itemElement.remove();
            }
        }
    };
    
    // Update add item button visibility
    function updateAddItemButton(periodId) {
        const container = document.getElementById(`items_${periodId}`);
        const addBtn = document.getElementById(`addItemBtn_${periodId}`);
        if (!container || !addBtn) return;
        
        const existingItems = container.querySelectorAll('.item-block');
        if (existingItems.length >= 1) {
            addBtn.style.display = 'none';
        } else {
            addBtn.style.display = 'inline-flex';
        }
    }
    
    // Handle form submission
    async function handleCostSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const form = e.target;
        clearFormErrors(form);
        
        // Validate form
        const isValid = validateForm(form);
        if (!isValid) {
            showToast('error', tCommon.fill_required_fields || 'Please fill all required fields');
            // Focus on first invalid field
            const firstInvalid = form.querySelector('.error, .invalid, [aria-invalid="true"]');
            if (firstInvalid) {
                firstInvalid.focus();
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }
        
        // Show loading state
        const saveBtn = document.getElementById('saveCostBtn');
        const cancelBtn = document.getElementById('cancelCostBtn');
        if (saveBtn) {
            saveBtn.disabled = true;
            const spinner = saveBtn.querySelector('.btn-loading-spinner');
            const saveIcon = saveBtn.querySelector('.material-symbols-rounded:not(.btn-loading-spinner .material-symbols-rounded)');
            if (spinner) spinner.style.display = 'inline-flex';
            if (saveIcon) saveIcon.style.display = 'none';
        }
        if (cancelBtn) {
            cancelBtn.disabled = true;
        }
        
        try {
            const formData = new FormData(form);
            
            // Build data structure
            const periods = buildPeriodsData(formData);
            
            const data = {
                name: formData.get('name').trim(),
                country_id: formData.get('country_id') ? parseInt(formData.get('country_id')) : null,
                region_id: formData.get('region_id') ? parseInt(formData.get('region_id')) : null,
                city_id: formData.get('city_id') ? parseInt(formData.get('city_id')) : null,
                periods: periods
            };
            
            if (form.dataset.id) {
                data.id = parseInt(form.dataset.id);
                await updateCost(data);
            } else {
                await createCost(data);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            showToast('error', tCommon.save_failed || 'Failed to save. Please try again.');
        } finally {
            // Reset loading state
            if (saveBtn) {
                saveBtn.disabled = false;
                const spinner = saveBtn.querySelector('.btn-loading-spinner');
                const saveIcon = saveBtn.querySelector('.material-symbols-rounded:not(.btn-loading-spinner .material-symbols-rounded)');
                if (spinner) spinner.style.display = 'none';
                if (saveIcon) saveIcon.style.display = 'inline-flex';
            }
            if (cancelBtn) {
                cancelBtn.disabled = false;
            }
        }
    }
    
    // Build periods data from form
    function buildPeriodsData(formData) {
        const periods = {};
        const periodsArray = [];
        
        const formEntries = Array.from(formData.entries());
        
        // Collect all period data
        for (const [key, value] of formEntries) {
            const match = key.match(/^periods\[(\d+)\]/);
            if (match) {
                const periodIndex = match[1];
                if (!periods[periodIndex]) {
                    periods[periodIndex] = {
                        period_name: '',
                        start_date: '',
                        end_date: '',
                        items: {}
                    };
                }
                
                if (key.includes('[period_name]')) {
                    periods[periodIndex].period_name = value;
                } else if (key.includes('[start_date]')) {
                    periods[periodIndex].start_date = value || null;
                } else if (key.includes('[end_date]')) {
                    periods[periodIndex].end_date = value || null;
                } else if (key.includes('[items]')) {
                    const itemMatch = key.match(/\[items\]\[(\d+)\]/);
                    if (itemMatch) {
                        const itemIndex = itemMatch[1];
                        if (!periods[periodIndex].items[itemIndex]) {
                            periods[periodIndex].items[itemIndex] = {
                                item_type: '',
                                pricing_type: '',
                                prices: []
                            };
                        }
                        
                        if (key.includes('[item_type]')) {
                            periods[periodIndex].items[itemIndex].item_type = value;
                        } else if (key.includes('[pricing_type]')) {
                            periods[periodIndex].items[itemIndex].pricing_type = value;
                        } else if (key.includes('[prices]')) {
                            const priceMatch = key.match(/\[prices\]\[(\d+)\]/);
                            if (priceMatch) {
                                const priceIndex = parseInt(priceMatch[1]);
                                
                                // Ensure prices array is large enough
                                while (periods[periodIndex].items[itemIndex].prices.length <= priceIndex) {
                                    periods[periodIndex].items[itemIndex].prices.push({});
                                }
                                
                                // Initialize price object if not exists
                                if (!periods[periodIndex].items[itemIndex].prices[priceIndex]) {
                                    periods[periodIndex].items[itemIndex].prices[priceIndex] = {};
                                }
                                
                                if (key.includes('[amount]')) {
                                    const numValue = value ? parseFloat(value) : (value === '' ? 0 : null);
                                    if (numValue !== null && !isNaN(numValue)) {
                                        periods[periodIndex].items[itemIndex].prices[priceIndex].amount = numValue;
                                    }
                                } else if (key.includes('[currency_id]')) {
                                    const intValue = value ? parseInt(value) : null;
                                    if (intValue !== null && !isNaN(intValue)) {
                                        periods[periodIndex].items[itemIndex].prices[priceIndex].currency_id = intValue;
                                    }
                                } else if (key.includes('[age_group]')) {
                                    if (value) {
                                        periods[periodIndex].items[itemIndex].prices[priceIndex].age_group = value;
                                    }
                                } else if (key.includes('[sub_region_id]')) {
                                    const intValue = value ? parseInt(value) : null;
                                    if (intValue !== null && !isNaN(intValue)) {
                                        periods[periodIndex].items[itemIndex].prices[priceIndex].sub_region_id = intValue;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        
        // Convert to array and clean up
        Object.keys(periods).forEach(periodIndex => {
            const period = periods[periodIndex];
            if (!period.period_name) return; // Skip empty periods
            
            const itemsArray = [];
            Object.keys(period.items).forEach(itemIndex => {
                const item = period.items[itemIndex];
                if (!item.item_type || !item.pricing_type) {
                    return; // Skip incomplete items
                }
                
                // Filter out empty prices
                if (!item.prices) {
                    item.prices = [];
                }
                
                item.prices = item.prices.filter(price => {
                    if (item.item_type === 'fixed' && item.pricing_type === 'general') {
                        return price && price.amount && price.currency_id;
                    } else if (item.item_type === 'fixed' && item.pricing_type === 'person_based') {
                        return price && price.age_group && price.amount !== undefined && price.currency_id;
                    } else if (item.item_type === 'regional' && item.pricing_type === 'general') {
                        return price && price.sub_region_id && price.amount && price.currency_id;
                    } else if (item.item_type === 'regional' && item.pricing_type === 'person_based') {
                        return price && price.sub_region_id && price.age_group && price.amount !== undefined && price.currency_id;
                    }
                    return false;
                });
                
                // Item'ı ekle - price olmasa bile (item_type ve pricing_type varsa)
                // Price'lar sonra eklenebilir
                if (item.prices.length > 0) {
                    itemsArray.push(item);
                }
            });
            
            // Period'u ekle - items olsa da olmasa da (period_name varsa)
            // Ama items varsa items ile birlikte ekle
            period.items = itemsArray;
            periodsArray.push(period);
        });
        return periodsArray;
    }
    
    // Create cost
    async function createCost(data) {
        try {
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
            
            const response = await window.apiFetch(`${API_BASE}?action=cost`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.costs = [];
                clearFormErrors(document.getElementById('costForm'));
                closeModal('costsModal');
                showToast('success', tCosts.cost_added || 'Cost created successfully');
                await loadData();
            } else {
                const errorMessage = result.message || 'Failed to create cost';
                showToast('error', errorMessage);
            }
        } catch (error) {
            console.error('Error creating cost:', error);
            showToast('error', tCommon.save_failed || 'Failed to create cost');
        }
    }
    
    // Update cost
    async function updateCost(data) {
        try {
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
            
            const response = await window.apiFetch(`${API_BASE}?action=cost`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.costs = [];
                clearFormErrors(document.getElementById('costForm'));
                showToast('success', tCosts.cost_updated || 'Cost updated successfully');
                await loadData();
                closeModal('costsModal');
            } else {
                const errorMessage = result.message || 'Failed to update cost';
                showToast('error', errorMessage);
                // Focus on first input on error
                const firstInput = document.querySelector('#costsModal input[name="name"]');
                if (firstInput) firstInput.focus();
            }
        } catch (error) {
            console.error('Error updating cost:', error);
            showToast('error', tCommon.update_failed || 'Failed to update cost');
        }
    }
    
    // Filter costs table
    window.filterCostsTable = function(searchTerm) {
        const tbody = document.getElementById('costsTableBody');
        const clearBtn = document.getElementById('costsSearchClear');
        
        if (!tbody) return;
        
        const term = searchTerm.toLowerCase().trim();
        const rows = tbody.querySelectorAll('tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const code = row.getAttribute('data-code') || '';
            const name = row.getAttribute('data-name') || '';
            const country = row.getAttribute('data-country') || '';
            const region = row.getAttribute('data-region') || '';
            const city = row.getAttribute('data-city') || '';
            
            const matches = term === '' || 
                          code.includes(term) || 
                          name.includes(term) || 
                          country.includes(term) || 
                          region.includes(term) || 
                          city.includes(term);
            
            row.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        });
        
        if (clearBtn) {
            clearBtn.style.display = term ? 'flex' : 'none';
        }
        
        const footer = document.querySelector('#costs-content .table-info');
        if (footer) {
            footer.innerHTML = `${tCommon.showing || 'Showing'} <strong>${visibleCount}</strong> ${visibleCount === 1 ? (tCosts.cost || 'cost') : (tCosts.costs || 'costs')}`;
        }
    };
    
    // Clear costs search
    window.clearCostsSearch = function() {
        const input = document.getElementById('costsSearchInput');
        const clearBtn = document.getElementById('costsSearchClear');
        
        if (input) {
            input.value = '';
            filterCostsTable('');
        }
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
    };
    
    // Sort table
    window.sortTable = function(column) {
        const tbody = document.getElementById('costsTableBody');
        if (!tbody || !window.costsTableData) return;
        
        // Toggle sort direction
        if (window.costsSortColumn === column) {
            window.costsSortDirection = window.costsSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            window.costsSortColumn = column;
            window.costsSortDirection = 'asc';
        }
        
        // Sort data
        const sortedData = [...window.costsTableData].sort((a, b) => {
            let aVal = a[column] || '';
            let bVal = b[column] || '';
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (window.costsSortDirection === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
        
        // Re-render table
        renderTable();
        
        // Update table data
        window.costsTableData = sortedData;
        renderTable();
    };
    
    window.costsSortColumn = null;
    window.costsSortDirection = 'asc';
    
    // Clear form errors
    function clearFormErrors(form) {
        if (!form) return;
        const errorFields = form.querySelectorAll('input.error, select.error, textarea.error, input.invalid, select.invalid, textarea.invalid');
        errorFields.forEach(field => {
            if (field && (field.tagName === 'INPUT' || field.tagName === 'SELECT' || field.tagName === 'TEXTAREA')) {
                field.classList.remove('error', 'invalid', 'has-error');
                field.removeAttribute('aria-invalid');
                if (typeof field.setCustomValidity === 'function') {
                    field.setCustomValidity('');
                }
            }
        });
        const errorMessages = form.querySelectorAll('.input-error-message');
        errorMessages.forEach(msg => {
            if (msg) {
                msg.classList.remove('show', 'has-error');
                msg.textContent = '';
                msg.removeAttribute('role');
            }
        });
    }
    
    // Validate form
    function validateForm(form) {
        if (!form) return false;
        
        clearFormErrors(form);
        
        let isValid = true;
        const requiredFields = Array.from(form.querySelectorAll('input[required], select[required]'));
        const errorFields = [];
        
        requiredFields.forEach(field => {
            if (field.disabled) return;
            
            let fieldInvalid = false;
            
            if (field.tagName === 'SELECT') {
                fieldInvalid = !field.value || field.value === '' || field.value === null;
            } else if (field.type === 'text' || !field.type) {
                fieldInvalid = !field.value || !field.value.trim();
            } else if (field.type === 'number') {
                fieldInvalid = field.hasAttribute('required') && (!field.value || isNaN(field.value));
            } else {
                fieldInvalid = !field.checkValidity();
            }
            
            if (fieldInvalid) {
                errorFields.push(field);
                isValid = false;
            }
        });
        
        if (errorFields.length > 0 && errorFields[0]) {
            setTimeout(() => {
                errorFields[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
        }
        
        return isValid;
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Listen for city change to update regional items
    document.addEventListener('change', function(e) {
        if (e.target.id === 'citySelect') {
            // Update all regional items' sub regions in the modal
            const modal = document.getElementById('costsModal');
            if (modal && modal.classList.contains('active')) {
                document.querySelectorAll('#costsModal [data-item-id]').forEach(itemBlock => {
                    const itemTypeSelect = itemBlock.querySelector('.item-type-select');
                    if (itemTypeSelect && itemTypeSelect.value === 'regional') {
                        const itemId = itemBlock.dataset.itemId;
                        if (e.target.value) {
                            loadSubRegionsForItem(itemId, e.target.value);
                        } else {
                            const subRegionsContainer = document.getElementById(`sub_regions_${itemId}`);
                            if (subRegionsContainer) {
                                subRegionsContainer.innerHTML = '<div class="checkbox-message">' + (tCosts.select_city_first || 'Please select city first') + '</div>';
                            }
                        }
                    }
                });
            }
        }
    });
})();

