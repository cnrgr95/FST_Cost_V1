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
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        // Setup modal close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Form submission is handled inline in costs.php
        
        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });
        });
        
        // Load data
        loadData();
    });
    
    // Load data
    function loadData() {
        showLoading();
        fetchData();
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
        html += '<div class="table-wrapper">';
        html += '<table class="table">';
        html += '<thead><tr>';
        html += `<th>${tCosts.cost_code || 'Cost Code'}</th>`;
        html += `<th>${tCosts.cost_name || 'Cost Name'}</th>`;
        html += `<th>${tCommon.actions || 'Actions'}</th>`;
        html += '</tr></thead>';
        
        html += '<tbody>';
        data.forEach(item => {
            html += `
                <tr>
                    <td><strong>${escapeHtml(item.cost_code)}</strong></td>
                    <td>${escapeHtml(item.cost_name || '-')}</td>
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
        html += '</tbody></table></div></div>';
        
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
        showToast('error', message || tCommon.error || 'Error');
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
        }
        
        // Update modal title
        const title = modal.querySelector('h2');
        if (title) {
            title.textContent = tCosts.add_cost || 'Add Cost';
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
    window.editItem = async function(id) {
        const item = currentData.costs.find(item => item.id == id);
        if (!item) {
            console.error('Item not found:', id);
            return;
        }
        
        const modal = document.getElementById('costsModal');
        if (!modal) {
            console.error('Modal not found: costsModal');
            return;
        }
        
        const form = document.getElementById('costForm');
        if (!form) {
            console.error('Form not found: costForm');
            return;
        }
        
        // Update modal title
        const title = modal.querySelector('h2');
        if (title) {
            title.textContent = tCosts.edit_cost || 'Edit Cost';
        }
        
        // Fill form
        form.dataset.id = id;
        
        // Set cost code
        const costCodeInput = form.querySelector('input[name="cost_code"]');
        if (costCodeInput) {
            costCodeInput.value = item.cost_code || '';
        }
        
        // Set cost name
        const costNameInput = form.querySelector('input[name="cost_name"]');
        if (costNameInput) {
            costNameInput.value = item.cost_name || '';
        }
        
        modal.classList.add('active');
    };
    
    // Delete item
    window.deleteItem = async function(id) {
        const t = window.Translations || {};
        const tLoc = t.locations || {};
        const deleteConfirmMessage = tCosts.delete_confirm || tLoc.delete_confirm || 'Are you sure you want to delete this item?';
        
        showConfirmDialog(deleteConfirmMessage, async function() {
            try {
                const response = await fetch(`${API_BASE}?action=cost&id=${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                if (result.success) {
                    currentData.costs = [];
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
                showToast('success', tCosts.cost_added || 'Cost created successfully');
            } else {
                showToast('error', result.message || 'Failed to create cost');
            }
        } catch (error) {
            console.error('Error creating cost:', error);
            showToast('error', tCommon.save_failed || 'Failed to create cost');
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
                showToast('success', tCosts.cost_updated || 'Cost updated successfully');
            } else {
                showToast('error', result.message || 'Failed to update cost');
            }
        } catch (error) {
            console.error('Error updating cost:', error);
            showToast('error', tCommon.update_failed || 'Failed to update cost');
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
