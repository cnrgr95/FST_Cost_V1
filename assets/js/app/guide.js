// Guide Page JavaScript
(function() {
    'use strict';
    
    // Get page configuration
    const pageConfig = (function() {
        const configEl = document.getElementById('page-config');
        if (configEl) {
            try {
                return JSON.parse(configEl.textContent);
            } catch (e) {
                console.error('Failed to parse page config:', e);
            }
        }
        return {};
    })();
    
    const API_BASE_MERCHANTS = pageConfig.apiBaseMerchants || '../api/definitions/merchants.php';
    const API_BASE_VEHICLES = pageConfig.apiBaseVehicles || '../api/definitions/vehicles.php';
    const API_BASE_USERS = pageConfig.apiBaseUsers || '../api/definitions/users.php';
    
    // Get translations
    const t = pageConfig.translations || {};
    const tGuide = t.guide || {};
    const tCommon = t.common || {};
    
    // Get initial tab from URL hash or localStorage, default to 'merchants'
    function getInitialTab() {
        const validTabs = ['merchants', 'companies', 'users'];
        // First, try URL hash
        if (window.location.hash) {
            const hashTab = window.location.hash.replace('#', '');
            if (validTabs.includes(hashTab)) {
                return hashTab;
            }
        }
        // Then, try localStorage
        const savedTab = localStorage.getItem('guide_active_tab');
        if (savedTab && validTabs.includes(savedTab)) {
            return savedTab;
        }
        // Default to merchants
        return 'merchants';
    }
    
    let currentTab = getInitialTab();
    let currentData = {
        merchants: [],
        companies: [],
        users: []
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        initTabs();
        
        // Set initial tab based on saved state
        switchTab(currentTab);
        
        // Listen for hash changes (browser back/forward)
        window.addEventListener('hashchange', function() {
            const hashTab = window.location.hash.replace('#', '');
            const validTabs = ['merchants', 'companies', 'users'];
            if (validTabs.includes(hashTab) && hashTab !== currentTab) {
                switchTab(hashTab);
            }
        });
    });
    
    // Tab initialization
    function initTabs() {
        document.querySelectorAll('.guide-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        });
    }
    
    // Switch tabs
    function switchTab(tab) {
        const validTabs = ['merchants', 'companies', 'users'];
        if (!validTabs.includes(tab)) {
            tab = 'merchants'; // Fallback to default
        }
        
        currentTab = tab;
        
        // Save tab state to localStorage and URL hash
        localStorage.setItem('guide_active_tab', tab);
        window.location.hash = tab;
        
        // Update active tab
        document.querySelectorAll('.guide-tab').forEach(t => t.classList.remove('active'));
        const activeTabButton = document.querySelector(`[data-tab="${tab}"]`);
        if (activeTabButton) {
            activeTabButton.classList.add('active');
        }
        
        // Update active content
        document.querySelectorAll('.guide-content').forEach(c => c.classList.remove('active'));
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
            if (type === 'merchants') {
                url = API_BASE_MERCHANTS + '?action=merchants';
            } else if (type === 'companies') {
                url = API_BASE_VEHICLES + '?action=companies';
            } else if (type === 'users') {
                url = API_BASE_USERS + '?action=users';
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
        
        const totalCount = data.length;
        const escapedHtml = window.escapeHtml || escapeHtml;
        const iconMap = {
            'merchants': 'store',
            'companies': 'business',
            'users': 'people'
        };
        
        if (data.length === 0) {
            let noFoundText, typeText;
            if (type === 'merchants') {
                noFoundText = tGuide.no_merchants;
                typeText = tGuide.merchants;
            } else if (type === 'companies') {
                noFoundText = tGuide.no_companies;
                typeText = tGuide.vehicle_companies;
            } else if (type === 'users') {
                noFoundText = tGuide.no_users || 'No users found';
                typeText = tGuide.users || 'Users';
            }
            
            container.innerHTML = `
                <div class="guide-table-container">
                    <div class="guide-table-header">
                        <div class="guide-table-title">
                            <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 8px; font-size: 24px;">${iconMap[type] || 'list'}</span>
                            ${typeText}
                        </div>
                    </div>
                    <div class="empty-state">
                        <span class="material-symbols-rounded">${iconMap[type] || 'contacts'}</span>
                        <h3>${noFoundText}</h3>
                        <p>${tCommon.no_data || 'No data available'}</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let typeText;
        if (type === 'merchants') {
            typeText = tGuide.merchants;
        } else if (type === 'companies') {
            typeText = tGuide.vehicle_companies;
        } else if (type === 'users') {
            typeText = tGuide.users || 'Users';
        }
        
        let html = '<div class="guide-table-container">';
        html += '<div class="guide-table-header">';
        html += `<div class="guide-table-title">
                    <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 8px; font-size: 24px;">${iconMap[type] || 'list'}</span>
                    ${typeText} 
                    <span class="table-count-badge">${totalCount}</span>
                 </div>`;
        html += '<div class="table-actions-group">';
        html += `<div class="search-box">
                    <span class="material-symbols-rounded search-icon">search</span>
                    <input type="text" 
                           id="${type}SearchInput" 
                           placeholder="${tCommon.search || 'Search...'}" 
                           class="search-input"
                           onkeyup="filterGuideTable('${type}', this.value)">
                    <button class="search-clear" id="${type}SearchClear" onclick="clearGuideSearch('${type}')" style="display: none;">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                 </div>`;
        html += '</div>';
        html += '</div>';
        html += '<div class="currencies-table-section">';
        html += `<table class="currencies-table" id="${type}Table">`;
        
        // Table headers with sortable
        if (type === 'merchants') {
            html += `<thead><tr>
                <th><span class="type-badge merchant">${tGuide.merchant || 'Merchant'}</span></th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'name')">
                    ${tGuide.name || 'Name'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'city_name')">
                    ${tGuide.city || 'City'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'authorized_person')">
                    ${tGuide.authorized_person || 'Authorized Person'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'authorized_email')">
                    ${tGuide.authorized_email || 'Authorized Email'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'authorized_phone')">
                    ${tGuide.authorized_phone || 'Authorized Phone'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="separator-column"></th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'operasyon_name')">
                    ${tGuide.operasyon_name || 'Operasyon Name'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'operasyon_email')">
                    ${tGuide.operasyon_email || 'Operasyon Email'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'operasyon_phone')">
                    ${tGuide.operasyon_phone || 'Operasyon Phone'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="no-sort">${tGuide.location || 'Location'}</th>
            </tr></thead>`;
        } else if (type === 'companies') {
            html += `<thead><tr>
                <th><span class="type-badge company">${tGuide.vehicle_company || 'Company'}</span></th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'name')">
                    ${tGuide.name || 'Name'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'city_name')">
                    ${tGuide.city || 'City'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'contact_person')">
                    ${tGuide.contact_person || 'Contact Person'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'contact_email')">
                    ${tGuide.contact_email || 'Contact Email'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'contact_phone')">
                    ${tGuide.contact_phone || 'Contact Phone'}
                    <span class="sort-icon">⇅</span>
                </th>
            </tr></thead>`;
        } else if (type === 'users') {
            html += `<thead><tr>
                <th><span class="type-badge user">${tGuide.user || 'User'}</span></th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'username')">
                    ${tGuide.username || 'Username'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'full_name')">
                    ${tGuide.full_name || 'Full Name'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'department_name')">
                    ${tGuide.department || 'Department'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'city_name')">
                    ${tGuide.city || 'City'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'email')">
                    ${tGuide.email || 'Email'}
                    <span class="sort-icon">⇅</span>
                </th>
                <th class="sortable" onclick="sortGuideTable('${type}', 'phone')">
                    ${tGuide.phone || 'Phone'}
                    <span class="sort-icon">⇅</span>
                </th>
            </tr></thead>`;
        }
        
        html += `<tbody id="${type}TableBody">`;
        data.forEach((item, index) => {
            html += buildTableRow(type, item, index, escapedHtml);
        });
        html += '</tbody></table>';
        html += '<div class="table-footer">';
        html += `<div class="table-info">${tCommon.showing || 'Showing'} <strong>${totalCount}</strong> ${totalCount === 1 ? 'item' : 'items'}</div>`;
        html += '</div>';
        html += '</div></div>';
        
        container.innerHTML = html;
        
        // Store original data for filtering and sorting
        window[`${type}TableData`] = data;
    }
    
    // Build table row with data attributes for filtering
    function buildTableRow(type, item, index, escapedHtmlFunc) {
        const escapedHtml = escapedHtmlFunc || escapeHtml;
        let html = '<tr';
        
        if (type === 'merchants') {
            html += ` data-index="${index}" 
                     data-name="${((item.name || '') + '').toLowerCase()}" 
                     data-city="${((item.city_name || '') + '').toLowerCase()}" 
                     data-authorized-person="${((item.authorized_person || '') + '').toLowerCase()}" 
                     data-authorized-email="${((item.authorized_email || '') + '').toLowerCase()}" 
                     data-authorized-phone="${((item.authorized_phone || '') + '').toLowerCase()}" 
                     data-operasyon-name="${((item.operasyon_name || '') + '').toLowerCase()}" 
                     data-operasyon-email="${((item.operasyon_email || '') + '').toLowerCase()}" 
                     data-operasyon-phone="${((item.operasyon_phone || '') + '').toLowerCase()}">`;
            html += `<td><span class="type-badge merchant">${tGuide.merchant || 'Merchant'}</span></td>`;
            html += `<td><strong>${escapedHtml(item.name || '-')}</strong></td>`;
            html += `<td>${escapedHtml(item.city_name || '-')}</td>`;
            html += `<td>${escapedHtml(item.authorized_person || '-')}</td>`;
            html += `<td>${item.authorized_email ? '<a href="mailto:' + encodeURIComponent(item.authorized_email) + '">' + escapedHtml(item.authorized_email) + '</a>' : '-'}</td>`;
            html += `<td>${escapedHtml(item.authorized_phone || '-')}</td>`;
            html += `<td class="separator-column"></td>`;
            html += `<td>${escapedHtml(item.operasyon_name || '-')}</td>`;
            html += `<td>${item.operasyon_email ? '<a href="mailto:' + encodeURIComponent(item.operasyon_email) + '">' + escapedHtml(item.operasyon_email) + '</a>' : '-'}</td>`;
            html += `<td>${escapedHtml(item.operasyon_phone || '-')}</td>`;
            html += `<td>${item.location_url ? '<a href="' + encodeURI(item.location_url) + '" target="_blank" rel="noopener noreferrer" class="location-link" title="' + (tGuide.view_on_map || 'View on Map') + '"><span class="material-symbols-rounded">location_on</span></a>' : '-'}</td>`;
        } else if (type === 'companies') {
            html += ` data-index="${index}" 
                     data-name="${((item.name || '') + '').toLowerCase()}" 
                     data-city="${((item.city_name || '') + '').toLowerCase()}" 
                     data-contact-person="${((item.contact_person || '') + '').toLowerCase()}" 
                     data-contact-email="${((item.contact_email || '') + '').toLowerCase()}" 
                     data-contact-phone="${((item.contact_phone || '') + '').toLowerCase()}">`;
            html += `<td><span class="type-badge company">${tGuide.vehicle_company || 'Company'}</span></td>`;
            html += `<td><strong>${escapedHtml(item.name || '-')}</strong></td>`;
            html += `<td>${escapedHtml(item.city_name || '-')}</td>`;
            html += `<td>${escapedHtml(item.contact_person || '-')}</td>`;
            html += `<td>${item.contact_email ? '<a href="mailto:' + encodeURIComponent(item.contact_email) + '">' + escapedHtml(item.contact_email) + '</a>' : '-'}</td>`;
            html += `<td>${escapedHtml(item.contact_phone || '-')}</td>`;
        } else if (type === 'users') {
            html += ` data-index="${index}" 
                     data-username="${((item.username || '') + '').toLowerCase()}" 
                     data-full-name="${((item.full_name || '') + '').toLowerCase()}" 
                     data-department="${((item.department_name || '') + '').toLowerCase()}" 
                     data-city="${((item.city_name || '') + '').toLowerCase()}" 
                     data-email="${((item.email || '') + '').toLowerCase()}" 
                     data-phone="${((item.phone || '') + '').toLowerCase()}">`;
            html += `<td><span class="type-badge user">${tGuide.user || 'User'}</span></td>`;
            html += `<td><strong>${escapedHtml(item.username || '-')}</strong></td>`;
            html += `<td>${escapedHtml(item.full_name || '-')}</td>`;
            html += `<td>${escapedHtml(item.department_name || '-')}</td>`;
            html += `<td>${escapedHtml(item.city_name || '-')}</td>`;
            html += `<td>${item.email ? '<a href="mailto:' + encodeURIComponent(item.email) + '">' + escapedHtml(item.email) + '</a>' : '-'}</td>`;
            html += `<td>${escapedHtml(item.phone || '-')}</td>`;
        }
        
        html += '</tr>';
        
        return html;
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
    
    // Toast notifications use global showToast from toast.js
    
    // ============================================
    // TABLE SEARCH AND SORT FUNCTIONS
    // ============================================
    
    // Filter Guide table
    window.filterGuideTable = function(type, searchTerm) {
        const tbody = document.getElementById(`${type}TableBody`);
        const clearBtn = document.getElementById(`${type}SearchClear`);
        
        if (!tbody) return;
        
        // Get data attributes based on type
        let dataAttributes = [];
        if (type === 'merchants') {
            dataAttributes = ['name', 'city', 'authorized-person', 'authorized-email', 'authorized-phone', 'operasyon-name', 'operasyon-email', 'operasyon-phone'];
        } else if (type === 'companies') {
            dataAttributes = ['name', 'city', 'contact-person', 'contact-email', 'contact-phone'];
        } else if (type === 'users') {
            dataAttributes = ['username', 'full-name', 'department', 'city', 'email', 'phone'];
        }
        
        // Use generic filterTable function
        window.filterTable(`${type}TableBody`, searchTerm, dataAttributes, `${type}SearchClear`, function(visibleCount) {
            // Update footer count
            const footer = document.querySelector(`#${type}-content .table-info`);
            if (footer) {
                footer.innerHTML = `${tCommon.showing || 'Showing'} <strong>${visibleCount}</strong> ${visibleCount === 1 ? 'item' : 'items'}`;
            }
        });
    };
    
    // Clear Guide search
    window.clearGuideSearch = function(type) {
        const input = document.getElementById(`${type}SearchInput`);
        const clearBtn = document.getElementById(`${type}SearchClear`);
        
        if (input) {
            input.value = '';
            filterGuideTable(type, '');
        }
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
    };
    
    // Sort Guide table
    let guideSortState = {};
    
    window.sortGuideTable = function(type, column) {
        const data = window[`${type}TableData`];
        if (!data || data.length === 0) return;
        
        const currentState = guideSortState[type] || { column: null, direction: 'asc' };
        const result = window.sortTableData(data, column, currentState.column, currentState.direction);
        
        // Update sort state
        guideSortState[type] = {
            column: result.newColumn,
            direction: result.newDirection
        };
        
        // Re-render table with sorted data
        renderTable(type, result.sortedData);
        
        // Update sort icons
        const table = document.getElementById(`${type}Table`);
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

