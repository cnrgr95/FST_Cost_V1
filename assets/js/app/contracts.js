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
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
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
                showToast('Error loading sub regions', 'error');
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
                showToast('Error loading merchants', 'error');
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
                showToast('Error loading tours', 'error');
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
                    showToast(data.message || 'Error loading contracts', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading contracts:', error);
                showToast('Error loading contracts', 'error');
            });
    }
    
    function renderTable() {
        const tbody = document.getElementById('contractsTableBody');
        tbody.innerHTML = '';
        
        if (contracts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No contracts found</td></tr>';
            return;
        }
        
        contracts.forEach(contract => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contract.sub_region_name || '-'}</td>
                <td>${contract.merchant_name || '-'}</td>
                <td>${contract.tour_name || '-'}</td>
                <td>${contract.price ? parseFloat(contract.price).toFixed(2) : '-'}</td>
                <td>${contract.start_date || '-'}</td>
                <td>${contract.end_date || '-'}</td>
                <td>
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
        
        // Set title
        if (contractId) {
            title.textContent = (tCommon.edit || 'Edit') + ' ' + (tSidebar.contracts || 'Contract');
            loadContractData(contractId);
        } else {
            title.textContent = (tCommon.add || 'Add') + ' ' + (tSidebar.contracts || 'Contract');
        }
        
        modal.style.display = 'flex';
    }
    
    function closeModal() {
        document.getElementById('contractModal').style.display = 'none';
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
            showToast('End date must be after start date', 'error');
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
                    showToast('Please enter prices for at least one region', 'error');
                    return;
                }
            } else if (priceType === 'fixed') {
                // Check if at least one fixed price is filled
                const fixedAdultPrice = document.getElementById('fixed_adult_price').value;
                const fixedChildPrice = document.getElementById('fixed_child_price').value;
                const fixedInfantPrice = document.getElementById('fixed_infant_price').value;
                
                if (!fixedAdultPrice && !fixedChildPrice && !fixedInfantPrice) {
                    showToast('Please enter at least one fixed price', 'error');
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
                showToast(result.message || 'Contract saved successfully', 'success');
                closeModal();
                loadContracts();
            } else {
                showToast(result.message || 'Error saving contract', 'error');
            }
        })
        .catch(error => {
            console.error('Error saving contract:', error);
            showToast('Error saving contract', 'error');
        });
    }
    
    // Global functions for onclick handlers
    window.editContract = function(id) {
        openModal(id);
    };
    
    window.deleteContract = function(id) {
        if (!confirm('Are you sure you want to delete this contract?')) {
            return;
        }
        
        fetch(`${API_BASE}?action=contract&id=${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showToast('Contract deleted successfully', 'success');
                loadContracts();
            } else {
                showToast(result.message || 'Error deleting contract', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting contract:', error);
            showToast('Error deleting contract', 'error');
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

