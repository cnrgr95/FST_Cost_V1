// Contracts Page JavaScript
(function() {
    'use strict';
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/contracts.php';
    
    // Get translations
    const t = window.Translations || {};
    const tContracts = t.contracts || {};
    const tCommon = t.common || {};
    const tSidebar = t.sidebar || {};
    
    let contracts = [];
    let subRegions = [];
    let merchants = [];
    let tours = [];
    let currencies = [];
    let tourRegions = [];
    let currentContractId = null;
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        setupEventListeners();
        setupSearch();
        loadSubRegions();
        loadCurrencies();
        loadContracts();
    });
    
    function setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearSearch');
        let searchTimeout;
        
        if (!searchInput || !clearBtn) return;
        
        // Search on input
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            
            // Show/hide clear button
            clearBtn.style.display = query ? 'flex' : 'none';
            
            // Debounce search
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterContracts(query);
            }, 300);
        });
        
        // Clear search
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            filterContracts('');
        });
    }
    
    function filterContracts(query) {
        if (!query) {
            renderTable();
            return;
        }
        
        const filtered = contracts.filter(contract => {
            const searchText = query.toLowerCase();
            return (
                (contract.sub_region_name && contract.sub_region_name.toLowerCase().includes(searchText)) ||
                (contract.merchant_name && contract.merchant_name.toLowerCase().includes(searchText)) ||
                (contract.tour_name && contract.tour_name.toLowerCase().includes(searchText)) ||
                (contract.price && contract.price.toString().includes(searchText))
            );
        });
        
        renderTableFiltered(filtered);
    }
    
    function renderTableFiltered(filteredContracts) {
        const tbody = document.getElementById('contractsTableBody');
        tbody.innerHTML = '';
        
        if (filteredContracts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No contracts found</td></tr>';
            return;
        }
        
        filteredContracts.forEach(contract => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contract.sub_region_name || '-'}</td>
                <td>${contract.merchant_name || '-'}</td>
                <td>${contract.tour_name || '-'}</td>
                <td>${contract.price ? parseFloat(contract.price).toFixed(2) : '-'}</td>
                <td>${contract.start_date || '-'}</td>
                <td>${contract.end_date || '-'}</td>
                <td>
                    <button class="btn-icon btn-info" onclick="showContractSummary(${contract.id})" title="${tContracts.summary || 'Kontrat Özeti'}">
                        <span class="material-symbols-rounded">info</span>
                    </button>
                    <button class="btn-icon" onclick="editContract(${contract.id})" title="Edit">
                        <span class="material-symbols-rounded">edit</span>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteContract(${contract.id})" title="Delete">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    function setupEventListeners() {
        // Modal controls
        const addBtn = document.getElementById('addContractBtn');
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const form = document.getElementById('contractForm');
        
        if (!addBtn || !closeBtn || !cancelBtn || !form) {
            console.error('Required elements not found for event listeners');
            return;
        }
        
        addBtn.addEventListener('click', () => openModal());
        if (closeBtn) closeBtn.addEventListener('click', () => closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal());
        
        // Form submission
        form.addEventListener('submit', handleSubmit);
        
        // VAT included change
        document.getElementById('vat_included').addEventListener('change', function() {
            const vatRateInput = document.getElementById('vat_rate');
            const vatRateLabel = document.getElementById('vat_rate_label');
            if (this.value === 'excluded') {
                vatRateInput.disabled = false;
                vatRateInput.style.opacity = '1';
                vatRateLabel.style.opacity = '1';
            } else {
                vatRateInput.disabled = true;
                vatRateInput.style.opacity = '0.5';
                vatRateLabel.style.opacity = '0.5';
                vatRateInput.value = '';
            }
        });
        
        // Sub region change - load merchants
        document.getElementById('sub_region_id').addEventListener('change', function() {
            const subRegionId = this.value;
            if (subRegionId) {
                loadMerchants(subRegionId);
            } else {
                document.getElementById('merchant_id').innerHTML = '<option value="">Select sub region first</option>';
                clearMerchantData();
            }
        });
        
        // Merchant change - load tours and fill merchant data
        document.getElementById('merchant_id').addEventListener('change', function() {
            const merchantId = this.value;
            if (merchantId) {
                loadTours(merchantId);
                fillMerchantData(merchantId);
            } else {
                document.getElementById('tour_id').innerHTML = '<option value="">Select merchant first</option>';
                clearMerchantData();
            }
        });
        
        // Transfer owner checkbox change - show/hide transfer fields
        const transferOwnerAgency = document.getElementById('transfer_owner_agency');
        const transferOwnerSupplier = document.getElementById('transfer_owner_supplier');
        const transferOwnerHidden = document.getElementById('transfer_owner');
        
        function updateTransferOwner() {
            const values = [];
            if (transferOwnerAgency && transferOwnerAgency.checked) values.push('agency');
            if (transferOwnerSupplier && transferOwnerSupplier.checked) values.push('supplier');
            transferOwnerHidden.value = values.join(',');
            
            const hasSupplier = transferOwnerSupplier && transferOwnerSupplier.checked;
            const priceTypeGroup = document.getElementById('transfer_price_type_group');
            const perPersonGroup = document.getElementById('transfer_per_person_price_group');
            const fixedPricesGroup = document.getElementById('transfer_fixed_prices_group');
            
            if (hasSupplier) {
                if (priceTypeGroup) priceTypeGroup.style.display = 'flex';
            } else {
                if (priceTypeGroup) priceTypeGroup.style.display = 'none';
                if (perPersonGroup) perPersonGroup.style.display = 'none';
                if (fixedPricesGroup) fixedPricesGroup.style.display = 'none';
                // Clear values
                document.getElementById('transfer_price_type').value = '';
                document.getElementById('transfer_price').value = '';
                document.getElementById('transfer_currency').value = '';
                document.getElementById('transfer_price_mini').value = '';
                document.getElementById('transfer_price_midi').value = '';
                document.getElementById('transfer_price_bus').value = '';
                document.getElementById('transfer_currency_fixed').value = '';
            }
        }
        
        if (transferOwnerAgency) transferOwnerAgency.addEventListener('change', updateTransferOwner);
        if (transferOwnerSupplier) transferOwnerSupplier.addEventListener('change', updateTransferOwner);
        
        // Transfer price type change - show/hide price field
        document.getElementById('transfer_price_type').addEventListener('change', function() {
            const priceType = this.value;
            const perPersonGroup = document.getElementById('transfer_per_person_price_group');
            const fixedPricesGroup = document.getElementById('transfer_fixed_prices_group');
            
            if (priceType === 'per_person') {
                if (perPersonGroup) perPersonGroup.style.display = 'flex';
                if (fixedPricesGroup) fixedPricesGroup.style.display = 'none';
            } else if (priceType === 'fixed') {
                if (perPersonGroup) perPersonGroup.style.display = 'none';
                if (fixedPricesGroup) fixedPricesGroup.style.display = 'block';
            } else {
                if (perPersonGroup) perPersonGroup.style.display = 'none';
                if (fixedPricesGroup) fixedPricesGroup.style.display = 'none';
            }
        });
        
        // Tour change - load tour regions and show price sections
        document.getElementById('tour_id').addEventListener('change', function() {
            const tourId = this.value;
            if (tourId) {
                loadTourRegions(tourId);
                document.getElementById('pricing_section').style.display = 'block';
                document.getElementById('price_type_section').style.display = 'block';
                document.getElementById('age_currency_section').style.display = 'block';
            } else {
                hideRegionalPrices();
                document.getElementById('pricing_section').style.display = 'none';
                document.getElementById('price_type_section').style.display = 'none';
                document.getElementById('age_currency_section').style.display = 'none';
                document.getElementById('fixed_price_section').style.display = 'none';
            }
        });
        
        // Price type change - show regional or fixed prices
        document.addEventListener('change', function(e) {
            if (e.target.name === 'price_type') {
                if (e.target.value === 'regional') {
                    document.getElementById('regional_prices_section').style.display = 'block';
                    document.getElementById('fixed_price_section').style.display = 'none';
                    // Render regional prices if tour regions are loaded
                    if (tourRegions && tourRegions.length > 0) {
                        renderRegionalPrices();
                    }
                } else {
                    document.getElementById('regional_prices_section').style.display = 'none';
                    document.getElementById('fixed_price_section').style.display = 'block';
                }
            }
        });
        
        // Kickback type change - show currency if fixed
        document.getElementById('kickback_type').addEventListener('change', function() {
            const currencySelect = document.getElementById('kickback_currency');
            const currencyLabel = document.getElementById('kickback_currency_label');
            if (this.value === 'fixed') {
                currencySelect.disabled = false;
                currencySelect.style.opacity = '1';
                currencyLabel.style.opacity = '1';
            } else {
                currencySelect.disabled = true;
                currencySelect.style.opacity = '0.5';
                currencyLabel.style.opacity = '0.5';
                currencySelect.value = '';
            }
        });
        
        // Close modal when clicking outside
        document.getElementById('contractModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
    
    function loadSubRegions() {
        fetch(`${API_BASE}?action=sub_regions`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    subRegions = data.data;
                    const select = document.getElementById('sub_region_id');
                    select.innerHTML = '<option value="">Select...</option>';
                    data.data.forEach(subRegion => {
                        const option = document.createElement('option');
                        option.value = subRegion.id;
                        option.textContent = subRegion.name;
                        select.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Error loading sub regions:', error);
                showToast('error', 'Error loading sub regions');
            });
    }
    
    function loadCurrencies() {
        fetch(`${API_BASE}?action=currencies`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currencies = data.data;
                    populateCurrencyDropdowns();
                }
            })
            .catch(error => {
                console.error('Error loading currencies:', error);
                // Use default currencies if API fails
                currencies = [
                    {code: 'USD', name: 'US Dollar', symbol: '$'},
                    {code: 'EUR', name: 'Euro', symbol: '€'},
                    {code: 'TL', name: 'Turkish Lira', symbol: '₺'},
                    {code: 'GBP', name: 'British Pound', symbol: '£'}
                ];
                populateCurrencyDropdowns();
            });
    }
    
    function populateCurrencyDropdowns() {
        // Populate kickback currency and contract currency dropdowns
        const currencySelects = ['kickback_currency', 'contract_currency'];
        
        currencySelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Select...</option>';
                currencies.forEach(currency => {
                    const option = document.createElement('option');
                    option.value = currency.code;
                    option.textContent = `${currency.code}${currency.symbol ? ' (' + currency.symbol + ')' : ''}`;
                    select.appendChild(option);
                });
            }
        });
        
        // Populate transfer currency dropdowns
        const transferCurrencySelect = document.getElementById('transfer_currency');
        if (transferCurrencySelect) {
            transferCurrencySelect.innerHTML = '<option value="">Select...</option>';
            currencies.forEach(currency => {
                const option = document.createElement('option');
                option.value = currency.code;
                option.textContent = `${currency.code}${currency.symbol ? ' (' + currency.symbol + ')' : ''}`;
                transferCurrencySelect.appendChild(option);
            });
        }
        
        const transferCurrencyFixedSelect = document.getElementById('transfer_currency_fixed');
        if (transferCurrencyFixedSelect) {
            transferCurrencyFixedSelect.innerHTML = '<option value="">Select...</option>';
            currencies.forEach(currency => {
                const option = document.createElement('option');
                option.value = currency.code;
                option.textContent = `${currency.code}${currency.symbol ? ' (' + currency.symbol + ')' : ''}`;
                transferCurrencyFixedSelect.appendChild(option);
            });
        }
    }
    
    function loadMerchants(subRegionId) {
        return fetch(`${API_BASE}?action=merchants&sub_region_id=${subRegionId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    merchants = data.data;
                    const select = document.getElementById('merchant_id');
                    select.innerHTML = '<option value="">Select...</option>';
                    data.data.forEach(merchant => {
                        const option = document.createElement('option');
                        option.value = merchant.id;
                        option.textContent = merchant.name;
                        select.appendChild(option);
                    });
                }
                return data;
            })
            .catch(error => {
                console.error('Error loading merchants:', error);
                showToast('error', 'Error loading merchants');
                throw error;
            });
    }
    
    function loadTours(merchantId) {
        return fetch(`${API_BASE}?action=tours&merchant_id=${merchantId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    tours = data.data;
                    const select = document.getElementById('tour_id');
                    select.innerHTML = '<option value="">Select...</option>';
                    data.data.forEach(tour => {
                        const option = document.createElement('option');
                        option.value = tour.id;
                        option.textContent = tour.name;
                        select.appendChild(option);
                    });
                }
                return data;
            })
            .catch(error => {
                console.error('Error loading tours:', error);
                showToast('error', 'Error loading tours');
                throw error;
            });
    }
    
    function loadTourRegions(tourId) {
        return fetch(`${API_BASE}?action=tour_regions&tour_id=${tourId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data && data.data.length > 0) {
                    tourRegions = data.data;
                    // Check price type and show appropriate section
                    const priceTypeRadio = document.querySelector('input[name="price_type"]:checked');
                    if (priceTypeRadio && priceTypeRadio.value === 'regional') {
                        renderRegionalPrices();
                        document.getElementById('regional_prices_section').style.display = 'block';
                    } else {
                        document.getElementById('regional_prices_section').style.display = 'none';
                    }
                } else {
                    hideRegionalPrices();
                }
                return data;
            })
            .catch(error => {
                console.error('Error loading tour regions:', error);
                hideRegionalPrices();
                throw error;
            });
    }
    
    function renderRegionalPrices() {
        const container = document.getElementById('regional_prices_container');
        const section = document.getElementById('regional_prices_section');
        
        if (!container || !section) return;
        
        container.innerHTML = '';
        
        tourRegions.forEach(region => {
            const priceItem = document.createElement('div');
            priceItem.className = 'regional-price-item';
            priceItem.dataset.subRegionId = region.sub_region_id;
            
            priceItem.innerHTML = `
                <div class="regional-price-header">
                    <h4>${region.sub_region_name}</h4>
                    <small>${region.city_name || ''} - ${region.region_name || ''} - ${region.country_name || ''}</small>
                </div>
                <div class="regional-price-row">
                    <div class="regional-price-field">
                        <label>${tContracts.adult_price || 'Yetişkin Fiyat'}</label>
                        <input type="number" class="adult-price-input" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="regional-price-field">
                        <label>${tContracts.child_price || 'Çocuk Fiyat'}</label>
                        <input type="number" class="child-price-input" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="regional-price-field">
                        <label>${tContracts.infant_price || 'Bebek Fiyat'}</label>
                        <input type="number" class="infant-price-input" step="0.01" min="0" placeholder="0.00">
                    </div>
                </div>
            `;
            
            container.appendChild(priceItem);
        });
        
        section.style.display = 'block';
    }
    
    function hideRegionalPrices() {
        const section = document.getElementById('regional_prices_section');
        if (section) {
            section.style.display = 'none';
        }
        tourRegions = [];
    }
    
    function fillMerchantData(merchantId) {
        const merchant = merchants.find(m => m.id == merchantId);
        if (merchant) {
            document.getElementById('merchant_official_title').value = merchant.official_title || '';
            document.getElementById('authorized_person').value = merchant.authorized_person || '';
            document.getElementById('authorized_email').value = merchant.authorized_email || '';
        }
    }
    
    function clearMerchantData() {
        document.getElementById('merchant_official_title').value = '';
        document.getElementById('authorized_person').value = '';
        document.getElementById('authorized_email').value = '';
    }
    
    function loadContracts() {
        fetch(`${API_BASE}?action=contracts`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    contracts = data.data;
                    renderTable();
                } else {
                    showToast('error', data.message || 'Error loading contracts');
                }
            })
            .catch(error => {
                console.error('Error loading contracts:', error);
                showToast('error', 'Error loading contracts');
            });
    }
    
    function renderTable() {
        const tbody = document.getElementById('contractsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (contracts.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="7" style="text-align: center; padding: 20px;">No contracts found</td>';
            tbody.appendChild(emptyRow);
            return;
        }
        
        contracts.forEach(contract => {
            const row = document.createElement('tr');
            
            // XSS korumalı render
            const subRegionCell = document.createElement('td');
            subRegionCell.textContent = contract.sub_region_name || '-';
            
            const merchantCell = document.createElement('td');
            merchantCell.textContent = contract.merchant_name || '-';
            
            const tourCell = document.createElement('td');
            tourCell.textContent = contract.tour_name || '-';
            
            const priceCell = document.createElement('td');
            priceCell.textContent = contract.price ? parseFloat(contract.price).toFixed(2) : '-';
            
            const startDateCell = document.createElement('td');
            startDateCell.textContent = contract.start_date || '-';
            
            const endDateCell = document.createElement('td');
            endDateCell.textContent = contract.end_date || '-';
            
            const actionsCell = document.createElement('td');
            
            const infoBtn = document.createElement('button');
            infoBtn.className = 'btn-icon btn-info';
            infoBtn.title = tContracts.summary || 'Kontrat Özeti';
            infoBtn.onclick = () => showContractSummary(contract.id);
            infoBtn.innerHTML = '<span class="material-symbols-rounded">info</span>';
            actionsCell.appendChild(infoBtn);
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-icon';
            editBtn.title = 'Edit';
            editBtn.onclick = () => editContract(contract.id);
            editBtn.innerHTML = '<span class="material-symbols-rounded">edit</span>';
            actionsCell.appendChild(editBtn);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon btn-danger';
            deleteBtn.title = 'Delete';
            deleteBtn.onclick = () => deleteContract(contract.id);
            deleteBtn.innerHTML = '<span class="material-symbols-rounded">delete</span>';
            actionsCell.appendChild(deleteBtn);
            
            row.appendChild(subRegionCell);
            row.appendChild(merchantCell);
            row.appendChild(tourCell);
            row.appendChild(priceCell);
            row.appendChild(startDateCell);
            row.appendChild(endDateCell);
            row.appendChild(actionsCell);
            
            tbody.appendChild(row);
        });
    }
    
    function openModal(contractId = null) {
        currentContractId = contractId;
        const modal = document.getElementById('contractModal');
        const form = document.getElementById('contractForm');
        const title = document.getElementById('modalTitle');
        
        if (!modal || !form || !title) {
            console.error('Modal elements not found');
            return;
        }
        
        // Reset form
        form.reset();
        const contractIdInput = document.getElementById('contractId');
        if (contractIdInput) contractIdInput.value = '';
        
        // Reset VAT rate
        const vatRateInput = document.getElementById('vat_rate');
        const vatRateLabel = document.getElementById('vat_rate_label');
        if (vatRateInput) {
            vatRateInput.disabled = true;
            vatRateInput.style.opacity = '0.5';
            vatRateInput.value = '';
        }
        if (vatRateLabel) {
            vatRateLabel.style.opacity = '0.5';
        }
        
        const pricingSection = document.getElementById('pricing_section');
        if (pricingSection) pricingSection.style.display = 'none';
        
        const priceTypeSection = document.getElementById('price_type_section');
        if (priceTypeSection) priceTypeSection.style.display = 'none';
        
        const ageCurrencySection = document.getElementById('age_currency_section');
        if (ageCurrencySection) ageCurrencySection.style.display = 'none';
        
        const fixedPriceSection = document.getElementById('fixed_price_section');
        if (fixedPriceSection) fixedPriceSection.style.display = 'none';
        
        const priceTypeRegional = document.getElementById('price_type_regional');
        if (priceTypeRegional) priceTypeRegional.checked = true;
        
        // Reset kickback currency
        const kickbackCurrency = document.getElementById('kickback_currency');
        const kickbackCurrencyLabel = document.getElementById('kickback_currency_label');
        if (kickbackCurrency) {
            kickbackCurrency.disabled = true;
            kickbackCurrency.style.opacity = '0.5';
            kickbackCurrency.value = '';
        }
        if (kickbackCurrencyLabel) {
            kickbackCurrencyLabel.style.opacity = '0.5';
        }
        
        clearMerchantData();
        hideRegionalPrices();
        
        // Reset transfer checkboxes
        document.getElementById('transfer_owner_agency').checked = false;
        document.getElementById('transfer_owner_supplier').checked = false;
        document.getElementById('transfer_owner').value = '';
        document.getElementById('transfer_price_type_group').style.display = 'none';
        document.getElementById('transfer_per_person_price_group').style.display = 'none';
        document.getElementById('transfer_fixed_prices_group').style.display = 'none';
        
        // Set title
        if (contractId) {
            title.textContent = (tCommon.edit || 'Edit') + ' ' + (tSidebar.contracts || 'Contract');
            loadContractData(contractId);
        } else {
            title.textContent = (tCommon.add || 'Add') + ' ' + (tSidebar.contracts || 'Contract');
        }
        
        // Show modal using common.js function or fallback
        if (typeof window.openModal === 'function') {
            window.openModal('contractModal');
        } else {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeModal() {
        const modal = document.getElementById('contractModal');
        if (modal) {
            if (typeof window.closeModal === 'function') {
                window.closeModal('contractModal');
            } else {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
        currentContractId = null;
    }
    
    function loadContractData(contractId) {
        const contract = contracts.find(c => c.id == contractId);
        if (!contract) return;
        
        document.getElementById('contractId').value = contract.id;
        document.getElementById('sub_region_id').value = contract.sub_region_id;
        
        // Load merchants for this sub region
        loadMerchants(contract.sub_region_id).then(() => {
            document.getElementById('merchant_id').value = contract.merchant_id;
            loadTours(contract.merchant_id).then(() => {
                document.getElementById('tour_id').value = contract.tour_id;
                // Load tour regions and prices
                if (contract.tour_id) {
                    // Show price sections
                    document.getElementById('pricing_section').style.display = 'block';
                    document.getElementById('price_type_section').style.display = 'block';
                    document.getElementById('age_currency_section').style.display = 'block';
                    
                    loadTourRegions(contract.tour_id).then(() => {
                        // Set price type
                        const priceType = contract.price_type || 'regional';
                        if (priceType === 'fixed') {
                            document.getElementById('price_type_fixed').checked = true;
                            document.getElementById('fixed_price_section').style.display = 'block';
                            document.getElementById('regional_prices_section').style.display = 'none';
                            document.getElementById('fixed_adult_price').value = contract.fixed_adult_price || '';
                            document.getElementById('fixed_child_price').value = contract.fixed_child_price || '';
                            document.getElementById('fixed_infant_price').value = contract.fixed_infant_price || '';
                        } else {
                            document.getElementById('price_type_regional').checked = true;
                            document.getElementById('fixed_price_section').style.display = 'none';
                            document.getElementById('regional_prices_section').style.display = 'block';
                            // Load saved regional prices
                            if (contract.regional_prices && contract.regional_prices.length > 0) {
                                loadRegionalPrices(contract.regional_prices);
                            }
                        }
                    });
                }
            });
            fillMerchantData(contract.merchant_id);
        });
        
        document.getElementById('vat_included').value = contract.vat_included ? 'included' : 'excluded';
        const vatRateInput = document.getElementById('vat_rate');
        const vatRateLabel = document.getElementById('vat_rate_label');
        if (!contract.vat_included && contract.vat_rate) {
            if (vatRateInput) {
                vatRateInput.disabled = false;
                vatRateInput.style.opacity = '1';
                vatRateInput.value = contract.vat_rate;
            }
            if (vatRateLabel) {
                vatRateLabel.style.opacity = '1';
            }
        } else {
            if (vatRateInput) {
                vatRateInput.disabled = true;
                vatRateInput.style.opacity = '0.5';
                vatRateInput.value = '';
            }
            if (vatRateLabel) {
                vatRateLabel.style.opacity = '0.5';
            }
        }
        document.getElementById('kickback_type').value = contract.kickback_type || '';
        document.getElementById('kickback_value').value = contract.kickback_value || '';
        const currencySelect = document.getElementById('kickback_currency');
        const currencyLabel = document.getElementById('kickback_currency_label');
        if (contract.kickback_type === 'fixed') {
            currencySelect.disabled = false;
            currencySelect.style.opacity = '1';
            currencyLabel.style.opacity = '1';
            currencySelect.value = contract.kickback_currency || 'USD';
        } else {
            currencySelect.disabled = true;
            currencySelect.style.opacity = '0.5';
            currencyLabel.style.opacity = '0.5';
            currencySelect.value = '';
        }
        // Set radio button for kickback calculation
        if (contract.kickback_per_person) {
            document.getElementById('kickback_per_person_1').checked = true;
        } else {
            document.getElementById('kickback_per_person_0').checked = true;
        }
        document.getElementById('kickback_min_persons').value = contract.kickback_min_persons || '';
        document.getElementById('adult_age').value = contract.adult_age || '';
        document.getElementById('child_age_range').value = contract.child_age_range || '';
        document.getElementById('infant_age_range').value = contract.infant_age_range || '';
        document.getElementById('contract_currency').value = contract.contract_currency || contract.adult_currency || 'USD';
        document.getElementById('included_content').value = contract.included_content || '';
        document.getElementById('start_date').value = contract.start_date || '';
        document.getElementById('end_date').value = contract.end_date || '';
        
        // Transfer fields - set checkboxes
        const transferOwner = contract.transfer_owner || '';
        const transferOwners = transferOwner.split(',');
        if (transferOwners.includes('agency')) {
            document.getElementById('transfer_owner_agency').checked = true;
        }
        if (transferOwners.includes('supplier')) {
            document.getElementById('transfer_owner_supplier').checked = true;
            document.getElementById('transfer_price_type_group').style.display = 'flex';
            const priceType = contract.transfer_price_type || '';
            document.getElementById('transfer_price_type').value = priceType;
            
            if (priceType === 'per_person') {
                document.getElementById('transfer_per_person_price_group').style.display = 'flex';
                document.getElementById('transfer_fixed_prices_group').style.display = 'none';
                document.getElementById('transfer_price').value = contract.transfer_price || '';
                document.getElementById('transfer_currency').value = contract.transfer_currency || '';
            } else if (priceType === 'fixed') {
                document.getElementById('transfer_per_person_price_group').style.display = 'none';
                document.getElementById('transfer_fixed_prices_group').style.display = 'block';
                document.getElementById('transfer_price_mini').value = contract.transfer_price_mini || '';
                document.getElementById('transfer_price_midi').value = contract.transfer_price_midi || '';
                document.getElementById('transfer_price_bus').value = contract.transfer_price_bus || '';
                document.getElementById('transfer_currency_fixed').value = contract.transfer_currency_fixed || contract.transfer_currency || '';
            }
        }
        // Update hidden field
        document.getElementById('transfer_owner').value = transferOwner;
    }
    
    function loadRegionalPrices(regionalPrices) {
        regionalPrices.forEach(priceData => {
            const item = document.querySelector(`.regional-price-item[data-sub-region-id="${priceData.sub_region_id}"]`);
            if (item) {
                if (priceData.adult_price) {
                    item.querySelector('.adult-price-input').value = priceData.adult_price;
                }
                if (priceData.child_price) {
                    item.querySelector('.child-price-input').value = priceData.child_price;
                }
                if (priceData.infant_price) {
                    item.querySelector('.infant-price-input').value = priceData.infant_price;
                }
            }
        });
    }
    
    function handleSubmit(e) {
        e.preventDefault();
        
        // Basic validation
        const startDate = document.getElementById('start_date').value;
        const endDate = document.getElementById('end_date').value;
        
        if (startDate && endDate && endDate < startDate) {
            showToast('error', 'End date must be after start date');
            return;
        }
        
        // Check if tour is selected and price type section is visible
        const tourId = document.getElementById('tour_id').value;
        const priceTypeSection = document.getElementById('price_type_section');
        
        if (tourId && priceTypeSection.style.display !== 'none') {
            const priceTypeRadio = document.querySelector('input[name="price_type"]:checked');
            const priceType = priceTypeRadio ? priceTypeRadio.value : 'regional';
            
            if (priceType === 'regional') {
                // Check if at least one regional price is filled
                const hasRegionalPrices = document.querySelectorAll('.regional-price-item').length > 0;
                if (!hasRegionalPrices) {
                    showToast('error', 'Please enter prices for at least one region');
                    return;
                }
            } else if (priceType === 'fixed') {
                // Check if at least one fixed price is filled
                const fixedAdultPrice = document.getElementById('fixed_adult_price').value;
                const fixedChildPrice = document.getElementById('fixed_child_price').value;
                const fixedInfantPrice = document.getElementById('fixed_infant_price').value;
                
                if (!fixedAdultPrice && !fixedChildPrice && !fixedInfantPrice) {
                    showToast('error', 'Please enter at least one fixed price');
                    return;
                }
            }
        }
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Convert radio button to boolean
        const kickbackPerPersonRadio = document.querySelector('input[name="kickback_per_person"]:checked');
        data.kickback_per_person = kickbackPerPersonRadio ? kickbackPerPersonRadio.value === '1' : false;
        
        // Get price type
        const priceTypeRadio = document.querySelector('input[name="price_type"]:checked');
        data.price_type = priceTypeRadio ? priceTypeRadio.value : 'regional';
        
        // Get contract currency (common for all prices)
        const contractCurrency = document.getElementById('contract_currency')?.value || 'USD';
        data.contract_currency = contractCurrency;
        
        // Transfer fields - get from checkbox
        const transferOwnerAgency = document.getElementById('transfer_owner_agency')?.checked;
        const transferOwnerSupplier = document.getElementById('transfer_owner_supplier')?.checked;
        const transferOwners = [];
        if (transferOwnerAgency) transferOwners.push('agency');
        if (transferOwnerSupplier) transferOwners.push('supplier');
        data.transfer_owner = transferOwners.join(',');
        
        data.transfer_price_type = document.getElementById('transfer_price_type')?.value || '';
        
        // Per person price or fixed prices by vehicle type
        if (data.transfer_price_type === 'per_person') {
            data.transfer_price = document.getElementById('transfer_price')?.value || '';
            data.transfer_currency = document.getElementById('transfer_currency')?.value || '';
            data.transfer_price_mini = '';
            data.transfer_price_midi = '';
            data.transfer_price_bus = '';
            data.transfer_currency_fixed = '';
        } else if (data.transfer_price_type === 'fixed') {
            data.transfer_price = '';
            data.transfer_currency = '';
            data.transfer_price_mini = document.getElementById('transfer_price_mini')?.value || '';
            data.transfer_price_midi = document.getElementById('transfer_price_midi')?.value || '';
            data.transfer_price_bus = document.getElementById('transfer_price_bus')?.value || '';
            data.transfer_currency_fixed = document.getElementById('transfer_currency_fixed')?.value || '';
        } else {
            data.transfer_price = '';
            data.transfer_currency = '';
            data.transfer_price_mini = '';
            data.transfer_price_midi = '';
            data.transfer_price_bus = '';
            data.transfer_currency_fixed = '';
        }
        
        // Age groups
        data.adult_age = document.getElementById('adult_age')?.value || '';
        data.child_age_range = document.getElementById('child_age_range')?.value || '';
        data.infant_age_range = document.getElementById('infant_age_range')?.value || '';
        
        // Collect prices based on type
        if (data.price_type === 'regional') {
            // Regional prices
            const regionalPrices = [];
            document.querySelectorAll('.regional-price-item').forEach(item => {
                const subRegionId = item.dataset.subRegionId;
                const priceData = {
                    sub_region_id: subRegionId,
                    adult_price: item.querySelector('.adult-price-input')?.value || '',
                    adult_currency: contractCurrency,
                    child_price: item.querySelector('.child-price-input')?.value || '',
                    child_currency: contractCurrency,
                    infant_price: item.querySelector('.infant-price-input')?.value || '',
                    infant_currency: contractCurrency
                };
                regionalPrices.push(priceData);
            });
            data.regional_prices = regionalPrices;
        } else {
            // Fixed prices for all regions
            data.fixed_adult_price = document.getElementById('fixed_adult_price')?.value || '';
            data.fixed_child_price = document.getElementById('fixed_child_price')?.value || '';
            data.fixed_infant_price = document.getElementById('fixed_infant_price')?.value || '';
            data.fixed_currency = contractCurrency;
        }
        
        // Add contract ID if editing
        if (currentContractId) {
            data.id = currentContractId;
        }
        
        const url = `${API_BASE}?action=contract`;
        const method = currentContractId ? 'PUT' : 'POST';
        
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
                showToast('success', result.message || 'Contract saved successfully');
                closeModal();
                loadContracts();
            } else {
                showToast('error', result.message || 'Error saving contract');
            }
        })
        .catch(error => {
            console.error('Error saving contract:', error);
            showToast('error', 'Error saving contract');
        });
    }
    
    // Global functions for onclick handlers
    window.showContractSummary = function(id) {
        const contract = contracts.find(c => c.id == id);
        if (!contract) {
            showToast('error', 'Kontrat bulunamadı');
            return;
        }
        
        const t = window.Translations || {};
        const tContracts = t.contracts || {};
        
        // Format transfer owner
        let transferOwnerText = '-';
        if (contract.transfer_owner) {
            const owners = contract.transfer_owner.split(',');
            const ownerNames = owners.map(owner => {
                return owner === 'agency' ? (tContracts.agency || 'Acente') : (tContracts.supplier || 'Supplier');
            });
            transferOwnerText = ownerNames.join(', ');
        }
        
        // Format transfer price
        let transferPriceText = '-';
        if (contract.transfer_price_type === 'per_person') {
            transferPriceText = `${contract.transfer_price || '0'} ${contract.transfer_currency || ''} (${tContracts.per_person || 'Kişi Başı'})`;
        } else if (contract.transfer_price_type === 'fixed') {
            const prices = [];
            if (contract.transfer_price_mini) prices.push(`Mini: ${contract.transfer_price_mini}`);
            if (contract.transfer_price_midi) prices.push(`Midi: ${contract.transfer_price_midi}`);
            if (contract.transfer_price_bus) prices.push(`Bus: ${contract.transfer_price_bus}`);
            transferPriceText = prices.length > 0 ? `${prices.join(', ')} ${contract.transfer_currency_fixed || contract.transfer_currency || ''}` : '-';
        }
        
        // Format VAT info
        const vatText = contract.vat_included === 't' || contract.vat_included === true ? 
            (tContracts.vat_included_included || 'KDV Dahil') : 
            contract.vat_rate ? 
                `${tContracts.vat_included_excluded || 'KDV Hariç'} (${contract.vat_rate}%)` : 
                (tContracts.vat_included_included || 'KDV Dahil');
        
        // Format kickback calculation
        const kickbackCalcText = contract.kickback_per_person === 't' || contract.kickback_per_person === true ? 
            (tContracts.per_person || 'Kişi Başı') : 
            (tContracts.over_revenue || 'Ciro Üzerinden');
        
        // Format pricing info as table
        let pricingHTML = '';
        if (contract.price_type === 'fixed') {
            pricingHTML = `
                <table class="pricing-table">
                    <thead>
                        <tr>
                            <th>${tContracts.age_type || 'Yaş Tipi'}</th>
                            <th>${tContracts.price || 'Fiyat'}</th>
                            <th>${tContracts.currency || 'Döviz'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${contract.fixed_adult_price ? `
                        <tr>
                            <td>${tContracts.adult || 'Yetişkin'}</td>
                            <td>${contract.fixed_adult_price}</td>
                            <td>${contract.contract_currency || 'USD'}</td>
                        </tr>
                        ` : ''}
                        ${contract.fixed_child_price ? `
                        <tr>
                            <td>${tContracts.child || 'Çocuk'}</td>
                            <td>${contract.fixed_child_price}</td>
                            <td>${contract.contract_currency || 'USD'}</td>
                        </tr>
                        ` : ''}
                        ${contract.fixed_infant_price ? `
                        <tr>
                            <td>${tContracts.infant || 'Bebek'}</td>
                            <td>${contract.fixed_infant_price}</td>
                            <td>${contract.contract_currency || 'USD'}</td>
                        </tr>
                        ` : ''}
                        ${!contract.fixed_adult_price && !contract.fixed_child_price && !contract.fixed_infant_price ? `
                        <tr>
                            <td colspan="3" style="text-align: center;">-</td>
                        </tr>
                        ` : ''}
                    </tbody>
                </table>
            `;
        } else if (contract.regional_prices && contract.regional_prices.length > 0) {
            pricingHTML = `
                <table class="pricing-table">
                    <thead>
                        <tr>
                            <th>${tContracts.sub_region || 'Bölge'}</th>
                            <th>${tContracts.adult || 'Yetişkin'}</th>
                            <th>${tContracts.child || 'Çocuk'}</th>
                            <th>${tContracts.infant || 'Bebek'}</th>
                            <th>${tContracts.currency || 'Döviz'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${contract.regional_prices.map(price => `
                            <tr>
                                <td><strong>${price.sub_region_name || '-'}</strong></td>
                                <td>${price.adult_price || '-'}</td>
                                <td>${price.child_price || '-'}</td>
                                <td>${price.infant_price || '-'}</td>
                                <td>${price.adult_currency || contract.contract_currency || 'USD'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            pricingHTML = '<div>-</div>';
        }
        
        const summaryHTML = `
            <div class="contract-summary">
                <div class="summary-section">
                    <h3>${tContracts.basic_info || 'Temel Bilgiler'}</h3>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.sub_region || 'Bölge'}:</span>
                        <span class="summary-value">${contract.sub_region_name || '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.merchant || 'Firma'}:</span>
                        <span class="summary-value">${contract.merchant_name || '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.merchant_official_title || 'Resmi Ünvan'}:</span>
                        <span class="summary-value">${contract.merchant_official_title || contract.official_title || '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.authorized_person || 'Yetkili Kişi'}:</span>
                        <span class="summary-value">${contract.authorized_person || contract.merchant_authorized_person || '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.authorized_email || 'Yetkili E-Posta'}:</span>
                        <span class="summary-value">${contract.authorized_email || contract.merchant_authorized_email || '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.tour || 'Tur'}:</span>
                        <span class="summary-value">${contract.tour_name || '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.start_date || 'Başlangıç Tarihi'}:</span>
                        <span class="summary-value">${contract.start_date || '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.end_date || 'Bitiş Tarihi'}:</span>
                        <span class="summary-value">${contract.end_date || '-'}</span>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>${tContracts.contract_dates_vat || 'KDV Bilgileri'}</h3>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.vat_included || 'KDV Durumu'}:</span>
                        <span class="summary-value">${vatText}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.vat_rate || 'KDV Oranı'}:</span>
                        <span class="summary-value">${contract.vat_rate ? `${contract.vat_rate}%` : '-'}</span>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>${tContracts.age_currency || 'Yaş Bilgileri'}</h3>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.adult_age || 'Yetişkin Yaş'}:</span>
                        <span class="summary-value">${contract.adult_age || '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.child_age || 'Çocuk Yaş'}:</span>
                        <span class="summary-value">${contract.child_age_range || '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.infant_age || 'Bebek Yaş'}:</span>
                        <span class="summary-value">${contract.infant_age_range || '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.currency || 'Döviz'}:</span>
                        <span class="summary-value">${contract.contract_currency || 'USD'}</span>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>${tContracts.pricing || 'Fiyatlandırma'}</h3>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.price_type || 'Fiyat Tipi'}:</span>
                        <span class="summary-value">${contract.price_type === 'fixed' ? (tContracts.fixed_price || 'Sabit Fiyat') : (tContracts.regional_price || 'Bölge Bazlı')}</span>
                    </div>
                    <div class="summary-row" style="flex-direction: column; align-items: flex-start;">
                        <span class="summary-label" style="margin-bottom: 8px;">${tContracts.pricing || 'Fiyatlar'}:</span>
                        <div style="width: 100%; overflow-x: auto;">${pricingHTML}</div>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>${tContracts.transfer || 'Transfer Bilgileri'}</h3>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.transfer_owner || 'Transfer Kimde'}:</span>
                        <span class="summary-value">${transferOwnerText}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.transfer_price_type || 'Transfer Fiyat Tipi'}:</span>
                        <span class="summary-value">${contract.transfer_price_type === 'per_person' ? (tContracts.per_person || 'Kişi Başı') : contract.transfer_price_type === 'fixed' ? (tContracts.fixed_amount || 'Sabit Fiyat') : '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.transfer_price || 'Transfer Fiyatı'}:</span>
                        <span class="summary-value">${transferPriceText}</span>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>${tContracts.kickback || 'Kickback Bilgileri'}</h3>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.kickback_type || 'Kickback Tipi'}:</span>
                        <span class="summary-value">${contract.kickback_type === 'fixed' ? (tContracts.fixed_amount || 'Sabit Tutar') : contract.kickback_type === 'percentage' ? (tContracts.percentage || 'Yüzde') : '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.kickback_value || 'Kickback Değeri'}:</span>
                        <span class="summary-value">${contract.kickback_value ? `${contract.kickback_value} ${contract.kickback_currency || ''}` : '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.kickback_calculation || 'Hesaplama Tipi'}:</span>
                        <span class="summary-value">${contract.kickback_type ? kickbackCalcText : '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${tContracts.min_persons || 'Minimum Kişi'}:</span>
                        <span class="summary-value">${contract.kickback_min_persons || '-'}</span>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>${tContracts.included_content || 'Dahil Edilenler'}</h3>
                    <div class="summary-row">
                        <span class="summary-value" style="text-align: left; max-width: 100%; white-space: pre-wrap;">${contract.included_content || '-'}</span>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('contractSummaryContent').innerHTML = summaryHTML;
        document.getElementById('contractSummaryModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    
    window.closeContractSummary = function() {
        document.getElementById('contractSummaryModal').classList.remove('active');
        document.body.style.overflow = '';
    };
    
    window.printContractSummary = function() {
        const printWindow = window.open('', '_blank');
        const content = document.getElementById('contractSummaryContent').innerHTML;
        const title = document.querySelector('#contractSummaryModal h2').textContent;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        color: #1f2937;
                    }
                    h2 {
                        color: #151A2D;
                        border-bottom: 2px solid #151A2D;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .summary-section {
                        margin-bottom: 24px;
                        border-bottom: 1px solid #e5e7eb;
                        padding-bottom: 16px;
                    }
                    .summary-section:last-child {
                        border-bottom: none;
                    }
                    .summary-section h3 {
                        margin: 0 0 12px 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: #151A2D;
                    }
                    .summary-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #f3f4f6;
                    }
                    .summary-label {
                        font-weight: 500;
                        color: #6b7280;
                        font-size: 14px;
                    }
                    .summary-value {
                        color: #1f2937;
                        font-size: 14px;
                        text-align: right;
                    }
                    .pricing-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 8px;
                        font-size: 14px;
                    }
                    .pricing-table thead {
                        background: #f9fafb;
                    }
                    .pricing-table th {
                        padding: 10px 12px;
                        text-align: left;
                        font-weight: 600;
                        color: #151A2D;
                        border-bottom: 2px solid #e5e7eb;
                    }
                    .pricing-table td {
                        padding: 10px 12px;
                        border-bottom: 1px solid #f3f4f6;
                        color: #374151;
                    }
                    @media print {
                        body { padding: 0; }
                        .summary-section { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <h2>${title}</h2>
                ${content}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };
    
    window.editContract = function(id) {
        openModal(id);
    };
    
    window.deleteContract = function(id) {
        const tCommon = window.Translations?.common || {};
        const tContracts = window.Translations?.contracts || {};
        const message = tContracts.delete_confirm || tCommon.delete_confirm || 'Are you sure you want to delete this contract?';
        
        showConfirmDialog(message, function() {
            fetch(`${API_BASE}?action=contract&id=${id}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showToast('success', tContracts.contract_deleted_successfully || tCommon.item_deleted_successfully || 'Contract deleted successfully');
                    loadContracts();
                } else {
                    showToast('error', result.message || tCommon.delete_failed || 'Error deleting contract');
                }
            })
            .catch(error => {
                console.error('Error deleting contract:', error);
                showToast('error', tCommon.delete_failed || 'Error deleting contract');
            });
        });
    };
})();

