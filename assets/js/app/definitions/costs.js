// Costs Page JavaScript
(function() {
    'use strict';
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/costs.php';
    
    // Get translations
    const t = window.Translations || {};
    const tCosts = t.costs || {};
    const tCommon = t.common || {};
    const tSidebar = t.sidebar || {};
    
    let currentData = {
        countries: [],
        costs: []
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        // Setup modal close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Form submission is handled inline in costs.php
        
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
    
    // Load data
    function loadData() {
        showLoading();
        fetchData();
    }
    
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
                filterCosts(query);
            }, 300);
        });
        
        // Clear search
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            filterCosts('');
        });
    }
    
    // Filter costs
    function filterCosts(query) {
        if (!query) {
            // Show all
            renderTable();
            return;
        }
        
        // Filter data
        const filtered = (currentData.costs || []).filter(item => {
            const searchText = query.toLowerCase();
            return (
                (item.cost_name && item.cost_name.toLowerCase().includes(searchText)) ||
                (item.cost_code && item.cost_code.toLowerCase().includes(searchText)) ||
                (item.country_name && item.country_name.toLowerCase().includes(searchText)) ||
                (item.region_name && item.region_name.toLowerCase().includes(searchText)) ||
                (item.city_name && item.city_name.toLowerCase().includes(searchText))
            );
        });
        
        // Render filtered results
        console.log('Filtered results:', filtered.length, 'out of', currentData.costs.length);
        renderTable(filtered);
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
                showError(result.message);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            currentData.costs = [];
            renderTable();
            showError('Failed to load data');
        }
    }
    
    // Render table
    function renderTable(dataToRender = null) {
        const container = document.getElementById('costs-content');
        const data = dataToRender !== null ? dataToRender : (currentData.costs || []);
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="costs-table-container">
                    <div class="costs-table-header">
                        <div class="costs-table-title">${tCosts.title || 'Costs'}</div>
                        <button class="btn-add" onclick="openModal()">
                            <span class="material-symbols-rounded">add</span>
                            ${tCosts.add_cost || 'Add Cost'}
                        </button>
                    </div>
                    <div class="empty-state">
                        <span class="material-symbols-rounded">savings</span>
                        <h3>${tCosts.no_costs || 'No costs found'}</h3>
                        <p>${tCosts.add_cost || 'Add your first cost'}</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '<div class="costs-table-container">';
        html += '<div class="costs-table-header">';
        html += `<div class="costs-table-title">${tCosts.title || 'Costs'}</div>`;
        html += `<button class="btn-add" onclick="openModal()">
                    <span class="material-symbols-rounded">add</span>
                    ${tCosts.add_cost || 'Add Cost'}
                 </button>`;
        html += '</div>';
        html += '<table class="table">';
        html += '<thead><tr>';
        html += `<th>${tCosts.cost_code || 'Cost Code'}</th>`;
        html += `<th>${tCosts.cost_name || 'Cost Name'}</th>`;
        html += `<th>${tSidebar.country || 'Country'}</th>`;
        html += `<th>${tSidebar.region || 'Region'}</th>`;
        html += `<th>${tSidebar.city || 'City'}</th>`;
        html += `<th>${tCommon.actions || 'Actions'}</th>`;
        html += '</tr></thead>';
        
        html += '<tbody>';
        data.forEach(item => {
            html += `
                <tr>
                    <td><strong>${item.cost_code}</strong></td>
                    <td>${item.cost_name || '-'}</td>
                    <td>${item.country_name || '-'} ${item.country_code ? '(' + item.country_code + ')' : ''}</td>
                    <td>${item.region_name || '-'}</td>
                    <td>${item.city_name || '-'}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-action btn-edit" onclick="editItem(${item.id})">
                                <span class="material-symbols-rounded">edit</span>
                            </button>
                            <button class="btn-action btn-delete" onclick="deleteItem(${item.id})">
                                <span class="material-symbols-rounded">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        
        container.innerHTML = html;
    }
    
    // Show loading state
    function showLoading() {
        const container = document.getElementById('costs-content');
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
        alert(message || (tCommon.error || 'Error'));
    }
    
    // Open modal
    window.openModal = async function() {
        const modal = document.getElementById('costsModal');
        if (!modal) return;
        
        modal.classList.add('active');
        
        // Reset form
        const form = document.getElementById('costForm');
        if (form) {
            form.reset();
            delete form.dataset.id;
            
            // Reset radio button to fixed (default)
            const fixedRadio = form.querySelector('input[value="fixed"]');
            if (fixedRadio) {
                fixedRadio.checked = true;
            }
        }
        
        // Update modal title
        const title = modal.querySelector('h2');
        if (title) {
            title.textContent = tCosts.add_cost || 'Add Cost';
        }
        
        // Load countries
        await loadCountriesForSelect();
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
        const item = currentData.costs.find(item => item.id == id);
        if (!item) return;
        
        const modal = document.getElementById('costsModal');
        if (!modal) return;
        
        const form = document.getElementById('costForm');
        if (!form) return;
        
        // Update modal title
        const title = modal.querySelector('h2');
        if (title) {
            title.textContent = tCosts.edit_cost || 'Edit Cost';
        }
        
        // Fill form
        form.dataset.id = id;
        form.querySelector('input[name="cost_code"]').value = item.cost_code || '';
        form.querySelector('input[name="cost_name"]').value = item.cost_name || '';
        form.querySelector('input[name="amount"]').value = item.amount || '';
        
        // Set radio button
        const isPercentage = item.is_percentage === 't' || item.is_percentage === true;
        const fixedRadio = form.querySelector('input[value="fixed"]');
        const percentRadio = form.querySelector('input[value="percentage"]');
        if (isPercentage) {
            percentRadio.checked = true;
        } else {
            fixedRadio.checked = true;
        }
        
        // Trigger change event to update label
        const radioToTrigger = isPercentage ? percentRadio : fixedRadio;
        if (radioToTrigger) {
            radioToTrigger.dispatchEvent(new Event('change'));
        }
        
        await loadCountriesForSelect();
        form.querySelector('select[name="country_id"]').value = item.country_id;
        
        modal.classList.add('active');
    };
    
    // Delete item
    window.deleteItem = async function(id) {
        if (!confirm(tCosts.delete_confirm || 'Are you sure you want to delete this item?')) return;
        
        try {
            const response = await fetch(`${API_BASE}?action=cost&id=${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.costs = [];
                await loadData();
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            showError('Failed to delete item');
        }
    };
    
    
    // Create cost
    window.createCost = async function(data) {
        try {
            const response = await fetch(`${API_BASE}?action=cost`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.costs = [];
                await loadData();
                closeModal();
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('Error creating cost:', error);
            showError('Failed to create cost');
        }
    }
    
    // Update cost
    window.updateCost = async function(data) {
        try {
            const response = await fetch(`${API_BASE}?action=cost`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                currentData.costs = [];
                await loadData();
                closeModal();
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('Error updating cost:', error);
            showError('Failed to update cost');
        }
    }
    
    // Load countries for select
    async function loadCountriesForSelect() {
        if (currentData.countries.length === 0) {
            try {
                const response = await fetch(`${API_BASE}?action=countries`);
                const result = await response.json();
                if (result.success) {
                    currentData.countries = result.data || [];
                }
            } catch (error) {
                console.error('Error loading countries:', error);
            }
        }
        
        const select = document.querySelector('[name="country_id"]');
        if (select) {
            select.innerHTML = `<option value="">${tCosts.select_country || 'Select Country'}</option>`;
            currentData.countries.forEach(country => {
                const codeStr = country.code ? ' (' + country.code + ')' : '';
                select.innerHTML += `<option value="${country.id}">${country.name}${codeStr}</option>`;
            });
        }
    }
})();
