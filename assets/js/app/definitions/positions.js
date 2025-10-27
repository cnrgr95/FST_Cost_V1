// Positions Page JavaScript
(function() {
    'use strict';
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/positions.php';
    
    // Get translations
    const t = window.Translations || {};
    const tPos = t.positions || {};
    const tCommon = t.common || {};
    const tSidebar = t.sidebar || {};
    
    let currentTab = 'departments';
    let currentData = {
        cities: [],
        departments: [],
        positions: []
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
        const departmentForm = document.getElementById('departmentForm');
        const positionForm = document.getElementById('positionForm');
        
        if (departmentForm) {
            departmentForm.addEventListener('submit', handleDepartmentSubmit);
        }
        if (positionForm) {
            positionForm.addEventListener('submit', handlePositionSubmit);
        }
        
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
                filterPositions(query);
            }, 300);
        });
        
        // Clear search
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            filterPositions('');
        });
    }
    
    // Filter positions based on active tab
    function filterPositions(query) {
        if (!query) {
            // Show all
            loadData(currentTab);
            return;
        }
        
        const activeTab = document.querySelector('.positions-tab.active');
        if (!activeTab) return;
        
        const tabType = activeTab.dataset.tab;
        const searchText = query.toLowerCase();
        
        // Filter data
        const filtered = (() => {
            switch(tabType) {
                case 'departments':
                    return (currentData.departments || []).filter(item => {
                        return (
                            (item.name && item.name.toLowerCase().includes(searchText)) ||
                            (item.city_name && item.city_name.toLowerCase().includes(searchText))
                        );
                    });
                case 'positions':
                    return (currentData.positions || []).filter(item => {
                        return (
                            (item.name && item.name.toLowerCase().includes(searchText)) ||
                            (item.department_name && item.department_name.toLowerCase().includes(searchText))
                        );
                    });
            }
        })();
        
        // Render filtered results
        renderTable(tabType, filtered);
    }
    
    // Tab initialization
    function initTabs() {
        document.querySelectorAll('.positions-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        });
    }
    
    // Switch tabs
    function switchTab(tab) {
        currentTab = tab;
        
        // Update active tab
        document.querySelectorAll('.positions-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update active content
        document.querySelectorAll('.positions-content').forEach(c => c.classList.remove('active'));
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
            if (type === 'cities') {
                url = API_BASE.replace('positions.php', 'locations.php') + '?action=cities';
            } else {
                url = `${API_BASE}?action=${type}`;
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
            const noFoundText = type === 'departments' ? tPos.no_departments : tPos.no_positions;
            const addText = type === 'departments' ? tPos.add_new_dept : tPos.add_new_pos;
            const typeText = type === 'departments' ? tSidebar.department : tSidebar.position;
            
            container.innerHTML = `
                <div class="positions-table-container">
                    <div class="positions-table-header">
                        <div class="positions-table-title">${typeText}</div>
                        <button class="btn-add" onclick="window.openModal('${type}')">
                            <span class="material-symbols-rounded">add</span>
                            ${tPos.add_new_dept || 'Add New'}
                        </button>
                    </div>
                    <div class="empty-state">
                        <span class="material-symbols-rounded">inventory_2</span>
                        <h3>${noFoundText}</h3>
                        <p>${addText}</p>
                    </div>
                </div>
            `;
            return;
        }
        
        const typeText = type === 'departments' ? tSidebar.department : tSidebar.position;
        
        let html = '<div class="positions-table-container">';
        html += '<div class="positions-table-header">';
        html += `<div class="positions-table-title">${typeText}</div>`;
        html += `<button class="btn-add" onclick="window.openModal('${type}')">
                    <span class="material-symbols-rounded">add</span>
                    ${tPos.add_new_dept || 'Add New'}
                 </button>`;
        html += '</div>';
        html += '<table class="table">';
        
        // Table headers
        if (type === 'departments') {
            html += `<thead><tr><th>${tPos.department_name || 'Name'}</th><th>${tPos.city || 'City'}</th><th>${tPos.region || 'Region'}</th><th>${tPos.country || 'Country'}</th><th>${tPos.actions || 'Actions'}</th></tr></thead>`;
        } else {
            html += `<thead><tr><th>${tPos.position_name || 'Name'}</th><th>${tSidebar.department || 'Department'}</th><th>${tPos.city || 'City'}</th><th>${tPos.region || 'Region'}</th><th>${tPos.country || 'Country'}</th><th>${tPos.actions || 'Actions'}</th></tr></thead>`;
        }
        
        html += '<tbody>';
        data.forEach(item => {
            html += buildTableRow(type, item);
        });
        html += '</tbody></table></div>';
        
        container.innerHTML = html;
        
        // Attach event listeners to action buttons
        attachActionListeners();
    }
    
    // Attach event listeners to action buttons
    function attachActionListeners() {
        // Find all edit buttons and attach click handlers
        document.querySelectorAll('.btn-edit[data-item-type][data-item-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.getAttribute('data-item-type');
                const id = parseInt(this.getAttribute('data-item-id'));
                window.editItem(type, id);
            });
        });
        
        // Find all delete buttons and attach click handlers
        document.querySelectorAll('.btn-delete[data-item-type][data-item-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.getAttribute('data-item-type');
                const id = parseInt(this.getAttribute('data-item-id'));
                window.deleteItem(type, id);
            });
        });
    }
    
    // Build table row
    function buildTableRow(type, item) {
        let html = '<tr>';
        
        if (type === 'departments') {
            html += `<td>${escapeHtml(item.name)}</td>`;
            html += `<td>${escapeHtml(item.city_name || '-')}</td>`;
            html += `<td>${escapeHtml(item.region_name || '-')}</td>`;
            html += `<td>${escapeHtml(item.country_name || '-')}</td>`;
        } else {
            html += `<td>${escapeHtml(item.name)}</td>`;
            html += `<td>${escapeHtml(item.department_name || '-')}</td>`;
            html += `<td>${escapeHtml(item.city_name || '-')}</td>`;
            html += `<td>${escapeHtml(item.region_name || '-')}</td>`;
            html += `<td>${escapeHtml(item.country_name || '-')}</td>`;
        }
        
        html += '<td>';
        html += '<div class="table-actions">';
        html += `<button class="btn-action btn-edit" data-item-type="${type}" data-item-id="${item.id}">
                    <span class="material-symbols-rounded">edit</span>
                 </button>`;
        html += `<button class="btn-action btn-delete" data-item-type="${type}" data-item-id="${item.id}">
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
    window.openModal = async function(type) {
        // Fix modal ID - departments -> departmentModal, positions -> positionModal
        const modalId = type === 'departments' ? 'departmentModal' : 'positionModal';
        const formId = type === 'departments' ? 'departmentForm' : 'positionForm';
        
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error('Modal not found:', modalId);
            return;
        }
        
        const form = document.getElementById(formId);
        if (!form) {
            console.error('Form not found:', formId);
            return;
        }
        
        modal.classList.add('active');
        
        // Reset form
        form.reset();
        delete form.dataset.id;
        
        // Update modal title
        const title = modal.querySelector('h2');
        if (title) {
            if (type === 'departments') {
                title.textContent = tPos.add_new_dept || 'Add Department';
            } else {
                title.textContent = tPos.add_new_pos || 'Add Position';
            }
        }
        
        // Load dependent data if needed
        if (type === 'departments') {
            await loadCitiesForSelect();
        } else {
            await loadDepartmentsForSelect();
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
        // If data for this type hasn't been loaded yet, load it first
        if (!currentData[type] || currentData[type].length === 0) {
            await fetchData(type);
        }
        
        const item = (currentData[type] || []).find(item => item.id == id);
        if (!item) {
            console.error('Item not found:', type, id);
            return;
        }
        
        // Fix modal ID - departments -> departmentModal, positions -> positionModal
        const modalId = type === 'departments' ? 'departmentModal' : 'positionModal';
        const formId = type === 'departments' ? 'departmentForm' : 'positionForm';
        
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error('Modal not found:', modalId);
            return;
        }
        
        const form = document.getElementById(formId);
        if (!form) {
            console.error('Form not found:', formId);
            return;
        }
        
        // Update modal title
        const title = modal.querySelector('h2');
        if (title) {
            if (type === 'departments') {
                title.textContent = tPos.edit_dept || 'Edit Department';
            } else {
                title.textContent = tPos.edit_pos || 'Edit Position';
            }
        }
        
        // Fill form
        form.dataset.id = id;
        form.querySelector('input[name="name"]').value = escapeHtml(item.name);
        
        if (type === 'departments') {
            await loadCitiesForSelect();
            form.querySelector('select[name="city_id"]').value = item.city_id;
        } else {
            await loadDepartmentsForSelect();
            form.querySelector('select[name="department_id"]').value = item.department_id;
        }
        
        modal.classList.add('active');
    };
    
    // Helper function to convert type to API action (singular form)
    function getApiAction(type) {
        const actionMap = {
            'departments': 'department',
            'positions': 'position'
        };
        return actionMap[type] || type;
    }
    
    // Delete item
    window.deleteItem = async function(type, id) {
        const t = window.Translations || {};
        const tLoc = t.locations || {};
        const tDeps = t.dependencies || {};
        const deleteConfirmMessage = tPos.delete_confirm || tLoc.delete_confirm || 'Are you sure you want to delete this item?';
        
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
                        // Try to match and translate department dependency pattern
                        const positionMatch = errorMessage.match(/department.*?(\d+).*?position/i);
                        if (positionMatch) {
                            errorMessage = (tDeps.department_has_positions || errorMessage).replace('{count}', positionMatch[1]);
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
    function handleDepartmentSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            city_id: formData.get('city_id')
        };
        
        if (form.dataset.id) {
            data.id = form.dataset.id;
            updateDepartment(data);
        } else {
            createDepartment(data);
        }
    }
    
    function handlePositionSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            department_id: formData.get('department_id')
        };
        
        if (form.dataset.id) {
            data.id = form.dataset.id;
            updatePosition(data);
        } else {
            createPosition(data);
        }
    }
    
    // Create operations
    async function createDepartment(data) {
        try {
            const response = await fetch(`${API_BASE}?action=department`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.departments = [];
                loadData('departments');
                closeModal();
                showToast('success', tPos.dept_added || 'Department created successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating department:', error);
            showToast('error', tCommon.save_failed || 'Failed to create department');
        }
    }
    
    async function createPosition(data) {
        try {
            const response = await fetch(`${API_BASE}?action=position`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.positions = [];
                loadData('positions');
                closeModal();
                showToast('success', tPos.pos_added || 'Position created successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating position:', error);
            showToast('error', tCommon.save_failed || 'Failed to create position');
        }
    }
    
    // Update operations
    async function updateDepartment(data) {
        try {
            const response = await fetch(`${API_BASE}?action=department`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.departments = [];
                loadData('departments');
                closeModal();
                showToast('success', tPos.dept_updated || 'Department updated successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error updating department:', error);
            showToast('error', tCommon.update_failed || 'Failed to update department');
        }
    }
    
    async function updatePosition(data) {
        try {
            const response = await fetch(`${API_BASE}?action=position`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.positions = [];
                loadData('positions');
                closeModal();
                showToast('success', tPos.pos_updated || 'Position updated successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error updating position:', error);
            showToast('error', tCommon.update_failed || 'Failed to update position');
        }
    }
    
    // Load dependent data for selects
    async function loadCitiesForSelect() {
        // Fetch cities from locations API
        try {
            const locationsApi = API_BASE.replace('positions.php', 'locations.php');
            const response = await fetch(`${locationsApi}?action=cities`);
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                const select = document.querySelector('[name="city_id"]');
                if (select) {
                    select.innerHTML = `<option value="">${tPos.select_city || 'Select City'}</option>`;
                    result.data.forEach(city => {
                        select.innerHTML += `<option value="${city.id}">${city.name} (${city.region_name || ''} - ${city.country_name || ''})</option>`;
                    });
                }
            } else {
                console.warn('No cities found or API error');
                const select = document.querySelector('[name="city_id"]');
                if (select) {
                    select.innerHTML = `<option value="">Şehir bulunamadı</option>`;
                }
            }
        } catch (error) {
            console.error('Error loading cities:', error);
            const select = document.querySelector('[name="city_id"]');
            if (select) {
                select.innerHTML = `<option value="">Hata - Şehirler yüklenemedi</option>`;
            }
        }
    }
    
    async function loadDepartmentsForSelect() {
        if (currentData.departments.length === 0) {
            await fetchData('departments');
        }
        
        const select = document.querySelector('[name="department_id"]');
        if (select) {
            select.innerHTML = `<option value="">${tPos.select_dept || 'Select Department'}</option>`;
            currentData.departments.forEach(dept => {
                select.innerHTML += `<option value="${dept.id}">${dept.name} (${dept.city_name || ''})</option>`;
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
    
    // showToast is now from toast.js
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();

