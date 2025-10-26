// Tours Page JavaScript
(function() {
    'use strict';
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/tours.php';
    
    // Get translations
    const t = window.Translations || {};
    const tTours = t.tours || {};
    const tCommon = t.common || {};
    const tSidebar = t.sidebar || {};
    
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
        });
        
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
        html += '<table class="table">';
        html += '<thead><tr>';
        html += `<th>${tTours.sejour_tour_code || 'Sejour Tour Code'}</th>`;
        html += `<th>${tTours.tour_name || 'Tour Name'}</th>`;
        html += `<th>${tSidebar.merchant || 'Merchant'}</th>`;
        html += `<th>${tSidebar.country || 'Country'}</th>`;
        html += `<th>${tSidebar.region || 'Region'}</th>`;
        html += `<th>${tSidebar.city || 'City'}</th>`;
        html += `<th>${tSidebar['sub_region'] || 'Sub Region'}</th>`;
        html += `<th>${tCommon.actions || 'Actions'}</th>`;
        html += '</tr></thead>';
        
        html += '<tbody>';
        data.forEach(item => {
            html += `
                <tr>
                    <td><strong>${escapeHtml(item.sejour_tour_code || '-')}</strong></td>
                    <td><strong>${escapeHtml(item.name)}</strong></td>
                    <td>${escapeHtml(item.merchant_name || '-')}</td>
                    <td>${escapeHtml(item.country_name || '-')}</td>
                    <td>${escapeHtml(item.region_name || '-')}</td>
                    <td>${escapeHtml(item.city_name || '-')}</td>
                    <td>${escapeHtml(item.sub_region_name || '-')}</td>
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
        if (!modal) return;
        
        modal.classList.add('active');
        
        // Reset form
        const form = document.getElementById('tourForm');
        if (form) {
            form.reset();
            delete form.dataset.id;
        }
        
        // Update modal title
        const title = modal.querySelector('h2');
        if (title) {
            title.textContent = tTours.add_tour || 'Add Tour';
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
        
        modal.classList.add('active');
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
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();
