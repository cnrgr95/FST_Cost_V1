// vehicles Page JavaScript
(function() {
    'use strict';
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/vehicles.php';
    
    // Get translations
    const t = window.Translations || {};
    const tVehicles = t.vehicles || {};
    const tCommon = t.common || {};
    const tSidebar = t.sidebar || {};
    
    let currentTab = 'companies';
    let currentData = {
        cities: [],
        companies: [],
        types: [],
        contracts: []
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
        const companyForm = document.getElementById('companyForm');
        const typeForm = document.getElementById('typeForm');
        const contractForm = document.getElementById('contractForm');
        
        if (companyForm) {
            companyForm.addEventListener('submit', handleCompanySubmit);
        }
        if (typeForm) {
            typeForm.addEventListener('submit', handleTypeSubmit);
        }
        if (contractForm) {
            contractForm.addEventListener('submit', handleContractSubmit);
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
                filtervehicles(query);
            }, 300);
        });
        
        // Clear search
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            filtervehicles('');
        });
    }
    
    // Filter vehicles based on active tab
    function filtervehicles(query) {
        if (!query) {
            // Show all
            loadData(currentTab);
            return;
        }
        
        const activeTab = document.querySelector('.vehicles-tab.active');
        if (!activeTab) return;
        
        const tabType = activeTab.dataset.tab;
        const searchText = query.toLowerCase();
        
        // Filter data
        const filtered = (() => {
            switch(tabType) {
                case 'companies':
                    return (currentData.companies || []).filter(item => {
                        return (
                            (item.name && item.name.toLowerCase().includes(searchText)) ||
                            (item.city_name && item.city_name.toLowerCase().includes(searchText))
                        );
                    });
                 case 'types':
                     return (currentData.types || []).filter(item => {
                         return (
                             (item.name && item.name.toLowerCase().includes(searchText)) ||
                             (item.company_name && item.company_name.toLowerCase().includes(searchText))
                         );
                     });
                case 'contracts':
                     return (currentData.contracts || []).filter(item => {
                         return (
                             (item.contract_code && item.contract_code.toLowerCase().includes(searchText)) ||
                             (item.company_name && item.company_name.toLowerCase().includes(searchText)) ||
                             (item.from_location && item.from_location.toLowerCase().includes(searchText)) ||
                             (item.to_location && item.to_location.toLowerCase().includes(searchText))
                         );
                     });
            }
        })();
        
        // Render filtered results
        renderTable(tabType, filtered);
    }
    
    // Tab initialization
    function initTabs() {
        document.querySelectorAll('.vehicles-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        });
    }
    
    // Switch tabs
    function switchTab(tab) {
        currentTab = tab;
        
        // Update active tab
        document.querySelectorAll('.vehicles-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update active content
        document.querySelectorAll('.vehicles-content').forEach(c => c.classList.remove('active'));
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
                url = API_BASE.replace('vehicles.php', 'locations.php') + '?action=cities';
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
            let noFoundText, addText, typeText;
            if (type === 'companies') {
                noFoundText = tVehicles.no_companies;
                addText = tVehicles.add_company;
                typeText = tVehicles.vehicle_company;
            } else if (type === 'types') {
                noFoundText = tVehicles.no_types;
                addText = tVehicles.add_type;
                typeText = tVehicles.vehicle_type;
            } else if (type === 'contracts') {
                noFoundText = tVehicles.no_contracts;
                addText = tVehicles.add_contract;
                typeText = tVehicles.contracts;
            }
            
            container.innerHTML = `
                <div class="vehicles-table-container">
                    <div class="vehicles-table-header">
                        <div class="vehicles-table-title">${typeText}</div>
                        <button class="btn-add" onclick="window.openModal('${type}')">
                            <span class="material-symbols-rounded">add</span>
                            ${addText || 'Add New'}
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
        
        let typeText, addText;
        if (type === 'companies') {
            typeText = tVehicles.vehicle_company;
            addText = tVehicles.add_company;
        } else if (type === 'types') {
            typeText = tVehicles.vehicle_type;
            addText = tVehicles.add_type;
        } else if (type === 'contracts') {
            typeText = tVehicles.contracts;
            addText = tVehicles.add_contract;
        }
        
        let html = '<div class="vehicles-table-container">';
        html += '<div class="vehicles-table-header">';
        html += `<div class="vehicles-table-title">${typeText}</div>`;
        html += '<div style="display: flex; gap: 10px;">';
        html += `<button class="btn-add" onclick="window.openModal('${type}')">
                    <span class="material-symbols-rounded">add</span>
                    ${addText || 'Add New'}
                 </button>`;
        html += '</div>';
        html += '</div>';
        html += '<table class="table">';
        
         // Table headers
         if (type === 'companies') {
             html += `<thead><tr><th>${tVehicles.company_name || 'Name'}</th><th>${tVehicles.city || 'City'}</th><th>${tVehicles.region || 'Region'}</th><th>${tVehicles.country || 'Country'}</th><th>${tVehicles.actions || 'Actions'}</th></tr></thead>`;
         } else if (type === 'types') {
             html += `<thead><tr><th>${tVehicles.type_name || 'Name'}</th><th>${tVehicles.vehicle_company || 'Vehicle Company'}</th><th>${tVehicles.city || 'City'}</th><th>${tVehicles.region || 'Region'}</th><th>${tVehicles.country || 'Country'}</th><th>${tVehicles.actions || 'Actions'}</th></tr></thead>`;
        } else if (type === 'contracts') {
            html += `<thead><tr><th>${tVehicles.contract_code || 'Contract Code'}</th><th>${tVehicles.vehicle_company || 'Company'}</th><th>${tVehicles.start_date || 'Start Date'}</th><th>${tVehicles.end_date || 'End Date'}</th><th>${tVehicles.actions || 'Actions'}</th></tr></thead>`;
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
        
        if (type === 'companies') {
            html += `<td>${item.name}</td>`;
            html += `<td>${item.city_name || '-'}</td>`;
            html += `<td>${item.region_name || '-'}</td>`;
            html += `<td>${item.country_name || '-'}</td>`;
        } else if (type === 'types') {
            html += `<td>${item.name}</td>`;
            html += `<td>${item.company_name || '-'}</td>`;
            html += `<td>${item.city_name || '-'}</td>`;
            html += `<td>${item.region_name || '-'}</td>`;
            html += `<td>${item.country_name || '-'}</td>`;
        } else if (type === 'contracts') {
            html += `<td>${item.contract_code || '-'}</td>`;
            html += `<td>${item.company_name || '-'}</td>`;
            html += `<td>${item.start_date || '-'}</td>`;
            html += `<td>${item.end_date || '-'}</td>`;
        }
        
        html += '<td>';
        html += '<div class="table-actions">';
        if (type === 'contracts') {
            html += `<button class="btn-action btn-edit" onclick="window.editContractRoutes(${item.id})" title="${tVehicles.edit_routes || 'Edit Routes'}">
                        <span class="material-symbols-rounded">route</span>
                     </button>`;
            html += `<button class="btn-action btn-edit" data-item-type="${type}" data-item-id="${item.id}">
                        <span class="material-symbols-rounded">edit</span>
                     </button>`;
        } else {
            html += `<button class="btn-action btn-edit" data-item-type="${type}" data-item-id="${item.id}">
                        <span class="material-symbols-rounded">edit</span>
                     </button>`;
        }
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
        // Fix modal ID - companies -> companyModal, types -> typeModal, contracts -> contractModal
        let modalId, formId;
        if (type === 'companies') {
            modalId = 'companyModal';
            formId = 'companyForm';
        } else if (type === 'types') {
            modalId = 'typeModal';
            formId = 'typeForm';
        } else if (type === 'contracts') {
            modalId = 'contractModal';
            formId = 'contractForm';
        }
        
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
             if (type === 'companies') {
                 title.textContent = tVehicles.add_company || 'Add Vehicle Company';
             } else if (type === 'types') {
                 title.textContent = tVehicles.add_type || 'Add Vehicle Type';
             } else if (type === 'contracts') {
                 title.textContent = tVehicles.add_contract || 'Add Contract';
             }
         }
        
        // Load dependent data if needed
        if (type === 'companies') {
            await loadCitiesForSelect();
        } else if (type === 'types') {
            await loadCompaniesForSelect();
        } else if (type === 'contracts') {
            await loadCompaniesForContractSelect();
            // Generate and set contract code automatically
            await generateAndSetContractCode();
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
        
        // Reset contract form specifically
        const contractId = document.getElementById('contractId');
        if (contractId) {
            contractId.value = '';
        }
        
        // Reset contract code input readonly state when closing modal
        const contractCodeInput = document.getElementById('contract_code');
        if (contractCodeInput && !contractId.value) {
            contractCodeInput.readOnly = true;
        }
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
        
        // Fix modal ID - companies -> companyModal, types -> typeModal, contracts -> contractModal
        let modalId, formId;
        if (type === 'companies') {
            modalId = 'companyModal';
            formId = 'companyForm';
        } else if (type === 'types') {
            modalId = 'typeModal';
            formId = 'typeForm';
        } else if (type === 'contracts') {
            modalId = 'contractModal';
            formId = 'contractForm';
        }
        
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
             if (type === 'companies') {
                 title.textContent = tVehicles.edit_company || 'Edit Vehicle Company';
             } else if (type === 'types') {
                 title.textContent = tVehicles.edit_type || 'Edit Vehicle Type';
             } else if (type === 'contracts') {
                 title.textContent = tVehicles.edit_contract || 'Edit Contract';
             }
         }
        
        // Fill form
        form.dataset.id = id;
        
        if (type === 'companies') {
            form.querySelector('input[name="name"]').value = item.name;
            await loadCitiesForSelect();
            form.querySelector('select[name="city_id"]').value = item.city_id;
            // Fill contact information
            if (form.querySelector('input[name="contact_person"]')) {
                form.querySelector('input[name="contact_person"]').value = item.contact_person || '';
            }
            if (form.querySelector('input[name="contact_email"]')) {
                form.querySelector('input[name="contact_email"]').value = item.contact_email || '';
            }
            if (form.querySelector('input[name="contact_phone"]')) {
                form.querySelector('input[name="contact_phone"]').value = item.contact_phone || '';
            }
        } else if (type === 'types') {
            form.querySelector('input[name="name"]').value = item.name;
            await loadCompaniesForSelect();
            form.querySelector('select[name="vehicle_company_id"]').value = item.vehicle_company_id;
        } else if (type === 'contracts') {
            document.getElementById('contractId').value = item.id;
            document.getElementById('contract_vehicle_company_id').value = item.vehicle_company_id;
            const contractCodeInput = document.getElementById('contract_code');
            if (contractCodeInput) {
                contractCodeInput.value = item.contract_code || '';
                // Keep readonly in edit mode too
                contractCodeInput.readOnly = true;
            }
            document.getElementById('contract_start_date').value = item.start_date || '';
            document.getElementById('contract_end_date').value = item.end_date || '';
            await loadCompaniesForContractSelect();
        }
        
        modal.classList.add('active');
    };
    
     // Helper function to convert type to API action (singular form)
     function getApiAction(type) {
         const actionMap = {
             'companies': 'company',
             'types': 'type',
             'contracts': 'contract'
         };
         return actionMap[type] || type;
     }
    
    // Delete item
    window.deleteItem = async function(type, id) {
        const t = window.Translations || {};
        const tLoc = t.locations || {};
        const tDeps = t.dependencies || {};
        const deleteConfirmMessage = tVehicles.delete_confirm || tLoc.delete_confirm || 'Are you sure you want to delete this item?';
        
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
                    
                    // If API provides dependency_type and count, use them directly
                    if (result.dependency_type && result.count !== undefined) {
                        const depKey = result.dependency_type;
                        if (tDeps[depKey]) {
                            errorMessage = tDeps[depKey].replace('{count}', result.count);
                        }
                    } else if (errorMessage && typeof errorMessage === 'string') {
                        // Fallback: Try to match and translate dependency patterns from message
                        const companyTypesMatch = errorMessage.match(/company.*?(\d+).*?vehicle type/i);
                        if (companyTypesMatch) {
                            errorMessage = (tDeps.company_has_vehicle_types || errorMessage).replace('{count}', companyTypesMatch[1]);
                        }
                        
                        const companyContractsMatch = errorMessage.match(/company.*?(\d+).*?contract/i);
                        if (companyContractsMatch) {
                            errorMessage = (tDeps.company_has_contracts || errorMessage).replace('{count}', companyContractsMatch[1]);
                        }
                        
                        const typeContractsMatch = errorMessage.match(/vehicle type.*?(\d+).*?contract/i);
                        if (typeContractsMatch) {
                            errorMessage = (tDeps.type_has_contracts || errorMessage).replace('{count}', typeContractsMatch[1]);
                        }
                        
                        const contractRoutesMatch = errorMessage.match(/contract.*?(\d+).*?route/i);
                        if (contractRoutesMatch) {
                            errorMessage = (tDeps.contract_has_routes || errorMessage).replace('{count}', contractRoutesMatch[1]);
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
     function handleCompanySubmit(e) {
         e.preventDefault();
         const form = e.target;
         const formData = new FormData(form);
         const data = {
             name: formData.get('name'),
             city_id: formData.get('city_id'),
             contact_person: formData.get('contact_person'),
             contact_email: formData.get('contact_email'),
             contact_phone: formData.get('contact_phone')
         };
         
         if (form.dataset.id) {
             data.id = form.dataset.id;
             updateCompany(data);
         } else {
             createCompany(data);
         }
     }
     
    function handleTypeSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            vehicle_company_id: formData.get('vehicle_company_id')
        };
        
        if (form.dataset.id) {
            data.id = form.dataset.id;
            updateType(data);
        } else {
            createType(data);
        }
    }
    
    function handleContractSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const data = {
            vehicle_company_id: document.getElementById('contract_vehicle_company_id').value,
            contract_code: document.getElementById('contract_code').value,
            start_date: document.getElementById('contract_start_date').value,
            end_date: document.getElementById('contract_end_date').value
        };
        
        const contractId = document.getElementById('contractId').value;
        if (contractId) {
            data.id = contractId;
            updateContract(data);
        } else {
            createContract(data);
        }
    }
    
    // Navigate to contract routes page
    window.editContractRoutes = function(contractId) {
        window.location.href = BASE_PATH + 'app/definitions/contract-routes.php?id=' + contractId;
    };
    
    // Create operations
    async function createCompany(data) {
        try {
            const response = await fetch(`${API_BASE}?action=company`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.companies = [];
                loadData('companies');
                closeModal();
                showToast('success', tVehicles.company_added || 'Vehicle company created successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating company:', error);
            showToast('error', tCommon.save_failed || 'Failed to create company');
        }
    }
    
    async function createType(data) {
        try {
            const response = await fetch(`${API_BASE}?action=type`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.types = [];
                loadData('types');
                closeModal();
                showToast('success', tVehicles.type_added || 'Vehicle type created successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating type:', error);
            showToast('error', tCommon.save_failed || 'Failed to create type');
        }
    }
    
    // Update operations
    async function updateCompany(data) {
        try {
            const response = await fetch(`${API_BASE}?action=company`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.companies = [];
                loadData('companies');
                closeModal();
                showToast('success', tVehicles.company_updated || 'Vehicle company updated successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error updating company:', error);
            showToast('error', tCommon.update_failed || 'Failed to update company');
        }
    }
    
    async function updateType(data) {
        try {
            const response = await fetch(`${API_BASE}?action=type`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.types = [];
                loadData('types');
                closeModal();
                showToast('success', tVehicles.type_updated || 'Vehicle type updated successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error updating type:', error);
            showToast('error', tCommon.update_failed || 'Failed to update type');
        }
    }
    
    // Contract operations
    async function createContract(data) {
        try {
            const response = await fetch(`${API_BASE}?action=contract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.contracts = [];
                loadData('contracts');
                closeModal();
                showToast('success', tVehicles.contract_added || 'Contract created successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error creating contract:', error);
            showToast('error', tCommon.save_failed || 'Failed to create contract');
        }
    }
    
    async function updateContract(data) {
        try {
            const response = await fetch(`${API_BASE}?action=contract`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.contracts = [];
                loadData('contracts');
                closeModal();
                showToast('success', tVehicles.contract_updated || 'Contract updated successfully');
            } else {
                showToast('error', result.message);
            }
        } catch (error) {
            console.error('Error updating contract:', error);
            showToast('error', tCommon.update_failed || 'Failed to update contract');
        }
    }
    
    // Load dependent data for selects
    async function loadCitiesForSelect() {
        // Fetch cities from locations API
        try {
            const locationsApi = API_BASE.replace('vehicles.php', 'locations.php');
            const response = await fetch(`${locationsApi}?action=cities`);
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                const select = document.querySelector('[name="city_id"]');
                if (select) {
                    select.innerHTML = `<option value="">${tVehicles.select_city || 'Select City'}</option>`;
                    result.data.forEach(city => {
                        select.innerHTML += `<option value="${city.id}">${city.name} (${city.region_name || ''} - ${city.country_name || ''})</option>`;
                    });
                }
            } else {
                console.warn('No cities found or API error');
                const select = document.querySelector('[name="city_id"]');
                if (select) {
                    select.innerHTML = `<option value="">${tVehicles.no_cities_found || 'No cities found'}</option>`;
                }
            }
        } catch (error) {
            console.error('Error loading cities:', error);
            const select = document.querySelector('[name="city_id"]');
            if (select) {
                select.innerHTML = `<option value="">${tVehicles.error_cities_load || 'Error loading cities'}</option>`;
            }
        }
    }
    
    async function loadCompaniesForSelect() {
        if (currentData.companies.length === 0) {
            await fetchData('companies');
        }
        
        const select = document.querySelector('[name="vehicle_company_id"]');
        if (select) {
             select.innerHTML = `<option value="">${tVehicles.select_dept || 'Select Vehicle Company'}</option>`;
            currentData.companies.forEach(company => {
                select.innerHTML += `<option value="${company.id}">${company.name} (${company.city_name || ''})</option>`;
            });
        }
    }
    
    async function loadCompaniesForContractSelect(selectId = 'contract_vehicle_company_id') {
        if (currentData.companies.length === 0) {
            await fetchData('companies');
        }
        
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = `<option value="">${tVehicles.select_dept || 'Select Vehicle Company'}</option>`;
            currentData.companies.forEach(company => {
                select.innerHTML += `<option value="${company.id}">${company.name} (${company.city_name || ''})</option>`;
            });
        }
    }
    
    // Generate contract code automatically
    async function generateAndSetContractCode() {
        try {
            const response = await fetch(`${API_BASE}?action=generate_contract_code`);
            const result = await response.json();
            
            if (result.success && result.contract_code) {
                const contractCodeInput = document.getElementById('contract_code');
                if (contractCodeInput) {
                    contractCodeInput.value = result.contract_code;
                }
            }
        } catch (error) {
            console.error('Error generating contract code:', error);
        }
    }
    
    // showToast is from toast.js
})();

