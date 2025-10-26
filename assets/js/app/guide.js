// Guide Page JavaScript
(function() {
    'use strict';
    
    const API_BASE_MERCHANTS = (typeof window.API_BASE_MERCHANTS !== 'undefined') ? window.API_BASE_MERCHANTS : '../api/definitions/merchants.php';
    const API_BASE_VEHICLES = (typeof window.API_BASE_VEHICLES !== 'undefined') ? window.API_BASE_VEHICLES : '../api/definitions/vehicles.php';
    
    // Get translations
    const t = window.Translations || {};
    const tGuide = t.guide || {};
    const tCommon = t.common || {};
    
    let currentTab = 'merchants';
    let currentData = {
        merchants: [],
        companies: []
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        initTabs();
        loadData(currentTab);
        setupSearch();
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
                filterData(query);
            }, 300);
        });
        
        // Clear search
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            filterData('');
        });
    }
    
    // Filter data based on active tab
    function filterData(query) {
        if (!query) {
            loadData(currentTab);
            return;
        }
        
        const searchText = query.toLowerCase();
        const filtered = (() => {
            switch(currentTab) {
                case 'merchants':
                    return (currentData.merchants || []).filter(item => {
                        return (
                            (item.name && item.name.toLowerCase().includes(searchText)) ||
                            (item.authorized_phone && item.authorized_phone.includes(searchText)) ||
                            (item.authorized_email && item.authorized_email.toLowerCase().includes(searchText)) ||
                            (item.operasyon_name && item.operasyon_name.toLowerCase().includes(searchText)) ||
                            (item.operasyon_phone && item.operasyon_phone.includes(searchText)) ||
                            (item.operasyon_email && item.operasyon_email.toLowerCase().includes(searchText))
                        );
                    });
                case 'companies':
                    return (currentData.companies || []).filter(item => {
                        return (
                            (item.name && item.name.toLowerCase().includes(searchText)) ||
                            (item.contact_phone && item.contact_phone.includes(searchText)) ||
                            (item.contact_email && item.contact_email.toLowerCase().includes(searchText))
                        );
                    });
            }
        })();
        
        renderTable(currentTab, filtered);
    }
    
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
        currentTab = tab;
        
        // Update active tab
        document.querySelectorAll('.guide-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update active content
        document.querySelectorAll('.guide-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tab}-content`).classList.add('active');
        
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
            } else {
                url = API_BASE_VEHICLES + '?action=companies';
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
        
        if (data.length === 0) {
            const noFoundText = type === 'merchants' ? tGuide.no_merchants : tGuide.no_companies;
            const typeText = type === 'merchants' ? tGuide.merchants : tGuide.vehicle_companies;
            
            container.innerHTML = `
                <div class="guide-table-container">
                    <div class="guide-table-header">
                        <div class="guide-table-title">${typeText}</div>
                    </div>
                    <div class="empty-state">
                        <span class="material-symbols-rounded">contacts</span>
                        <h3>${noFoundText}</h3>
                    </div>
                </div>
            `;
            return;
        }
        
        const typeText = type === 'merchants' ? tGuide.merchants : tGuide.vehicle_companies;
        
        let html = '<div class="guide-table-container">';
        html += '<div class="guide-table-header">';
        html += `<div class="guide-table-title">${typeText}</div>`;
        html += '</div>';
        html += '<table class="guide-table">';
        
        // Table headers
        if (type === 'merchants') {
            html += `<thead><tr>
                <th><span class="type-badge merchant">${tGuide.merchant}</span></th>
                <th>${tGuide.name}</th>
                <th>${tGuide.city}</th>
                <th>${tGuide.authorized_person}</th>
                <th>${tGuide.authorized_email}</th>
                <th>${tGuide.authorized_phone}</th>
                <th class="separator-column"></th>
                <th>${tGuide.operator_name}</th>
                <th>${tGuide.operator_email}</th>
                <th>${tGuide.operator_phone}</th>
                <th>${tGuide.location}</th>
            </tr></thead>`;
        } else {
            html += `<thead><tr>
                <th><span class="type-badge company">${tGuide.vehicle_company}</span></th>
                <th>${tGuide.name}</th>
                <th>${tGuide.city}</th>
                <th>${tGuide.contact_person}</th>
                <th>${tGuide.contact_email}</th>
                <th>${tGuide.contact_phone}</th>
            </tr></thead>`;
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
        
        if (type === 'merchants') {
            html += `<td><span class="type-badge merchant">${tGuide.merchant || 'Esnaf'}</span></td>`;
            html += `<td>${item.name || '-'}</td>`;
            html += `<td>${item.city_name || '-'}</td>`;
            html += `<td>${item.authorized_person || '-'}</td>`;
            html += `<td>${item.authorized_email ? '<a href="mailto:' + encodeURIComponent(item.authorized_email) + '">' + escapeHtml(item.authorized_email) + '</a>' : '-'}</td>`;
            html += `<td>${item.authorized_phone || '-'}</td>`;
            html += `<td class="separator-column"></td>`;
            html += `<td>${item.operasyon_name || '-'}</td>`;
            html += `<td>${item.operasyon_email ? '<a href="mailto:' + encodeURIComponent(item.operasyon_email) + '">' + escapeHtml(item.operasyon_email) + '</a>' : '-'}</td>`;
            html += `<td>${item.operasyon_phone || '-'}</td>`;
            html += `<td>${item.location_url ? '<a href="' + encodeURI(item.location_url) + '" target="_blank" rel="noopener noreferrer" class="location-link" title="' + (tGuide.view_on_map || 'Haritada Gör') + '"><span class="material-symbols-rounded">location_on</span></a>' : '-'}</td>`;
        } else {
            html += `<td><span class="type-badge company">${tGuide.vehicle_company || 'Taşımacı'}</span></td>`;
            html += `<td>${item.name || '-'}</td>`;
            html += `<td>${item.city_name || '-'}</td>`;
            html += `<td>${item.contact_person || '-'}</td>`;
            html += `<td>${item.contact_email ? '<a href="mailto:' + encodeURIComponent(item.contact_email) + '">' + escapeHtml(item.contact_email) + '</a>' : '-'}</td>`;
            html += `<td>${item.contact_phone || '-'}</td>`;
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
        } else if (type === 'warning') {
            icon = 'warning';
            title = 'Warning';
        } else if (type === 'info') {
            icon = 'info';
            title = 'Information';
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
})();

