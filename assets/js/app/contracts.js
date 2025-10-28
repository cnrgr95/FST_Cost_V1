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
    let activeRequests = new Map(); // Track active requests for cancellation
    
    // Initialize
    // Load vehicle companies
    function loadVehicleCompanies() {
        const select = document.getElementById('vehicle_company_id');
        if (!select) return;
        
        fetch('../api/definitions/vehicles.php?action=companies')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    select.innerHTML = '<option value="">Seçin...</option>';
                    data.data.forEach(company => {
                        const option = document.createElement('option');
                        option.value = company.id;
                        option.textContent = company.company_name;
                        select.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Error loading vehicle companies:', error);
                select.innerHTML = '<option value="">Yüklenemedi</option>';
            });
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        setupEventListeners();
        setupSearch();
        loadSubRegions();
        loadVehicleCompanies();
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
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">${tContracts.no_contracts || 'No contracts found'}</td></tr>`;
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
                    <button class="btn-icon btn-info" onclick="showContractSummary(${contract.id})" title="${tContracts.summary || 'Contract Summary'}">
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
        if (closeBtn) closeBtn.addEventListener('click', () => closeContractModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => closeContractModal());
        
        // Form submission
        form.addEventListener('submit', handleSubmit);
        
        // VAT included change
        const vatIncludedEl = document.getElementById('vat_included');
        if (vatIncludedEl) {
            vatIncludedEl.addEventListener('change', function() {
                const vatRateInput = document.getElementById('vat_rate');
                const vatRateLabel = document.getElementById('vat_rate_label');
                if (this.value === 'excluded') {
                    if (vatRateInput) vatRateInput.disabled = false;
                    if (vatRateInput) vatRateInput.style.opacity = '1';
                    if (vatRateLabel) vatRateLabel.style.opacity = '1';
                } else {
                    if (vatRateInput) vatRateInput.disabled = true;
                    if (vatRateInput) vatRateInput.style.opacity = '0.5';
                    if (vatRateLabel) vatRateLabel.style.opacity = '0.5';
                    if (vatRateInput) vatRateInput.value = '';
                }
            });
        }
        
        // Sub region change - load merchants
        const subRegionId = document.getElementById('sub_region_id');
        if (subRegionId) {
            subRegionId.addEventListener('change', function() {
                const subRegionId = this.value;
                if (subRegionId) {
                    loadMerchants(subRegionId);
                } else {
                    const merchantIdSelect = document.getElementById('merchant_id');
                    if (merchantIdSelect) {
                        merchantIdSelect.innerHTML = `<option value="">${tCommon.select_sub_region_first || 'Please select sub region first'}</option>`;
                    }
                    clearMerchantData();
                }
            });
        }
        
        // Merchant change - load tours and fill merchant data
        const merchantId = document.getElementById('merchant_id');
        if (merchantId) {
            merchantId.addEventListener('change', function() {
                const merchantId = this.value;
                if (merchantId) {
                    loadTours(merchantId);
                    fillMerchantData(merchantId);
                } else {
                    const tourIdSelect = document.getElementById('tour_id');
                    if (tourIdSelect) {
                        tourIdSelect.innerHTML = `<option value="">${tCommon.select_merchant_first || 'Please select merchant first'}</option>`;
                    }
                    clearMerchantData();
                }
            });
        }
        
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
        const transferPriceType = document.getElementById('transfer_price_type');
        if (transferPriceType) {
            transferPriceType.addEventListener('change', function() {
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
        }
        
        // Tour change - load tour regions and show price sections
        const tourIdSelect = document.getElementById('tour_id');
        if (tourIdSelect) {
            tourIdSelect.addEventListener('change', function() {
                const tourId = this.value;
                if (tourId) {
                    loadTourRegions(tourId);
                    // Show price periods section when tour is selected
                    const pricePeriodsSection = document.getElementById('price_periods_section');
                    if (pricePeriodsSection) pricePeriodsSection.style.display = 'block';
                } else {
                    hideRegionalPrices();
                    const pricePeriodsSection = document.getElementById('price_periods_section');
                    if (pricePeriodsSection) pricePeriodsSection.style.display = 'none';
                }
            });
        }
        
        // Price type change - show regional or fixed prices (for price period modal)
        document.addEventListener('change', function(e) {
            if (e.target.name === 'price_type') {
                const regionalPricesSection = document.getElementById('regional_prices_section');
                const fixedPriceSection = document.getElementById('fixed_price_section');
                const periodRegionalPricesSection = document.getElementById('period_regional_prices_section');
                const periodFixedPriceSection = document.getElementById('period_fixed_price_section');
                
                if (e.target.value === 'regional') {
                    if (regionalPricesSection) regionalPricesSection.style.display = 'block';
                    if (fixedPriceSection) fixedPriceSection.style.display = 'none';
                    if (periodRegionalPricesSection) periodRegionalPricesSection.style.display = 'block';
                    if (periodFixedPriceSection) periodFixedPriceSection.style.display = 'none';
                    // Render regional prices if tour regions are loaded
                    if (tourRegions && tourRegions.length > 0) {
                        renderRegionalPricesForPeriod();
                    }
                } else {
                    if (regionalPricesSection) regionalPricesSection.style.display = 'none';
                    if (fixedPriceSection) fixedPriceSection.style.display = 'block';
                    if (periodRegionalPricesSection) periodRegionalPricesSection.style.display = 'none';
                    if (periodFixedPriceSection) periodFixedPriceSection.style.display = 'block';
                }
            }
        });
        
        // Kickback type change - show currency if fixed
        const kickbackType = document.getElementById('kickback_type');
        if (kickbackType) {
            kickbackType.addEventListener('change', function() {
                const currencySelect = document.getElementById('kickback_currency');
                const currencyLabel = document.getElementById('kickback_currency_label');
                if (this.value === 'fixed') {
                    if (currencySelect) currencySelect.disabled = false;
                    if (currencySelect) currencySelect.style.opacity = '1';
                    if (currencyLabel) currencyLabel.style.opacity = '1';
                } else {
                    if (currencySelect) currencySelect.disabled = true;
                    if (currencySelect) currencySelect.style.opacity = '0.5';
                    if (currencyLabel) currencyLabel.style.opacity = '0.5';
                    if (currencySelect) currencySelect.value = '';
                }
            });
        }
        
        // Modal close only via X button or Cancel button (no click outside)
        
    // Tab switching
    document.querySelectorAll('.contract-form-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            document.querySelectorAll('.contract-form-tab').forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.contract-form-content').forEach(c => c.classList.remove('active'));
            // Show selected tab content
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
    
    // Period type change - show/hide period fields
    const periodTypeSelect = document.getElementById('period_type');
    const periodTypeAdvSelect = document.getElementById('period_type_adv');
    
    if (periodTypeSelect) {
        periodTypeSelect.addEventListener('change', function() {
            const periodType = this.value;
            const periodValueGroup = document.getElementById('period_value_group');
            const periodUnitGroup = document.getElementById('period_unit_group');
            
            if (periodType === 'custom') {
                if (periodValueGroup) periodValueGroup.style.display = 'flex';
                if (periodUnitGroup) periodUnitGroup.style.display = 'flex';
            } else {
                if (periodValueGroup) periodValueGroup.style.display = 'none';
                if (periodUnitGroup) periodUnitGroup.style.display = 'none';
            }
        });
    }
    
    // Kickback period type change
    const kickbackPeriodTypeSelect = document.getElementById('kickback_period_type');
    if (kickbackPeriodTypeSelect) {
        kickbackPeriodTypeSelect.addEventListener('change', function() {
            const periodType = this.value;
            const periodValueGroup = document.getElementById('kickback_period_value_group');
            const periodUnitGroup = document.getElementById('kickback_period_unit_group');
            
            if (periodType === 'custom') {
                if (periodValueGroup) periodValueGroup.style.display = 'flex';
                if (periodUnitGroup) periodUnitGroup.style.display = 'flex';
            } else {
                if (periodValueGroup) periodValueGroup.style.display = 'none';
                if (periodUnitGroup) periodUnitGroup.style.display = 'none';
            }
        });
    }
        
        // Action price type change
        document.addEventListener('change', function(e) {
            if (e.target && e.target.name === 'action_price_type') {
                const fixedContainer = document.getElementById('action_fixed_price_container');
                const regionalContainer = document.getElementById('action_regional_price_container');
                
                if (e.target.value === 'fixed') {
                    if (fixedContainer) fixedContainer.style.display = 'block';
                    if (regionalContainer) regionalContainer.style.display = 'none';
                } else if (e.target.value === 'regional') {
                    if (fixedContainer) fixedContainer.style.display = 'none';
                    if (regionalContainer) regionalContainer.style.display = 'block';
                    // Render regional prices if tour regions are loaded
                    if (tourRegions && tourRegions.length > 0) {
                        renderActionRegionalPrices();
                    }
                }
            }
        });
        
        // Action name uniqueness check
        const actionNameInput = document.getElementById('action_name');
        if (actionNameInput) {
            let actionNameTimeout;
            actionNameInput.addEventListener('blur', function() {
                clearTimeout(actionNameTimeout);
                actionNameTimeout = setTimeout(() => {
                    checkActionName(this.value);
                }, 500);
            });
        }
        
        // Period name uniqueness checks
        const pricePeriodNameInput = document.getElementById('period_name');
        if (pricePeriodNameInput) {
            let periodNameTimeout;
            pricePeriodNameInput.addEventListener('blur', function() {
                clearTimeout(periodNameTimeout);
                periodNameTimeout = setTimeout(() => {
                    checkPeriodName(this.value, 'price');
                }, 500);
            });
        }
        
        const kickbackPeriodNameInput = document.getElementById('kickback_period_name');
        if (kickbackPeriodNameInput) {
            let kickbackNameTimeout;
            kickbackPeriodNameInput.addEventListener('blur', function() {
                clearTimeout(kickbackNameTimeout);
                kickbackNameTimeout = setTimeout(() => {
                    checkPeriodName(this.value, 'kickback');
                }, 500);
            });
        }
        
        const transferPeriodNameInput = document.getElementById('transfer_period_name');
        if (transferPeriodNameInput) {
            let transferNameTimeout;
            transferPeriodNameInput.addEventListener('blur', function() {
                clearTimeout(transferNameTimeout);
                transferNameTimeout = setTimeout(() => {
                    checkPeriodName(this.value, 'transfer');
                }, 500);
            });
        }
        
        // Add action button
        const addActionBtnEl = document.getElementById('addActionBtn');
        if (addActionBtnEl) {
            addActionBtnEl.addEventListener('click', function() {
                openActionModal();
            });
        }
        
        // Action modal controls
        const closeActionModalBtn = document.getElementById('closeActionModal');
        if (closeActionModalBtn) {
            closeActionModalBtn.addEventListener('click', closeActionModal);
        }
        
        const cancelActionBtn = document.getElementById('cancelActionBtn');
        if (cancelActionBtn) {
            cancelActionBtn.addEventListener('click', closeActionModal);
        }
        
        const actionForm = document.getElementById('actionForm');
        if (actionForm) {
            actionForm.addEventListener('submit', handleActionSubmit);
        }
        
        // Action modal - close only via buttons
        
        // Price period modal controls
        const addPricePeriodBtn = document.getElementById('addPricePeriodBtn');
        if (addPricePeriodBtn) {
            addPricePeriodBtn.addEventListener('click', function() {
                openPricePeriodModal();
            });
        }
        
        const closePricePeriodModalBtn = document.getElementById('closePricePeriodModal');
        if (closePricePeriodModalBtn) {
            closePricePeriodModalBtn.addEventListener('click', closePricePeriodModal);
        }
        
        const cancelPricePeriodBtn = document.getElementById('cancelPricePeriodBtn');
        if (cancelPricePeriodBtn) {
            cancelPricePeriodBtn.addEventListener('click', closePricePeriodModal);
        }
        
        const pricePeriodForm = document.getElementById('pricePeriodForm');
        if (pricePeriodForm) {
            pricePeriodForm.addEventListener('submit', handlePricePeriodSubmit);
        }
        
        // Price period modal - close only via buttons
        
        // Kickback period modal controls
        const addKickbackPeriodBtn = document.getElementById('addKickbackPeriodBtn');
        if (addKickbackPeriodBtn) {
            addKickbackPeriodBtn.addEventListener('click', function() {
                openKickbackPeriodModal(null, currentContractId);
            });
        }
        
        const closeKickbackPeriodModalBtn = document.getElementById('closeKickbackPeriodModal');
        if (closeKickbackPeriodModalBtn) {
            closeKickbackPeriodModalBtn.addEventListener('click', closeKickbackPeriodModal);
        }
        
        const cancelKickbackPeriodBtn = document.getElementById('cancelKickbackPeriodBtn');
        if (cancelKickbackPeriodBtn) {
            cancelKickbackPeriodBtn.addEventListener('click', closeKickbackPeriodModal);
        }
        
        const kickbackPeriodForm = document.getElementById('kickbackPeriodForm');
        if (kickbackPeriodForm) {
            kickbackPeriodForm.addEventListener('submit', handleKickbackPeriodSubmit);
        }
        
        // Kickback type change listener
        const kickbackPeriodType = document.getElementById('kickback_period_type');
        if (kickbackPeriodType) {
            kickbackPeriodType.addEventListener('change', function() {
                const kickbackType = this.value;
                const fixedValueField = document.getElementById('kickback_fixed_value_field');
                const fixedCurrencyField = document.getElementById('kickback_fixed_currency_field');
                const percentageField = document.getElementById('kickback_percentage_field');
                
                if (kickbackType === 'fixed') {
                    if (fixedValueField) fixedValueField.style.display = 'block';
                    if (fixedCurrencyField) fixedCurrencyField.style.display = 'block';
                    if (percentageField) percentageField.style.display = 'none';
                } else if (kickbackType === 'percentage') {
                    if (fixedValueField) fixedValueField.style.display = 'none';
                    if (fixedCurrencyField) fixedCurrencyField.style.display = 'none';
                    if (percentageField) percentageField.style.display = 'block';
                } else {
                    if (fixedValueField) fixedValueField.style.display = 'none';
                    if (fixedCurrencyField) fixedCurrencyField.style.display = 'none';
                    if (percentageField) percentageField.style.display = 'none';
                }
            });
        }
        
        // Transfer period modal controls
        const addTransferPeriodBtn = document.getElementById('addTransferPeriodBtn');
        if (addTransferPeriodBtn) {
            addTransferPeriodBtn.addEventListener('click', function() {
                openTransferPeriodModal(null, currentContractId);
            });
        }
        
        const closeTransferPeriodModalBtn = document.getElementById('closeTransferPeriodModal');
        if (closeTransferPeriodModalBtn) {
            closeTransferPeriodModalBtn.addEventListener('click', closeTransferPeriodModal);
        }
        
        const cancelTransferPeriodBtn = document.getElementById('cancelTransferPeriodBtn');
        if (cancelTransferPeriodBtn) {
            cancelTransferPeriodBtn.addEventListener('click', closeTransferPeriodModal);
        }
        
        const transferPeriodForm = document.getElementById('transferPeriodForm');
        if (transferPeriodForm) {
            transferPeriodForm.addEventListener('submit', handleTransferPeriodSubmit);
        }
        
        // Transfer owner change listener
        const transferOwnerAgencyRadio = document.getElementById('transfer_period_owner_agency');
        const transferOwnerSupplierRadio = document.getElementById('transfer_period_owner_supplier');
        
        if (transferOwnerAgencyRadio) {
            transferOwnerAgencyRadio.addEventListener('change', handleTransferOwnerChange);
        }
        if (transferOwnerSupplierRadio) {
            transferOwnerSupplierRadio.addEventListener('change', handleTransferOwnerChange);
        }
        
        // Transfer pricing method change listener
        const transferPricingFixed = document.getElementById('transfer_pricing_fixed');
        const transferPricingRegional = document.getElementById('transfer_pricing_regional');
        const transferPricingGroup = document.getElementById('transfer_pricing_group');
        
        if (transferPricingFixed) {
            transferPricingFixed.addEventListener('change', handleTransferPricingMethodChange);
        }
        if (transferPricingRegional) {
            transferPricingRegional.addEventListener('change', handleTransferPricingMethodChange);
        }
        if (transferPricingGroup) {
            transferPricingGroup.addEventListener('change', handleTransferPricingMethodChange);
        }
        
        // Fixed price type change listener
        const transferFixedPerPerson = document.getElementById('transfer_fixed_per_person');
        const transferFixedGroup = document.getElementById('transfer_fixed_group');
        
        if (transferFixedPerPerson) {
            transferFixedPerPerson.addEventListener('change', handleTransferFixedPriceTypeChange);
        }
        if (transferFixedGroup) {
            transferFixedGroup.addEventListener('change', handleTransferFixedPriceTypeChange);
        }
        
        // Add fixed group range button
        const addTransferFixedGroupRangeBtn = document.getElementById('addTransferFixedGroupRange');
        if (addTransferFixedGroupRangeBtn) {
            addTransferFixedGroupRangeBtn.addEventListener('click', addTransferFixedGroupRange);
        }
        
        // Regional price type change listener
        const transferRegionalPerPerson = document.getElementById('transfer_regional_per_person');
        const transferRegionalGroup = document.getElementById('transfer_regional_group');
        
        if (transferRegionalPerPerson) {
            transferRegionalPerPerson.addEventListener('change', handleTransferRegionalPriceTypeChange);
        }
        if (transferRegionalGroup) {
            transferRegionalGroup.addEventListener('change', handleTransferRegionalPriceTypeChange);
        }
        
        // Tour departure days checkbox change
        document.querySelectorAll('.departure-day').forEach(checkbox => {
            checkbox.addEventListener('change', updateTourDepartureDays);
        });
        
        // Price period departure days checkbox change
        document.querySelectorAll('.period-departure-day').forEach(checkbox => {
            checkbox.addEventListener('change', updatePricePeriodDepartureDays);
        });
        
        // Price period price type change (regional/fixed)
        document.addEventListener('change', function(e) {
            if (e.target && (e.target.id === 'period_price_type_regional' || e.target.id === 'period_price_type_fixed')) {
                const periodRegionalPricesSection = document.getElementById('period_regional_prices_section');
                const periodFixedPriceSection = document.getElementById('period_fixed_price_section');
                
                if (e.target.value === 'regional' || e.target.id === 'period_price_type_regional') {
                    if (periodRegionalPricesSection) periodRegionalPricesSection.style.display = 'block';
                    if (periodFixedPriceSection) periodFixedPriceSection.style.display = 'none';
                    // Render regional prices if tour regions are loaded
                    if (tourRegions && tourRegions.length > 0) {
                        renderRegionalPricesForPeriod();
                    }
                } else {
                    if (periodRegionalPricesSection) periodRegionalPricesSection.style.display = 'none';
                    if (periodFixedPriceSection) periodFixedPriceSection.style.display = 'block';
                }
            }
        });
    }
    
    function updateTourDepartureDays() {
        const selectedDays = [];
        document.querySelectorAll('.departure-day:checked').forEach(checkbox => {
            selectedDays.push(checkbox.value);
        });
        document.getElementById('tour_departure_days').value = selectedDays.join(',');
    }
    
    function updatePricePeriodDepartureDays() {
        const selectedDays = [];
        document.querySelectorAll('.period-departure-day:checked').forEach(checkbox => {
            selectedDays.push(checkbox.value);
        });
        document.getElementById('period_days_of_week').value = selectedDays.join(',');
    }
    
    // Transfer period helper functions
    function handleTransferOwnerChange() {
        const supplierChecked = document.getElementById('transfer_period_owner_supplier')?.checked;
        const pricingMethodGroup = document.getElementById('transfer_pricing_method_group');
        
        if (supplierChecked) {
            // Supplier selected: Show pricing method
            if (pricingMethodGroup) pricingMethodGroup.style.display = 'block';
        } else {
            // Supplier not selected: Hide pricing method
            if (pricingMethodGroup) pricingMethodGroup.style.display = 'none';
            
            // Hide all pricing containers
            hideAllTransferPricingContainers();
        }
    }
    
    function handleTransferPricingMethodChange() {
        const pricingMethod = document.querySelector('input[name="pricing_method"]:checked')?.value;
        
        const fixedPriceContainer = document.getElementById('transfer_fixed_price_container');
        const regionalPriceContainer = document.getElementById('transfer_regional_price_container');
        
        // Hide all containers first
        if (fixedPriceContainer) fixedPriceContainer.style.display = 'none';
        if (regionalPriceContainer) regionalPriceContainer.style.display = 'none';
        
        // Show selected container
        if (pricingMethod === 'fixed_price' && fixedPriceContainer) {
            fixedPriceContainer.style.display = 'block';
        } else if (pricingMethod === 'regional_price' && regionalPriceContainer) {
            regionalPriceContainer.style.display = 'block';
        }
    }
    
    function handleTransferRegionalPriceTypeChange() {
        const regionalPriceType = document.querySelector('input[name="regional_price_type"]:checked')?.value;
        
        const perPersonContainer = document.getElementById('transfer_regional_per_person_container');
        const groupContainer = document.getElementById('transfer_regional_group_container');
        
        if (regionalPriceType === 'per_person') {
            if (perPersonContainer) perPersonContainer.style.display = 'block';
            if (groupContainer) groupContainer.style.display = 'none';
            // Render regional prices if tour regions are loaded
            if (tourRegions && tourRegions.length > 0) {
                renderTransferRegionalPrices();
            }
        } else if (regionalPriceType === 'group') {
            if (perPersonContainer) perPersonContainer.style.display = 'none';
            if (groupContainer) groupContainer.style.display = 'block';
            // Render regional group ranges
            if (tourRegions && tourRegions.length > 0) {
                renderTransferRegionalGroupRanges();
            }
        }
    }
    
    function handleTransferFixedPriceTypeChange() {
        const fixedPriceType = document.querySelector('input[name="fixed_price_type"]:checked')?.value;
        
        const perPersonContainer = document.getElementById('transfer_fixed_per_person_container');
        const groupContainer = document.getElementById('transfer_fixed_group_container');
        
        if (fixedPriceType === 'per_person') {
            if (perPersonContainer) perPersonContainer.style.display = 'block';
            if (groupContainer) groupContainer.style.display = 'none';
        } else if (fixedPriceType === 'group') {
            if (perPersonContainer) perPersonContainer.style.display = 'none';
            if (groupContainer) groupContainer.style.display = 'block';
        }
    }
    
    function hideAllTransferPricingContainers() {
        const containers = [
            'transfer_fixed_price_container',
            'transfer_regional_price_container',
            'transfer_fixed_per_person_container',
            'transfer_fixed_group_container',
            'transfer_regional_per_person_container',
            'transfer_regional_group_container'
        ];
        containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
    
    let transferFixedGroupRanges = [];
    
    function addTransferFixedGroupRange() {
        const rangeId = Date.now();
        transferFixedGroupRanges.push({
            id: rangeId,
            min_persons: '',
            max_persons: '',
            price: '',
            currency: 'USD'
        });
        renderTransferFixedGroupRanges();
    }
    
    function removeTransferFixedGroupRange(rangeId) {
        transferFixedGroupRanges = transferFixedGroupRanges.filter(r => r.id !== rangeId);
        renderTransferFixedGroupRanges();
    }
    
    function renderTransferFixedGroupRanges() {
        const container = document.getElementById('transfer_fixed_group_ranges_list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (transferFixedGroupRanges.length === 0) {
            container.innerHTML = `<p style="color: #6b7280; padding: 12px; font-size: 14px;">${tContracts.no_group_ranges || 'Click "Add Range" to add group price ranges'}</p>`;
            return;
        }
        
        transferFixedGroupRanges.forEach((range, index) => {
            const rangeItem = document.createElement('div');
            rangeItem.className = 'group-range-item';
            rangeItem.style.cssText = 'padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; background: #f9fafb;';
            rangeItem.innerHTML = `
                <div class="form-row" style="align-items: flex-end;">
                    <div class="form-group">
                        <label>${tContracts.min_persons || 'Min Persons'}</label>
                        <input type="number" class="transfer-fixed-group-min" data-range-id="${range.id}" value="${range.min_persons}" min="1" placeholder="1">
                    </div>
                    <div class="form-group">
                        <label>${tContracts.max_persons || 'Max Persons'}</label>
                        <input type="number" class="transfer-fixed-group-max" data-range-id="${range.id}" value="${range.max_persons}" min="1" placeholder="10">
                    </div>
                    <div class="form-group">
                        <label>${tContracts.price || 'Price'}</label>
                        <input type="number" class="transfer-fixed-group-price" data-range-id="${range.id}" value="${range.price}" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label>${tContracts.currency || 'Currency'}</label>
                        <select class="transfer-fixed-group-currency" data-range-id="${range.id}">
                            <option value="USD" ${range.currency === 'USD' ? 'selected' : ''}>USD</option>
                            <option value="EUR" ${range.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                            <option value="TL" ${range.currency === 'TL' ? 'selected' : ''}>TL</option>
                            <option value="GBP" ${range.currency === 'GBP' ? 'selected' : ''}>GBP</option>
                        </select>
                    </div>
                    <div class="form-group" style="width: auto;">
                        <button type="button" class="btn-icon btn-danger" onclick="removeTransferFixedGroupRange(${range.id})" title="${tContracts.delete || 'Delete'}">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(rangeItem);
        });
    }
    
    function renderTransferRegionalGroupRanges() {
        const container = document.getElementById('transfer_regional_group_container_list');
        if (!container || !tourRegions || tourRegions.length === 0) return;
        
        container.innerHTML = '';
        
        tourRegions.forEach(region => {
            const regionSection = document.createElement('div');
            regionSection.style.cssText = 'margin-bottom: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;';
            
            regionSection.innerHTML = `
                <div class="regional-price-header" style="margin-bottom: 12px;">
                    <h4 style="margin: 0 0 4px 0;">${region.sub_region_name || 'Region'}</h4>
                    <small style="color: #6b7280;">${region.city_name || ''} ${region.city_name ? '-' : ''} ${region.region_name || ''}</small>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="addRegionalGroupRange(${region.sub_region_id})" style="margin-top: 8px;">
                        <span class="material-symbols-rounded" style="font-size: 16px;">add</span>
                        ${tContracts.add_range || 'Add Range'}
                    </button>
                </div>
                <div class="regional-group-ranges-list" data-sub-region-id="${region.sub_region_id}">
                    <!-- Group ranges for this region will appear here -->
                </div>
            `;
            
            container.appendChild(regionSection);
        });
    }
    
    window.removeTransferFixedGroupRange = function(rangeId) {
        removeTransferFixedGroupRange(rangeId);
    };
    
    let regionalGroupRanges = {}; // Object to store ranges per region: {regionId: [ranges]}
    
    window.addRegionalGroupRange = function(subRegionId) {
        if (!regionalGroupRanges[subRegionId]) {
            regionalGroupRanges[subRegionId] = [];
        }
        
        const rangeId = Date.now() + Math.random();
        regionalGroupRanges[subRegionId].push({
            id: rangeId,
            sub_region_id: subRegionId,
            min_persons: '',
            max_persons: '',
            price: '',
            currency: 'USD'
        });
        
        renderRegionalGroupRangesForRegion(subRegionId);
    };
    
    window.removeRegionalGroupRange = function(subRegionId, rangeId) {
        if (regionalGroupRanges[subRegionId]) {
            regionalGroupRanges[subRegionId] = regionalGroupRanges[subRegionId].filter(r => r.id !== rangeId);
            renderRegionalGroupRangesForRegion(subRegionId);
        }
    };
    
    function renderRegionalGroupRangesForRegion(subRegionId) {
        const container = document.querySelector(`.regional-group-ranges-list[data-sub-region-id="${subRegionId}"]`);
        if (!container) return;
        
        container.innerHTML = '';
        
        const ranges = regionalGroupRanges[subRegionId] || [];
        
        if (ranges.length === 0) {
            container.innerHTML = `<p style="color: #6b7280; padding: 8px; font-size: 13px;">${tContracts.no_group_ranges || 'No ranges added yet'}</p>`;
            return;
        }
        
        ranges.forEach(range => {
            const rangeItem = document.createElement('div');
            rangeItem.className = 'group-range-item';
            rangeItem.style.cssText = 'padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; margin-bottom: 6px; background: white;';
            rangeItem.innerHTML = `
                <div class="form-row" style="align-items: flex-end;">
                    <div class="form-group">
                        <label style="font-size: 13px;">${tContracts.min_persons || 'Min'}</label>
                        <input type="number" class="transfer-regional-group-min" data-sub-region-id="${subRegionId}" data-range-id="${range.id}" value="${range.min_persons}" min="1" placeholder="1" style="font-size: 14px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size: 13px;">${tContracts.max_persons || 'Max'}</label>
                        <input type="number" class="transfer-regional-group-max" data-sub-region-id="${subRegionId}" data-range-id="${range.id}" value="${range.max_persons}" min="1" placeholder="10" style="font-size: 14px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size: 13px;">${tContracts.price || 'Price'}</label>
                        <input type="number" class="transfer-regional-group-price" data-sub-region-id="${subRegionId}" data-range-id="${range.id}" value="${range.price}" step="0.01" min="0" placeholder="0.00" style="font-size: 14px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size: 13px;">${tContracts.currency || 'Currency'}</label>
                        <select class="transfer-regional-group-currency" data-sub-region-id="${subRegionId}" data-range-id="${range.id}" style="font-size: 14px;">
                            <option value="USD" ${range.currency === 'USD' ? 'selected' : ''}>USD</option>
                            <option value="EUR" ${range.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                            <option value="TL" ${range.currency === 'TL' ? 'selected' : ''}>TL</option>
                            <option value="GBP" ${range.currency === 'GBP' ? 'selected' : ''}>GBP</option>
                        </select>
                    </div>
                    <div class="form-group" style="width: auto;">
                        <button type="button" class="btn-icon btn-danger" onclick="removeRegionalGroupRange(${subRegionId}, ${range.id})" title="${tContracts.delete || 'Delete'}" style="padding: 6px;">
                            <span class="material-symbols-rounded" style="font-size: 18px;">delete</span>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(rangeItem);
        });
    }
    
    function renderTransferRegionalPrices() {
        const container = document.getElementById('transfer_regional_prices_container');
        if (!container || !tourRegions || tourRegions.length === 0) return;
        
        container.innerHTML = '';
        
        tourRegions.forEach(region => {
            const priceItem = document.createElement('div');
            priceItem.className = 'regional-price-item';
            priceItem.dataset.subRegionId = region.sub_region_id;
            
            priceItem.innerHTML = `
                <div class="regional-price-header">
                    <h4>${region.sub_region_name || 'Region'}</h4>
                    <small>${region.city_name || ''} ${region.city_name ? '-' : ''} ${region.region_name || ''} ${region.region_name ? '-' : ''} ${region.country_name || ''}</small>
                </div>
                <div class="regional-price-row">
                    <div class="regional-price-field">
                        <label>${tContracts.adult_price || 'Adult'}</label>
                        <input type="number" class="transfer-regional-adult-price" data-sub-region-id="${region.sub_region_id}" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="regional-price-field">
                        <label>${tContracts.child_price || 'Child'}</label>
                        <input type="number" class="transfer-regional-child-price" data-sub-region-id="${region.sub_region_id}" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="regional-price-field">
                        <label>${tContracts.infant_price || 'Infant'}</label>
                        <input type="number" class="transfer-regional-infant-price" data-sub-region-id="${region.sub_region_id}" step="0.01" min="0" placeholder="0.00">
                    </div>
                </div>
            `;
            
            container.appendChild(priceItem);
        });
    }
    
    function renderActionRegionalPrices() {
        const container = document.getElementById('action_regional_prices_container');
        if (!container || !tourRegions || tourRegions.length === 0) return;
        
        container.innerHTML = '';
        
        tourRegions.forEach(region => {
            const priceItem = document.createElement('div');
            priceItem.className = 'regional-price-item';
            priceItem.dataset.subRegionId = region.sub_region_id;
            
            priceItem.innerHTML = `
                <div class="regional-price-header">
                    <h4>${region.sub_region_name || 'Region'}</h4>
                    <small>${region.city_name || ''} ${region.city_name ? '-' : ''} ${region.region_name || ''}</small>
                </div>
                <div class="regional-price-row">
                    <div class="regional-price-field">
                        <label>${tContracts.adult_price || 'Adult'}</label>
                        <input type="number" class="action-regional-adult-price" data-sub-region-id="${region.sub_region_id}" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="regional-price-field">
                        <label>${tContracts.child_price || 'Child'}</label>
                        <input type="number" class="action-regional-child-price" data-sub-region-id="${region.sub_region_id}" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="regional-price-field">
                        <label>${tContracts.infant_price || 'Infant'}</label>
                        <input type="number" class="action-regional-infant-price" data-sub-region-id="${region.sub_region_id}" step="0.01" min="0" placeholder="0.00">
                    </div>
                </div>
            `;
            
            container.appendChild(priceItem);
        });
    }
    
    
    // Name uniqueness check functions
    function checkActionName(actionName) {
        if (!actionName || !currentContractId) return;
        
        const actionId = document.getElementById('actionId')?.value || '';
        const url = `${API_BASE}?action=check_action_name&contract_id=${currentContractId}&action_name=${encodeURIComponent(actionName)}&action_id=${actionId}`;
        
        fetch(url)
            .then(response => response.json())
            .then(result => {
                const actionNameInput = document.getElementById('action_name');
                if (result.success && result.exists) {
                    if (actionNameInput) {
                        actionNameInput.style.borderColor = '#ef4444';
                        actionNameInput.style.backgroundColor = '#fee2e2';
                    }
                    showToast('warning', tContracts.action_name_exists || 'This action name already exists for this contract');
                } else {
                    if (actionNameInput) {
                        actionNameInput.style.borderColor = '';
                        actionNameInput.style.backgroundColor = '';
                    }
                }
            })
            .catch(error => {
                console.error('Error checking action name:', error);
            });
    }
    
    function checkPeriodName(periodName, periodType) {
        if (!periodName || !currentContractId) return;
        
        let periodId = '';
        let inputElement = null;
        
        if (periodType === 'price') {
            periodId = document.getElementById('pricePeriodId')?.value || '';
            inputElement = document.getElementById('period_name');
        } else if (periodType === 'kickback') {
            periodId = document.getElementById('kickbackPeriodId')?.value || '';
            inputElement = document.getElementById('kickback_period_name');
        } else if (periodType === 'transfer') {
            periodId = document.getElementById('transferPeriodId')?.value || '';
            inputElement = document.getElementById('transfer_period_name');
        }
        
        const url = `${API_BASE}?action=check_period_name&contract_id=${currentContractId}&period_name=${encodeURIComponent(periodName)}&period_id=${periodId}&period_type=${periodType}`;
        
        fetch(url)
            .then(response => response.json())
            .then(result => {
                if (result.success && result.exists) {
                    if (inputElement) {
                        inputElement.style.borderColor = '#ef4444';
                        inputElement.style.backgroundColor = '#fee2e2';
                    }
                    showToast('warning', tContracts.period_name_exists || 'This period name already exists for this contract');
                } else {
                    if (inputElement) {
                        inputElement.style.borderColor = '';
                        inputElement.style.backgroundColor = '';
                    }
                }
            })
            .catch(error => {
                console.error('Error checking period name:', error);
            });
    }
    
    function loadSubRegions() {
        // Cancel previous request if still pending
        if (activeRequests.has('sub_regions')) {
            const controller = activeRequests.get('sub_regions');
            controller.abort();
        }
        
        const controller = new AbortController();
        activeRequests.set('sub_regions', controller);
        
        fetch(`${API_BASE}?action=sub_regions`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        })
            .then(response => response.json())
            .then(data => {
                activeRequests.delete('sub_regions');
                if (data.success) {
                    subRegions = data.data;
                    const select = document.getElementById('sub_region_id');
                    select.innerHTML = `<option value="">${tCommon.select || 'Select...'}</option>`;
                    data.data.forEach(subRegion => {
                        const option = document.createElement('option');
                        option.value = subRegion.id;
                        option.textContent = subRegion.name;
                        select.appendChild(option);
                    });
                }
            })
            .catch(error => {
                activeRequests.delete('sub_regions');
                if (error.name === 'AbortError') return;
                console.error('Error loading sub regions:', error);
                showToast('error', 'Error loading sub regions');
            });
    }
    
    function loadCurrencies() {
        // Cancel previous request if still pending
        if (activeRequests.has('currencies')) {
            const controller = activeRequests.get('currencies');
            controller.abort();
        }
        
        const controller = new AbortController();
        activeRequests.set('currencies', controller);
        
        fetch(`${API_BASE}?action=currencies`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        })
            .then(response => response.json())
            .then(data => {
                activeRequests.delete('currencies');
                if (data.success) {
                    currencies = data.data;
                    populateCurrencyDropdowns();
                }
            })
            .catch(error => {
                activeRequests.delete('currencies');
                if (error.name === 'AbortError') return;
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
                    select.innerHTML = `<option value="">${tCommon.select || 'Select...'}</option>`;
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
            transferCurrencySelect.innerHTML = `<option value="">${tCommon.select || 'Select...'}</option>`;
            currencies.forEach(currency => {
                const option = document.createElement('option');
                option.value = currency.code;
                option.textContent = `${currency.code}${currency.symbol ? ' (' + currency.symbol + ')' : ''}`;
                transferCurrencySelect.appendChild(option);
            });
        }
        
        const transferCurrencyFixedSelect = document.getElementById('transfer_currency_fixed');
        if (transferCurrencyFixedSelect) {
            transferCurrencyFixedSelect.innerHTML = `<option value="">${tCommon.select || 'Select...'}</option>`;
            currencies.forEach(currency => {
                const option = document.createElement('option');
                option.value = currency.code;
                option.textContent = `${currency.code}${currency.symbol ? ' (' + currency.symbol + ')' : ''}`;
                transferCurrencyFixedSelect.appendChild(option);
            });
        }
    }
    
    function loadMerchants(subRegionId) {
        // Cancel previous request if still pending
        const requestKey = `merchants_${subRegionId}`;
        if (activeRequests.has(requestKey)) {
            const controller = activeRequests.get(requestKey);
            controller.abort();
        }
        
        const controller = new AbortController();
        activeRequests.set(requestKey, controller);
        
        return fetch(`${API_BASE}?action=merchants&sub_region_id=${subRegionId}`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        })
            .then(response => response.json())
            .then(data => {
                activeRequests.delete(requestKey);
                if (data.success) {
                    merchants = data.data;
                    const select = document.getElementById('merchant_id');
                    select.innerHTML = `<option value="">${tCommon.select || 'Select...'}</option>`;
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
                activeRequests.delete(requestKey);
                if (error.name === 'AbortError') return Promise.reject(error);
                console.error('Error loading merchants:', error);
                showToast('error', 'Error loading merchants');
                throw error;
            });
    }
    
    function loadTours(merchantId) {
        // Cancel previous request if still pending
        const requestKey = `tours_${merchantId}`;
        if (activeRequests.has(requestKey)) {
            const controller = activeRequests.get(requestKey);
            controller.abort();
        }
        
        const controller = new AbortController();
        activeRequests.set(requestKey, controller);
        
        return fetch(`${API_BASE}?action=tours&merchant_id=${merchantId}`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        })
            .then(response => response.json())
            .then(data => {
                activeRequests.delete(requestKey);
                if (data.success) {
                    tours = data.data;
                    const select = document.getElementById('tour_id');
                    select.innerHTML = `<option value="">${tCommon.select || 'Select...'}</option>`;
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
                activeRequests.delete(requestKey);
                if (error.name === 'AbortError') return Promise.reject(error);
                console.error('Error loading tours:', error);
                showToast('error', 'Error loading tours');
                throw error;
            });
    }
    
    function loadTourRegions(tourId) {
        // Cancel previous request if still pending
        const requestKey = `tour_regions_${tourId}`;
        if (activeRequests.has(requestKey)) {
            const controller = activeRequests.get(requestKey);
            controller.abort();
        }
        
        const controller = new AbortController();
        activeRequests.set(requestKey, controller);
        
        return fetch(`${API_BASE}?action=tour_regions&tour_id=${tourId}`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        })
            .then(response => response.json())
            .then(data => {
                activeRequests.delete(requestKey);
                if (data.success && data.data && data.data.length > 0) {
                    tourRegions = data.data;
                    // Check price type and show appropriate section (only for period modal)
                    const priceTypeRadio = document.querySelector('input[name="price_type"]:checked');
                    const periodRegionalPricesSection = document.getElementById('period_regional_prices_section');
                    if (priceTypeRadio && priceTypeRadio.value === 'regional' && periodRegionalPricesSection) {
                        renderRegionalPricesForPeriod();
                        periodRegionalPricesSection.style.display = 'block';
                    } else if (periodRegionalPricesSection) {
                        periodRegionalPricesSection.style.display = 'none';
                    }
                } else {
                    hideRegionalPrices();
                }
                return data;
            })
            .catch(error => {
                activeRequests.delete(requestKey);
                if (error.name === 'AbortError') return Promise.reject(error);
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
                        <label>${tContracts.adult_price || 'Adult Price'}</label>
                        <input type="number" class="adult-price-input" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="regional-price-field">
                        <label>${tContracts.child_price || 'Child Price'}</label>
                        <input type="number" class="child-price-input" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="regional-price-field">
                        <label>${tContracts.infant_price || 'Infant Price'}</label>
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
        const periodSection = document.getElementById('period_regional_prices_section');
        if (periodSection) {
            periodSection.style.display = 'none';
        }
        tourRegions = [];
    }
    
    function renderRegionalPricesForPeriod() {
        const container = document.getElementById('period_regional_prices_container');
        if (!container || !tourRegions || tourRegions.length === 0) return;
        
        container.innerHTML = '';
        
        tourRegions.forEach(region => {
            const priceItem = document.createElement('div');
            priceItem.className = 'regional-price-item';
            priceItem.dataset.subRegionId = region.sub_region_id;
            
            priceItem.innerHTML = `
                <div class="regional-price-header">
                    <h4>${region.sub_region_name || region.name || 'Region'}</h4>
                    <small>${region.city_name || ''} ${region.city_name ? '-' : ''} ${region.region_name || ''} ${region.region_name ? '-' : ''} ${region.country_name || ''}</small>
                </div>
                <div class="regional-price-row">
                    <div class="regional-price-field">
                        <label>${tContracts.adult_price || 'Adult Price'}</label>
                        <input type="number" class="period-regional-adult-price" data-sub-region-id="${region.sub_region_id}" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="regional-price-field">
                        <label>${tContracts.child_price || 'Child Price'}</label>
                        <input type="number" class="period-regional-child-price" data-sub-region-id="${region.sub_region_id}" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="regional-price-field">
                        <label>${tContracts.infant_price || 'Infant Price'}</label>
                        <input type="number" class="period-regional-infant-price" data-sub-region-id="${region.sub_region_id}" step="0.01" min="0" placeholder="0.00">
                    </div>
                </div>
            `;
            
            container.appendChild(priceItem);
        });
    }
    
    function loadPeriodRegionalPrices(regionalPrices) {
        if (!regionalPrices || regionalPrices.length === 0) return;
        
        regionalPrices.forEach(priceData => {
            const item = document.querySelector(`.regional-price-item[data-sub-region-id="${priceData.sub_region_id}"]`);
            if (item) {
                const adultInput = item.querySelector('.period-regional-adult-price');
                const childInput = item.querySelector('.period-regional-child-price');
                const infantInput = item.querySelector('.period-regional-infant-price');
                
                if (adultInput && priceData.adult_price) adultInput.value = priceData.adult_price;
                if (childInput && priceData.child_price) childInput.value = priceData.child_price;
                if (infantInput && priceData.infant_price) infantInput.value = priceData.infant_price;
            }
        });
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
        // Cancel previous request if still pending
        if (activeRequests.has('contracts')) {
            const controller = activeRequests.get('contracts');
            controller.abort();
        }
        
        // Show loading state
        showLoading();
        
        // Create new AbortController for this request
        const controller = new AbortController();
        activeRequests.set('contracts', controller);
        
        const startTime = performance.now();
        
        fetch(`${API_BASE}?action=contracts`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const loadTime = performance.now() - startTime;
                activeRequests.delete('contracts');
                
                if (loadTime > 500) {
                    console.log(`⚠️ Slow load detected for contracts: ${loadTime.toFixed(2)}ms`);
                }
                
                if (data.success) {
                    contracts = Array.isArray(data.data) ? data.data : [];
                    renderTable();
                } else {
                    showToast('error', data.message || 'Error loading contracts');
                    showEmptyState();
                }
            })
            .catch(error => {
                activeRequests.delete('contracts');
                
                // Don't show error if request was cancelled
                if (error.name === 'AbortError') {
                    return;
                }
                
                console.error('Error loading contracts:', error);
                showToast('error', 'Error loading contracts');
                showEmptyState();
            });
    }
    
    function showLoading() {
        const tbody = document.getElementById('contractsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 60px 20px;">
                    <div class="loading" role="status" aria-live="polite">
                        <span class="material-symbols-rounded loading-spinner">sync</span>
                        <p>${tContracts.loading_contracts || tCommon.loading || 'Loading contracts...'}</p>
                    </div>
                </td>
            </tr>
        `;
    }
    
    function showEmptyState() {
        const tbody = document.getElementById('contractsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 60px 20px;">
                    <div class="empty-state">
                        <span class="material-symbols-rounded">description</span>
                        <h3>${tContracts.no_contracts || 'No contracts found'}</h3>
                        <p>${tContracts.add_contract || 'Add a new contract to get started'}</p>
                    </div>
                </td>
            </tr>
        `;
    }
    
    function renderTable() {
        const tbody = document.getElementById('contractsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (contracts.length === 0) {
            showEmptyState();
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
            infoBtn.title = tContracts.summary || 'Contract Summary';
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
        const transferOwnerAgencyReset = document.getElementById('transfer_owner_agency');
        const transferOwnerSupplierReset = document.getElementById('transfer_owner_supplier');
        const transferOwnerHiddenReset = document.getElementById('transfer_owner');
        const transferPriceTypeGroup = document.getElementById('transfer_price_type_group');
        const transferPerPersonGroup = document.getElementById('transfer_per_person_price_group');
        const transferFixedPricesGroup = document.getElementById('transfer_fixed_prices_group');
        
        if (transferOwnerAgencyReset) transferOwnerAgencyReset.checked = false;
        if (transferOwnerSupplierReset) transferOwnerSupplierReset.checked = false;
        if (transferOwnerHiddenReset) transferOwnerHiddenReset.value = '';
        if (transferPriceTypeGroup) transferPriceTypeGroup.style.display = 'none';
        if (transferPerPersonGroup) transferPerPersonGroup.style.display = 'none';
        if (transferFixedPricesGroup) transferFixedPricesGroup.style.display = 'none';
        
        // Set title
        if (contractId) {
            title.textContent = (tCommon.edit || 'Edit') + ' ' + (tSidebar.contract || 'Contract');
            loadContractData(contractId);
        } else {
            title.textContent = (tCommon.add || 'Add') + ' ' + (tSidebar.contract || 'Contract');
        }
        
        // Show modal directly (avoid conflict with local function name)
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeContractModal() {
        const modal = document.getElementById('contractModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        currentContractId = null;
    }
    
    function loadContractData(contractId) {
        const contract = contracts.find(c => c.id == contractId);
        if (!contract) {
            console.error('Contract not found:', contractId);
            return;
        }
        
        const contractIdField = document.getElementById('contractId');
        if (contractIdField) contractIdField.value = contract.id;
        const subRegionIdField = document.getElementById('sub_region_id');
        if (subRegionIdField) subRegionIdField.value = contract.sub_region_id;
        
        // Load merchants for this sub region
        loadMerchants(contract.sub_region_id).then(() => {
            const merchantIdField = document.getElementById('merchant_id');
            if (merchantIdField) merchantIdField.value = contract.merchant_id;
            loadTours(contract.merchant_id).then(() => {
                const tourIdField = document.getElementById('tour_id');
                if (tourIdField) tourIdField.value = contract.tour_id;
                // Load tour regions and prices
                if (contract.tour_id) {
                    // Show price periods section
                    const pricePeriodsSection = document.getElementById('price_periods_section');
                    if (pricePeriodsSection) pricePeriodsSection.style.display = 'block';
                    
                    loadTourRegions(contract.tour_id);
                }
            });
            fillMerchantData(contract.merchant_id);
        });
        
        const vatIncludedField = document.getElementById('vat_included');
        if (vatIncludedField) {
            vatIncludedField.value = contract.vat_included ? 'included' : 'excluded';
        }
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
        const kickbackTypeField = document.getElementById('kickback_type');
        if (kickbackTypeField) kickbackTypeField.value = contract.kickback_type || '';
        const kickbackValue = document.getElementById('kickback_value');
        if (kickbackValue) kickbackValue.value = contract.kickback_value || '';
        const currencySelect = document.getElementById('kickback_currency');
        const currencyLabel = document.getElementById('kickback_currency_label');
        if (contract.kickback_type === 'fixed') {
            if (currencySelect) {
                currencySelect.disabled = false;
                currencySelect.style.opacity = '1';
                currencySelect.value = contract.kickback_currency || 'USD';
            }
            if (currencyLabel) currencyLabel.style.opacity = '1';
        } else {
            if (currencySelect) {
                currencySelect.disabled = true;
                currencySelect.style.opacity = '0.5';
                currencySelect.value = '';
            }
            if (currencyLabel) currencyLabel.style.opacity = '0.5';
        }
        // Set radio button for kickback calculation
        if (contract.kickback_per_person) {
            const kickbackPerPerson1 = document.getElementById('kickback_per_person_1');
            if (kickbackPerPerson1) kickbackPerPerson1.checked = true;
        } else {
            const kickbackPerPerson0 = document.getElementById('kickback_per_person_0');
            if (kickbackPerPerson0) kickbackPerPerson0.checked = true;
        }
        const kickbackMinPersons = document.getElementById('kickback_min_persons');
        if (kickbackMinPersons) kickbackMinPersons.value = contract.kickback_min_persons || '';
        const adultAge = document.getElementById('adult_age');
        if (adultAge) adultAge.value = contract.adult_age || '';
        const childAgeRange = document.getElementById('child_age_range');
        if (childAgeRange) childAgeRange.value = contract.child_age_range || '';
        const infantAgeRange = document.getElementById('infant_age_range');
        if (infantAgeRange) infantAgeRange.value = contract.infant_age_range || '';
        const contractCurrency = document.getElementById('contract_currency');
        if (contractCurrency) contractCurrency.value = contract.contract_currency || contract.adult_currency || 'USD';
        const includedContent = document.getElementById('included_content');
        if (includedContent) includedContent.value = contract.included_content || '';
        const startDate = document.getElementById('start_date');
        if (startDate) startDate.value = contract.start_date || '';
        const endDate = document.getElementById('end_date');
        if (endDate) endDate.value = contract.end_date || '';
        
        // Period fields
        const periodTypeSelect = document.getElementById('period_type');
        const periodTypeAdvSelect = document.getElementById('period_type_adv');
        
        if (periodTypeSelect) periodTypeSelect.value = contract.period_type || '';
        if (periodTypeAdvSelect) periodTypeAdvSelect.value = contract.period_type || '';
        
        if (contract.period_type === 'custom') {
            if (document.getElementById('period_value_group')) {
                document.getElementById('period_value_group').style.display = 'flex';
                document.getElementById('period_value').value = contract.period_value || '';
            }
            if (document.getElementById('period_unit_group')) {
                document.getElementById('period_unit_group').style.display = 'flex';
                document.getElementById('period_unit').value = contract.period_unit || '';
            }
            if (document.getElementById('period_value_group_adv')) {
                document.getElementById('period_value_group_adv').style.display = 'flex';
                document.getElementById('period_value_adv').value = contract.period_value || '';
            }
            if (document.getElementById('period_unit_group_adv')) {
                document.getElementById('period_unit_group_adv').style.display = 'flex';
                document.getElementById('period_unit_adv').value = contract.period_unit || '';
            }
        }
        
        // Show actions and price periods sections if contract has ID
        if (contract.id) {
            const actionsSection = document.getElementById('actions_section');
            const pricePeriodsSection = document.getElementById('price_periods_section');
            const kickbackPeriodsSection = document.getElementById('kickback_periods_section');
            const transferPeriodsSection = document.getElementById('transfer_periods_section');
            
            if (actionsSection) actionsSection.style.display = 'block';
            if (pricePeriodsSection) pricePeriodsSection.style.display = 'block';
            if (kickbackPeriodsSection) kickbackPeriodsSection.style.display = 'block';
            if (transferPeriodsSection) transferPeriodsSection.style.display = 'block';
            
            loadContractActions(contract.id);
            loadContractPricePeriods(contract.id);
            loadContractKickbackPeriods(contract.id);
            loadContractTransferPeriods(contract.id);
        }
        
        // Set tour departure days
        if (contract.tour_departure_days) {
            const days = contract.tour_departure_days.split(',');
            document.querySelectorAll('.departure-day').forEach(checkbox => {
                checkbox.checked = days.includes(checkbox.value);
            });
            updateTourDepartureDays();
        }
        
        // Transfer fields - set checkboxes
        const transferOwner = contract.transfer_owner || '';
        const transferOwners = transferOwner.split(',');
        if (transferOwners.includes('agency')) {
            const transferOwnerAgencySet = document.getElementById('transfer_owner_agency');
            if (transferOwnerAgencySet) transferOwnerAgencySet.checked = true;
        }
        if (transferOwners.includes('supplier')) {
            const transferOwnerSupplierSet = document.getElementById('transfer_owner_supplier');
            if (transferOwnerSupplierSet) transferOwnerSupplierSet.checked = true;
            const transferPriceTypeGroupSet = document.getElementById('transfer_price_type_group');
            if (transferPriceTypeGroupSet) transferPriceTypeGroupSet.style.display = 'flex';
            const priceType = contract.transfer_price_type || '';
            const transferPriceType = document.getElementById('transfer_price_type');
            if (transferPriceType) transferPriceType.value = priceType;
            
            if (priceType === 'per_person') {
                const transferPerPersonGroupSet = document.getElementById('transfer_per_person_price_group');
                const transferFixedPricesGroupSet = document.getElementById('transfer_fixed_prices_group');
                if (transferPerPersonGroupSet) transferPerPersonGroupSet.style.display = 'flex';
                if (transferFixedPricesGroupSet) transferFixedPricesGroupSet.style.display = 'none';
                const transferPrice = document.getElementById('transfer_price');
                const transferCurrency = document.getElementById('transfer_currency');
                if (transferPrice) transferPrice.value = contract.transfer_price || '';
                if (transferCurrency) transferCurrency.value = contract.transfer_currency || '';
            } else if (priceType === 'fixed') {
                const transferPerPersonGroupSet2 = document.getElementById('transfer_per_person_price_group');
                const transferFixedPricesGroupSet2 = document.getElementById('transfer_fixed_prices_group');
                if (transferPerPersonGroupSet2) transferPerPersonGroupSet2.style.display = 'none';
                if (transferFixedPricesGroupSet2) transferFixedPricesGroupSet2.style.display = 'block';
                const transferPriceMini = document.getElementById('transfer_price_mini');
                const transferPriceMidi = document.getElementById('transfer_price_midi');
                const transferPriceBus = document.getElementById('transfer_price_bus');
                const transferCurrencyFixed = document.getElementById('transfer_currency_fixed');
                if (transferPriceMini) transferPriceMini.value = contract.transfer_price_mini || '';
                if (transferPriceMidi) transferPriceMidi.value = contract.transfer_price_midi || '';
                if (transferPriceBus) transferPriceBus.value = contract.transfer_price_bus || '';
                if (transferCurrencyFixed) transferCurrencyFixed.value = contract.transfer_currency_fixed || contract.transfer_currency || '';
            }
        }
        // Update hidden field
        const transferOwnerField = document.getElementById('transfer_owner');
        if (transferOwnerField) transferOwnerField.value = transferOwner;
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
        
        // Check if tour is selected
        const tourId = document.getElementById('tour_id')?.value;
        if (!tourId) {
            showToast('error', 'Please select a tour');
            return;
        }
        
        // Price validation is now done at period level
        // Just check if at least one price period exists
        const pricePeriodsSection = document.getElementById('price_periods_section');
        if (pricePeriodsSection && pricePeriodsSection.style.display !== 'none') {
            // Period validation will be done when saving periods
        }
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Convert radio button to boolean
        const kickbackPerPersonRadio = document.querySelector('input[name="kickback_per_person"]:checked');
        data.kickback_per_person = kickbackPerPersonRadio ? kickbackPerPersonRadio.value === '1' : false;
        
        // Price type and currency are now handled at period level
        // Just set defaults
        data.price_type = 'regional';
        data.contract_currency = 'USD';
        
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
        
        // Period fields
        data.period_type = document.getElementById('period_type')?.value || '';
        if (data.period_type === 'custom') {
            data.period_value = document.getElementById('period_value')?.value || '';
            data.period_unit = document.getElementById('period_unit')?.value || '';
        }
        
        // Tour departure days
        data.tour_departure_days = document.getElementById('tour_departure_days')?.value || '';
        
        // Prices are now handled at period level, not contract level
        // No need to collect prices here
        
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
                closeContractModal();
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
                showToast('error', tContracts.no_contracts || 'Contract not found');
            return;
        }
        
        const t = window.Translations || {};
        const tContracts = t.contracts || {};
        
        // Format transfer owner
        let transferOwnerText = '-';
        if (contract.transfer_owner) {
            const owners = contract.transfer_owner.split(',');
            const ownerNames = owners.map(owner => {
                return owner === 'agency' ? (tContracts.agency || 'Agency') : (tContracts.supplier || 'Supplier');
            });
            transferOwnerText = ownerNames.join(', ');
        }
        
        // Format transfer price
        let transferPriceText = '-';
        if (contract.transfer_price_type === 'per_person') {
            transferPriceText = `${contract.transfer_price || '0'} ${contract.transfer_currency || ''} (${tContracts.per_person || 'Per Person'})`;
        } else if (contract.transfer_price_type === 'fixed') {
            const prices = [];
            if (contract.transfer_price_mini) prices.push(`Mini: ${contract.transfer_price_mini}`);
            if (contract.transfer_price_midi) prices.push(`Midi: ${contract.transfer_price_midi}`);
            if (contract.transfer_price_bus) prices.push(`Bus: ${contract.transfer_price_bus}`);
            transferPriceText = prices.length > 0 ? `${prices.join(', ')} ${contract.transfer_currency_fixed || contract.transfer_currency || ''}` : '-';
        }
        
        // Format VAT info
        const vatText = contract.vat_included === 't' || contract.vat_included === true ? 
            (tContracts.vat_included_included || 'VAT Included') : 
            contract.vat_rate ? 
                `${tContracts.vat_included_excluded || 'VAT Excluded'} (${contract.vat_rate}%)` : 
                (tContracts.vat_included_included || 'VAT Included');
        
        // Format kickback calculation
        const kickbackCalcText = contract.kickback_per_person === 't' || contract.kickback_per_person === true ? 
            (tContracts.per_person || 'Per Person') : 
            (tContracts.over_revenue || 'Over Revenue');
        
        // Format pricing info as table
        let pricingHTML = '';
        if (contract.price_type === 'fixed') {
            pricingHTML = `
                <table class="pricing-table">
                    <thead>
                        <tr>
                            <th>${tContracts.age_type || 'Age Type'}</th>
                            <th>${tContracts.price || 'Price'}</th>
                            <th>${tContracts.currency || 'Currency'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${contract.fixed_adult_price ? `
                        <tr>
                            <td>${tContracts.adult || 'Adult'}</td>
                            <td>${contract.fixed_adult_price}</td>
                            <td>${contract.contract_currency || 'USD'}</td>
                        </tr>
                        ` : ''}
                        ${contract.fixed_child_price ? `
                        <tr>
                            <td>${tContracts.child || 'Child'}</td>
                            <td>${contract.fixed_child_price}</td>
                            <td>${contract.contract_currency || 'USD'}</td>
                        </tr>
                        ` : ''}
                        ${contract.fixed_infant_price ? `
                        <tr>
                            <td>${tContracts.infant || 'Infant'}</td>
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
                            <th>${tContracts.sub_region || 'Sub Region'}</th>
                            <th>${tContracts.adult || 'Adult'}</th>
                            <th>${tContracts.child || 'Child'}</th>
                            <th>${tContracts.infant || 'Infant'}</th>
                            <th>${tContracts.currency || 'Currency'}</th>
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
        
        // XSS protection helper
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        const summaryHTML = `
            <div class="contract-summary">
                <div class="summary-section">
                    <h3>${escapeHtml(tContracts.basic_info || 'Basic Information')}</h3>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.sub_region || 'Sub Region')}:</span>
                        <span class="summary-value">${escapeHtml(contract.sub_region_name || '-')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.merchant || 'Merchant')}:</span>
                        <span class="summary-value">${escapeHtml(contract.merchant_name || '-')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.merchant_official_title || 'Official Title')}:</span>
                        <span class="summary-value">${escapeHtml(contract.merchant_official_title || contract.official_title || '-')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.authorized_person || 'Authorized Person')}:</span>
                        <span class="summary-value">${escapeHtml(contract.authorized_person || contract.merchant_authorized_person || '-')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.authorized_email || 'Authorized Email')}:</span>
                        <span class="summary-value">${escapeHtml(contract.authorized_email || contract.merchant_authorized_email || '-')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.tour || 'Tour')}:</span>
                        <span class="summary-value">${escapeHtml(contract.tour_name || '-')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.start_date || 'Start Date')}:</span>
                        <span class="summary-value">${escapeHtml(contract.start_date || '-')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.end_date || 'End Date')}:</span>
                        <span class="summary-value">${escapeHtml(contract.end_date || '-')}</span>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>${escapeHtml(tContracts.contract_dates_vat || 'Contract Dates & VAT')}</h3>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.vat_included || 'VAT Status')}:</span>
                        <span class="summary-value">${escapeHtml(vatText)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.vat_rate || 'VAT Rate')}:</span>
                        <span class="summary-value">${contract.vat_rate ? escapeHtml(`${contract.vat_rate}%`) : '-'}</span>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>${escapeHtml(tContracts.age_currency || 'Age Information')}</h3>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.adult_age || 'Adult Age')}:</span>
                        <span class="summary-value">${escapeHtml(contract.adult_age || '-')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.child_age || 'Child Age')}:</span>
                        <span class="summary-value">${escapeHtml(contract.child_age_range || '-')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.infant_age || 'Infant Age')}:</span>
                        <span class="summary-value">${escapeHtml(contract.infant_age_range || '-')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.currency || 'Currency')}:</span>
                        <span class="summary-value">${escapeHtml(contract.contract_currency || 'USD')}</span>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>${escapeHtml(tContracts.pricing || 'Pricing')}</h3>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.price_type || 'Price Type')}:</span>
                        <span class="summary-value">${escapeHtml(contract.price_type === 'fixed' ? (tContracts.fixed_price || 'Fixed Price') : (tContracts.regional_price || 'Regional Price'))}</span>
                    </div>
                    <div class="summary-row" style="flex-direction: column; align-items: flex-start;">
                        <span class="summary-label" style="margin-bottom: 8px;">${escapeHtml(tContracts.pricing || 'Prices')}:</span>
                        <div style="width: 100%; overflow-x: auto;">${pricingHTML}</div>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>${escapeHtml(tContracts.transfer || 'Transfer Information')}</h3>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.transfer_owner || 'Transfer Owner')}:</span>
                        <span class="summary-value">${escapeHtml(transferOwnerText)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.transfer_price_type || 'Transfer Price Type')}:</span>
                        <span class="summary-value">${escapeHtml(contract.transfer_price_type === 'per_person' ? (tContracts.per_person || 'Per Person') : contract.transfer_price_type === 'fixed' ? (tContracts.fixed_amount || 'Fixed Price') : '-')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.transfer_price || 'Transfer Price')}:</span>
                        <span class="summary-value">${escapeHtml(transferPriceText)}</span>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>${escapeHtml(tContracts.kickback || 'Kickback Information')}</h3>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.kickback_type || 'Kickback Type')}:</span>
                        <span class="summary-value">${escapeHtml(contract.kickback_type === 'fixed' ? (tContracts.fixed_amount || 'Fixed Amount') : contract.kickback_type === 'percentage' ? (tContracts.percentage || 'Percentage') : '-')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.kickback_value || 'Kickback Value')}:</span>
                        <span class="summary-value">${contract.kickback_value ? escapeHtml(`${contract.kickback_value} ${contract.kickback_currency || ''}`) : '-'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.kickback_calculation || 'Calculation Type')}:</span>
                        <span class="summary-value">${escapeHtml(contract.kickback_type ? kickbackCalcText : '-')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">${escapeHtml(tContracts.min_persons || 'Minimum Persons')}:</span>
                        <span class="summary-value">${escapeHtml(contract.kickback_min_persons || '-')}</span>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>${escapeHtml(tContracts.included_content || 'Included Content')}</h3>
                    <div class="summary-row">
                        <span class="summary-value" style="text-align: left; max-width: 100%; white-space: pre-wrap;">${escapeHtml(contract.included_content || '-')}</span>
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
    
    // Action management functions
    let currentActions = [];
    let currentActionId = null;
    
    function openActionModal(actionId = null, contractId = null) {
        currentActionId = actionId;
        const modal = document.getElementById('actionModal');
        const form = document.getElementById('actionForm');
        const title = document.getElementById('actionModalTitle');
        
        if (!modal || !form || !title) return;
        
        form.reset();
        document.getElementById('actionId').value = '';
        document.getElementById('actionContractId').value = contractId || currentContractId || '';
        
        // Hide price containers initially
        const fixedContainer = document.getElementById('action_fixed_price_container');
        const regionalContainer = document.getElementById('action_regional_price_container');
        if (fixedContainer) fixedContainer.style.display = 'none';
        if (regionalContainer) regionalContainer.style.display = 'none';
        
        if (actionId) {
            title.textContent = tContracts.edit_action || 'Edit Action';
            const action = currentActions.find(a => a.id == actionId);
            if (action) {
                document.getElementById('actionId').value = action.id;
                document.getElementById('actionContractId').value = action.contract_id;
                
                // Action name is read-only when editing
                const actionNameField = document.getElementById('action_name');
                if (actionNameField) {
                    actionNameField.value = action.action_name || '';
                    actionNameField.readOnly = true;
                    actionNameField.style.backgroundColor = '#f3f4f6';
                    actionNameField.style.cursor = 'not-allowed';
                }
                
                document.getElementById('action_description').value = action.action_description || '';
                document.getElementById('action_start_date').value = action.action_start_date || '';
                document.getElementById('action_end_date').value = action.action_end_date || '';
                
                // Set price type if exists
                const priceType = action.price_type || '';
                if (priceType === 'fixed') {
                    const fixedRadio = document.getElementById('action_price_type_fixed');
                    if (fixedRadio) {
                        fixedRadio.checked = true;
                        if (fixedContainer) fixedContainer.style.display = 'block';
                    }
                    // Load age ranges
                    const adultAge = document.getElementById('action_adult_age');
                    const childAge = document.getElementById('action_child_age_range');
                    const infantAge = document.getElementById('action_infant_age_range');
                    if (adultAge) adultAge.value = action.adult_age || '';
                    if (childAge) childAge.value = action.child_age_range || '';
                    if (infantAge) infantAge.value = action.infant_age_range || '';
                    
                    // Load fixed prices
                    const adultPrice = document.getElementById('action_adult_price');
                    const childPrice = document.getElementById('action_child_price');
                    const infantPrice = document.getElementById('action_infant_price');
                    const currency = document.getElementById('action_currency');
                    if (adultPrice) adultPrice.value = action.adult_price || '';
                    if (childPrice) childPrice.value = action.child_price || '';
                    if (infantPrice) infantPrice.value = action.infant_price || '';
                    if (currency) currency.value = action.action_currency || 'USD';
                } else if (priceType === 'regional') {
                    const regionalRadio = document.getElementById('action_price_type_regional');
                    if (regionalRadio) {
                        regionalRadio.checked = true;
                        if (regionalContainer) regionalContainer.style.display = 'block';
                    }
                    // Load age ranges
                    const regionalAdultAge = document.getElementById('action_regional_adult_age');
                    const regionalChildAge = document.getElementById('action_regional_child_age');
                    const regionalInfantAge = document.getElementById('action_regional_infant_age');
                    if (regionalAdultAge) regionalAdultAge.value = action.regional_adult_age || '';
                    if (regionalChildAge) regionalChildAge.value = action.regional_child_age || '';
                    if (regionalInfantAge) regionalInfantAge.value = action.regional_infant_age || '';
                    
                    // Render and load regional prices
                    if (tourRegions && tourRegions.length > 0) {
                        renderActionRegionalPrices();
                        if (action.regional_prices && action.regional_prices.length > 0) {
                            setTimeout(() => loadActionRegionalPrices(action.regional_prices), 100);
                        }
                    }
                }
            }
        } else {
            title.textContent = tContracts.add_action || 'Add Action';
            // Action name is editable when creating
            const actionNameField = document.getElementById('action_name');
            if (actionNameField) {
                actionNameField.readOnly = false;
                actionNameField.style.backgroundColor = '';
                actionNameField.style.cursor = '';
            }
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function loadActionRegionalPrices(regionalPrices) {
        if (!regionalPrices || regionalPrices.length === 0) return;
        
        regionalPrices.forEach(priceData => {
            const item = document.querySelector(`.regional-price-item[data-sub-region-id="${priceData.sub_region_id}"]`);
            if (item) {
                const adultInput = item.querySelector('.action-regional-adult-price');
                const childInput = item.querySelector('.action-regional-child-price');
                const infantInput = item.querySelector('.action-regional-infant-price');
                
                if (adultInput && priceData.adult_price) adultInput.value = priceData.adult_price;
                if (childInput && priceData.child_price) childInput.value = priceData.child_price;
                if (infantInput && priceData.infant_price) infantInput.value = priceData.infant_price;
            }
        });
    }
    
    function closeActionModal() {
        const modal = document.getElementById('actionModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        currentActionId = null;
    }
    
    function loadContractActions(contractId) {
        if (!contractId) return;
        
        fetch(`${API_BASE}?action=actions&contract_id=${contractId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentActions = data.data || [];
                    renderActions();
                }
            })
            .catch(error => {
                console.error('Error loading actions:', error);
            });
    }
    
    function renderActions() {
        const container = document.getElementById('actions_list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (currentActions.length === 0) {
            container.innerHTML = `<p style="color: #6b7280; padding: 16px;">${tContracts.no_actions || 'No actions found'}</p>`;
            return;
        }
        
        currentActions.forEach(action => {
            const actionItem = document.createElement('div');
            actionItem.className = 'action-item';
            actionItem.style.cssText = 'padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; background: #f9fafb;';
            
            const startDate = action.action_start_date || '-';
            const endDate = action.action_end_date || '-';
            
            // Format pricing info
            let pricingText = '';
            if (action.price_type === 'fixed') {
                pricingText = `${tContracts.fixed_price || 'Sabit Fiyat'}`;
                if (action.adult_price) {
                    pricingText += `: ${action.adult_price} ${action.action_currency || 'USD'}`;
                }
            } else if (action.price_type === 'regional') {
                pricingText = `${tContracts.regional_price || 'Bölge Bazlı'}`;
            }
            
            actionItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">${action.action_name || '-'}</h4>
                        ${action.action_description ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${action.action_description}</p>` : ''}
                        <div style="display: flex; gap: 16px; font-size: 13px; color: #6b7280;">
                            <span><strong>${tContracts.start_date || 'Start'}:</strong> ${startDate}</span>
                            <span><strong>${tContracts.end_date || 'End'}:</strong> ${endDate}</span>
                            ${pricingText ? `<span><strong>${tContracts.pricing || 'Pricing'}:</strong> ${pricingText}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-icon" onclick="editAction(${action.id}, event)" title="${tContracts.edit_action || 'Edit'}">
                            <span class="material-symbols-rounded">edit</span>
                        </button>
                        <button class="btn-icon btn-danger" onclick="deleteAction(${action.id}, event)" title="${tContracts.delete_action || 'Delete'}">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                </div>
            `;
            
            container.appendChild(actionItem);
        });
    }
    
    function handleActionSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.contract_id = document.getElementById('actionContractId').value;
        
        // Get price type
        const priceType = document.querySelector('input[name="action_price_type"]:checked')?.value;
        data.price_type = priceType || '';
        
        // Collect prices based on type
        if (priceType === 'regional') {
            const regionalPrices = [];
            document.querySelectorAll('.regional-price-item').forEach(item => {
                const subRegionId = item.dataset.subRegionId;
                const adultPrice = item.querySelector('.action-regional-adult-price')?.value;
                const childPrice = item.querySelector('.action-regional-child-price')?.value;
                const infantPrice = item.querySelector('.action-regional-infant-price')?.value;
                
                if (adultPrice || childPrice || infantPrice) {
                    regionalPrices.push({
                        sub_region_id: subRegionId,
                        adult_price: adultPrice || null,
                        child_price: childPrice || null,
                        infant_price: infantPrice || null
                    });
                }
            });
            data.regional_prices = regionalPrices;
        }
        
        const url = `${API_BASE}?action=action`;
        const method = currentActionId ? 'PUT' : 'POST';
        
        if (currentActionId) {
            data.id = currentActionId;
        }
        
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
                showToast('success', result.message || (currentActionId ? tContracts.action_updated : tContracts.action_added));
                closeActionModal();
                loadContractActions(data.contract_id);
            } else {
                showToast('error', result.message || 'Error saving action');
            }
        })
        .catch(error => {
            console.error('Error saving action:', error);
            showToast('error', 'Error saving action');
        });
    }
    
    window.editAction = function(id, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        const action = currentActions.find(a => a.id == id);
        if (action) {
            openActionModal(id, action.contract_id);
        }
    };
    
    window.deleteAction = function(id, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        const tCommon = window.Translations?.common || {};
        const tContracts = window.Translations?.contracts || {};
        const message = tContracts.delete_action_confirm || 'Are you sure you want to delete this action?';
        
        showConfirmDialog(message, function() {
            fetch(`${API_BASE}?action=action&id=${id}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showToast('success', tContracts.action_deleted || 'Action deleted successfully');
                    const contractId = document.getElementById('actionContractId').value || currentContractId;
                    loadContractActions(contractId);
                } else {
                    showToast('error', result.message || 'Error deleting action');
                }
            })
            .catch(error => {
                console.error('Error deleting action:', error);
                showToast('error', 'Error deleting action');
            });
        });
    };
    
    // Price Period management functions
    let currentPricePeriods = [];
    let currentPricePeriodId = null;
    
    function openPricePeriodModal(periodId = null, contractId = null) {
        currentPricePeriodId = periodId;
        const modal = document.getElementById('pricePeriodModal');
        const form = document.getElementById('pricePeriodForm');
        const title = document.getElementById('pricePeriodModalTitle');
        
        if (!modal || !form || !title) return;
        
        form.reset();
        document.getElementById('pricePeriodId').value = '';
        document.getElementById('pricePeriodContractId').value = contractId || currentContractId || '';
        document.querySelectorAll('.period-departure-day').forEach(cb => cb.checked = false);
        document.getElementById('period_days_of_week').value = '';
        
        // Reset price type to regional
        const periodPriceTypeRegional = document.getElementById('period_price_type_regional');
        const periodPriceTypeFixed = document.getElementById('period_price_type_fixed');
        if (periodPriceTypeRegional) periodPriceTypeRegional.checked = true;
        if (periodPriceTypeFixed) periodPriceTypeFixed.checked = false;
        
        // Show regional prices section, hide fixed prices
        const periodRegionalPricesSection = document.getElementById('period_regional_prices_section');
        const periodFixedPriceSection = document.getElementById('period_fixed_price_section');
        if (periodRegionalPricesSection) periodRegionalPricesSection.style.display = 'block';
        if (periodFixedPriceSection) periodFixedPriceSection.style.display = 'none';
        
        // Render regional prices if tour regions are loaded
        if (tourRegions && tourRegions.length > 0) {
            renderRegionalPricesForPeriod();
        }
        
        if (periodId) {
            title.textContent = tContracts.edit_price_period || 'Edit Price Period';
            const period = currentPricePeriods.find(p => p.id == periodId);
            if (period) {
                document.getElementById('pricePeriodId').value = period.id;
                document.getElementById('pricePeriodContractId').value = period.contract_id;
                
                // Period name is read-only when editing
                const periodNameField = document.getElementById('period_name');
                if (periodNameField) {
                    periodNameField.value = period.period_name || '';
                    periodNameField.readOnly = true;
                    periodNameField.style.backgroundColor = '#f3f4f6';
                    periodNameField.style.cursor = 'not-allowed';
                }
                document.getElementById('period_start_date').value = period.start_date || '';
                document.getElementById('period_end_date').value = period.end_date || '';
                document.getElementById('price_period_notes').value = period.notes || '';
                
                // Age fields
                const periodAdultAge = document.getElementById('period_adult_age');
                const periodChildAgeRange = document.getElementById('period_child_age_range');
                const periodInfantAgeRange = document.getElementById('period_infant_age_range');
                if (periodAdultAge) periodAdultAge.value = period.adult_age || '';
                if (periodChildAgeRange) periodChildAgeRange.value = period.child_age_range || '';
                if (periodInfantAgeRange) periodInfantAgeRange.value = period.infant_age_range || '';
                
                // Currency
                document.getElementById('period_currency').value = period.currency || 'USD';
                
                // Set price type
                const priceType = period.price_type || 'regional';
                
                if (priceType === 'fixed') {
                    if (periodPriceTypeFixed) periodPriceTypeFixed.checked = true;
                    if (periodPriceTypeRegional) periodPriceTypeRegional.checked = false;
                    if (periodFixedPriceSection) periodFixedPriceSection.style.display = 'block';
                    if (periodRegionalPricesSection) periodRegionalPricesSection.style.display = 'none';
                    
                    // Set fixed prices
                    document.getElementById('period_adult_price').value = period.adult_price || '';
                    document.getElementById('period_child_price').value = period.child_price || '';
                    document.getElementById('period_infant_price').value = period.infant_price || '';
                } else {
                    if (periodPriceTypeRegional) periodPriceTypeRegional.checked = true;
                    if (periodPriceTypeFixed) periodPriceTypeFixed.checked = false;
                    if (periodRegionalPricesSection) periodRegionalPricesSection.style.display = 'block';
                    if (periodFixedPriceSection) periodFixedPriceSection.style.display = 'none';
                    
                    // Render regional prices first, then load values
                    if (tourRegions && tourRegions.length > 0) {
                        renderRegionalPricesForPeriod();
                        // Load regional prices if available
                        if (period.regional_prices && period.regional_prices.length > 0) {
                            setTimeout(() => loadPeriodRegionalPrices(period.regional_prices), 100);
                        }
                    }
                }
                
                if (period.days_of_week) {
                    const days = period.days_of_week.split(',');
                    document.querySelectorAll('.period-departure-day').forEach(checkbox => {
                        checkbox.checked = days.includes(checkbox.value);
                    });
                    updatePricePeriodDepartureDays();
                }
            }
        } else {
            title.textContent = tContracts.add_price_period || 'Add Price Period';
            // Period name is editable when creating
            const periodNameField = document.getElementById('period_name');
            if (periodNameField) {
                periodNameField.readOnly = false;
                periodNameField.style.backgroundColor = '';
                periodNameField.style.cursor = '';
            }
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closePricePeriodModal() {
        const modal = document.getElementById('pricePeriodModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        currentPricePeriodId = null;
    }
    
    function loadContractPricePeriods(contractId) {
        if (!contractId) return;
        
        fetch(`${API_BASE}?action=price_periods&contract_id=${contractId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentPricePeriods = data.data || [];
                    renderPricePeriods();
                }
            })
            .catch(error => {
                console.error('Error loading price periods:', error);
            });
    }
    
    function renderPricePeriods() {
        const container = document.getElementById('price_periods_list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (currentPricePeriods.length === 0) {
            container.innerHTML = `<p style="color: #6b7280; padding: 16px;">${tContracts.no_price_periods || 'No price periods found'}</p>`;
            return;
        }
        
        // Create table similar to locations.php style
        let html = '<div class="price-periods-table-container" style="background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">';
        html += '<div class="price-periods-table-header" style="padding: 16px 20px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">';
        html += `<div style="font-weight: 600; color: #1f2937;">${tContracts.price_periods || 'Price Periods'}</div>`;
        html += '</div>';
        html += '<div class="table-wrapper" style="overflow-x: auto;">';
        html += '<table class="table" style="width: 100%; border-collapse: collapse;">';
        html += '<thead style="background: #f9fafb;">';
        html += '<tr>';
        html += `<th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 2px solid #e5e7eb;">${tContracts.price_period_name || 'Period Name'}</th>`;
        html += `<th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 2px solid #e5e7eb;">${tContracts.action_start_date || 'Start Date'}</th>`;
        html += `<th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 2px solid #e5e7eb;">${tContracts.action_end_date || 'End Date'}</th>`;
        html += `<th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 2px solid #e5e7eb;">${tContracts.tour_departure_days || 'Departure Days'}</th>`;
        html += `<th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 2px solid #e5e7eb;">${tContracts.adult_price || 'Adult'}</th>`;
        html += `<th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 2px solid #e5e7eb;">${tContracts.actions || 'Actions'}</th>`;
        html += '</tr></thead><tbody>';
        
        currentPricePeriods.forEach(period => {
            const days = period.days_of_week ? period.days_of_week.split(',').map(d => tContracts[d] || d).join(', ') : '-';
            html += '<tr style="border-bottom: 1px solid #e5e7eb; transition: background-color 0.2s;">';
            html += `<td style="padding: 12px 16px; color: #1f2937;">${period.period_name || '-'}</td>`;
            html += `<td style="padding: 12px 16px; color: #1f2937;">${period.start_date || '-'}</td>`;
            html += `<td style="padding: 12px 16px; color: #1f2937;">${period.end_date || '-'}</td>`;
            html += `<td style="padding: 12px 16px; color: #1f2937; font-size: 13px;">${days}</td>`;
            html += `<td style="padding: 12px 16px; color: #1f2937;">${period.adult_price ? parseFloat(period.adult_price).toFixed(2) + ' ' + (period.currency || 'USD') : '-'}</td>`;
            html += '<td style="padding: 12px 16px;">';
            html += '<div style="display: flex; gap: 8px;">';
            html += `<button class="btn-icon" onclick="editPricePeriod(${period.id}, event)" title="${tContracts.edit_price_period || 'Edit'}">`;
            html += '<span class="material-symbols-rounded">edit</span></button>';
            html += `<button class="btn-icon btn-danger" onclick="deletePricePeriod(${period.id}, event)" title="${tContracts.delete_price_period || 'Delete'}">`;
            html += '<span class="material-symbols-rounded">delete</span></button>';
            html += '</div></td></tr>';
        });
        
        html += '</tbody></table></div></div>';
        container.innerHTML = html;
    }
    
    function handlePricePeriodSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.contract_id = document.getElementById('pricePeriodContractId').value;
        data.days_of_week = document.getElementById('period_days_of_week').value;
        
        // Get price type
        const priceTypeRadio = document.querySelector('input[name="price_type"]:checked');
        data.price_type = priceTypeRadio ? priceTypeRadio.value : 'regional';
        
        // Collect regional prices if price type is regional
        if (data.price_type === 'regional') {
            const regionalPrices = [];
            document.querySelectorAll('.regional-price-item').forEach(item => {
                const subRegionId = item.dataset.subRegionId;
                const adultPrice = item.querySelector('.period-regional-adult-price')?.value;
                const childPrice = item.querySelector('.period-regional-child-price')?.value;
                const infantPrice = item.querySelector('.period-regional-infant-price')?.value;
                
                // Only add if at least one price is filled
                if (adultPrice || childPrice || infantPrice) {
                    regionalPrices.push({
                        sub_region_id: subRegionId,
                        adult_price: adultPrice || null,
                        child_price: childPrice || null,
                        infant_price: infantPrice || null,
                        currency: data.currency || 'USD'
                    });
                }
            });
            data.regional_prices = regionalPrices;
        }
        
        const url = `${API_BASE}?action=price_period`;
        const method = currentPricePeriodId ? 'PUT' : 'POST';
        
        if (currentPricePeriodId) {
            data.id = currentPricePeriodId;
        }
        
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
                showToast('success', result.message || (currentPricePeriodId ? tContracts.price_period_updated : tContracts.price_period_added));
                closePricePeriodModal();
                loadContractPricePeriods(data.contract_id);
            } else {
                showToast('error', result.message || 'Error saving price period');
            }
        })
        .catch(error => {
            console.error('Error saving price period:', error);
            showToast('error', 'Error saving price period');
        });
    }
    
    window.editPricePeriod = function(id, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        const period = currentPricePeriods.find(p => p.id == id);
        if (period) {
            openPricePeriodModal(id, period.contract_id);
        }
    };
    
    window.deletePricePeriod = function(id, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        const tCommon = window.Translations?.common || {};
        const tContracts = window.Translations?.contracts || {};
        const message = tContracts.delete_price_period_confirm || 'Are you sure you want to delete this price period?';
        
        showConfirmDialog(message, function() {
            fetch(`${API_BASE}?action=price_period&id=${id}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showToast('success', tContracts.price_period_deleted || 'Price period deleted successfully');
                    const contractId = currentContractId;
                    loadContractPricePeriods(contractId);
                } else {
                    showToast('error', result.message || 'Error deleting price period');
                }
            })
            .catch(error => {
                console.error('Error deleting price period:', error);
                showToast('error', 'Error deleting price period');
            });
        });
    };
    
    // Kickback Period management
    let currentKickbackPeriods = [];
    let currentKickbackPeriodId = null;
    
    function openKickbackPeriodModal(periodId = null, contractId = null) {
        currentKickbackPeriodId = periodId;
        const modal = document.getElementById('kickbackPeriodModal');
        const form = document.getElementById('kickbackPeriodForm');
        const title = document.getElementById('kickbackPeriodModalTitle');
        
        if (!modal || !form || !title) return;
        
        form.reset();
        document.getElementById('kickbackPeriodId').value = '';
        document.getElementById('kickbackPeriodContractId').value = contractId || currentContractId || '';
        
        // Reset form fields
        const kickbackPerPerson0 = document.getElementById('kickback_per_person_0');
        const kickbackPerPerson1 = document.getElementById('kickback_per_person_1');
        if (kickbackPerPerson1) kickbackPerPerson1.checked = true;
        if (kickbackPerPerson0) kickbackPerPerson0.checked = false;
        
        // Hide all kickback fields initially
        const fixedValueField = document.getElementById('kickback_fixed_value_field');
        const fixedCurrencyField = document.getElementById('kickback_fixed_currency_field');
        const percentageField = document.getElementById('kickback_percentage_field');
        if (fixedValueField) fixedValueField.style.display = 'none';
        if (fixedCurrencyField) fixedCurrencyField.style.display = 'none';
        if (percentageField) percentageField.style.display = 'none';
        
        if (periodId) {
            title.textContent = tContracts.edit_kickback_period || 'Edit Kickback Period';
            const period = currentKickbackPeriods.find(p => p.id == periodId);
            if (period) {
                document.getElementById('kickbackPeriodId').value = period.id;
                document.getElementById('kickbackPeriodContractId').value = period.contract_id;
                
                // Period name is read-only when editing
                const periodNameField = document.getElementById('kickback_period_name');
                if (periodNameField) {
                    periodNameField.value = period.period_name || '';
                    periodNameField.readOnly = true;
                    periodNameField.style.backgroundColor = '#f3f4f6';
                    periodNameField.style.cursor = 'not-allowed';
                }
                document.getElementById('kickback_period_start_date').value = period.start_date || '';
                document.getElementById('kickback_period_end_date').value = period.end_date || '';
                
                // Set kickback calculation FIRST (before type)
                // PostgreSQL returns boolean as 't' or 'f' string, or true/false
                const perPerson = period.kickback_per_person;
                if (perPerson === 't' || perPerson === true || perPerson === 'true' || perPerson == 1 || perPerson === '1') {
                    if (kickbackPerPerson1) kickbackPerPerson1.checked = true;
                    if (kickbackPerPerson0) kickbackPerPerson0.checked = false;
                } else {
                    if (kickbackPerPerson0) kickbackPerPerson0.checked = true;
                    if (kickbackPerPerson1) kickbackPerPerson1.checked = false;
                }
                document.getElementById('kickback_period_min_persons').value = period.kickback_min_persons || '';
                
                // Set kickback type and show appropriate fields
                const kickbackType = period.kickback_type || '';
                document.getElementById('kickback_period_type').value = kickbackType;
                
                if (kickbackType === 'fixed') {
                    if (fixedValueField) fixedValueField.style.display = 'block';
                    if (fixedCurrencyField) fixedCurrencyField.style.display = 'block';
                    document.getElementById('kickback_period_value').value = period.kickback_value || '';
                    document.getElementById('kickback_period_currency').value = period.kickback_currency || 'USD';
                } else if (kickbackType === 'percentage') {
                    if (percentageField) percentageField.style.display = 'block';
                    const percentageInput = document.getElementById('kickback_period_percentage');
                    if (percentageInput) percentageInput.value = period.kickback_value || '';
                }
            }
        } else {
            title.textContent = tContracts.add_kickback_period || 'Add Kickback Period';
            // Period name is editable when creating
            const periodNameField = document.getElementById('kickback_period_name');
            if (periodNameField) {
                periodNameField.readOnly = false;
                periodNameField.style.backgroundColor = '';
                periodNameField.style.cursor = '';
            }
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeKickbackPeriodModal() {
        const modal = document.getElementById('kickbackPeriodModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        currentKickbackPeriodId = null;
    }
    
    function loadContractKickbackPeriods(contractId) {
        if (!contractId) return;
        
        fetch(`${API_BASE}?action=kickback_periods&contract_id=${contractId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentKickbackPeriods = data.data || [];
                    renderKickbackPeriods();
                }
            })
            .catch(error => {
                console.error('Error loading kickback periods:', error);
            });
    }
    
    function renderKickbackPeriods() {
        const container = document.getElementById('kickback_periods_list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (currentKickbackPeriods.length === 0) {
            container.innerHTML = `<p style="color: #6b7280; padding: 16px;">${tContracts.no_kickback_periods || 'No kickback periods found'}</p>`;
            return;
        }
        
        currentKickbackPeriods.forEach(period => {
            const item = document.createElement('div');
            item.className = 'period-item';
            item.style.cssText = 'padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; background: #f9fafb;';
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">${period.period_name || '-'}</h4>
                        <div style="display: flex; gap: 16px; font-size: 13px; color: #6b7280;">
                            <span>${tContracts.start_date || 'Start'}: ${period.start_date || '-'}</span>
                            <span>${tContracts.end_date || 'End'}: ${period.end_date || '-'}</span>
                            ${period.kickback_type ? `<span>Type: ${period.kickback_type}</span>` : ''}
                            ${period.kickback_value ? `<span>Value: ${period.kickback_value} ${period.kickback_currency || 'USD'}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-icon" onclick="editKickbackPeriod(${period.id}, event)" title="${tContracts.edit || 'Edit'}">
                            <span class="material-symbols-rounded">edit</span>
                        </button>
                        <button class="btn-icon" onclick="deleteKickbackPeriod(${period.id}, event)" title="${tContracts.delete || 'Delete'}">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(item);
        });
    }
    
    function handleKickbackPeriodSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.contract_id = document.getElementById('kickbackPeriodContractId').value;
        data.kickback_per_person = formData.get('kickback_per_person') === '1';
        
        // Get kickback value based on type
        const kickbackType = document.getElementById('kickback_period_type').value;
        if (kickbackType === 'percentage') {
            // For percentage, get value from percentage field
            const percentageValue = document.getElementById('kickback_period_percentage')?.value;
            data.kickback_value = percentageValue || '';
            delete data.kickback_currency; // No currency for percentage
        } else if (kickbackType === 'fixed') {
            // For fixed, value and currency already in formData
            // kickback_value and kickback_currency
        }
        
        const periodId = document.getElementById('kickbackPeriodId').value;
        const url = `${API_BASE}?action=kickback_period`;
        const method = periodId ? 'PUT' : 'POST';
        
        if (periodId) {
            data.id = periodId;
        }
        
        fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showToast('success', periodId ? (tContracts.kickback_period_updated || 'Kickback period updated') : (tContracts.kickback_period_added || 'Kickback period created'));
                closeKickbackPeriodModal();
                loadContractKickbackPeriods(data.contract_id);
            } else {
                showToast('error', result.message || (tCommon.save_failed || 'Error saving kickback period'));
            }
        })
        .catch(error => {
            showToast('error', tCommon.an_error_occurred || 'An error occurred');
        });
    }
    
    window.editKickbackPeriod = function(id, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        const period = currentKickbackPeriods.find(p => p.id == id);
        if (period) {
            openKickbackPeriodModal(id, period.contract_id);
        }
    };
    
    window.deleteKickbackPeriod = function(id, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        showConfirmDialog('Are you sure you want to delete this kickback period?', function() {
            fetch(`${API_BASE}?action=kickback_period&id=${id}`, {method: 'DELETE'})
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showToast('success', 'Kickback period deleted successfully');
                    loadContractKickbackPeriods(currentContractId);
                } else {
                    showToast('error', result.message || 'Error deleting kickback period');
                }
            })
            .catch(error => {
                console.error('Error deleting kickback period:', error);
                showToast('error', 'Error deleting kickback period');
            });
        });
    };
    
    // Transfer Period management
    let currentTransferPeriods = [];
    let currentTransferPeriodId = null;
    
    function openTransferPeriodModal(periodId = null, contractId = null) {
        currentTransferPeriodId = periodId;
        const modal = document.getElementById('transferPeriodModal');
        const form = document.getElementById('transferPeriodForm');
        const title = document.getElementById('transferPeriodModalTitle');
        
        if (!modal || !form || !title) return;
        
        form.reset();
        document.getElementById('transferPeriodId').value = '';
        document.getElementById('transferPeriodContractId').value = contractId || currentContractId || '';
        
        // Reset group ranges
        transferFixedGroupRanges = [];
        regionalGroupRanges = {};
        
        // Reset transfer owner checkboxes
        const transferOwnerAgency = document.getElementById('transfer_period_owner_agency');
        const transferOwnerSupplier = document.getElementById('transfer_period_owner_supplier');
        if (transferOwnerAgency) transferOwnerAgency.checked = false;
        if (transferOwnerSupplier) transferOwnerSupplier.checked = false;
        
        // Hide all sections initially
        const dateRangeGroup = document.getElementById('transfer_period_date_range');
        const pricingMethodGroup = document.getElementById('transfer_pricing_method_group');
        if (dateRangeGroup) dateRangeGroup.style.display = 'none';
        if (pricingMethodGroup) pricingMethodGroup.style.display = 'none';
        hideAllTransferPricingContainers();
        
        if (periodId) {
            title.textContent = tContracts.edit_transfer_period || 'Edit Transfer Period';
            const period = currentTransferPeriods.find(p => p.id == periodId);
            if (period) {
                document.getElementById('transferPeriodId').value = period.id;
                document.getElementById('transferPeriodContractId').value = period.contract_id;
                
                // Period name is read-only when editing
                const periodNameField = document.getElementById('transfer_period_name');
                if (periodNameField) {
                    periodNameField.value = period.period_name || '';
                    periodNameField.readOnly = true;
                    periodNameField.style.backgroundColor = '#f3f4f6';
                    periodNameField.style.cursor = 'not-allowed';
                }
                
                // Set transfer owner (can be comma-separated: agency,supplier)
                const transferOwners = (period.transfer_owner || '').split(',');
                if (transferOwnerAgency) transferOwnerAgency.checked = transferOwners.includes('agency');
                if (transferOwnerSupplier) transferOwnerSupplier.checked = transferOwners.includes('supplier');
                
                // Show pricing if supplier is selected
                if (transferOwners.includes('supplier')) {
                    if (pricingMethodGroup) pricingMethodGroup.style.display = 'block';
                    
                    // Set dates
                    document.getElementById('transfer_period_start_date').value = period.start_date || '';
                    document.getElementById('transfer_period_end_date').value = period.end_date || '';
                    
                    // Set pricing method
                    const pricingMethod = period.pricing_method || 'fixed_price';
                    const pricingRadio = document.getElementById('transfer_pricing_' + pricingMethod.replace('_price', ''));
                    if (pricingRadio) {
                        pricingRadio.checked = true;
                        // Trigger change to show appropriate container
                        setTimeout(() => handleTransferPricingMethodChange(), 50);
                    }
                    
                    // Load pricing data based on method
                    if (pricingMethod === 'fixed_price') {
                        const fixedPriceType = period.fixed_price_type || 'per_person';
                        
                        // Wait for container to be visible, then set radio
                        setTimeout(() => {
                            const fixedTypeRadio = document.getElementById('transfer_fixed_' + (fixedPriceType === 'per_person' ? 'per_person' : 'group'));
                            if (fixedTypeRadio) {
                                fixedTypeRadio.checked = true;
                                handleTransferFixedPriceTypeChange();
                            }
                        }, 100);
                        
                        // Load data after containers are ready
                        setTimeout(() => {
                            if (fixedPriceType === 'per_person') {
                                // Load age-based prices
                                const adultAge = document.getElementById('transfer_adult_age');
                                const childAge = document.getElementById('transfer_child_age_range');
                                const infantAge = document.getElementById('transfer_infant_age_range');
                                const adultPrice = document.getElementById('transfer_adult_price');
                                const childPrice = document.getElementById('transfer_child_price');
                                const infantPrice = document.getElementById('transfer_infant_price');
                                const currency = document.getElementById('transfer_fixed_currency');
                                
                                if (adultAge) adultAge.value = period.adult_age || '';
                                if (childAge) childAge.value = period.child_age_range || '';
                                if (infantAge) infantAge.value = period.infant_age_range || '';
                                if (adultPrice) adultPrice.value = period.adult_price || '';
                                if (childPrice) childPrice.value = period.child_price || '';
                                if (infantPrice) infantPrice.value = period.infant_price || '';
                                if (currency) currency.value = period.fixed_currency || 'USD';
                            } else if (fixedPriceType === 'group') {
                                // Load fixed group ranges
                                if (period.fixed_group_ranges && period.fixed_group_ranges.length > 0) {
                                    transferFixedGroupRanges = period.fixed_group_ranges.map(r => ({
                                        id: Date.now() + Math.random(),
                                        min_persons: r.min_persons,
                                        max_persons: r.max_persons,
                                        price: r.price,
                                        currency: r.currency
                                    }));
                                    renderTransferFixedGroupRanges();
                                }
                            }
                        }, 200);
                    } else if (pricingMethod === 'regional_price') {
                        // Load regional price data
                        const regionalPriceType = period.regional_price_type || 'per_person';
                        const regionalPerPersonRadio = document.getElementById('transfer_regional_per_person');
                        const regionalGroupRadio = document.getElementById('transfer_regional_group');
                        
                        if (regionalPriceType === 'per_person' && regionalPerPersonRadio) {
                            regionalPerPersonRadio.checked = true;
                            handleTransferRegionalPriceTypeChange();
                            
                            const regionalAdultAge = document.getElementById('transfer_regional_adult_age');
                            const regionalChildAge = document.getElementById('transfer_regional_child_age');
                            const regionalInfantAge = document.getElementById('transfer_regional_infant_age');
                            
                            if (regionalAdultAge) regionalAdultAge.value = period.regional_adult_age || '';
                            if (regionalChildAge) regionalChildAge.value = period.regional_child_age || '';
                            if (regionalInfantAge) regionalInfantAge.value = period.regional_infant_age || '';
                            
                            if (tourRegions && tourRegions.length > 0) {
                                renderTransferRegionalPrices();
                                if (period.regional_prices && period.regional_prices.length > 0) {
                                    setTimeout(() => loadTransferRegionalPrices(period.regional_prices), 100);
                                }
                            }
                        } else if (regionalPriceType === 'group' && regionalGroupRadio) {
                            regionalGroupRadio.checked = true;
                            handleTransferRegionalPriceTypeChange();
                            
                            // Load regional group ranges
                            if (period.regional_group_ranges && period.regional_group_ranges.length > 0) {
                                regionalGroupRanges = {};
                                period.regional_group_ranges.forEach(range => {
                                    const subRegionId = range.sub_region_id;
                                    if (!regionalGroupRanges[subRegionId]) {
                                        regionalGroupRanges[subRegionId] = [];
                                    }
                                    regionalGroupRanges[subRegionId].push({
                                        id: Date.now() + Math.random(),
                                        sub_region_id: subRegionId,
                                        min_persons: range.min_persons,
                                        max_persons: range.max_persons,
                                        price: range.price,
                                        currency: range.currency
                                    });
                                });
                                
                                // Render ranges for each region
                                Object.keys(regionalGroupRanges).forEach(subRegionId => {
                                    renderRegionalGroupRangesForRegion(subRegionId);
                                });
                            }
                        }
                    }
                }
            }
        } else {
            title.textContent = tContracts.add_transfer_period || 'Add Transfer Period';
            // Period name is editable when creating
            const periodNameField = document.getElementById('transfer_period_name');
            if (periodNameField) {
                periodNameField.readOnly = false;
                periodNameField.style.backgroundColor = '';
                periodNameField.style.cursor = '';
            }
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function loadTransferRegionalPrices(regionalPrices) {
        if (!regionalPrices || regionalPrices.length === 0) return;
        
        regionalPrices.forEach(priceData => {
            const item = document.querySelector(`.regional-price-item[data-sub-region-id="${priceData.sub_region_id}"]`);
            if (item) {
                const adultInput = item.querySelector('.transfer-regional-adult-price');
                const childInput = item.querySelector('.transfer-regional-child-price');
                const infantInput = item.querySelector('.transfer-regional-infant-price');
                
                if (adultInput && priceData.adult_price) adultInput.value = priceData.adult_price;
                if (childInput && priceData.child_price) childInput.value = priceData.child_price;
                if (infantInput && priceData.infant_price) infantInput.value = priceData.infant_price;
            }
        });
    }
    
    function closeTransferPeriodModal() {
        const modal = document.getElementById('transferPeriodModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        currentTransferPeriodId = null;
    }
    
    function loadContractTransferPeriods(contractId) {
        if (!contractId) return;
        
        fetch(`${API_BASE}?action=transfer_periods&contract_id=${contractId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentTransferPeriods = data.data || [];
                    renderTransferPeriods();
                }
            })
            .catch(error => {
                console.error('Error loading transfer periods:', error);
            });
    }
    
    function renderTransferPeriods() {
        const container = document.getElementById('transfer_periods_list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (currentTransferPeriods.length === 0) {
            container.innerHTML = `<p style="color: #6b7280; padding: 16px;">${tContracts.no_transfer_periods || 'No transfer periods found'}</p>`;
            return;
        }
        
        currentTransferPeriods.forEach(period => {
            const item = document.createElement('div');
            item.className = 'period-item';
            item.style.cssText = 'padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; background: #f9fafb;';
            
            // Format transfer owners
            const owners = (period.transfer_owner || '').split(',').filter(o => o);
            const ownersText = owners.map(o => o === 'agency' ? (tContracts.agency || 'Acente') : (tContracts.supplier || 'Tedarikçi')).join(' + ');
            
            // Format pricing method
            let pricingText = '';
            if (owners.includes('supplier')) {
                const method = period.pricing_method || 'fixed_price';
                pricingText = method === 'fixed_price' ? (tContracts.fixed_price || 'Sabit Fiyat') : (tContracts.regional_price || 'Bölge Bazlı');
            }
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">${period.period_name || '-'}</h4>
                        <div style="display: flex; gap: 16px; font-size: 13px; color: #6b7280;">
                            ${period.start_date ? `<span><strong>${tContracts.start_date || 'Start'}:</strong> ${period.start_date}</span>` : ''}
                            ${period.end_date ? `<span><strong>${tContracts.end_date || 'End'}:</strong> ${period.end_date}</span>` : ''}
                            <span><strong>${tContracts.transfer_owner || 'Transfer Kimde'}:</strong> ${ownersText || '-'}</span>
                            ${pricingText ? `<span><strong>${tContracts.pricing_method || 'Yöntem'}:</strong> ${pricingText}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-icon" onclick="editTransferPeriod(${period.id}, event)" title="${tContracts.edit || 'Edit'}">
                            <span class="material-symbols-rounded">edit</span>
                        </button>
                        <button class="btn-icon" onclick="deleteTransferPeriod(${period.id}, event)" title="${tContracts.delete || 'Delete'}">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(item);
        });
    }
    
    function handleTransferPeriodSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.contract_id = document.getElementById('transferPeriodContractId').value;
        
        // Validate dates
        const startDate = document.getElementById('transfer_period_start_date').value;
        const endDate = document.getElementById('transfer_period_end_date').value;
        
        if (!startDate || !endDate) {
            showToast('error', tContracts.date_required || 'Start date and end date are required');
            return;
        }
        
        if (endDate < startDate) {
            showToast('error', tContracts.end_date_after_start || 'End date must be after start date');
            return;
        }
        
        // Get transfer owner (can be both)
        const transferOwners = [];
        const agencyChecked = document.getElementById('transfer_period_owner_agency')?.checked;
        const supplierChecked = document.getElementById('transfer_period_owner_supplier')?.checked;
        
        if (!agencyChecked && !supplierChecked) {
            showToast('error', tContracts.transfer_owner_required || 'Please select at least one transfer owner');
            return;
        }
        
        if (agencyChecked) transferOwners.push('agency');
        if (supplierChecked) transferOwners.push('supplier');
        
        data.transfer_owner = transferOwners.join(',');
        
        if (supplierChecked) {
            // Get pricing method
            const pricingMethod = document.querySelector('input[name="pricing_method"]:checked')?.value;
            data.pricing_method = pricingMethod;
            
            if (pricingMethod === 'fixed_price') {
                // Fixed price
                const fixedPriceType = document.querySelector('input[name="fixed_price_type"]:checked')?.value;
                data.fixed_price_type = fixedPriceType;
                
                if (fixedPriceType === 'per_person') {
                    // Per person with age groups
                    data.adult_age = document.getElementById('transfer_adult_age')?.value || '';
                    data.child_age_range = document.getElementById('transfer_child_age_range')?.value || '';
                    data.infant_age_range = document.getElementById('transfer_infant_age_range')?.value || '';
                    data.adult_price = document.getElementById('transfer_adult_price')?.value || '';
                    data.child_price = document.getElementById('transfer_child_price')?.value || '';
                    data.infant_price = document.getElementById('transfer_infant_price')?.value || '';
                    data.fixed_currency = document.getElementById('transfer_fixed_currency')?.value || 'USD';
                } else if (fixedPriceType === 'group') {
                    // Group ranges for fixed price
                    const groupRanges = [];
                    document.querySelectorAll('.group-range-item').forEach(item => {
                        const minPersons = item.querySelector('.transfer-fixed-group-min')?.value;
                        const maxPersons = item.querySelector('.transfer-fixed-group-max')?.value;
                        const price = item.querySelector('.transfer-fixed-group-price')?.value;
                        const currency = item.querySelector('.transfer-fixed-group-currency')?.value;
                        
                        if (minPersons && maxPersons && price) {
                            groupRanges.push({
                                min_persons: minPersons,
                                max_persons: maxPersons,
                                price: price,
                                currency: currency
                            });
                        }
                    });
                    data.fixed_group_ranges = groupRanges;
                }
            } else if (pricingMethod === 'regional_price') {
                // Regional prices - check type
                const regionalPriceType = document.querySelector('input[name="regional_price_type"]:checked')?.value;
                data.regional_price_type = regionalPriceType;
                
                if (regionalPriceType === 'per_person') {
                    // Regional per person
                    data.regional_adult_age = document.getElementById('transfer_regional_adult_age')?.value || '';
                    data.regional_child_age = document.getElementById('transfer_regional_child_age')?.value || '';
                    data.regional_infant_age = document.getElementById('transfer_regional_infant_age')?.value || '';
                    
                    const regionalPrices = [];
                    document.querySelectorAll('.regional-price-item').forEach(item => {
                        const subRegionId = item.dataset.subRegionId;
                        const adultPrice = item.querySelector('.transfer-regional-adult-price')?.value;
                        const childPrice = item.querySelector('.transfer-regional-child-price')?.value;
                        const infantPrice = item.querySelector('.transfer-regional-infant-price')?.value;
                        
                        if (adultPrice || childPrice || infantPrice) {
                            regionalPrices.push({
                                sub_region_id: subRegionId,
                                adult_price: adultPrice || null,
                                child_price: childPrice || null,
                                infant_price: infantPrice || null
                            });
                        }
                    });
                    data.regional_prices = regionalPrices;
                } else if (regionalPriceType === 'group') {
                    // Regional group ranges - collect all ranges from all regions
                    const allRegionalGroupRanges = [];
                    document.querySelectorAll('.regional-group-ranges-list').forEach(regionContainer => {
                        const subRegionId = regionContainer.dataset.subRegionId;
                        regionContainer.querySelectorAll('.group-range-item').forEach(item => {
                            const minPersons = item.querySelector('.transfer-regional-group-min')?.value;
                            const maxPersons = item.querySelector('.transfer-regional-group-max')?.value;
                            const price = item.querySelector('.transfer-regional-group-price')?.value;
                            const currency = item.querySelector('.transfer-regional-group-currency')?.value;
                            
                            if (minPersons && maxPersons && price) {
                                allRegionalGroupRanges.push({
                                    sub_region_id: subRegionId,
                                    min_persons: minPersons,
                                    max_persons: maxPersons,
                                    price: price,
                                    currency: currency
                                });
                            }
                        });
                    });
                    data.regional_group_ranges = allRegionalGroupRanges;
                }
            }
        }
        
        const periodId = document.getElementById('transferPeriodId').value;
        if (periodId) {
            data.id = periodId;
        }
        
        const url = `${API_BASE}?action=transfer_period`;
        const method = periodId ? 'PUT' : 'POST';
        
        fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showToast('success', periodId ? (tContracts.transfer_period_updated || 'Transfer period updated') : (tContracts.transfer_period_added || 'Transfer period created'));
                closeTransferPeriodModal();
                loadContractTransferPeriods(data.contract_id);
            } else {
                showToast('error', result.message || (tContracts.save_failed || 'Error saving transfer period'));
            }
        })
        .catch(error => {
            showToast('error', tContracts.an_error_occurred || 'An error occurred');
        });
    }
    
    window.editTransferPeriod = function(id, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        const period = currentTransferPeriods.find(p => p.id == id);
        if (period) {
            openTransferPeriodModal(id, period.contract_id);
        }
    };
    
    window.deleteTransferPeriod = function(id, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        showConfirmDialog('Are you sure you want to delete this transfer period?', function() {
            fetch(`${API_BASE}?action=transfer_period&id=${id}`, {method: 'DELETE'})
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showToast('success', 'Transfer period deleted successfully');
                    loadContractTransferPeriods(currentContractId);
                } else {
                    showToast('error', result.message || 'Error deleting transfer period');
                }
            })
            .catch(error => {
                console.error('Error deleting transfer period:', error);
                showToast('error', 'Error deleting transfer period');
            });
        });
    };
})();

