// Merchant Contract Page JavaScript
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
            // Store CSRF token in page config for easy access
            if (pageConfig.csrfToken) {
                window.pageConfig = window.pageConfig || {};
                window.pageConfig.csrfToken = pageConfig.csrfToken;
            }
        } catch (e) {
            console.error('Failed to parse page config:', e);
        }
    }
    
    const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : 'api/definitions/merchant-contracts.php';
    const MERCHANTS_API_BASE = pageConfig.merchantsApiBase || 'api/definitions/merchants.php';
    const TOURS_API_BASE = pageConfig.toursApiBase || 'api/definitions/tours.php';
    const CURRENCIES_API_BASE = pageConfig.currenciesApiBase || 'api/definitions/currencies.php';
    const LOCATIONS_API_BASE = pageConfig.locationsApiBase || 'api/definitions/locations.php';
    const COSTS_API_BASE = pageConfig.costsApiBase || 'api/definitions/costs.php';
    const MERCHANT_ID = pageConfig.merchantId || 0;
    
    let merchantCityId = null; // Store merchant's city ID
    let selectedTourId = null;
    let selectedTourData = null;
    let currenciesList = [];
    let tourRegions = [];
    let costItemsList = [];
    let selectedCostItems = {}; // Store selected cost items: { costId: { cost, periods: [], pricingType: '', fields: {} } }
    let vatRatesList = []; // Store VAT rates: [{ id, category, percentage, vat_rate }, ...]
    let vatRateCounter = 0; // Counter for unique VAT rate IDs
    let vatCategoriesList = []; // Store VAT categories from costs API
    
    // Get translations
    const t = window.Translations || {};
    const tMerchants = t.merchants || {};
    const tCommon = t.common || {};
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        if (MERCHANT_ID <= 0) {
            showToast('error', 'Invalid merchant ID');
            setTimeout(() => {
                window.location.href = pageConfig.basePath + 'app/definitions/merchants.php';
            }, 2000);
            return;
        }
        
        // Load merchant info
        loadMerchantInfo();
        
        // Load existing contracts
        loadExistingContracts();
        
        // Setup refresh button
        const refreshBtn = document.getElementById('refreshContractsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                loadExistingContracts();
            });
        }
        
        // Setup open modal button
        const openModalBtn = document.getElementById('openAddContractModalBtn');
        if (openModalBtn) {
            openModalBtn.addEventListener('click', function() {
                openContractModal();
            });
        }
        
        // Setup modal close buttons
        const closeModalBtn = document.getElementById('closeAddContractModal');
        const cancelBtn = document.getElementById('cancelContractBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeContractModal);
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeContractModal);
        }
        
        // Close modal when clicking outside
        const modal = document.getElementById('addContractModal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeContractModal();
                }
            });
        }
        
        // Load currencies and costs
        loadCurrencies();
        loadCostItems();
        
        // Load VAT categories
        loadVatCategories();
        
        // Setup cost items modal
        setupCostItemsModal();
        
        // Setup dynamic form fields
        setupDynamicFormFields();
        
        // Setup form submission
        const contractForm = document.getElementById('contractForm');
        if (contractForm) {
            contractForm.addEventListener('submit', handleFormSubmit);
        }
    });
    
    // Load merchant information
    async function loadMerchantInfo() {
        try {
            const response = await fetch(`${MERCHANTS_API_BASE}?action=merchant&id=${MERCHANT_ID}`);
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                const merchant = result.data[0];
                displayMerchantInfo(merchant);
            } else {
                showToast('error', result.message || 'Merchant not found');
                setTimeout(() => {
                    window.location.href = pageConfig.basePath + 'app/definitions/merchants.php';
                }, 2000);
            }
        } catch (error) {
            console.error('Error loading merchant info:', error);
            showToast('error', 'Failed to load merchant information');
        }
    }
    
    // Display merchant information
    function displayMerchantInfo(merchant) {
        console.log('Merchant data:', merchant); // Debug log
        console.log('Authorized person:', merchant.authorized_person);
        console.log('Authorized email:', merchant.authorized_email);
        console.log('Authorized phone:', merchant.authorized_phone);
        console.log('Operasyon name:', merchant.operasyon_name);
        console.log('Operasyon email:', merchant.operasyon_email);
        console.log('Operasyon phone:', merchant.operasyon_phone);
        console.log('Official title:', merchant.official_title);
        
        // Get city_id from merchant's sub_region
        // We need to fetch sub_region to get city_id
        if (merchant.sub_region_id) {
            fetchSubRegionCity(merchant.sub_region_id);
        }
        
        // Helper function to safely get value (handles null, undefined, and empty strings)
        const getValue = (value) => {
            if (value === null || value === undefined || value === '') {
                return '-';
            }
            const trimmed = String(value).trim();
            return trimmed !== '' ? trimmed : '-';
        };
        
        const merchantNameEl = document.getElementById('merchantName');
        if (merchantNameEl) {
            merchantNameEl.textContent = getValue(merchant.name);
        }
        
        const merchantOfficialTitleEl = document.getElementById('merchantOfficialTitle');
        if (merchantOfficialTitleEl) {
            merchantOfficialTitleEl.textContent = getValue(merchant.official_title);
        }
        
        // Build region info (Country > Region > City > Sub Region)
        let regionInfo = [];
        if (merchant.country_name) regionInfo.push(merchant.country_name);
        if (merchant.region_name) regionInfo.push(merchant.region_name);
        if (merchant.city_name) regionInfo.push(merchant.city_name);
        if (merchant.sub_region_name) regionInfo.push(merchant.sub_region_name);
        const merchantRegionEl = document.getElementById('merchantRegion');
        if (merchantRegionEl) {
            merchantRegionEl.textContent = regionInfo.length > 0 ? regionInfo.join(' > ') : '-';
        }
        
        // Authorized person info
        const authorizedPerson = document.getElementById('merchantAuthorizedPerson');
        if (authorizedPerson) {
            authorizedPerson.textContent = getValue(merchant.authorized_person);
        }
        
        const authorizedEmail = document.getElementById('merchantAuthorizedEmail');
        if (authorizedEmail) {
            authorizedEmail.textContent = getValue(merchant.authorized_email);
        }
        
        const authorizedPhone = document.getElementById('merchantAuthorizedPhone');
        if (authorizedPhone) {
            authorizedPhone.textContent = getValue(merchant.authorized_phone);
        }
        
        // Operasyon info
        const operasyonName = document.getElementById('merchantOperasyonName');
        if (operasyonName) {
            operasyonName.textContent = getValue(merchant.operasyon_name);
        }
        
        const operasyonEmail = document.getElementById('merchantOperasyonEmail');
        if (operasyonEmail) {
            operasyonEmail.textContent = getValue(merchant.operasyon_email);
        }
        
        const operasyonPhone = document.getElementById('merchantOperasyonPhone');
        if (operasyonPhone) {
            operasyonPhone.textContent = getValue(merchant.operasyon_phone);
        }
        
        // Get city_id from merchant data (now included in API response)
        if (merchant.city_id) {
            merchantCityId = parseInt(merchant.city_id);
            loadToursByCity(merchantCityId);
        } else if (merchant.sub_region_id) {
            // Fallback: fetch from sub_region
            fetchSubRegionCity(merchant.sub_region_id);
        }
    }
    
    // Fetch sub region to get city_id (fallback)
    async function fetchSubRegionCity(subRegionId) {
        try {
            const response = await fetch(`${pageConfig.basePath}api/definitions/locations.php?action=sub_regions`);
            const result = await response.json();
            
            if (result.success && result.data) {
                const subRegion = result.data.find(sr => sr.id == subRegionId);
                if (subRegion && subRegion.city_id) {
                    merchantCityId = parseInt(subRegion.city_id);
                    loadToursByCity(merchantCityId);
                } else {
                    loadAllToursAndFilter();
                }
            } else {
                loadAllToursAndFilter();
            }
        } catch (error) {
            console.error('Error fetching sub region city:', error);
            loadAllToursAndFilter();
        }
    }
    
    // Load all tours and filter by city (fallback)
    async function loadAllToursAndFilter() {
        const tourSelect = document.getElementById('tourId');
        if (!tourSelect) return;
        
        try {
            tourSelect.innerHTML = '<option value="">' + (tCommon.loading || 'Loading tours...') + '</option>';
            
            const response = await fetch(`${TOURS_API_BASE}?action=tours`);
            const result = await response.json();
            
            if (result.success && result.data) {
                // Since we don't have city_id, we'll show all tours for now
                // User should select based on city name
                tourSelect.innerHTML = '<option value="">' + (tCommon.select || 'Select Tour...') + '</option>';
                
                if (result.data.length === 0) {
                    tourSelect.innerHTML += '<option value="" disabled>' + (tMerchants.no_tours_available || 'No tours available') + '</option>';
                } else {
                    result.data.forEach(tour => {
                        const option = document.createElement('option');
                        option.value = tour.id;
                        // Display: City - Sejour Code - Tour Name
                        const cityInfo = tour.city_name ? tour.city_name + ' - ' : '';
                        const codeInfo = tour.sejour_tour_code ? tour.sejour_tour_code + ' - ' : '';
                        option.textContent = cityInfo + codeInfo + (tour.name || 'Unnamed Tour');
                        option.dataset.cityId = tour.city_id || '';
                        tourSelect.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading tours:', error);
            tourSelect.innerHTML = '<option value="">' + (tCommon.error_loading || 'Error loading tours') + '</option>';
        }
    }
    
    // Load tours by city
    async function loadToursByCity(cityId) {
        if (!cityId || cityId <= 0) {
            console.warn('City ID is not available, loading all tours');
            loadAllToursAndFilter();
            return;
        }
        
        const tourSelect = document.getElementById('tourId');
        if (!tourSelect) return;
        
        try {
            tourSelect.innerHTML = '<option value="">' + (tCommon.loading || 'Loading tours...') + '</option>';
            
            const response = await fetch(`${TOURS_API_BASE}?action=tours`);
            const result = await response.json();
            
            if (result.success && result.data) {
                // Filter tours by city_id
                const cityTours = result.data.filter(tour => tour.city_id == cityId);
                
                tourSelect.innerHTML = '<option value="">' + (tCommon.select || 'Select Tour...') + '</option>';
                
                if (cityTours.length === 0) {
                    tourSelect.innerHTML += '<option value="" disabled>' + (tMerchants.no_tours_in_city || 'No tours available for this city') + '</option>';
                } else {
                    cityTours.forEach(tour => {
                        const option = document.createElement('option');
                        option.value = tour.id;
                        // Display: Sejour Code - Tour Name
                        const displayText = (tour.sejour_tour_code ? tour.sejour_tour_code + ' - ' : '') + (tour.name || 'Unnamed Tour');
                        option.textContent = displayText;
                        tourSelect.appendChild(option);
                    });
                }
            } else {
                tourSelect.innerHTML = '<option value="">' + (tCommon.error_loading || 'Error loading tours') + '</option>';
            }
        } catch (error) {
            console.error('Error loading tours:', error);
            tourSelect.innerHTML = '<option value="">' + (tCommon.error_loading || 'Error loading tours') + '</option>';
        }
    }
    
    // Generate contract code (FST-03-******)
    async function generateContractCode() {
        try {
            const response = await window.apiFetch(`${API_BASE}?action=generate_contract_code`, {
                method: 'GET'
            });
            const result = await response.json();
            
            if (result.success && result.contract_code) {
                const contractCodeInput = document.getElementById('contractCode');
                if (contractCodeInput) {
                    contractCodeInput.value = result.contract_code;
                }
            } else {
                console.error('Failed to generate contract code:', result.message);
                showToast('error', result.message || 'Failed to generate contract code');
            }
        } catch (error) {
            console.error('Error generating contract code:', error);
            showToast('error', 'Failed to generate contract code');
        }
    }
    
    // Validate dates (for date range picker)
    function validateDates() {
        const startDateInput = document.getElementById('contract_start_date');
        const endDateInput = document.getElementById('contract_end_date');
        const dateRangeWrapper = document.querySelector('.date-range-wrapper');
        const errorMessage = dateRangeWrapper ? dateRangeWrapper.querySelector('.input-error-message') : null;
        
        if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);
            
            if (startDate > endDate) {
                if (errorMessage) {
                    errorMessage.textContent = 'Start date must be before end date';
                    errorMessage.classList.add('show');
                }
                if (dateRangeWrapper) {
                    dateRangeWrapper.classList.add('error');
                }
                return false;
            } else {
                if (errorMessage) {
                    errorMessage.classList.remove('show');
                }
                if (dateRangeWrapper) {
                    dateRangeWrapper.classList.remove('error');
                }
            }
        }
        
        return true;
    }
    
    // Handle form submission
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        
        // Clear previous errors
        if (window.FormValidator) {
            window.FormValidator.clearErrors(form);
        }
        
        // Get date values from hidden inputs
        const startDateInput = document.getElementById('contract_start_date');
        const endDateInput = document.getElementById('contract_end_date');
        
        // Validate that dates are selected
        if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
            const dateRangeWrapper = document.querySelector('.date-range-wrapper');
            const errorMessage = dateRangeWrapper ? dateRangeWrapper.querySelector('.input-error-message') : null;
            if (errorMessage) {
                errorMessage.textContent = 'Please select a date range';
                errorMessage.classList.add('show');
            }
            if (dateRangeWrapper) {
                dateRangeWrapper.classList.add('error');
            }
            return;
        }
        
        // Validate dates
        if (!validateDates()) {
            return;
        }
        
        // Validate VAT total percentage is 100
        const hasVat = document.getElementById('hasVat')?.value;
        if (hasVat === 'yes') {
            let total = 0;
            vatRatesList.forEach(vat => {
                const percentage = parseFloat(vat.percentage) || 0;
                total += percentage;
            });
            
            if (Math.abs(total - 100) > 0.01) {
                showToast('error', tMerchants.vat_total_must_be_100 || 'Toplam yüzde %100 olmalıdır');
                const totalError = document.getElementById('vatTotalError');
                if (totalError) {
                    totalError.style.display = '';
                }
                return;
            }
        }
        
        // Validate form using FormValidator
        if (window.FormValidator) {
            const isValid = window.FormValidator.validate(form, {
                scrollToFirstError: true,
                focusFirstError: true
            });
            
            if (!isValid) {
                return;
            }
        }
        
        // Show loading state
        const submitBtn = document.getElementById('submitContractBtn');
        const originalText = submitBtn ? submitBtn.innerHTML : null;
        const originalDisabled = submitBtn ? submitBtn.disabled : null;
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-rounded" style="animation: spin 1s linear infinite;">sync</span> ' + (tCommon.saving || 'Saving...');
        }
        
        try {
            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Collect cost items data from form
            const costItemsData = {};
            Object.keys(selectedCostItems).forEach(costId => {
                const item = selectedCostItems[costId];
                const costData = {
                    cost_id: costId,
                    pricing_type: item.pricingType,
                    amount_type: item.amountType,
                    fields: {}
                };
                
                if (item.pricingType === 'fixed') {
                    const amountInput = document.querySelector(`input[name="cost_fixed_amount[${costId}]"]`);
                    const currencySelect = document.querySelector(`select[name="cost_fixed_currency[${costId}]"]`);
                    if (amountInput && currencySelect) {
                        costData.fields.amount = amountInput.value;
                        costData.fields.currency = currencySelect.value;
                    }
                } else if (item.pricingType === 'person_based') {
                    if (item.amountType === 'person_based') {
                        const ageRanges = {};
                        const prices = {};
                        ['adult', 'child', 'baby'].forEach(ageType => {
                            const minInput = document.querySelector(`input[name="cost_age_range[${costId}][${ageType}][min]"]`);
                            const maxInput = document.querySelector(`input[name="cost_age_range[${costId}][${ageType}][max]"]`);
                            const priceInput = document.querySelector(`input[name="cost_price[${costId}][${ageType}]"]`);
                            const currencySelect = document.querySelector(`select[name="cost_currency[${costId}][${ageType}]"]`);
                            
                            if (minInput && maxInput) {
                                ageRanges[ageType] = {
                                    min: minInput.value,
                                    max: maxInput.value
                                };
                            }
                            if (priceInput && currencySelect) {
                                prices[ageType] = {
                                    price: priceInput.value,
                                    currency: currencySelect.value
                                };
                            }
                        });
                        costData.fields.ageRanges = ageRanges;
                        costData.fields.prices = prices;
                    } else if (item.amountType === 'region_based') {
                        const regionalAgeRanges = {};
                        const regionalPrices = {};
                        tourRegions.forEach(region => {
                            regionalAgeRanges[region.id] = {};
                            regionalPrices[region.id] = {};
                            ['adult', 'child', 'baby'].forEach(ageType => {
                                const minInput = document.querySelector(`input[name="cost_regional_age_range[${costId}][${region.id}][${ageType}][min]"]`);
                                const maxInput = document.querySelector(`input[name="cost_regional_age_range[${costId}][${region.id}][${ageType}][max]"]`);
                                const priceInput = document.querySelector(`input[name="cost_regional_price[${costId}][${region.id}][${ageType}]"]`);
                                const currencySelect = document.querySelector(`select[name="cost_regional_currency[${costId}][${region.id}][${ageType}]"]`);
                                
                                if (minInput && maxInput) {
                                    regionalAgeRanges[region.id][ageType] = {
                                        min: minInput.value,
                                        max: maxInput.value
                                    };
                                }
                                if (priceInput && currencySelect) {
                                    regionalPrices[region.id][ageType] = {
                                        price: priceInput.value,
                                        currency: currencySelect.value
                                    };
                                }
                            });
                        });
                        costData.fields.regionalAgeRanges = regionalAgeRanges;
                        costData.fields.regionalPrices = regionalPrices;
                    }
                }
                
                costItemsData[costId] = costData;
            });
            
            // Add selected cost items to data
            data.selected_cost_items = costItemsData;
            
            // Collect VAT rates data
            if (hasVat === 'yes') {
                data.vat_rates = vatRatesList.map(vat => ({
                    category: vat.category,
                    percentage: parseFloat(vat.percentage) || 0,
                    vat_rate: parseFloat(vat.vat_rate) || 0
                }));
            } else {
                data.vat_rates = [];
            }
            
            // Submit via FormHandler
            if (window.FormHandler) {
                const result = await window.FormHandler.submit(form, {
                    apiUrl: API_BASE,
                    action: 'contract',
                    method: 'POST',
                    showSuccessToast: true,
                    showErrorToast: true,
                    onSuccess: function(result) {
                        // Refresh contracts list and close modal
                        loadExistingContracts();
                        closeContractModal();
                    },
                    onError: function(error) {
                        // Error handling is done by FormHandler
                        console.error('Form submission error:', error);
                    }
                });
            } else {
                // Fallback if FormHandler is not available
                const response = await window.apiFetch(`${API_BASE}?action=contract`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showToast('success', result.message || 'Contract added successfully');
                    // Refresh contracts list and reset form
                    loadExistingContracts();
                    generateContractCode();
                    form.reset();
                    if (window.FormValidator) {
                        window.FormValidator.clearErrors(form);
                    }
                } else {
                    showToast('error', result.message || 'Failed to add contract');
                    
                    // Handle field-specific errors
                    if (result.errors && window.FormValidator) {
                        Object.keys(result.errors).forEach(fieldName => {
                            window.FormValidator.showError(fieldName, result.errors[fieldName]);
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showToast('error', 'An error occurred while submitting the form');
        } finally {
            // Restore button state
            if (submitBtn) {
                submitBtn.disabled = originalDisabled;
                submitBtn.innerHTML = originalText;
            }
        }
    }
    
    // Load existing contracts
    async function loadExistingContracts() {
        const container = document.getElementById('contractsListContainer');
        if (!container) return;
        
        try {
            container.innerHTML = '<div class="loading"><span class="material-symbols-rounded">sync</span><p>' + (tCommon.loading || 'Loading...') + '</p></div>';
            
            const response = await window.apiFetch(`${API_BASE}?action=contracts&merchant_id=${MERCHANT_ID}`, {
                method: 'GET'
            });
            const result = await response.json();
            
            if (result.success) {
                renderContractsList(result.data || []);
            } else {
                container.innerHTML = '<div class="empty-state"><span class="material-symbols-rounded">error</span><p>' + (result.message || 'Failed to load contracts') + '</p></div>';
            }
        } catch (error) {
            console.error('Error loading contracts:', error);
            container.innerHTML = '<div class="empty-state"><span class="material-symbols-rounded">error</span><p>' + (tCommon.error_loading || 'Error loading contracts') + '</p></div>';
        }
    }
    
    // Render contracts list
    function renderContractsList(contracts) {
        const container = document.getElementById('contractsListContainer');
        if (!container) return;
        
        if (contracts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-rounded">description</span>
                    <p>${tMerchants.no_contracts || 'No contracts found'}</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="contracts-table-container">';
        html += '<table class="contracts-table">';
        html += '<thead><tr>';
        html += '<th>' + (tMerchants.contract_code || 'Contract Code') + '</th>';
        html += '<th>' + (tMerchants.start_date || 'Start Date') + '</th>';
        html += '<th>' + (tMerchants.end_date || 'End Date') + '</th>';
        html += '<th>' + (tCommon.created_at || 'Created At') + '</th>';
        html += '<th class="no-sort">' + (tCommon.actions || 'Actions') + '</th>';
        html += '</tr></thead>';
        html += '<tbody>';
        
        contracts.forEach(contract => {
            const startDate = contract.start_date ? new Date(contract.start_date).toLocaleDateString() : '-';
            const endDate = contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '-';
            const createdAt = contract.created_at ? new Date(contract.created_at).toLocaleDateString() : '-';
            
            html += '<tr>';
            html += '<td><strong>' + (contract.contract_code || '-') + '</strong></td>';
            html += '<td>' + startDate + '</td>';
            html += '<td>' + endDate + '</td>';
            html += '<td>' + createdAt + '</td>';
            html += '<td>';
            html += '<div class="action-buttons">';
            html += '<button class="btn-icon btn-danger" onclick="deleteContract(' + contract.id + ')" title="' + (tCommon.delete || 'Delete') + '">';
            html += '<span class="material-symbols-rounded">delete</span>';
            html += '</button>';
            html += '</div>';
            html += '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        html += '</div>';
        
        container.innerHTML = html;
    }
    
    // Delete contract
    window.deleteContract = async function(contractId) {
        const t = window.Translations || {};
        const tCommon = t.common || {};
        const deleteConfirmMessage = tMerchants.delete_contract_confirm || tCommon.delete_confirm || 'Are you sure you want to delete this contract?';
        
        if (typeof window.showConfirmDialog === 'function') {
            window.showConfirmDialog(deleteConfirmMessage, async function() {
                try {
                    const response = await window.apiFetch(`${API_BASE}?action=contract&id=${contractId}`, {
                        method: 'DELETE'
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        showToast('success', result.message || 'Contract deleted successfully');
                        loadExistingContracts();
                    } else {
                        showToast('error', result.message || 'Failed to delete contract');
                    }
                } catch (error) {
                    console.error('Error deleting contract:', error);
                    showToast('error', 'An error occurred while deleting the contract');
                }
            });
        } else {
            if (confirm(deleteConfirmMessage)) {
                try {
                    const response = await window.apiFetch(`${API_BASE}?action=contract&id=${contractId}`, {
                        method: 'DELETE'
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        showToast('success', result.message || 'Contract deleted successfully');
                        loadExistingContracts();
                    } else {
                        showToast('error', result.message || 'Failed to delete contract');
                    }
                } catch (error) {
                    console.error('Error deleting contract:', error);
                    showToast('error', 'An error occurred while deleting the contract');
                }
            }
        }
    };
    
    // Open contract modal
    function openContractModal() {
        const modal = document.getElementById('addContractModal');
        if (modal && window.ModalManager) {
            window.ModalManager.open('addContractModal');
            generateContractCode();
            loadToursByCity(merchantCityId);
            
            // Hide all tour-dependent sections initially
            toggleTourDependentSections(false);
            
            // Reset tour selection
            const tourSelect = document.getElementById('tourId');
            if (tourSelect) {
                tourSelect.value = '';
                selectedTourId = null;
            }
            
            // Initialize date range picker when modal opens
            if (typeof window.initializeDateRangePicker === 'function') {
                const translations = {
                    common: tCommon
                };
                window.initializeDateRangePicker('contract_date_range', 'contract_start_date', 'contract_end_date', 'contractRangePicker', translations);
            }
            
            // Initialize select search for tour select
            setTimeout(() => {
                const tourSelect = document.getElementById('tourId');
                if (tourSelect && typeof window.initializeSelectSearch === 'function') {
                    window.initializeSelectSearch(tourSelect);
                }
            }, 100);
        }
    }
    
    // Close contract modal
    function closeContractModal() {
        const modal = document.getElementById('addContractModal');
        if (modal && window.ModalManager) {
            window.ModalManager.close('addContractModal');
            const form = document.getElementById('contractForm');
            if (form) {
                form.reset();
                if (window.FormValidator) {
                    window.FormValidator.clearErrors(form);
                }
            }
            // Clear dynamic fields
            document.getElementById('pricingFieldsContainer').innerHTML = '';
            document.getElementById('kickbackFieldsContainer').innerHTML = '';
            document.getElementById('vatFieldsContainer').classList.add('hidden');
            
            // Clear VAT rates
            vatRatesList = [];
            vatRateCounter = 0;
            renderVatRates();
            
            selectedTourId = null;
            selectedTourData = null;
            tourRegions = [];
        }
    }
    
    // Load currencies
    async function loadCurrencies() {
        try {
            const response = await fetch(`${CURRENCIES_API_BASE}?action=currencies`);
            const result = await response.json();
            if (result.success && result.data) {
                currenciesList = result.data.filter(c => c.is_active);
            }
        } catch (error) {
            console.error('Error loading currencies:', error);
        }
    }
    
    // Load cost items
    async function loadCostItems() {
        try {
            const response = await fetch(`${COSTS_API_BASE}?action=costs`);
            const result = await response.json();
            if (result.success && result.data) {
                // Filter normal costs (not VAT categories) for cost items modal
                costItemsList = result.data.filter(item => !item.is_vat_category || item.is_vat_category === false);
                renderCostItemsInModal();
            }
        } catch (error) {
            console.error('Error loading cost items:', error);
            const container = document.getElementById('costItemsContainer');
            if (container) {
                container.innerHTML = '<div class="error-state">' + (tCommon.error_loading || 'Error loading cost items') + '</div>';
            }
        }
    }
    
    // Load VAT categories for VAT rate category dropdown
    async function loadVatCategories() {
        try {
            const response = await fetch(`${COSTS_API_BASE}?action=costs`);
            const result = await response.json();
            if (result.success && result.data) {
                // Filter only VAT categories (is_vat_category = true)
                vatCategoriesList = result.data.filter(item => item.is_vat_category === true || item.is_vat_category === 't' || item.is_vat_category === 1);
                // Sort by name
                vatCategoriesList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            }
        } catch (error) {
            console.error('Error loading VAT categories:', error);
            vatCategoriesList = [];
        }
    }
    
    // Setup cost items modal
    function setupCostItemsModal() {
        const openBtn = document.getElementById('openCostItemsModalBtn');
        const closeBtn = document.getElementById('closeCostItemsModal');
        const cancelBtn = document.getElementById('cancelCostItemsBtn');
        const saveBtn = document.getElementById('saveCostItemsBtn');
        const modal = document.getElementById('costItemsModal');
        
        if (openBtn) {
            openBtn.addEventListener('click', function() {
                openCostItemsModal();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeCostItemsModal);
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeCostItemsModal);
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', saveCostItemsSelection);
        }
        
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeCostItemsModal();
                }
            });
        }
    }
    
    // Open cost items modal
    function openCostItemsModal() {
        const modal = document.getElementById('costItemsModal');
        if (modal && window.ModalManager) {
            window.ModalManager.open('costItemsModal');
            renderCostItemsInModal();
        }
    }
    
    // Close cost items modal
    function closeCostItemsModal() {
        const modal = document.getElementById('costItemsModal');
        if (modal && window.ModalManager) {
            window.ModalManager.close('costItemsModal');
        }
    }
    
    // Save cost items selection
    function saveCostItemsSelection() {
        // Get all checked cost items from modal
        const checkedCosts = document.querySelectorAll('#costItemsContainer .cost-item-checkbox:checked');
        const newSelectedCostItems = {};
        
        checkedCosts.forEach(checkbox => {
            const costId = checkbox.value;
            const cost = costItemsList.find(c => c.id == costId);
            
            if (cost) {
                // Initialize with empty data - user will configure in main form
                newSelectedCostItems[costId] = {
                    cost: cost,
                    pricingType: '', // Will be set in main form
                    amountType: '', // person_based or region_based
                    fields: {}
                };
            }
        });
        
        // Keep existing pricing data for costs that are still selected
        Object.keys(selectedCostItems).forEach(costId => {
            if (newSelectedCostItems[costId] && selectedCostItems[costId].fields) {
                newSelectedCostItems[costId].pricingType = selectedCostItems[costId].pricingType || '';
                newSelectedCostItems[costId].amountType = selectedCostItems[costId].amountType || '';
                newSelectedCostItems[costId].fields = selectedCostItems[costId].fields || {};
            }
        });
        
        selectedCostItems = newSelectedCostItems;
        renderSelectedCostItems();
        closeCostItemsModal();
    }
    
    // Render selected cost items in form with pricing configuration
    function renderSelectedCostItems() {
        const container = document.getElementById('selectedCostItemsContainer');
        if (!container) return;
        
        if (Object.keys(selectedCostItems).length === 0) {
            container.innerHTML = '<p class="no-selection">' + (tMerchants.no_cost_items_selected || 'Henüz maliyet seçilmedi') + '</p>';
            return;
        }
        
        let html = '<div class="selected-cost-items-list">';
        Object.values(selectedCostItems).forEach(item => {
            const cost = item.cost;
            const costId = cost.id;
            
            html += '<div class="selected-cost-item" data-cost-id="' + costId + '">';
            html += '<div class="selected-cost-header">';
            html += '<strong>' + (cost.cost_code || '') + ' - ' + (cost.name || '') + '</strong>';
            html += '<button type="button" class="btn-icon btn-danger btn-remove-cost" data-cost-id="' + costId + '" title="' + (tCommon.remove || 'Remove') + '">';
            html += '<span class="material-symbols-rounded">close</span>';
            html += '</button>';
            html += '</div>';
            
            // Pricing Type Selection
            html += '<div class="selected-cost-config">';
            html += '<div class="form-row-inline">';
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.pricing_type || 'Sabit tutar mı Kişi bazlı tutar mı?') + ' *</label>';
            html += '<select name="cost_pricing_type[' + costId + ']" class="cost-pricing-type-select" data-cost-id="' + costId + '" required>';
            html += '<option value="">' + (tCommon.select || 'Select...') + '</option>';
            html += '<option value="fixed"' + (item.pricingType === 'fixed' ? ' selected' : '') + '>' + (tMerchants.fixed_amount || 'Sabit Tutar') + '</option>';
            html += '<option value="person_based"' + (item.pricingType === 'person_based' ? ' selected' : '') + '>' + (tMerchants.person_based || 'Kişi Bazlı') + '</option>';
            html += '</select>';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            html += '</div>';
            
            // Pricing Fields Container
            html += '<div class="cost-item-pricing-fields" id="cost_pricing_fields_' + costId + '"></div>';
            
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
        
        container.innerHTML = html;
        
        // Setup pricing type change handlers
        document.querySelectorAll('.cost-pricing-type-select').forEach(select => {
            select.addEventListener('change', function() {
                const costId = this.dataset.costId;
                const item = selectedCostItems[costId];
                if (item) {
                    item.pricingType = this.value;
                    renderCostItemPricingFields(costId, this.value);
                }
            });
            
            // Trigger initial render if already has value
            if (select.value) {
                select.dispatchEvent(new Event('change'));
            }
        });
        
        // Setup remove buttons
        document.querySelectorAll('.btn-remove-cost').forEach(btn => {
            btn.addEventListener('click', function() {
                const costId = this.dataset.costId;
                delete selectedCostItems[costId];
                renderSelectedCostItems();
            });
        });
    }
    
    // Render cost item pricing fields (in main form)
    function renderCostItemPricingFields(costId, pricingType) {
        const container = document.getElementById('cost_pricing_fields_' + costId);
        if (!container) return;
        
        const item = selectedCostItems[costId];
        if (!item) return;
        
        container.innerHTML = '';
        
        if (!pricingType) return;
        
        if (pricingType === 'fixed') {
            // Sabit tutar - Genel mi Genel Bölge bazlı mı?
            let html = '<div class="form-row-inline">';
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.fixed_amount_type || 'Genel mi Genel Bölge bazlı mı?') + ' *</label>';
            html += '<select name="cost_amount_type[' + costId + ']" class="cost-amount-type-select" data-cost-id="' + costId + '" required>';
            html += '<option value="">' + (tCommon.select || 'Select...') + '</option>';
            html += '<option value="general"' + (item.amountType === 'general' ? ' selected' : '') + '>' + (tMerchants.general || 'Genel') + '</option>';
            html += '<option value="region_based"' + (item.amountType === 'region_based' ? ' selected' : '') + '>' + (tMerchants.region_based || 'Genel Bölge Bazlı') + '</option>';
            html += '</select>';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            html += '</div>';
            
            html += '<div class="cost-amount-fields-container" id="cost_amount_fields_' + costId + '"></div>';
            
            container.innerHTML = html;
            
            // Setup amount type change handler
            const amountTypeSelect = container.querySelector('.cost-amount-type-select');
            if (amountTypeSelect) {
                amountTypeSelect.addEventListener('change', function() {
                    const selectedAmountType = this.value;
                    if (item) {
                        item.amountType = selectedAmountType;
                    }
                    renderCostItemAmountFields(costId, selectedAmountType, 'fixed');
                });
                
                // Trigger initial render if already has value
                if (amountTypeSelect.value) {
                    amountTypeSelect.dispatchEvent(new Event('change'));
                }
            }
        } else if (pricingType === 'person_based') {
            // Kişi bazlı - Kişi Bazlı mı Yoksa Bölge Kişi Bazlı mı?
            let html = '<div class="form-row-inline">';
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.person_amount_type || 'Kişi Bazlı mı Yoksa Bölge Kişi Bazlı mı?') + ' *</label>';
            html += '<select name="cost_amount_type[' + costId + ']" class="cost-amount-type-select" data-cost-id="' + costId + '" required>';
            html += '<option value="">' + (tCommon.select || 'Select...') + '</option>';
            html += '<option value="person_based"' + (item.amountType === 'person_based' ? ' selected' : '') + '>' + (tMerchants.person_based || 'Kişi Bazlı') + '</option>';
            html += '<option value="region_person_based"' + (item.amountType === 'region_person_based' ? ' selected' : '') + '>' + (tMerchants.region_person_based || 'Bölge Kişi Bazlı') + '</option>';
            html += '</select>';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            html += '</div>';
            
            html += '<div class="cost-amount-fields-container" id="cost_amount_fields_' + costId + '"></div>';
            
            container.innerHTML = html;
            
            // Setup amount type change handler
            const amountTypeSelect = container.querySelector('.cost-amount-type-select');
            if (amountTypeSelect) {
                amountTypeSelect.addEventListener('change', function() {
                    const selectedAmountType = this.value;
                    if (item) {
                        item.amountType = selectedAmountType;
                    }
                    renderCostItemAmountFields(costId, selectedAmountType, 'person_based');
                });
                
                // Trigger initial render if already has value
                if (amountTypeSelect.value) {
                    amountTypeSelect.dispatchEvent(new Event('change'));
                }
            }
        }
    }
    
    // Render cost item amount fields (person_based or region_based)
    // pricingType: 'fixed' or 'person_based' - determines if fixed amount or age-based pricing
    function renderCostItemAmountFields(costId, amountType, pricingType = 'person_based') {
        const container = document.getElementById('cost_amount_fields_' + costId);
        if (!container) return;
        
        const item = selectedCostItems[costId];
        if (!item) return;
        
        container.innerHTML = '';
        
        if (!amountType) return;
        
        if (amountType === 'general' && pricingType === 'fixed') {
            // Sabit tutar + Genel: Sadece tek tutar ve döviz
            let html = '<div class="form-row-inline">';
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.amount || 'Tutar') + ' *</label>';
            html += '<input type="number" step="0.01" name="cost_fixed_amount[' + costId + ']" placeholder="0.00" min="0" value="' + (item.fields.amount || '') + '" required />';
            html += '</div>';
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.currency || 'Döviz') + ' *</label>';
            html += '<select name="cost_fixed_currency[' + costId + ']" required>';
            html += '<option value="">' + (tCommon.select || 'Select') + '</option>';
            const savedCurrency = item.fields.currency || '';
            currenciesList.forEach(currency => {
                const selected = savedCurrency === currency.code ? ' selected' : '';
                html += '<option value="' + currency.code + '"' + selected + '>' + currency.code + ' - ' + (currency.name || '') + '</option>';
            });
            html += '</select>';
            html += '</div>';
            html += '</div>';
            
            container.innerHTML = html;
        } else if (amountType === 'person_based' && pricingType === 'person_based') {
            // Kişi bazlı + Kişi Bazlı: Yaş aralıkları ve fiyatlar (genel)
            let html = '<div class="age-ranges-section">';
            html += '<h5>' + (tMerchants.age_ranges || 'Yaş Aralıkları') + '</h5>';
            html += '<div class="form-row-inline">';
            
            const ageTypes = [
                { key: 'adult', label: tMerchants.adult || 'Yetişkin', default: { min: 18, max: 100 } },
                { key: 'child', label: tMerchants.child || 'Çocuk', default: { min: 2, max: 17 } },
                { key: 'baby', label: tMerchants.baby || 'Bebek', default: { min: 0, max: 1 } }
            ];
            
            ageTypes.forEach(ageType => {
                const savedAgeRange = item.fields.ageRanges && item.fields.ageRanges[ageType.key] ? item.fields.ageRanges[ageType.key] : null;
                html += '<div class="form-group-inline age-range-group">';
                html += '<label>' + ageType.label + '</label>';
                html += '<div class="age-inputs-inline">';
                html += '<input type="number" name="cost_age_range[' + costId + '][' + ageType.key + '][min]" placeholder="' + (tMerchants.min_age || 'Min') + '" value="' + (savedAgeRange ? savedAgeRange.min : ageType.default.min) + '" min="0" max="150" required />';
                html += '<span class="age-separator">-</span>';
                html += '<input type="number" name="cost_age_range[' + costId + '][' + ageType.key + '][max]" placeholder="' + (tMerchants.max_age || 'Max') + '" value="' + (savedAgeRange ? savedAgeRange.max : ageType.default.max) + '" min="0" max="150" required />';
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            html += '</div>';
            
            html += '<div class="prices-section">';
            html += '<h5>' + (tMerchants.prices || 'Fiyatlar') + '</h5>';
            
            // Single currency selection for all age types
            const savedCurrency = item.fields.currency || '';
            html += '<div class="form-group">';
            html += '<label>' + (tMerchants.currency || 'Döviz') + ' *</label>';
            html += '<select name="cost_currency[' + costId + ']" required>';
            html += '<option value="">' + (tCommon.select || 'Select') + '</option>';
            currenciesList.forEach(currency => {
                const selected = savedCurrency === currency.code ? ' selected' : '';
                html += '<option value="' + currency.code + '"' + selected + '>' + currency.code + ' - ' + (currency.name || '') + '</option>';
            });
            html += '</select>';
            html += '</div>';
            
            html += '<div class="form-row-inline">';
            ageTypes.forEach(ageType => {
                const savedPrice = item.fields.prices && item.fields.prices[ageType.key] ? item.fields.prices[ageType.key] : null;
                html += '<div class="form-group-inline price-group">';
                html += '<label>' + ageType.label + ' ' + (tMerchants.price || 'Fiyat') + ' *</label>';
                html += '<input type="number" step="0.01" name="cost_price[' + costId + '][' + ageType.key + ']" placeholder="0.00" min="0" value="' + (savedPrice ? savedPrice.price : '') + '" required />';
                html += '</div>';
            });
            html += '</div>';
            html += '</div>';
            html += '</div>';
            
            container.innerHTML = html;
        } else if (amountType === 'region_based' && pricingType === 'fixed') {
            // Sabit tutar + Genel Bölge Bazlı: Her bölge için sadece tutar ve döviz
            if (!selectedTourId || tourRegions.length === 0) {
                container.innerHTML = '<div class="form-notice"><span class="material-symbols-rounded">info</span> ' + (tMerchants.select_tour_first || 'Please select a tour first') + '</div>';
                return;
            }
            
            let html = '<div class="regional-pricing-section">';
            html += '<h5>' + (tMerchants.regional_prices || 'Bölgesel Fiyatlar') + '</h5>';
            
            tourRegions.forEach((region, regionIndex) => {
                html += '<div class="region-pricing-block" data-region-id="' + region.id + '">';
                html += '<h6>' + (region.name || 'Region ' + (regionIndex + 1)) + '</h6>';
                
                html += '<div class="form-row-inline">';
                html += '<div class="form-group-inline">';
                html += '<label>' + (tMerchants.amount || 'Tutar') + ' *</label>';
                const savedAmount = item.fields.regionalAmounts && item.fields.regionalAmounts[region.id] ? item.fields.regionalAmounts[region.id] : '';
                html += '<input type="number" step="0.01" name="cost_regional_fixed_amount[' + costId + '][' + region.id + ']" placeholder="0.00" min="0" value="' + savedAmount + '" required />';
                html += '</div>';
                html += '<div class="form-group-inline">';
                html += '<label>' + (tMerchants.currency || 'Döviz') + ' *</label>';
                html += '<select name="cost_regional_fixed_currency[' + costId + '][' + region.id + ']" required>';
                html += '<option value="">' + (tCommon.select || 'Select') + '</option>';
                const savedCurrency = item.fields.regionalCurrencies && item.fields.regionalCurrencies[region.id] ? item.fields.regionalCurrencies[region.id] : '';
                currenciesList.forEach(currency => {
                    const selected = savedCurrency === currency.code ? ' selected' : '';
                    html += '<option value="' + currency.code + '"' + selected + '>' + currency.code + ' - ' + (currency.name || '') + '</option>';
                });
                html += '</select>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            container.innerHTML = html;
        } else if (amountType === 'region_person_based' && pricingType === 'person_based') {
            // Kişi bazlı + Bölge Kişi Bazlı: Turun bölgeleri + her bölge için yaş aralıkları ve fiyatlar
            if (!selectedTourId || tourRegions.length === 0) {
                container.innerHTML = '<div class="form-notice"><span class="material-symbols-rounded">info</span> ' + (tMerchants.select_tour_first || 'Please select a tour first') + '</div>';
                return;
            }
            
            let html = '<div class="regional-pricing-section">';
            html += '<h5>' + (tMerchants.regional_prices || 'Bölgesel Fiyatlar') + '</h5>';
            
            tourRegions.forEach((region, regionIndex) => {
                html += '<div class="region-pricing-block" data-region-id="' + region.id + '">';
                html += '<h6>' + (region.name || 'Region ' + (regionIndex + 1)) + '</h6>';
                
                // Age ranges
                html += '<div class="age-ranges-section">';
                html += '<h6>' + (tMerchants.age_ranges || 'Yaş Aralıkları') + '</h6>';
                html += '<div class="form-row-inline">';
                
                const ageTypes = [
                    { key: 'adult', label: tMerchants.adult || 'Yetişkin', default: { min: 18, max: 100 } },
                    { key: 'child', label: tMerchants.child || 'Çocuk', default: { min: 2, max: 17 } },
                    { key: 'baby', label: tMerchants.baby || 'Bebek', default: { min: 0, max: 1 } }
                ];
                
                ageTypes.forEach(ageType => {
                    const savedAgeRange = item.fields.regionalAgeRanges && item.fields.regionalAgeRanges[region.id] && item.fields.regionalAgeRanges[region.id][ageType.key] ? item.fields.regionalAgeRanges[region.id][ageType.key] : null;
                    html += '<div class="form-group-inline age-range-group">';
                    html += '<label>' + ageType.label + '</label>';
                    html += '<div class="age-inputs-inline">';
                    html += '<input type="number" name="cost_regional_age_range[' + costId + '][' + region.id + '][' + ageType.key + '][min]" placeholder="' + (tMerchants.min_age || 'Min') + '" value="' + (savedAgeRange ? savedAgeRange.min : ageType.default.min) + '" min="0" max="150" required />';
                    html += '<span class="age-separator">-</span>';
                    html += '<input type="number" name="cost_regional_age_range[' + costId + '][' + region.id + '][' + ageType.key + '][max]" placeholder="' + (tMerchants.max_age || 'Max') + '" value="' + (savedAgeRange ? savedAgeRange.max : ageType.default.max) + '" min="0" max="150" required />';
                    html += '</div>';
                    html += '</div>';
                });
                
                html += '</div>';
                html += '</div>';
                
                // Prices - Single currency for all age types per region
                html += '<div class="prices-section">';
                html += '<h6>' + (tMerchants.prices || 'Fiyatlar') + '</h6>';
                
                const savedRegionalCurrency = item.fields.regionalCurrencies && item.fields.regionalCurrencies[region.id] ? item.fields.regionalCurrencies[region.id] : '';
                html += '<div class="form-group">';
                html += '<label>' + (tMerchants.currency || 'Döviz') + ' *</label>';
                html += '<select name="cost_regional_currency[' + costId + '][' + region.id + ']" required>';
                html += '<option value="">' + (tCommon.select || 'Select') + '</option>';
                currenciesList.forEach(currency => {
                    const selected = savedRegionalCurrency === currency.code ? ' selected' : '';
                    html += '<option value="' + currency.code + '"' + selected + '>' + currency.code + ' - ' + (currency.name || '') + '</option>';
                });
                html += '</select>';
                html += '</div>';
                
                html += '<div class="form-row-inline">';
                ageTypes.forEach(ageType => {
                    const savedPrice = item.fields.regionalPrices && item.fields.regionalPrices[region.id] && item.fields.regionalPrices[region.id][ageType.key] ? item.fields.regionalPrices[region.id][ageType.key] : null;
                    html += '<div class="form-group-inline price-group">';
                    html += '<label>' + ageType.label + ' ' + (tMerchants.price || 'Fiyat') + ' *</label>';
                    html += '<input type="number" step="0.01" name="cost_regional_price[' + costId + '][' + region.id + '][' + ageType.key + ']" placeholder="0.00" min="0" value="' + (savedPrice ? savedPrice.price : '') + '" required />';
                    html += '</div>';
                });
                html += '</div>';
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            
            container.innerHTML = html;
        }
    }
    
    // Render cost items in modal (table format)
    function renderCostItemsInModal() {
        const container = document.getElementById('costItemsContainer');
        if (!container) return;
        
        if (costItemsList.length === 0) {
            container.innerHTML = '<div class="empty-state-small">' + (tMerchants.no_cost_items || 'No cost items available') + '</div>';
            return;
        }
        
        let html = '<div class="cost-items-table-wrapper">';
        html += '<table class="cost-items-table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th style="width: 50px;">';
        html += '<input type="checkbox" id="selectAllCosts" title="' + (tCommon.select_all || 'Select All') + '">';
        html += '</th>';
        html += '<th>' + (tMerchants.cost_code || 'Cost Code') + '</th>';
        html += '<th>' + (tMerchants.cost_name || 'Cost Name') + '</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        costItemsList.forEach(cost => {
            const isSelected = selectedCostItems[cost.id] ? 'checked' : '';
            html += '<tr class="cost-item-row" data-cost-id="' + cost.id + '">';
            html += '<td>';
            html += '<input type="checkbox" name="included_cost_items[]" value="' + cost.id + '" id="cost_' + cost.id + '" class="cost-item-checkbox" ' + isSelected + '>';
            html += '</td>';
            html += '<td>' + (cost.cost_code || '-') + '</td>';
            html += '<td>' + (cost.name || '-') + '</td>';
            html += '</tr>';
        });
        
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        
        container.innerHTML = html;
        
        // Setup select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllCosts');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const checkboxes = container.querySelectorAll('.cost-item-checkbox');
                checkboxes.forEach(cb => {
                    cb.checked = this.checked;
                });
            });
        }
        
        // Setup row click to toggle checkbox
        container.querySelectorAll('.cost-item-row').forEach(row => {
            row.addEventListener('click', function(e) {
                if (e.target.type !== 'checkbox') {
                    const checkbox = this.querySelector('.cost-item-checkbox');
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                }
            });
        });
        
        // Restore previously selected cost items
        Object.keys(selectedCostItems).forEach(costId => {
            const checkbox = container.querySelector(`#cost_${costId}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
    
    // Setup dynamic form fields
    function setupDynamicFormFields() {
        // VAT toggle
        const hasVatSelect = document.getElementById('hasVat');
        if (hasVatSelect) {
            hasVatSelect.addEventListener('change', function() {
                const vatContainer = document.getElementById('vatFieldsContainer');
                if (vatContainer) {
                    if (this.value === 'yes') {
                        vatContainer.classList.remove('hidden');
                        // Initialize with at least one VAT rate if empty
                        if (vatRatesList.length === 0) {
                            addVatRate();
                        }
                    } else {
                        vatContainer.classList.add('hidden');
                        vatRatesList = [];
                        vatRateCounter = 0;
                        renderVatRates();
                    }
                }
            });
        }
        
        // Add VAT rate button
        const addVatBtn = document.getElementById('addVatBtn');
        if (addVatBtn) {
            addVatBtn.addEventListener('click', function() {
                addVatRate();
            });
        }
        
        // Price type change handler
        const priceTypeSelect = document.getElementById('priceType');
        if (priceTypeSelect) {
            priceTypeSelect.addEventListener('change', function() {
                renderPricingFields(this.value);
            });
        }
        
        // Kickback type change handler
        const kickbackTypeSelect = document.getElementById('kickbackType');
        if (kickbackTypeSelect) {
            kickbackTypeSelect.addEventListener('change', function() {
                renderKickbackFields(this.value);
            });
        }
        
        // Tour selection change handler
        const tourSelect = document.getElementById('tourId');
        if (tourSelect) {
            // Initially hide all sections that depend on tour selection
            toggleTourDependentSections(false);
            
            tourSelect.addEventListener('change', function() {
                selectedTourId = this.value ? parseInt(this.value) : null;
                if (selectedTourId) {
                    // Show all sections when tour is selected
                    toggleTourDependentSections(true);
                    loadTourData(selectedTourId);
                } else {
                    // Hide all sections when tour is deselected
                    toggleTourDependentSections(false);
                    selectedTourData = null;
                    tourRegions = [];
                    
                    // Reset all fields
                    const vatSection = document.getElementById('vatSection');
                    if (vatSection) {
                        const hasVatSelect = document.getElementById('hasVat');
                        if (hasVatSelect) hasVatSelect.value = '';
                        const vatContainer = document.getElementById('vatFieldsContainer');
                        if (vatContainer) {
                            vatContainer.classList.add('hidden');
                            const vatRate = document.getElementById('vatRate');
                            if (vatRate) {
                                vatRate.value = '';
                                vatRate.required = false;
                            }
                        }
                    }
                    
                    const priceTypeSelect = document.getElementById('priceType');
                    if (priceTypeSelect) {
                        priceTypeSelect.value = '';
                        renderPricingFields('');
                    }
                    
                    const kickbackTypeSelect = document.getElementById('kickbackType');
                    if (kickbackTypeSelect) {
                        kickbackTypeSelect.value = '';
                        renderKickbackFields('');
                    }
                    
                    // Clear cost items
                    selectedCostItems = {};
                    renderSelectedCostItems();
                }
            });
        }
    }
    
    // Toggle visibility of tour-dependent sections
    function toggleTourDependentSections(show) {
        const vatSection = document.getElementById('vatSection');
        const pricingSection = document.getElementById('pricingSection');
        const kickbackSection = document.getElementById('kickbackSection');
        const includedPriceSection = document.getElementById('includedPriceSection');
        
        if (vatSection) {
            vatSection.style.display = show ? '' : 'none';
        }
        if (pricingSection) {
            pricingSection.style.display = show ? '' : 'none';
        }
        if (kickbackSection) {
            kickbackSection.style.display = show ? '' : 'none';
        }
        if (includedPriceSection) {
            includedPriceSection.style.display = show ? '' : 'none';
        }
    }
    
    // Add a new VAT rate
    function addVatRate() {
        const newVatRate = {
            id: 'vat_' + (++vatRateCounter),
            category: '',
            percentage: '',
            vat_rate: ''
        };
        vatRatesList.push(newVatRate);
        renderVatRates();
    }
    
    // Remove a VAT rate
    function removeVatRate(vatId) {
        vatRatesList = vatRatesList.filter(vat => vat.id !== vatId);
        renderVatRates();
        checkVatTotal();
    }
    
    // Render VAT rates list
    function renderVatRates() {
        const container = document.getElementById('vatRatesList');
        const totalContainer = document.getElementById('vatTotalPercentage');
        if (!container) return;
        
        if (vatRatesList.length === 0) {
            container.innerHTML = '<p class="no-vat-message">' + (tMerchants.no_vat_rates || 'Henüz KDV oranı eklenmedi') + '</p>';
            if (totalContainer) {
                totalContainer.classList.add('hidden');
            }
            return;
        }
        
        let html = '';
        vatRatesList.forEach((vatRate, index) => {
            html += '<div class="vat-rate-item" data-vat-id="' + vatRate.id + '">';
            html += '<div class="vat-rate-header">';
            html += '<strong>' + (tMerchants.vat_rate || 'KDV Oranı') + ' #' + (index + 1) + '</strong>';
            html += '<button type="button" class="btn-icon btn-danger btn-remove-vat" data-vat-id="' + vatRate.id + '" title="' + (tCommon.remove || 'Remove') + '">';
            html += '<span class="material-symbols-rounded">close</span>';
            html += '</button>';
            html += '</div>';
            
            html += '<div class="form-row-inline">';
            
            // Category - Dropdown from VAT Categories
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.vat_category || 'Kategori') + ' *</label>';
            html += '<select name="vat_category[' + vatRate.id + ']" class="vat-category-select" required>';
            html += '<option value="">' + (tCommon.select || 'Select...') + '</option>';
            vatCategoriesList.forEach(category => {
                const isSelected = vatRate.category === category.name || vatRate.category === category.id;
                html += '<option value="' + (category.name || '') + '"' + (isSelected ? ' selected' : '') + '>';
                html += (category.name || '') + (category.cost_code ? ' (' + category.cost_code + ')' : '');
                html += '</option>';
            });
            html += '</select>';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            
            // Percentage
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.percentage || 'Yüzde (%)') + ' *</label>';
            html += '<input type="number" step="0.01" name="vat_percentage[' + vatRate.id + ']" class="vat-percentage-input" placeholder="0.00" min="0" max="100" value="' + (vatRate.percentage || '') + '" required />';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            
            // VAT Rate
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.vat_rate || 'KDV Oranı (%)') + ' *</label>';
            html += '<input type="number" step="0.01" name="vat_rate[' + vatRate.id + ']" class="vat-rate-input" placeholder="0.00" min="0" max="100" value="' + (vatRate.vat_rate || '') + '" required />';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            
            html += '</div>';
            html += '</div>';
        });
        
        container.innerHTML = html;
        
        if (totalContainer) {
            totalContainer.classList.remove('hidden');
        }
        
        // Setup event listeners
        setupVatRateListeners();
        
        // Initialize select-search for all VAT category selects
        setTimeout(() => {
            document.querySelectorAll('.vat-category-select').forEach(select => {
                if (select && typeof window.initializeSelectSearch === 'function') {
                    // Only initialize if not already initialized
                    if (select.dataset.searchInitialized !== 'true') {
                        window.initializeSelectSearch(select);
                    }
                }
            });
        }, 50);
        
        checkVatTotal();
    }
    
    // Setup VAT rate input listeners
    function setupVatRateListeners() {
        // Remove buttons
        document.querySelectorAll('.btn-remove-vat').forEach(btn => {
            btn.addEventListener('click', function() {
                const vatId = this.dataset.vatId;
                removeVatRate(vatId);
            });
        });
        
        // Percentage inputs - validate total
        document.querySelectorAll('.vat-percentage-input').forEach(input => {
            input.addEventListener('input', function() {
                const vatId = this.name.match(/\[([^\]]+)\]/)[1];
                const vatRate = vatRatesList.find(v => v.id === vatId);
                if (vatRate) {
                    vatRate.percentage = this.value;
                }
                checkVatTotal();
            });
        });
        
        // Category selects
        document.querySelectorAll('.vat-category-select').forEach(select => {
            select.addEventListener('change', function() {
                const vatId = this.name.match(/\[([^\]]+)\]/)[1];
                const vatRate = vatRatesList.find(v => v.id === vatId);
                if (vatRate) {
                    vatRate.category = this.value;
                }
            });
        });
        
        // VAT rate inputs
        document.querySelectorAll('.vat-rate-input').forEach(input => {
            input.addEventListener('input', function() {
                const vatId = this.name.match(/\[([^\]]+)\]/)[1];
                const vatRate = vatRatesList.find(v => v.id === vatId);
                if (vatRate) {
                    vatRate.vat_rate = this.value;
                }
            });
        });
    }
    
    // Check if VAT total percentage is 100
    function checkVatTotal() {
        const totalPercentValue = document.getElementById('vatTotalPercentValue');
        const totalError = document.getElementById('vatTotalError');
        
        if (!totalPercentValue) return;
        
        let total = 0;
        vatRatesList.forEach(vat => {
            const percentage = parseFloat(vat.percentage) || 0;
            total += percentage;
        });
        
        totalPercentValue.textContent = total.toFixed(2);
        
        if (totalError) {
            if (Math.abs(total - 100) > 0.01) {
                totalError.style.display = '';
                totalPercentValue.style.color = '#ef4444';
            } else {
                totalError.style.display = 'none';
                totalPercentValue.style.color = '#10b981';
            }
        }
    }
    
    // Load tour data
    async function loadTourData(tourId) {
        try {
            const response = await fetch(`${TOURS_API_BASE}?action=tours`);
            const result = await response.json();
            
            if (result.success && result.data) {
                const tour = result.data.find(t => t.id == tourId);
                if (tour) {
                    selectedTourData = tour;
                    // Load tour sub regions
                    if (tour.sub_region_ids && tour.sub_region_ids.length > 0) {
                        await loadTourRegions(tour.sub_region_ids);
                    }
                    // Re-render pricing fields if regional is selected
                    const priceType = document.getElementById('priceType')?.value;
                    if (priceType) {
                        renderPricingFields(priceType);
                    }
                    // Re-render kickback fields
                    const kickbackType = document.getElementById('kickbackType')?.value;
                    if (kickbackType) {
                        renderKickbackFields(kickbackType);
                    }
                    // Re-render cost items with region_based amount type
                    Object.keys(selectedCostItems).forEach(costId => {
                        const item = selectedCostItems[costId];
                        if (item && item.pricingType === 'person_based' && item.amountType === 'region_based') {
                            const container = document.getElementById('cost_amount_fields_' + costId);
                            if (container) {
                                renderCostItemAmountFields(costId, 'region_based', 'person_based');
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error loading tour data:', error);
        }
    }
    
    // Load tour regions (sub_regions)
    async function loadTourRegions(subRegionIds) {
        try {
            const response = await fetch(`${LOCATIONS_API_BASE}?action=sub_regions`);
            const result = await response.json();
            
            if (result.success && result.data) {
                tourRegions = result.data.filter(sr => subRegionIds.includes(sr.id));
            }
        } catch (error) {
            console.error('Error loading tour regions:', error);
        }
    }
    
    // Render pricing fields based on price type
    function renderPricingFields(priceType) {
        const container = document.getElementById('pricingFieldsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!priceType) return;
        
        if (priceType === 'person_based') {
            // Kişi bazlı
            renderPersonBasedPricing(container);
        } else if (priceType === 'group_based') {
            // Grup bazlı
            renderGroupBasedPricing(container);
        }
    }
    
    // Render person based pricing
    function renderPersonBasedPricing(container) {
        let html = '<div class="pricing-sub-section">';
        html += '<div class="form-row-inline">';
        html += '<div class="form-group-inline">';
        html += '<label>' + (tMerchants.amount_type || 'Sabit tutar mı Bölgesel tutar mı?') + ' *</label>';
        html += '<select name="person_amount_type" id="personAmountType" required>';
        html += '<option value="">' + (tCommon.select || 'Select...') + '</option>';
        html += '<option value="fixed">' + (tMerchants.fixed_amount || 'Sabit Tutar') + '</option>';
        html += '<option value="regional">' + (tMerchants.regional_amount || 'Bölgesel Tutar') + '</option>';
        html += '</select>';
        html += '<span class="input-error-message"></span>';
        html += '</div>';
        html += '</div>';
        html += '<div id="personPricingFieldsContainer"></div>';
        html += '</div>';
        
        container.innerHTML = html;
        
        // Setup amount type change handler
        const amountTypeSelect = document.getElementById('personAmountType');
        if (amountTypeSelect) {
            amountTypeSelect.addEventListener('change', function() {
                renderPersonPricingDetails(this.value);
            });
        }
    }
    
    // Render person pricing details
    function renderPersonPricingDetails(amountType) {
        const container = document.getElementById('personPricingFieldsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!amountType) return;
        
        if (amountType === 'fixed') {
            // Sabit tutar - Yetişkin/Çocuk/Bebek yaş aralıkları + fiyatlar + döviz
            renderAgeRangesAndPrices(container, 'person');
        } else if (amountType === 'regional') {
            // Bölgesel tutar - Turun çıkış bölgeleri + her bölge için yaş aralıkları + fiyatlar + döviz
            if (!selectedTourId || tourRegions.length === 0) {
                container.innerHTML = '<div class="form-notice"><span class="material-symbols-rounded">info</span> ' + (tMerchants.select_tour_first || 'Please select a tour first') + '</div>';
                return;
            }
            renderRegionalPersonPricing(container);
        }
    }
    
    // Render age ranges and prices - with single currency selection
    function renderAgeRangesAndPrices(container, prefix = '') {
        let html = '<div class="age-ranges-section">';
        html += '<h4>' + (tMerchants.age_ranges || 'Yaş Aralıkları') + '</h4>';
        html += '<div class="form-row-inline">';
        
        const ageTypes = [
            { key: 'adult', label: tMerchants.adult || 'Yetişkin', default: { min: 18, max: 100 } },
            { key: 'child', label: tMerchants.child || 'Çocuk', default: { min: 2, max: 17 } },
            { key: 'baby', label: tMerchants.baby || 'Bebek', default: { min: 0, max: 1 } }
        ];
        
        ageTypes.forEach(ageType => {
            html += '<div class="form-group-inline age-range-group">';
            html += '<label>' + ageType.label + '</label>';
            html += '<div class="age-inputs-inline">';
            html += '<input type="number" name="' + prefix + '_age_range[' + ageType.key + '][min]" placeholder="' + (tMerchants.min_age || 'Min') + '" value="' + ageType.default.min + '" min="0" max="150" required />';
            html += '<span class="age-separator">-</span>';
            html += '<input type="number" name="' + prefix + '_age_range[' + ageType.key + '][max]" placeholder="' + (tMerchants.max_age || 'Max') + '" value="' + ageType.default.max + '" min="0" max="150" required />';
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
        
        html += '<div class="prices-section">';
        html += '<h4>' + (tMerchants.prices || 'Fiyatlar') + '</h4>';
        
        // Single currency selection for all age types
        html += '<div class="form-group">';
        html += '<label>' + (tMerchants.currency || 'Döviz') + ' *</label>';
        html += '<select name="' + prefix + '_currency" id="' + prefix + 'Currency" required>';
        html += '<option value="">' + (tCommon.select || 'Select') + '</option>';
        currenciesList.forEach(currency => {
            html += '<option value="' + currency.code + '">' + currency.code + ' - ' + (currency.name || '') + '</option>';
        });
        html += '</select>';
        html += '</div>';
        
        html += '<div class="form-row-inline">';
        ageTypes.forEach(ageType => {
            html += '<div class="form-group-inline price-group">';
            html += '<label>' + ageType.label + ' ' + (tMerchants.price || 'Fiyat') + ' *</label>';
            html += '<input type="number" step="0.01" name="' + prefix + '_price[' + ageType.key + ']" placeholder="0.00" min="0" required />';
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';
        
        container.innerHTML = html;
    }
    
    // Render regional person pricing
    function renderRegionalPersonPricing(container) {
        let html = '<div class="regional-pricing-section">';
        html += '<h4>' + (tMerchants.regional_prices || 'Bölgesel Fiyatlar') + '</h4>';
        
        tourRegions.forEach((region, regionIndex) => {
            html += '<div class="region-pricing-block" data-region-id="' + region.id + '">';
            html += '<h5>' + (region.name || 'Region ' + (regionIndex + 1)) + '</h5>';
            
            // Age ranges
            html += '<div class="age-ranges-section">';
            html += '<h5>' + (tMerchants.age_ranges || 'Yaş Aralıkları') + '</h5>';
            
            const ageTypes = [
                { key: 'adult', label: tMerchants.adult || 'Yetişkin', default: { min: 18, max: 100 } },
                { key: 'child', label: tMerchants.child || 'Çocuk', default: { min: 2, max: 17 } },
                { key: 'baby', label: tMerchants.baby || 'Bebek', default: { min: 0, max: 1 } }
            ];
            
            ageTypes.forEach(ageType => {
                html += '<div class="age-range-row">';
                html += '<label>' + ageType.label + '</label>';
                html += '<div class="age-inputs">';
                html += '<input type="number" name="regional_person_age_range[' + region.id + '][' + ageType.key + '][min]" placeholder="' + (tMerchants.min_age || 'Min') + '" value="' + ageType.default.min + '" min="0" max="150" required />';
                html += '<span class="age-separator">-</span>';
                html += '<input type="number" name="regional_person_age_range[' + region.id + '][' + ageType.key + '][max]" placeholder="' + (tMerchants.max_age || 'Max') + '" value="' + ageType.default.max + '" min="0" max="150" required />';
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            
            // Prices - Single currency for all age types per region
            html += '<div class="prices-section">';
            html += '<h5>' + (tMerchants.prices || 'Fiyatlar') + '</h5>';
            
            html += '<div class="form-group">';
            html += '<label>' + (tMerchants.currency || 'Döviz') + ' *</label>';
            html += '<select name="regional_person_currency[' + region.id + ']" required>';
            html += '<option value="">' + (tCommon.select || 'Select') + '</option>';
            currenciesList.forEach(currency => {
                html += '<option value="' + currency.code + '">' + currency.code + ' - ' + (currency.name || '') + '</option>';
            });
            html += '</select>';
            html += '</div>';
            
            html += '<div class="form-row-inline">';
            ageTypes.forEach(ageType => {
                html += '<div class="form-group-inline price-group">';
                html += '<label>' + ageType.label + ' ' + (tMerchants.price || 'Fiyat') + ' *</label>';
                html += '<input type="number" step="0.01" name="regional_person_price[' + region.id + '][' + ageType.key + ']" placeholder="0.00" min="0" required />';
                html += '</div>';
            });
            html += '</div>';
            
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>';
        
        container.innerHTML = html;
    }
    
    // Render group based pricing
    function renderGroupBasedPricing(container) {
        let html = '<div class="pricing-sub-section">';
        html += '<div class="form-row-inline">';
        html += '<div class="form-group-inline">';
        html += '<label>' + (tMerchants.max_persons || 'Kaç kişiye kadar') + ' *</label>';
        html += '<input type="number" name="max_persons" id="maxPersons" placeholder="0" min="1" required />';
        html += '<span class="input-error-message"></span>';
        html += '</div>';
        
        html += '<div class="form-group-inline">';
        html += '<label>' + (tMerchants.has_additional_fee || 'İlave ücret var mı?') + ' *</label>';
        html += '<select name="has_additional_fee" id="hasAdditionalFee" required>';
        html += '<option value="">' + (tCommon.select || 'Select...') + '</option>';
        html += '<option value="yes">' + (tMerchants.yes || 'Evet') + '</option>';
        html += '<option value="no">' + (tMerchants.no || 'Hayır') + '</option>';
        html += '</select>';
        html += '<span class="input-error-message"></span>';
        html += '</div>';
        html += '</div>';
        
        html += '<div id="additionalFeeContainer" class="hidden">';
        html += '<div class="form-row-inline">';
        html += '<div class="form-group-inline">';
        html += '<label>' + (tMerchants.additional_fee_amount || 'Belirtilen sayıdan sonra ne kadar?') + ' *</label>';
        html += '<div class="price-input-group-inline">';
        html += '<input type="number" step="0.01" name="additional_fee_amount" placeholder="0.00" min="0" />';
        html += '<select name="additional_fee_currency">';
        html += '<option value="">' + (tCommon.select || 'Select') + '</option>';
        currenciesList.forEach(currency => {
            html += '<option value="' + currency.code + '">' + currency.code + ' - ' + (currency.name || '') + '</option>';
        });
        html += '</select>';
        html += '</div>';
        html += '<span class="input-error-message"></span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        html += '<div class="form-row-inline">';
        html += '<div class="form-group-inline">';
        html += '<label>' + (tMerchants.amount_type || 'Sabit tutar mı Bölgesel tutar mı?') + ' *</label>';
        html += '<select name="group_amount_type" id="groupAmountType" required>';
        html += '<option value="">' + (tCommon.select || 'Select...') + '</option>';
        html += '<option value="fixed">' + (tMerchants.fixed_amount || 'Sabit Tutar') + '</option>';
        html += '<option value="regional">' + (tMerchants.regional_amount || 'Bölgesel Tutar') + '</option>';
        html += '</select>';
        html += '<span class="input-error-message"></span>';
        html += '</div>';
        html += '</div>';
        
        html += '<div id="groupPricingFieldsContainer"></div>';
        html += '</div>';
        
        container.innerHTML = html;
        
        // Setup additional fee toggle
        const hasAdditionalFeeSelect = document.getElementById('hasAdditionalFee');
        if (hasAdditionalFeeSelect) {
            hasAdditionalFeeSelect.addEventListener('change', function() {
                const feeContainer = document.getElementById('additionalFeeContainer');
                if (feeContainer) {
                    if (this.value === 'yes') {
                        feeContainer.classList.remove('hidden');
                        feeContainer.querySelector('input[name="additional_fee_amount"]').required = true;
                        feeContainer.querySelector('select[name="additional_fee_currency"]').required = true;
                    } else {
                        feeContainer.classList.add('hidden');
                        feeContainer.querySelector('input[name="additional_fee_amount"]').required = false;
                        feeContainer.querySelector('select[name="additional_fee_currency"]').required = false;
                        feeContainer.querySelector('input[name="additional_fee_amount"]').value = '';
                        feeContainer.querySelector('select[name="additional_fee_currency"]').value = '';
                    }
                }
            });
        }
        
        // Setup amount type change handler
        const amountTypeSelect = document.getElementById('groupAmountType');
        if (amountTypeSelect) {
            amountTypeSelect.addEventListener('change', function() {
                renderGroupPricingDetails(this.value);
            });
        }
    }
    
    // Render group pricing details
    function renderGroupPricingDetails(amountType) {
        const container = document.getElementById('groupPricingFieldsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!amountType) return;
        
        if (amountType === 'fixed') {
            // Sabit tutar - Yetişkin/Çocuk/Bebek yaş aralıkları + fiyatlar + döviz
            renderAgeRangesAndPrices(container, 'group');
        } else if (amountType === 'regional') {
            // Bölgesel tutar
            if (!selectedTourId || tourRegions.length === 0) {
                container.innerHTML = '<div class="form-notice"><span class="material-symbols-rounded">info</span> ' + (tMerchants.select_tour_first || 'Please select a tour first') + '</div>';
                return;
            }
            renderRegionalGroupPricing(container);
        }
    }
    
    // Render regional group pricing
    function renderRegionalGroupPricing(container) {
        let html = '<div class="regional-pricing-section">';
        html += '<h4>' + (tMerchants.regional_prices || 'Bölgesel Fiyatlar') + '</h4>';
        
        tourRegions.forEach((region, regionIndex) => {
            html += '<div class="region-pricing-block" data-region-id="' + region.id + '">';
            html += '<h5>' + (region.name || 'Region ' + (regionIndex + 1)) + '</h5>';
            
            // Age ranges
            html += '<div class="age-ranges-section">';
            html += '<h5>' + (tMerchants.age_ranges || 'Yaş Aralıkları') + '</h5>';
            
            const ageTypes = [
                { key: 'adult', label: tMerchants.adult || 'Yetişkin', default: { min: 18, max: 100 } },
                { key: 'child', label: tMerchants.child || 'Çocuk', default: { min: 2, max: 17 } },
                { key: 'baby', label: tMerchants.baby || 'Bebek', default: { min: 0, max: 1 } }
            ];
            
            ageTypes.forEach(ageType => {
                html += '<div class="age-range-row">';
                html += '<label>' + ageType.label + '</label>';
                html += '<div class="age-inputs">';
                html += '<input type="number" name="regional_group_age_range[' + region.id + '][' + ageType.key + '][min]" placeholder="' + (tMerchants.min_age || 'Min') + '" value="' + ageType.default.min + '" min="0" max="150" required />';
                html += '<span class="age-separator">-</span>';
                html += '<input type="number" name="regional_group_age_range[' + region.id + '][' + ageType.key + '][max]" placeholder="' + (tMerchants.max_age || 'Max') + '" value="' + ageType.default.max + '" min="0" max="150" required />';
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            
            // Prices - Single currency for all age types per region
            html += '<div class="prices-section">';
            html += '<h5>' + (tMerchants.prices || 'Fiyatlar') + '</h5>';
            
            html += '<div class="form-group">';
            html += '<label>' + (tMerchants.currency || 'Döviz') + ' *</label>';
            html += '<select name="regional_group_currency[' + region.id + ']" required>';
            html += '<option value="">' + (tCommon.select || 'Select') + '</option>';
            currenciesList.forEach(currency => {
                html += '<option value="' + currency.code + '">' + currency.code + ' - ' + (currency.name || '') + '</option>';
            });
            html += '</select>';
            html += '</div>';
            
            html += '<div class="form-row-inline">';
            ageTypes.forEach(ageType => {
                html += '<div class="form-group-inline price-group">';
                html += '<label>' + ageType.label + ' ' + (tMerchants.price || 'Fiyat') + ' *</label>';
                html += '<input type="number" step="0.01" name="regional_group_price[' + region.id + '][' + ageType.key + ']" placeholder="0.00" min="0" required />';
                html += '</div>';
            });
            html += '</div>';
            
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>';
        
        container.innerHTML = html;
    }
    
    // Render kickback fields
    function renderKickbackFields(kickbackType) {
        const container = document.getElementById('kickbackFieldsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!kickbackType) return;
        
        if (kickbackType === 'general') {
            renderGeneralKickback(container);
        } else if (kickbackType === 'person_based') {
            renderPersonBasedKickback(container);
        }
    }
    
    // Render general kickback
    function renderGeneralKickback(container) {
        let html = '<div class="kickback-sub-section">';
        html += '<div class="form-row-inline">';
        html += '<div class="form-group-inline">';
        html += '<label>' + (tMerchants.kickback_amount_type || 'Sabit Tutar mı % mı?') + ' *</label>';
        html += '<select name="kickback_amount_type" id="kickbackAmountType" required>';
        html += '<option value="">' + (tCommon.select || 'Select...') + '</option>';
        html += '<option value="amount">' + (tMerchants.fixed_amount || 'Sabit Tutar') + '</option>';
        html += '<option value="percent">' + (tMerchants.percent || '%') + '</option>';
        html += '</select>';
        html += '<span class="input-error-message"></span>';
        html += '</div>';
        html += '</div>';
        
        html += '<div id="generalKickbackFieldsContainer"></div>';
        html += '</div>';
        
        container.innerHTML = html;
        
        // Setup amount type change handler
        const amountTypeSelect = document.getElementById('kickbackAmountType');
        if (amountTypeSelect) {
            amountTypeSelect.addEventListener('change', function() {
                renderGeneralKickbackDetails(this.value);
            });
        }
    }
    
    // Render general kickback details
    function renderGeneralKickbackDetails(amountType) {
        const container = document.getElementById('generalKickbackFieldsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!amountType) return;
        
        if (amountType === 'percent') {
            // % - Sabit % veya Bölgesel %
            let html = '<div class="form-row-inline">';
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.percent_type || 'Sabit % mı Bölgesel % mı?') + ' *</label>';
            html += '<select name="kickback_percent_type" id="kickbackPercentType" required>';
            html += '<option value="">' + (tCommon.select || 'Select...') + '</option>';
            html += '<option value="fixed">' + (tMerchants.fixed_percent || 'Sabit %') + '</option>';
            html += '<option value="regional">' + (tMerchants.regional_percent || 'Bölgesel %') + '</option>';
            html += '</select>';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            html += '</div>';
            html += '<div id="kickbackPercentFieldsContainer"></div>';
            
            container.innerHTML = html;
            
            const percentTypeSelect = document.getElementById('kickbackPercentType');
            if (percentTypeSelect) {
                percentTypeSelect.addEventListener('change', function() {
                    renderKickbackPercentFields(this.value, 'general');
                });
            }
        } else if (amountType === 'amount') {
            // Sabit Tutar - Sabit tutar veya Bölgesel tutar (yan yana)
            let html = '<div class="form-row-inline">';
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.amount_type || 'Sabit Tutar mı Bölgesel Tutar mı?') + ' *</label>';
            html += '<select name="kickback_amount_regional_type" id="kickbackAmountRegionalType" required>';
            html += '<option value="">' + (tCommon.select || 'Select...') + '</option>';
            html += '<option value="fixed">' + (tMerchants.fixed_amount || 'Sabit Tutar') + '</option>';
            html += '<option value="regional">' + (tMerchants.regional_amount || 'Bölgesel Tutar') + '</option>';
            html += '</select>';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            html += '</div>';
            html += '<div id="kickbackAmountFieldsContainer"></div>';
            
            container.innerHTML = html;
            
            const amountRegionalTypeSelect = document.getElementById('kickbackAmountRegionalType');
            if (amountRegionalTypeSelect) {
                amountRegionalTypeSelect.addEventListener('change', function() {
                    renderKickbackAmountFields(this.value, 'general');
                });
            }
        }
    }
    
    // Render kickback percent fields
    function renderKickbackPercentFields(percentType, kickbackType) {
        const container = document.getElementById('kickbackPercentFieldsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (percentType === 'fixed') {
            // Sabit % - inline göster
            let html = '<div class="form-row-inline">';
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.percent || '%') + ' *</label>';
            html += '<input type="number" step="0.01" name="kickback_fixed_percent" placeholder="0.00" min="0" max="100" required />';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            html += '</div>';
            container.innerHTML = html;
        } else if (percentType === 'regional') {
            // Bölgesel %
            if (!selectedTourId || tourRegions.length === 0) {
                container.innerHTML = '<div class="form-notice"><span class="material-symbols-rounded">info</span> ' + (tMerchants.select_tour_first || 'Please select a tour first') + '</div>';
                return;
            }
            
            let html = '<div class="form-section">';
            html += '<h4>' + (tMerchants.regional_percent || 'Bölgesel %') + '</h4>';
            
            tourRegions.forEach(region => {
                html += '<div class="form-group">';
                html += '<label>' + (region.name || 'Region') + ' % *</label>';
                html += '<input type="number" step="0.01" name="kickback_regional_percent[' + region.id + ']" placeholder="0.00" min="0" max="100" required />';
                html += '</div>';
            });
            
            html += '</div>';
            container.innerHTML = html;
        }
    }
    
    // Render kickback amount fields
    function renderKickbackAmountFields(amountType, kickbackType) {
        const container = document.getElementById('kickbackAmountFieldsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (amountType === 'fixed') {
            // Sabit Tutar
            let html = '<div class="form-row-inline">';
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.amount || 'Tutar') + ' *</label>';
            html += '<div class="price-input-group-inline">';
            html += '<input type="number" step="0.01" name="kickback_fixed_amount" placeholder="0.00" min="0" required />';
            html += '<select name="kickback_fixed_currency" required>';
            html += '<option value="">' + (tCommon.select || 'Select') + '</option>';
            currenciesList.forEach(currency => {
                html += '<option value="' + currency.code + '">' + currency.code + ' - ' + (currency.name || '') + '</option>';
            });
            html += '</select>';
            html += '</div>';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            html += '</div>';
            container.innerHTML = html;
        } else if (amountType === 'regional') {
            // Bölgesel Tutar
            if (!selectedTourId || tourRegions.length === 0) {
                container.innerHTML = '<div class="form-notice"><span class="material-symbols-rounded">info</span> ' + (tMerchants.select_tour_first || 'Please select a tour first') + '</div>';
                return;
            }
            
            let html = '<div class="form-section">';
            html += '<h4>' + (tMerchants.regional_amount || 'Bölgesel Tutar') + '</h4>';
            
            tourRegions.forEach(region => {
                html += '<div class="form-group">';
                html += '<label>' + (region.name || 'Region') + ' ' + (tMerchants.amount || 'Tutar') + ' *</label>';
                html += '<div class="price-input-group">';
                html += '<input type="number" step="0.01" name="kickback_regional_amount[' + region.id + ']" placeholder="0.00" min="0" required />';
                html += '<select name="kickback_regional_currency[' + region.id + ']" required>';
                html += '<option value="">' + (tCommon.select || 'Select') + '</option>';
                currenciesList.forEach(currency => {
                    html += '<option value="' + currency.code + '">' + currency.code + ' - ' + (currency.name || '') + '</option>';
                });
                html += '</select>';
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            container.innerHTML = html;
        }
    }
    
    // Render person based kickback
    function renderPersonBasedKickback(container) {
        let html = '<div class="kickback-sub-section">';
        html += '<div class="form-row-inline">';
        html += '<div class="form-group-inline">';
        html += '<label>' + (tMerchants.kickback_amount_type || 'Sabit Tutar mı % mı?') + ' *</label>';
        html += '<select name="kickback_person_amount_type" id="kickbackPersonAmountType" required>';
        html += '<option value="">' + (tCommon.select || 'Select...') + '</option>';
        html += '<option value="amount">' + (tMerchants.fixed_amount || 'Sabit Tutar') + '</option>';
        html += '<option value="percent">' + (tMerchants.percent || '%') + '</option>';
        html += '</select>';
        html += '<span class="input-error-message"></span>';
        html += '</div>';
        html += '</div>';
        
        html += '<div id="personBasedKickbackFieldsContainer"></div>';
        html += '</div>';
        
        container.innerHTML = html;
        
        // Setup amount type change handler
        const amountTypeSelect = document.getElementById('kickbackPersonAmountType');
        if (amountTypeSelect) {
            amountTypeSelect.addEventListener('change', function() {
                renderPersonBasedKickbackDetails(this.value);
            });
        }
    }
    
    // Render person based kickback details
    function renderPersonBasedKickbackDetails(amountType) {
        const container = document.getElementById('personBasedKickbackFieldsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!amountType) return;
        
        if (amountType === 'percent') {
            // % - Sabit % veya Bölgesel %
            let html = '<div class="form-row-inline">';
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.percent_type || 'Sabit % mı Bölgesel % mı?') + ' *</label>';
            html += '<select name="kickback_person_percent_type" id="kickbackPersonPercentType" required>';
            html += '<option value="">' + (tCommon.select || 'Select...') + '</option>';
            html += '<option value="fixed">' + (tMerchants.fixed_percent || 'Sabit %') + '</option>';
            html += '<option value="regional">' + (tMerchants.regional_percent || 'Bölgesel %') + '</option>';
            html += '</select>';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            html += '</div>';
            html += '<div id="kickbackPersonPercentFieldsContainer"></div>';
            
            container.innerHTML = html;
            
            const percentTypeSelect = document.getElementById('kickbackPersonPercentType');
            if (percentTypeSelect) {
                percentTypeSelect.addEventListener('change', function() {
                    renderKickbackPersonPercentFields(this.value);
                });
            }
        } else if (amountType === 'amount') {
            // Sabit Tutar - Sabit tutar veya Bölgesel tutar
            let html = '<div class="form-row-inline">';
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.amount_type || 'Sabit Tutar mı Bölgesel Tutar mı?') + ' *</label>';
            html += '<select name="kickback_person_amount_regional_type" id="kickbackPersonAmountRegionalType" required>';
            html += '<option value="">' + (tCommon.select || 'Select...') + '</option>';
            html += '<option value="fixed">' + (tMerchants.fixed_amount || 'Sabit Tutar') + '</option>';
            html += '<option value="regional">' + (tMerchants.regional_amount || 'Bölgesel Tutar') + '</option>';
            html += '</select>';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            html += '</div>';
            html += '<div id="kickbackPersonAmountFieldsContainer"></div>';
            
            container.innerHTML = html;
            
            const amountRegionalTypeSelect = document.getElementById('kickbackPersonAmountRegionalType');
            if (amountRegionalTypeSelect) {
                amountRegionalTypeSelect.addEventListener('change', function() {
                    renderKickbackPersonAmountFields(this.value);
                });
            }
        }
    }
    
    // Render kickback person percent fields (with age ranges)
    function renderKickbackPersonPercentFields(percentType) {
        const container = document.getElementById('kickbackPersonPercentFieldsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (percentType === 'fixed') {
            // Sabit % + Yaş aralıkları ve % oranları
            let html = '<div class="form-row-inline">';
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.percent || '%') + ' *</label>';
            html += '<input type="number" step="0.01" name="kickback_person_fixed_percent" placeholder="0.00" min="0" max="100" required />';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            html += '</div>';
            
            // Age ranges and percentages
            html += '<div class="age-percentages-section">';
            html += '<h4>' + (tMerchants.age_ranges_percentages || 'Yaş Aralıkları ve % Oranları') + '</h4>';
            html += '<div class="form-row-inline">';
            
            const ageTypes = [
                { key: 'adult', label: tMerchants.adult || 'Yetişkin', default: { min: 18, max: 100 }, defaultPercent: 100 },
                { key: 'child', label: tMerchants.child || 'Çocuk', default: { min: 2, max: 17 }, defaultPercent: 50 },
                { key: 'baby', label: tMerchants.baby || 'Bebek', default: { min: 0, max: 1 }, defaultPercent: 0 }
            ];
            
            ageTypes.forEach(ageType => {
                html += '<div class="form-group-inline age-percent-group">';
                html += '<label>' + ageType.label + ' ' + (tMerchants.age_range || 'Yaş Aralığı') + '</label>';
                html += '<div class="age-inputs-inline">';
                html += '<input type="number" name="kickback_person_age_range[' + ageType.key + '][min]" placeholder="' + (tMerchants.min_age || 'Min') + '" value="' + ageType.default.min + '" min="0" max="150" required />';
                html += '<span class="age-separator">-</span>';
                html += '<input type="number" name="kickback_person_age_range[' + ageType.key + '][max]" placeholder="' + (tMerchants.max_age || 'Max') + '" value="' + ageType.default.max + '" min="0" max="150" required />';
                html += '</div>';
                html += '<div class="percent-input-inline">';
                html += '<label>' + (tMerchants.percent || '%') + '</label>';
                html += '<input type="number" step="0.01" name="kickback_person_percent[' + ageType.key + ']" placeholder="0.00" value="' + ageType.defaultPercent + '" min="0" max="100" required />';
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            html += '</div>';
            container.innerHTML = html;
        } else if (percentType === 'regional') {
            // Bölgesel % - Turun bölgeleri
            if (!selectedTourId || tourRegions.length === 0) {
                container.innerHTML = '<div class="form-notice"><span class="material-symbols-rounded">info</span> ' + (tMerchants.select_tour_first || 'Please select a tour first') + '</div>';
                return;
            }
            
            let html = '<div class="form-section">';
            html += '<h4>' + (tMerchants.regional_percent || 'Bölgesel %') + '</h4>';
            
            tourRegions.forEach(region => {
                html += '<div class="form-group">';
                html += '<label>' + (region.name || 'Region') + ' % *</label>';
                html += '<input type="number" step="0.01" name="kickback_person_regional_percent[' + region.id + ']" placeholder="0.00" min="0" max="100" required />';
                html += '</div>';
            });
            
            html += '</div>';
            container.innerHTML = html;
        }
    }
    
    // Render kickback person amount fields (with age ranges)
    function renderKickbackPersonAmountFields(amountType) {
        const container = document.getElementById('kickbackPersonAmountFieldsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (amountType === 'fixed') {
            // Sabit Tutar + Yaş aralıkları ve tutarlar
            let html = '<div class="form-row-inline">';
            html += '<div class="form-group-inline">';
            html += '<label>' + (tMerchants.amount || 'Tutar') + ' *</label>';
            html += '<div class="price-input-group-inline">';
            html += '<input type="number" step="0.01" name="kickback_person_fixed_amount" placeholder="0.00" min="0" required />';
            html += '<select name="kickback_person_fixed_currency" required>';
            html += '<option value="">' + (tCommon.select || 'Select') + '</option>';
            currenciesList.forEach(currency => {
                html += '<option value="' + currency.code + '">' + currency.code + ' - ' + (currency.name || '') + '</option>';
            });
            html += '</select>';
            html += '</div>';
            html += '<span class="input-error-message"></span>';
            html += '</div>';
            html += '</div>';
            
            // Age ranges and amounts
            html += '<div class="age-amounts-section">';
            html += '<h4>' + (tMerchants.age_ranges_amounts || 'Yaş Aralıkları ve Tutarlar') + '</h4>';
            html += '<div class="form-row-inline">';
            
            const ageTypes = [
                { key: 'adult', label: tMerchants.adult || 'Yetişkin', default: { min: 18, max: 100 } },
                { key: 'child', label: tMerchants.child || 'Çocuk', default: { min: 2, max: 17 } },
                { key: 'baby', label: tMerchants.baby || 'Bebek', default: { min: 0, max: 1 } }
            ];
            
            ageTypes.forEach(ageType => {
                html += '<div class="form-group-inline age-amount-group">';
                html += '<label>' + ageType.label + ' ' + (tMerchants.age_range || 'Yaş Aralığı') + '</label>';
                html += '<div class="age-inputs-inline">';
                html += '<input type="number" name="kickback_person_amount_age_range[' + ageType.key + '][min]" placeholder="' + (tMerchants.min_age || 'Min') + '" value="' + ageType.default.min + '" min="0" max="150" required />';
                html += '<span class="age-separator">-</span>';
                html += '<input type="number" name="kickback_person_amount_age_range[' + ageType.key + '][max]" placeholder="' + (tMerchants.max_age || 'Max') + '" value="' + ageType.default.max + '" min="0" max="150" required />';
                html += '</div>';
                html += '<div class="amount-input-group-inline">';
                html += '<label>' + (tMerchants.amount || 'Tutar') + '</label>';
                html += '<input type="number" step="0.01" name="kickback_person_amount[' + ageType.key + ']" placeholder="0.00" min="0" required />';
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            html += '</div>';
            container.innerHTML = html;
        } else if (amountType === 'regional') {
            // Bölgesel Tutar - Turun bölgeleri ve her bölge için fiyatlar
            if (!selectedTourId || tourRegions.length === 0) {
                container.innerHTML = '<div class="form-notice"><span class="material-symbols-rounded">info</span> ' + (tMerchants.select_tour_first || 'Please select a tour first') + '</div>';
                return;
            }
            
            let html = '<div class="form-section">';
            html += '<h4>' + (tMerchants.regional_amount || 'Bölgesel Tutar') + '</h4>';
            
            tourRegions.forEach(region => {
                html += '<div class="form-group">';
                html += '<label>' + (region.name || 'Region') + ' ' + (tMerchants.amount || 'Tutar') + ' *</label>';
                html += '<div class="price-input-group">';
                html += '<input type="number" step="0.01" name="kickback_person_regional_amount[' + region.id + ']" placeholder="0.00" min="0" required />';
                html += '<select name="kickback_person_regional_currency[' + region.id + ']" required>';
                html += '<option value="">' + (tCommon.select || 'Select') + '</option>';
                currenciesList.forEach(currency => {
                    html += '<option value="' + currency.code + '">' + currency.code + ' - ' + (currency.name || '') + '</option>';
                });
                html += '</select>';
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            container.innerHTML = html;
        }
    }
    
})();

