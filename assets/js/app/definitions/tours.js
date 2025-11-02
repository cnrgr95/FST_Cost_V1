// Tours Page JavaScript
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
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/tours.php';
    
    // Get translations
    const t = window.Translations || {};
    const tTours = t.tours || {};
    const tCommon = t.common || {};
    const tSidebar = t.sidebar || {};
    const tVehicles = t.vehicles || {};
    
    // Get initial tab from URL hash or localStorage, default to 'tours'
    function getInitialTab() {
        const validTabs = ['tours'];
        // First, try URL hash
        if (window.location.hash) {
            const hashTab = window.location.hash.replace('#', '');
            if (validTabs.includes(hashTab)) {
                return hashTab;
            }
        }
        // Then, try localStorage
        const savedTab = localStorage.getItem('tours_active_tab');
        if (savedTab && validTabs.includes(savedTab)) {
            return savedTab;
        }
        // Default to tours
        return 'tours';
    }
    
    let currentTab = getInitialTab();
    let currentData = {
        tours: []
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        initTabs();
        
        // Set initial tab based on saved state
        switchTab(currentTab);
        
        // Listen for hash changes (browser back/forward)
        window.addEventListener('hashchange', function() {
            const hashTab = window.location.hash.replace('#', '');
            const validTabs = ['tours'];
            if (validTabs.includes(hashTab) && hashTab !== currentTab) {
                switchTab(hashTab);
            }
        });
        
        // Setup modal close buttons
        const toursModalCloseBtn = document.querySelector('#toursModal .btn-close');
        if (toursModalCloseBtn) {
            toursModalCloseBtn.addEventListener('click', function() {
                closeModal('toursModal');
            });
        }
        
        // Setup form submissions
        const tourForm = document.getElementById('tourForm');
        if (tourForm) {
            tourForm.addEventListener('submit', handleTourSubmit);
        }
        
        // Clear errors on input/change for tour form - REAL-TIME CLEARING
        if (tourForm) {
            tourForm.addEventListener('input', function(e) {
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
            
            tourForm.addEventListener('change', function(e) {
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
            if (e.target.id === 'citySelect') {
                loadSubRegionsForTour(e.target.value);
            }
        });
        
        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal(this.id);
                }
            });
        });
    });
    
    // Tab initialization
    function initTabs() {
        document.querySelectorAll('.tours-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        });
    }
    
    // Switch tabs
    function switchTab(tab) {
        const validTabs = ['tours'];
        if (!validTabs.includes(tab)) {
            tab = 'tours'; // Fallback to default
        }
        
        currentTab = tab;
        
        // Save tab state to localStorage and URL hash
        localStorage.setItem('tours_active_tab', tab);
        window.location.hash = tab;
        
        // Update active tab
        document.querySelectorAll('.tours-tab').forEach(t => t.classList.remove('active'));
        const activeTabButton = document.querySelector(`[data-tab="${tab}"]`);
        if (activeTabButton) {
            activeTabButton.classList.add('active');
        }
        
        // Update active content - BASIT YAPI
        document.querySelectorAll('.tours-content').forEach(c => c.classList.remove('active'));
        const activeContent = document.getElementById(`${tab}-content`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
        
        // Update page header title
        const pageHeader = document.getElementById('toursPageTitle') || document.querySelector('.tours-header h1');
        if (pageHeader) {
            pageHeader.textContent = tTours.tours || 'Tours';
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
            if (type === 'tours') {
                url = `${API_BASE}?action=tours`;
            } else {
                console.error('Unknown data type:', type);
                return;
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
    
    // Render table based on type
    function renderTable(type) {
        const container = document.getElementById(`${type}-content`);
        if (!container) {
            console.warn(`Container not found: ${type}-content`);
            return;
        }
        
        // Only render if this tab is still active
        if (!container.classList.contains('active')) {
            console.warn(`Tab ${type} is not active, skipping render`);
            return;
        }
        
        const data = currentData[type] || [];
        
        if (type === 'tours') {
            renderToursTable(container, data);
        }
    }
    
    // Render Tours table
    function renderToursTable(container, data) {
        const totalCount = data.length;
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="tours-table-container">
                    <div class="tours-table-header">
                        <div class="tours-table-title">
                            <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 8px; font-size: 24px;">tour</span>
                            ${tTours.tours || 'Tours'}
                        </div>
                        <button class="btn-add" onclick="openModal()">
                            <span class="material-symbols-rounded">add</span>
                            ${tTours.add_tour || 'Add Tour'}
                        </button>
                    </div>
                    <div class="empty-state">
                        <span class="material-symbols-rounded">tour</span>
                        <h3>${tTours.no_tours || 'No tours found'}</h3>
                        <p>${tTours.add_tour || 'Add your first tour to get started'}</p>
                        <button class="btn-add" onclick="openModal()" style="margin-top: 20px;">
                            <span class="material-symbols-rounded">add</span>
                            ${tTours.add_tour || 'Add Tour'}
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '<div class="tours-table-container">';
        html += '<div class="tours-table-header">';
        html += `<div class="tours-table-title">
                    <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 8px; font-size: 24px;">tour</span>
                    ${tTours.tours || 'Tours'} 
                    <span class="table-count-badge">${totalCount}</span>
                 </div>`;
        html += '<div class="table-actions-group">';
        html += `<div class="search-box">
                    <span class="material-symbols-rounded search-icon">search</span>
                    <input type="text" 
                           id="toursSearchInput" 
                           placeholder="${tCommon.search || 'Search tours...'}" 
                           class="search-input"
                           onkeyup="filterToursTable(this.value)">
                    <button class="search-clear" id="toursSearchClear" onclick="clearToursSearch()" style="display: none;">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                 </div>`;
        html += `<button class="btn-add" onclick="openModal()" title="${tTours.add_tour || 'Add Tour'}">
                    <span class="material-symbols-rounded">add</span>
                    ${tTours.add_tour || 'Add Tour'}
                 </button>`;
        html += '</div>';
        html += '</div>';
        html += '<div class="currencies-table-section">';
        html += '<table class="currencies-table" id="toursTable">';
        html += '<thead><tr>';
        html += `<th class="sortable" onclick="sortTable('tours', 'sejour_tour_code')">
                    ${tTours.sejour_tour_code || 'Sejour Tour Code'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="sortable" onclick="sortTable('tours', 'name')">
                    ${tTours.tour_name || 'Tour Name'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="sortable" onclick="sortTable('tours', 'country_name')">
                    ${tSidebar.country || 'Country'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="sortable" onclick="sortTable('tours', 'region_name')">
                    ${tSidebar.region || 'Region'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="sortable" onclick="sortTable('tours', 'city_name')">
                    ${tSidebar.city || 'City'}
                    <span class="sort-icon">⇅</span>
                 </th>`;
        html += `<th class="no-sort">${tCommon.actions || 'Actions'}</th>`;
        html += '</tr></thead>';
        html += '<tbody id="toursTableBody">';
        
        data.forEach((item, index) => {
            html += `
                <tr data-index="${index}" 
                     data-code="${escapeHtml((item.sejour_tour_code || '').toLowerCase())}" 
                     data-name="${escapeHtml((item.name || '').toLowerCase())}"
                     data-country="${escapeHtml((item.country_name || '').toLowerCase())}"
                     data-region="${escapeHtml((item.region_name || '').toLowerCase())}"
                     data-city="${escapeHtml((item.city_name || '').toLowerCase())}">
                    <td>
                        <span class="code-badge">${escapeHtml(item.sejour_tour_code || '-')}</span>
                    </td>
                    <td>
                        <strong class="tour-name">${escapeHtml(item.name)}</strong>
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
        html += `<div class="table-info">${tCommon.showing || 'Showing'} <strong>${totalCount}</strong> ${totalCount === 1 ? (tTours.tour || 'tour') : (tTours.tours || 'tours')}</div>`;
        html += '</div>';
        html += '</div></div>';
        container.innerHTML = html;
        
        // Store original data for filtering
        window.toursTableData = data;
    }
    
    // Show loading state
    function showLoading(type) {
        const container = document.getElementById(`${type}-content`);
        if (!container) return;
        container.innerHTML = `
            <div class="loading">
                <span class="material-symbols-rounded">sync</span>
                <p>${tCommon.loading || 'Loading...'}</p>
            </div>
        `;
    }
    
    // Close modal
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
        document.body.style.overflow = '';
        
        // Reset forms
        if (modalId === 'toursModal') {
            const tourForm = document.getElementById('tourForm');
            if (tourForm) {
                tourForm.reset();
                delete tourForm.dataset.id;
            }
        }
    }
    
    // Open modal for Tours
    window.openModal = async function() {
        const modal = document.getElementById('toursModal');
        if (!modal) {
            console.error('Modal not found: toursModal');
            return;
        }
        
        // Reset form
        const form = document.getElementById('tourForm');
        if (form) {
            form.reset();
            delete form.dataset.id;
            // Clear all errors
            clearFormErrors(form);
        }
        
        // Update modal title
        const title = document.getElementById('tourModalTitle');
        if (title) {
            title.textContent = tTours.add_tour || 'Add Tour';
        }
        
        // Load countries and show modal
        try {
            await loadCountries();
            
            // Reset location selects
            const regionSelect = document.getElementById('regionSelect');
            const citySelect = document.getElementById('citySelect');
            if (regionSelect) {
                regionSelect.innerHTML = '<option value="">' + (tTours.select_region || 'Select Region') + '</option>';
                regionSelect.disabled = true;
            }
            if (citySelect) {
                citySelect.innerHTML = '<option value="">' + (tTours.select_city || 'Select City') + '</option>';
                citySelect.disabled = true;
            }
            
            // Hide sub regions section
            const subRegionsGroup = document.getElementById('subRegionsGroup');
            if (subRegionsGroup) subRegionsGroup.style.display = 'none';
            
            // Show modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error loading modal data:', error);
            showToast('error', tCommon.failed_to_load_data || 'Failed to load data');
        }
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
        const title = document.getElementById('tourModalTitle');
        if (title) {
            title.textContent = tTours.edit_tour || 'Edit Tour';
        }
        
        // Fill form
        form.dataset.id = id;
        form.querySelector('input[name="sejour_tour_code"]').value = item.sejour_tour_code || '';
        form.querySelector('input[name="name"]').value = item.name || '';
        
        // Load and set location fields
        await loadCountries();
        
        if (item.country_id) {
            document.getElementById('countrySelect').value = item.country_id;
            await loadRegions(item.country_id);
        }
        
        if (item.region_id) {
            document.getElementById('regionSelect').value = item.region_id;
            await loadCities(item.region_id);
        }
        
        if (item.city_id) {
            document.getElementById('citySelect').value = item.city_id;
            // Pass selected sub region IDs to loadSubRegionsForTour
            const selectedSubRegionIds = item.sub_region_ids && Array.isArray(item.sub_region_ids) 
                ? item.sub_region_ids.map(id => parseInt(id)).filter(id => !isNaN(id))
                : [];
            await loadSubRegionsForTour(item.city_id, selectedSubRegionIds);
        }
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    
    // Delete item
    window.deleteItem = async function(id) {
        const deleteConfirmMessage = tTours.delete_confirm || 'Are you sure you want to delete this item?';
        
        showConfirmDialog(deleteConfirmMessage, async function() {
            try {
                const response = await window.apiFetch(`${API_BASE}?action=tour&id=${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                if (result.success) {
                    currentData.tours = [];
                    if (currentTab === 'tours') {
                        await loadData('tours');
                    }
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
    
    // Clear form errors - COMPLETE CLEAR WITH STYLE RESET
    function clearFormErrors(form) {
        if (!form) return;
        // Only select form elements (input, select, textarea) - NOT all elements with error classes
        const errorFields = form.querySelectorAll('input.error, select.error, textarea.error, input.invalid, select.invalid, textarea.invalid, input.has-error, select.has-error, textarea.has-error');
        errorFields.forEach(field => {
            // Check if element is a form element before calling setCustomValidity
            if (field && (field.tagName === 'INPUT' || field.tagName === 'SELECT' || field.tagName === 'TEXTAREA')) {
                field.classList.remove('error', 'invalid', 'has-error');
                field.removeAttribute('aria-invalid');
                // Only call setCustomValidity if it exists (form elements only)
                if (typeof field.setCustomValidity === 'function') {
                    field.setCustomValidity('');
                }
                // Reset inline styles
                field.style.borderColor = '';
                field.style.backgroundColor = '';
            }
        });
        const errorMessages = form.querySelectorAll('.input-error-message');
        errorMessages.forEach(msg => {
            if (msg) {
                msg.classList.remove('show', 'has-error');
                msg.textContent = '';
                msg.removeAttribute('role');
                msg.style.display = '';
            }
        });
    }
    
    // Parse API error and highlight relevant fields
    function parseApiError(errorMessage, formId) {
        if (!errorMessage) return;
        
        const lowerMessage = errorMessage.toLowerCase();
        const form = document.getElementById(formId);
        if (form) {
            clearFormErrors(form);
        }
        
        // Tour-specific errors
        if (formId === 'tourForm') {
            // Sejour Tour Code errors
            if (lowerMessage.includes('sejour tour code') || lowerMessage.includes('sejour_tour_code') || 
                (lowerMessage.includes('code') && lowerMessage.includes('already exists') && !lowerMessage.includes('tour group'))) {
                showFieldError('sejour_tour_code', errorMessage);
            }
            // Tour Name errors
            else if ((lowerMessage.includes('tour') && lowerMessage.includes('name') && lowerMessage.includes('already exists')) ||
                     (lowerMessage.includes('tour name') && lowerMessage.includes('already exists'))) {
                showFieldError('name', errorMessage);
            }
            // Location errors
            else if (lowerMessage.includes('country') && (lowerMessage.includes('required') || lowerMessage.includes('invalid'))) {
                showFieldError('country_id', errorMessage);
            }
            else if (lowerMessage.includes('region') && (lowerMessage.includes('required') || lowerMessage.includes('invalid'))) {
                showFieldError('region_id', errorMessage);
            }
            else if (lowerMessage.includes('city') && (lowerMessage.includes('required') || lowerMessage.includes('invalid'))) {
                showFieldError('city_id', errorMessage);
            }
        }
        // Tour Group-specific errors
        else if (formId === 'tourGroupForm') {
            // Tour Group Name errors
            if ((lowerMessage.includes('tour group') && lowerMessage.includes('name') && lowerMessage.includes('already exists')) ||
                (lowerMessage.includes('tour group name') && lowerMessage.includes('required'))) {
                showFieldError('name', errorMessage);
            }
            // Generic name required error (fallback)
            else if (lowerMessage.includes('name') && lowerMessage.includes('required')) {
                showFieldError('name', errorMessage);
            }
            // "already exists" without "tour group" might also be tour group name error
            else if (lowerMessage.includes('already exists') && !lowerMessage.includes('tour') && !lowerMessage.includes('code')) {
                showFieldError('name', errorMessage);
            }
        }
    }
    
    // Show field error - IMMEDIATE VISUAL FEEDBACK WITH INLINE STYLES
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
            console.warn('Field not found:', fieldName, 'Available fields:', Array.from(document.querySelectorAll('[name]')).map(f => f.name));
            return;
        }
        
        // Apply error IMMEDIATELY using applyFieldError
        applyFieldError(field, message);
    }
    
    // Validate single field - SYNC VERSION FOR IMMEDIATE FEEDBACK
    function validateSingleField(field) {
        // Always return an object for consistency
        if (!field) {
            return {
                invalid: true,
                message: 'Field not found',
                field: null
            };
        }
        
        let fieldInvalid = false;
        let errorMessage = field.getAttribute('data-error') || (tCommon.field_required || 'This field is required');
        
        // Check if field is empty or invalid
        if (field.disabled && field.hasAttribute('required')) {
            fieldInvalid = true;
        } else if (field.tagName === 'SELECT') {
            fieldInvalid = !field.value || field.value === '' || field.value === null;
        } else if (field.type === 'text' || field.type === 'email' || !field.type || field.type === 'search') {
            fieldInvalid = !field.value || !field.value.trim();
        } else if (field.type === 'number') {
            fieldInvalid = !field.value || isNaN(field.value);
        } else {
            fieldInvalid = !field.checkValidity();
        }
        
        return {
            invalid: fieldInvalid,
            message: errorMessage,
            field: field
        };
    }
    
    // Show field error - IMMEDIATE VISUAL FEEDBACK
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
            // Force display
            errorMsg.style.display = 'block';
        }
        
        // Force redraw
        field.style.borderColor = '#dc2626';
        field.style.backgroundColor = '#fef2f2';
        field.offsetHeight; // Force reflow
    }
    
    // Validate all required fields in form - SYNC VALIDATION WITH IMMEDIATE VISUAL FEEDBACK
    function validateForm(form) {
        if (!form) return false;
        
        // First, remove all error states
        clearFormErrors(form);
        
        let isValid = true;
        const requiredFields = Array.from(form.querySelectorAll('input[required], select[required]'));
        const errorFields = [];
        
        // Validate each field IMMEDIATELY
        requiredFields.forEach(field => {
            const validation = validateSingleField(field);
            
            // Only process if validation object is valid and field is invalid
            if (validation && validation.field && validation.invalid) {
                errorFields.push(validation);
                isValid = false;
                
                // Apply error IMMEDIATELY - NO DELAY
                applyFieldError(validation.field, validation.message);
            }
        });
        
        // Scroll to first error
        if (errorFields.length > 0 && errorFields[0] && errorFields[0].field) {
            // Small delay only for scroll, not for visual feedback
            setTimeout(() => {
                if (errorFields[0] && errorFields[0].field) {
                    errorFields[0].field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        if (errorFields[0] && errorFields[0].field) {
                            errorFields[0].field.focus();
                        }
                    }, 200);
                }
            }, 50);
        }
        
        return isValid;
    }
    
    // Handle form submission
    async function handleTourSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const form = e.target;
        
        // Clear previous errors
        clearFormErrors(form);
        
        // Validate all required fields - IMMEDIATE VALIDATION
        const isValid = validateForm(form);
        
        if (!isValid) {
            showToast('error', tCommon.fill_required_fields || 'Please fill all required fields');
            return false;
        }
        
        const formData = new FormData(form);
        
        const sejourTourCode = formData.get('sejour_tour_code');
        const name = formData.get('name');
        const countryId = formData.get('country_id');
        const regionId = formData.get('region_id');
        const cityId = formData.get('city_id');
        
        // Get selected sub region IDs
        const subRegionCheckboxes = document.querySelectorAll('#sub_regions_checkbox_container input[type="checkbox"]:checked');
        const subRegionIds = Array.from(subRegionCheckboxes).map(cb => parseInt(cb.value));
        
        const data = {
            sejour_tour_code: sejourTourCode.trim().toUpperCase(),
            name: name.trim(),
            country_id: parseInt(countryId),
            region_id: parseInt(regionId),
            city_id: parseInt(cityId),
            sub_region_ids: subRegionIds
        };
        
        if (form.dataset.id) {
            data.id = parseInt(form.dataset.id);
            await updateTour(data);
        } else {
            await createTour(data);
        }
    }
    
    // Create tour
    async function createTour(data) {
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
            
            const response = await window.apiFetch(`${API_BASE}?action=tour`, {
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
                currentData.tours = [];
                clearFormErrors(document.getElementById('tourForm'));
                closeModal('toursModal');
                showToast('success', tTours.tour_added || 'Tour created successfully');
                if (currentTab === 'tours') {
                    await loadData('tours');
                }
            } else {
                // Handle validation errors
                const errorMessage = result.message || 'Failed to create tour';
                parseApiError(errorMessage, 'tourForm');
                showToast('error', errorMessage);
            }
        } catch (error) {
            console.error('Error creating tour:', error);
            showToast('error', tCommon.save_failed || 'Failed to create tour');
        }
    }
    
    // Update tour
    async function updateTour(data) {
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
            
            const response = await window.apiFetch(`${API_BASE}?action=tour`, {
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
                currentData.tours = [];
                clearFormErrors(document.getElementById('tourForm'));
                closeModal('toursModal');
                showToast('success', tTours.tour_updated || 'Tour updated successfully');
                if (currentTab === 'tours') {
                    await loadData('tours');
                }
            } else {
                // Handle validation errors
                const errorMessage = result.message || 'Failed to update tour';
                parseApiError(errorMessage, 'tourForm');
                showToast('error', errorMessage);
            }
        } catch (error) {
            console.error('Error updating tour:', error);
            showToast('error', tCommon.update_failed || 'Failed to update tour');
        }
    }
    
    // Load countries
    async function loadCountries() {
        const select = document.getElementById('countrySelect');
        if (!select) return;
        
        try {
            const response = await fetch(`${API_BASE}?action=countries`);
            const result = await response.json();
            if (result.success) {
                const selectText = tTours.select_country || 'Select Country';
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
            select.innerHTML = '<option value="">' + (tTours.select_region || 'Select Region') + '</option>';
            select.disabled = true;
            if (citySelect) {
                citySelect.innerHTML = '<option value="">' + (tTours.select_city || 'Select City') + '</option>';
                citySelect.disabled = true;
            }
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=regions&country_id=${country_id}`);
            const result = await response.json();
            if (result.success) {
                select.innerHTML = '<option value="">' + (tTours.select_region || 'Select Region') + '</option>';
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
                citySelect.innerHTML = '<option value="">' + (tTours.select_city || 'Select City') + '</option>';
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
            select.innerHTML = '<option value="">' + (tTours.select_city || 'Select City') + '</option>';
            select.disabled = true;
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=cities&region_id=${region_id}`);
            const result = await response.json();
            if (result.success) {
                select.innerHTML = '<option value="">' + (tTours.select_city || 'Select City') + '</option>';
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
    
    // Load tour sub regions as checkboxes by city
    async function loadSubRegionsForTour(city_id, selectedSubRegionIds = []) {
        const container = document.getElementById('sub_regions_checkbox_container');
        const subRegionsGroup = document.getElementById('subRegionsGroup');
        const searchBox = document.querySelector('#toursModal .checkbox-search');
        const selectAllBtn = document.querySelector('#toursModal .btn-select-all');
        const deselectAllBtn = document.querySelector('#toursModal .btn-deselect-all');
        
        if (!container || !subRegionsGroup) return;
        
        if (!city_id) {
            subRegionsGroup.style.display = 'none';
            container.innerHTML = '<div class="checkbox-message">' + (tTours.select_city_first || 'Please select city first') + '</div>';
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=sub_regions&city_id=${city_id}`);
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                subRegionsGroup.style.display = 'block';
                if (searchBox) searchBox.style.display = 'block';
                if (selectAllBtn) selectAllBtn.style.display = 'inline-block';
                if (deselectAllBtn) deselectAllBtn.style.display = 'inline-block';
                
                container.innerHTML = '';
                
                // Normalize selected IDs to integers for comparison
                const selectedIds = selectedSubRegionIds.map(id => parseInt(id)).filter(id => !isNaN(id));
                
                result.data.forEach(subRegion => {
                    const subRegionId = parseInt(subRegion.id);
                    const isChecked = selectedIds.includes(subRegionId);
                    
                    const checkboxDiv = document.createElement('div');
                    checkboxDiv.className = 'checkbox-item';
                    checkboxDiv.innerHTML = `
                        <label>
                            <input type="checkbox" name="sub_region_ids[]" value="${subRegion.id}" id="sub_region_${subRegion.id}" ${isChecked ? 'checked' : ''}>
                            <span>${escapeHtml(subRegion.name)}</span>
                        </label>
                    `;
                    container.appendChild(checkboxDiv);
                });
            } else {
                subRegionsGroup.style.display = 'block';
                container.innerHTML = '<div class="checkbox-message">' + (tTours.no_sub_regions || 'No sub regions found for this city') + '</div>';
                if (searchBox) searchBox.style.display = 'none';
                if (selectAllBtn) selectAllBtn.style.display = 'none';
                if (deselectAllBtn) deselectAllBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading sub regions:', error);
            subRegionsGroup.style.display = 'block';
            container.innerHTML = '<div class="checkbox-message">' + (tCommon.error || 'Error loading sub regions') + '</div>';
        }
    }
    
    // Select all sub regions
    window.selectAllSubRegions = function() {
        document.querySelectorAll('#sub_regions_checkbox_container input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
    };
    
    // Deselect all sub regions
    window.deselectAllSubRegions = function() {
        document.querySelectorAll('#sub_regions_checkbox_container input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    };
    
    // Filter sub regions
    window.filterSubRegions = function(searchTerm) {
        const items = document.querySelectorAll('#sub_regions_checkbox_container .checkbox-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm.toLowerCase())) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    };
    
    
    // Filter Tours table
    window.filterToursTable = function(searchTerm) {
        const tbody = document.getElementById('toursTableBody');
        const clearBtn = document.getElementById('toursSearchClear');
        
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
        
        // Show/hide clear button
        if (clearBtn) {
            clearBtn.style.display = term ? 'flex' : 'none';
        }
        
        // Update footer count
        const footer = document.querySelector('#tours-content .table-info');
        if (footer) {
            footer.innerHTML = `${tCommon.showing || 'Showing'} <strong>${visibleCount}</strong> ${visibleCount === 1 ? (tTours.tour || 'tour') : (tTours.tours || 'tours')}`;
        }
    };
    
    // Clear Tours search
    window.clearToursSearch = function() {
        const input = document.getElementById('toursSearchInput');
        const clearBtn = document.getElementById('toursSearchClear');
        
        if (input) {
            input.value = '';
            filterToursTable('');
        }
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
    };
    
    
    // Sort table
    window.sortTable = function(type, column) {
        if (type === 'tours') {
            sortToursTable(column);
        }
    };
    
    // Sort Tours table
    let toursSortColumn = null;
    let toursSortDirection = 'asc';
    
    function sortToursTable(column) {
        const tbody = document.getElementById('toursTableBody');
        if (!tbody || !window.toursTableData) return;
        
        // Toggle sort direction if same column
        if (toursSortColumn === column) {
            toursSortDirection = toursSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            toursSortColumn = column;
            toursSortDirection = 'asc';
        }
        
        // Sort data
        const sortedData = [...window.toursTableData].sort((a, b) => {
            let aVal = a[column] || '';
            let bVal = b[column] || '';
            
            // Handle numeric or string comparison
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (toursSortDirection === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
        
        // Re-render table
        renderToursTable(document.getElementById('tours-content'), sortedData);
        
        // Update sort icons
        document.querySelectorAll('#toursTable th.sortable .sort-icon').forEach(icon => {
            icon.textContent = '⇅';
        });
        
        const activeHeader = document.querySelector(`#toursTable th[onclick*="${column}"] .sort-icon`);
        if (activeHeader) {
            activeHeader.textContent = toursSortDirection === 'asc' ? '↑' : '↓';
            activeHeader.style.color = '#151A2D';
        }
    }
    
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();
