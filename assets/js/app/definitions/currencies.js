// Currencies Page JavaScript
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
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/currencies.php';
    
    // Get translations
    const t = window.Translations || {};
    const tCurrencies = t.currencies || {};
    const tCommon = t.common || {};
    
    let countries = [];
    let countryCurrencies = [];
    let allCurrencies = [];
    let currentCountryId = null;
    let currentCurrencyId = null; // for master currency modal
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        setupEventListeners();
        loadCountries();
        loadAllCurrencies();
    });
    
    function setupEventListeners() {
        // Modal controls
        const addBtn = document.getElementById('addCurrencyBtn');
        if (addBtn) addBtn.addEventListener('click', () => openModal());
        const closeBtn = document.getElementById('closeModal');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        const closeManage = document.getElementById('closeCountryManageModal');
        if (closeManage) closeManage.addEventListener('click', closeCountryManageModal);
        const closeManageFooter = document.getElementById('closeCountryManageFooter');
        if (closeManageFooter) closeManageFooter.addEventListener('click', closeCountryManageModal);
        const saveBaseBtn = document.getElementById('manageSaveBaseCurrencyBtn');
        if (saveBaseBtn) saveBaseBtn.addEventListener('click', saveBaseCurrency);
        
        // Form submission
        const form = document.getElementById('currencyForm');
        if (form) form.addEventListener('submit', handleSubmit);
        
        // Close modal when clicking outside
        document.getElementById('currencyModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
    // Master currency modal helpers
    function openModal(currencyId = null) {
        currentCurrencyId = currencyId;
        const modal = document.getElementById('currencyModal');
        const form = document.getElementById('currencyForm');
        const title = document.getElementById('currencyModalTitle');
        if (!modal || !form || !title) return;
        if (currencyId) {
            title.textContent = tCurrencies.edit_currency || 'Edit Currency';
            // We do not have a list of currencies in this page; editing requires fetching list first.
            // Keep add-only for now: reset and treat as add when no list present.
            form.reset();
            document.getElementById('is_active').checked = true;
        } else {
            title.textContent = tCurrencies.add_currency || 'Add Currency';
            form.reset();
            document.getElementById('is_active').checked = true;
            currentCurrencyId = null;
        }
        modal.style.display = 'flex';
    }

    function closeModal() {
        const modal = document.getElementById('currencyModal');
        if (modal) modal.style.display = 'none';
        currentCurrencyId = null;
        const form = document.getElementById('currencyForm');
        if (form) form.reset();
    }

    function loadCurrencyData() {
        // No-op: page does not maintain a currencies table view. Implement when needed.
    }

    
    function loadCountries() {
        fetch(`${API_BASE}?action=countries`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    countries = data.data;
                    renderTable();
                } else {
                    showToast('error', data.message || tCurrencies.error_loading_countries || 'Error loading countries');
                }
            })
            .catch(error => {
                console.error('Error loading countries:', error);
                showToast('error', tCurrencies.error_loading_countries || 'Error loading countries');
            });
    }
    
    function renderTable() {
        const data = countries;
        const tbody = document.getElementById('currenciesTableBody');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px;">
                        <span class="material-symbols-rounded" style="font-size: 48px; color: #9ca3af;">currency_exchange</span>
                        <p style="color: #9ca3af; margin-top: 10px;">${tCurrencies.no_countries || 'No countries selected for currencies'}</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = data.map(country => `
            <tr>
                <td><strong>${country.name || '-'}</strong></td>
                <td>${country.code || '-'}</td>
                <td>${country.local_currency_code || '-'}</td>
                <td>
                    <a class="btn-icon" href="${(pageConfig.basePath || '../../')}app/definitions/currency-country.php?id=${country.id}" title="${tCurrencies.manage || 'Manage'}">
                        <span class="material-symbols-rounded">open_in_new</span>
                    </a>
                </td>
            </tr>
        `).join('');
    }
    
    // Manage country modal
    async function openCountryManageModal(country) {
        const modal = document.getElementById('countryManageModal');
        const title = document.getElementById('countryManageTitle');
        const body = document.getElementById('countryManageBody');
        if (!modal || !title || !body) return;
        title.textContent = `${country.name || ''} (${country.code || ''})`;
        body.innerHTML = `
            <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
                <span class="material-symbols-rounded">flag</span>
                <div><strong>${country.name || ''}</strong> - ${country.code || ''}</div>
            </div>
        `;
        currentCountryId = country.id;
        await loadAllCurrencies();
        await loadCountryCurrencies(country.id);
        fillCurrencySelect();
        fillBaseCurrencySelect(country);
        renderCountryCurrencies();
        modal.style.display = 'flex';
    }
    
    function closeCountryManageModal() {
        const modal = document.getElementById('countryManageModal');
        if (modal) modal.style.display = 'none';
        currentCountryId = null;
        countryCurrencies = [];
    }

    window.manageCountry = function(id) {
        const country = countries.find(c => c.id == id);
        if (!country) return;
        openCountryManageModal(country);
    };

    async function loadAllCurrencies() {
        try {
            const resp = await fetch(`${API_BASE}?action=currencies`);
            const res = await resp.json();
            if (res.success) {
                allCurrencies = res.data || [];
            }
        } catch (e) { console.error(e); }
    }

    async function loadCountryCurrencies(countryId) {
        try {
            const resp = await fetch(`${API_BASE}?action=country_currencies&country_id=${countryId}`);
            const res = await resp.json();
            if (res.success) {
                countryCurrencies = res.data || [];
            } else {
                countryCurrencies = [];
            }
        } catch (e) {
            console.error('Failed to load country currencies', e);
            countryCurrencies = [];
        }
    }

    function fillCurrencySelect() {
        const sel = document.getElementById('manageCurrencySelect');
        if (!sel) return;
        const assigned = new Set(countryCurrencies.map(x => (x.currency_code || '').toUpperCase()));
        sel.innerHTML = `<option value="">${tCurrencies.select_currency || 'Select currency'}</option>`;
        (allCurrencies || []).filter(c => c.is_active).forEach(c => {
            const code = (c.code || '').toUpperCase();
            const opt = document.createElement('option');
            opt.value = code;
            opt.textContent = `${code} - ${c.name || ''}`;
            if (assigned.has(code)) opt.disabled = true;
            sel.appendChild(opt);
        });
    }

    function fillBaseCurrencySelect(country) {
        const sel = document.getElementById('manageBaseCurrencySelect');
        if (!sel) return;
        sel.innerHTML = `<option value="">${tCurrencies.select_currency || 'Select currency'}</option>`;
        (allCurrencies || []).filter(c => c.is_active).forEach(c => {
            const code = (c.code || '').toUpperCase();
            const opt = document.createElement('option');
            opt.value = code;
            opt.textContent = `${code} - ${c.name || ''}`;
            sel.appendChild(opt);
        });
        if (country && country.local_currency_code) sel.value = (country.local_currency_code || '').toUpperCase();
    }

    async function saveBaseCurrency() {
        const sel = document.getElementById('manageBaseCurrencySelect');
        if (!sel || !currentCountryId) return;
        const code = sel.value || '';
        try {
            const resp = await fetch(`${API_BASE}?action=country`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: currentCountryId, local_currency_code: code }) });
            const res = await resp.json();
            if (res.success) {
                showToast('success', tCommon.saved_successfully || 'Saved');
                // update countries array so table shows new base currency immediately
                const c = countries.find(x => x.id == currentCountryId);
                if (c) c.local_currency_code = code || null;
                renderTable();
        } else {
                showToast('error', res.message || (tCommon.update_failed||'Update failed'));
            }
        } catch (e) {
            console.error(e);
            showToast('error', tCommon.update_failed||'Update failed');
        }
    }

    function renderCountryCurrencies() {
        const container = document.getElementById('countryCurrenciesList');
        if (!container) return;
        if (!countryCurrencies.length) {
            container.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">inventory_2</span><h3>${tCurrencies.no_country_currencies || 'No currencies assigned'}</h3></div>`;
            return;
        }
        let html = '<table class="table"><thead><tr>' +
            `<th>${tCurrencies.currency || 'Currency'}</th>` +
            `<th>${tCurrencies.unit_name || 'Unit'}</th>` +
            `<th>${tCurrencies.status || 'Status'}</th>` +
            `<th>${tCurrencies.actions || 'Actions'}</th>` +
            '</tr></thead><tbody>';
        countryCurrencies.forEach(item => {
            const active = (item.is_active === true) || (item.is_active === 't') || (item.is_active === 1) || (item.is_active === '1');
            html += `<tr>
                <td><strong>${(item.currency_code || '').toUpperCase()}</strong> - ${item.currency_name || ''}</td>
                <td>${item.unit_name || '-'}</td>
                <td><span class="status-badge ${active ? 'active' : 'inactive'}">${active ? (tCurrencies.active||'Active') : (tCurrencies.inactive||'Inactive')}</span></td>
                <td>
                    <button class="btn-icon" data-action="toggle" data-id="${item.id}" title="${tCurrencies.toggle_active||'Toggle active'}"><span class="material-symbols-rounded">toggle_on</span></button>
                    <button class="btn-icon" data-action="edit" data-id="${item.id}" title="${tCurrencies.edit||'Edit'}"><span class="material-symbols-rounded">edit</span></button>
                    <button class="btn-icon btn-danger" data-action="delete" data-id="${item.id}" title="${tCurrencies.delete||'Delete'}"><span class="material-symbols-rounded">delete</span></button>
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
        attachCountryCurrenciesActions();
    }

    function attachCountryCurrenciesActions() {
        const container = document.getElementById('countryCurrenciesList');
        if (!container) return;
        container.querySelectorAll('button[data-action][data-id]').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = parseInt(this.getAttribute('data-id'));
                const action = this.getAttribute('data-action');
                const row = countryCurrencies.find(x => x.id == id);
                if (!row) return;
                if (action === 'delete') {
                    if (!confirm(tCommon.delete_confirm || 'Delete?')) return;
                    await deleteCountryCurrency(id);
                } else if (action === 'toggle') {
                    const active = (row.is_active === true) || (row.is_active === 't') || (row.is_active === 1) || (row.is_active === '1');
                    await updateCountryCurrency({ id, is_active: !active });
                } else if (action === 'edit') {
                    const newUnit = prompt(tCurrencies.enter_unit_name || 'Enter unit name (leave empty to clear):', row.unit_name || '');
                    if (newUnit !== null) {
                        await updateCountryCurrency({ id, unit_name: newUnit });
                    }
                }
                await loadCountryCurrencies(currentCountryId);
                fillCurrencySelect();
                renderCountryCurrencies();
            });
        });
        const addBtn = document.getElementById('manageAddCurrencyBtn');
        if (addBtn) {
            addBtn.onclick = async () => {
                const sel = document.getElementById('manageCurrencySelect');
                const unit = document.getElementById('manageUnitName');
                const isActive = document.getElementById('manageIsActive');
                const code = sel && sel.value ? sel.value : '';
                if (!code) { showToast(tCurrencies.select_currency_first||'Please select a currency', 'warning'); return; }
                await createCountryCurrency({ country_id: currentCountryId, currency_code: code, unit_name: unit?.value || '', is_active: !!(isActive && isActive.checked) });
                unit && (unit.value = '');
                sel && (sel.value = '');
                await loadCountryCurrencies(currentCountryId);
                fillCurrencySelect();
                renderCountryCurrencies();
            };
        }
    }

    async function createCountryCurrency(payload) {
        try {
            const resp = await fetch(`${API_BASE}?action=country_currency`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const res = await resp.json();
            if (!res.success) showToast('error', res.message || (tCommon.save_failed||'Save failed'));
        } catch (e) { console.error(e); }
    }

    async function updateCountryCurrency(payload) {
        try {
            const resp = await fetch(`${API_BASE}?action=country_currency`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const res = await resp.json();
            if (!res.success) showToast('error', res.message || (tCommon.update_failed||'Update failed'));
        } catch (e) { console.error(e); }
    }

    async function deleteCountryCurrency(id) {
        try {
            const resp = await fetch(`${API_BASE}?action=country_currency&id=${id}`, { method: 'DELETE' });
            const res = await resp.json();
            if (!res.success) showToast('error', res.message || (tCommon.delete_failed||'Delete failed'));
        } catch (e) { console.error(e); }
    }
    
    function handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.is_active = document.getElementById('is_active').checked;
        
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
                // refresh master list so Manage modal select updates
                loadAllCurrencies().then(() => {
                    if (currentCountryId) {
                        fillCurrencySelect();
                    }
                });
            } else {
                showToast('error', result.message || tCurrencies.error_saving_currency || 'Error saving currency');
            }
        })
        .catch(error => {
            console.error('Error saving currency:', error);
            showToast('error', tCurrencies.error_saving_currency || 'Error saving currency');
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
                showToast('error', result.message || tCurrencies.error_deleting_currency || 'Error deleting currency');
            }
        })
        .catch(error => {
            console.error('Error deleting currency:', error);
            showToast('error', tCurrencies.error_deleting_currency || 'Error deleting currency');
        });
    };
    
    function showToast(type, message) {
        if (typeof window.showToast === 'function') {
            window.showToast(type, message);
        } else {
            alert(message || type);
        }
    }
})();

