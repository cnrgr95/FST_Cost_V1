// Currencies Page JavaScript
(function() {
    'use strict';
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/currencies.php';
    
    // Get translations
    const t = window.Translations || {};
    const tCurrencies = t.currencies || {};
    const tCommon = t.common || {};
    
    let currencies = [];
    let currentCurrencyId = null;
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        setupEventListeners();
        loadCurrencies();
    });
    
    function setupEventListeners() {
        // Modal controls
        document.getElementById('addCurrencyBtn').addEventListener('click', () => openModal());
        document.getElementById('closeModal').addEventListener('click', closeModal);
        document.getElementById('cancelBtn').addEventListener('click', closeModal);
        
        // Form submission
        document.getElementById('currencyForm').addEventListener('submit', handleSubmit);
        
        // Close modal when clicking outside
        document.getElementById('currencyModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
        
        // Setup search
        setupSearch();
    }
    
    function setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearSearch');
        let searchTimeout;
        
        if (!searchInput) return;
        
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            clearBtn.style.display = query ? 'flex' : 'none';
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterCurrencies(query);
            }, 300);
        });
        
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            filterCurrencies('');
        });
    }
    
    function filterCurrencies(query) {
        if (!query) {
            renderTable();
            return;
        }
        
        const filtered = currencies.filter(item => {
            const searchText = query.toLowerCase();
            return (
                (item.code && item.code.toLowerCase().includes(searchText)) ||
                (item.name && item.name.toLowerCase().includes(searchText)) ||
                (item.symbol && item.symbol.toLowerCase().includes(searchText))
            );
        });
        
        renderTableFiltered(filtered);
    }
    
    function loadCurrencies() {
        fetch(`${API_BASE}?action=currencies`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currencies = data.data;
                    renderTable();
                } else {
                    showToast(data.message || 'Error loading currencies', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading currencies:', error);
                showToast('Error loading currencies', 'error');
            });
    }
    
    function renderTable() {
        renderTableFiltered(currencies);
    }
    
    function renderTableFiltered(filteredCurrencies) {
        const tbody = document.getElementById('currenciesTableBody');
        
        if (!filteredCurrencies || filteredCurrencies.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px;">
                        <span class="material-symbols-rounded" style="font-size: 48px; color: #9ca3af;">currency_exchange</span>
                        <p style="color: #9ca3af; margin-top: 10px;">${tCurrencies.no_currencies || 'No currencies found'}</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = filteredCurrencies.map(currency => `
            <tr>
                <td><strong>${currency.code || '-'}</strong></td>
                <td>${currency.name || '-'}</td>
                <td>${currency.symbol || '-'}</td>
                <td>
                    <span class="status-badge ${currency.is_active ? 'active' : 'inactive'}">
                        ${currency.is_active ? (tCurrencies.active || 'Active') : (tCurrencies.inactive || 'Inactive')}
                    </span>
                </td>
                <td>
                    <button class="btn-icon" onclick="editCurrency(${currency.id})" title="${tCommon.edit || 'Edit'}">
                        <span class="material-symbols-rounded">edit</span>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteCurrency(${currency.id})" title="${tCommon.delete || 'Delete'}">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    function openModal(currencyId = null) {
        currentCurrencyId = currencyId;
        const modal = document.getElementById('currencyModal');
        const form = document.getElementById('currencyForm');
        const title = document.getElementById('currencyModalTitle');
        
        if (currencyId) {
            title.textContent = tCurrencies.edit_currency || 'Edit Currency';
            loadCurrencyData(currencyId);
        } else {
            title.textContent = tCurrencies.add_currency || 'Add Currency';
            form.reset();
            document.getElementById('is_active').checked = true;
            currentCurrencyId = null;
        }
        
        modal.style.display = 'flex';
    }
    
    function closeModal() {
        document.getElementById('currencyModal').style.display = 'none';
        currentCurrencyId = null;
        document.getElementById('currencyForm').reset();
    }
    
    function loadCurrencyData(currencyId) {
        const currency = currencies.find(c => c.id == currencyId);
        if (!currency) return;
        
        document.getElementById('currencyId').value = currency.id;
        document.getElementById('code').value = currency.code || '';
        document.getElementById('name').value = currency.name || '';
        document.getElementById('symbol').value = currency.symbol || '';
        document.getElementById('is_active').checked = currency.is_active || false;
    }
    
    function handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.is_active = document.getElementById('is_active').checked;
        
        if (currentCurrencyId) {
            data.id = currentCurrencyId;
        }
        
        const url = `${API_BASE}?action=currency`;
        const method = currentCurrencyId ? 'PUT' : 'POST';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showToast(result.message || (currentCurrencyId ? (tCurrencies.currency_updated || 'Currency updated') : (tCurrencies.currency_added || 'Currency added')), 'success');
                closeModal();
                loadCurrencies();
            } else {
                showToast(result.message || 'Error saving currency', 'error');
            }
        })
        .catch(error => {
            console.error('Error saving currency:', error);
            showToast('Error saving currency', 'error');
        });
    }
    
    // Global functions for onclick handlers
    window.editCurrency = function(id) {
        openModal(id);
    };
    
    window.deleteCurrency = function(id) {
        if (!confirm(tCurrencies.delete_confirm || 'Are you sure you want to delete this currency?')) {
            return;
        }
        
        fetch(`${API_BASE}?action=currency&id=${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showToast(tCurrencies.currency_deleted || 'Currency deleted successfully', 'success');
                loadCurrencies();
            } else {
                showToast(result.message || 'Error deleting currency', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting currency:', error);
            showToast('Error deleting currency', 'error');
        });
    };
    
    function showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }
})();

