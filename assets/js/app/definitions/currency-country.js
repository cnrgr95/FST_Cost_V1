// Currency Country Detail Page JS
(function(){
    'use strict';

    let pageConfig = {};
    const cfg = document.getElementById('page-config');
    if (cfg) {
        try { pageConfig = JSON.parse(cfg.textContent); } catch(e) { console.error(e); }
    }
    const API_BASE = pageConfig.apiBase || 'api/definitions/currencies.php';
    const COUNTRY_ID = pageConfig.countryId || 0;
    const t = (pageConfig.translations || {});
    const tCurrencies = t.currencies || {};
    const tCommon = t.common || {};

    let countries = [];
    let allCurrencies = [];
    let countryCurrencies = [];
    let currentCountry = null;
    let currentEditRate = null;
    let currentEditDate = null;

    // Use formatDateDisplay from global date-range-picker library
    function formatDateDisplay(isoStr){
        if (typeof window.formatDateDisplay === 'function') {
            return window.formatDateDisplay(isoStr);
        }
        // Fallback if global function not available
        if (!isoStr) return '';
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoStr)) return isoStr;
        if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
            const d = new Date(isoStr + 'T00:00:00');
            if (d && !isNaN(d.getTime())) {
                const day=d.getDate().toString().padStart(2,'0'); 
                const m=(d.getMonth()+1).toString().padStart(2,'0'); 
                return `${day}/${m}/${d.getFullYear()}`;
            }
        }
        return isoStr;
    }

    document.addEventListener('DOMContentLoaded', async function(){
        await loadCountries();
        currentCountry = countries.find(c => c.id == COUNTRY_ID) || null;
        if (currentCountry) {
            const title = document.getElementById('ccCountryTitle');
            if (title) title.textContent = `${tCurrencies.manage_country||'Manage Country'} - ${currentCountry.name} (${currentCountry.code||''})`;
            // base currency select loads currencies on-demand when modal opens
        }
        await loadCountryCurrencies(COUNTRY_ID);
        renderCountryCurrencies();
        fillRateCurrencySelect();
        // lazy-load rates after first paint
        const ratesContainer = document.getElementById('ccRatesList');
        if (ratesContainer) {
            const loadingMsg = tCurrencies.loading_rates || tCurrencies.loading_exchange_rates || 'Loading exchange rates...';
            ratesContainer.innerHTML = `<div class="loading"><span class="material-symbols-rounded">sync</span><p>${loadingMsg}</p></div>`;
        }
        (window.requestIdleCallback||function(cb){ return setTimeout(cb, 120); })(async function(){
            await loadRates();
            renderRatesPivot();
        });
        bindEvents();
    });

    function bindEvents(){
        const saveBase = document.getElementById('ccSaveBase');
        if (saveBase) saveBase.addEventListener('click', saveBaseCurrency);
        const openBase = document.getElementById('ccOpenBase');
        if (openBase) openBase.addEventListener('click', async function(){
            if (!allCurrencies.length) { await loadAllCurrencies(); }
            fillBaseCurrencySelect(currentCountry);
            openModal('ccBaseModal');
        });
        const baseClose = document.getElementById('ccBaseClose');
        const baseCancel = document.getElementById('ccBaseCancel');
        if (baseClose) baseClose.addEventListener('click', function(){ closeModal('ccBaseModal'); });
        if (baseCancel) baseCancel.addEventListener('click', function(){ closeModal('ccBaseModal'); });
        const addBtn = document.getElementById('ccAddBtn');
        if (addBtn) addBtn.addEventListener('click', addCountryCurrency);
        const openAdd = document.getElementById('ccOpenAdd');
        if (openAdd) openAdd.addEventListener('click', async function(){
            if (!allCurrencies.length) { await loadAllCurrencies(); }
            fillAddCurrencySelect();
            openModal('ccAddCurModal');
        });
        const addClose = document.getElementById('ccAddClose');
        const addCancel = document.getElementById('ccAddCancel');
        if (addClose) addClose.addEventListener('click', function(){ closeModal('ccAddCurModal'); });
        if (addCancel) addCancel.addEventListener('click', function(){ closeModal('ccAddCurModal'); });
        const openCur = document.getElementById('ccOpenCurrencies');
        if (openCur) openCur.addEventListener('click', async function(){
            try {
                await loadCountryCurrencies(COUNTRY_ID);
                renderCountryCurrencies();
                openModal('ccCurrenciesModal');
            } catch(e){ console.error(e); }
        });
        const curClose = document.getElementById('ccCurrenciesClose');
        const curCancel = document.getElementById('ccCurrenciesCancel');
        if (curClose) curClose.addEventListener('click', function(){ closeModal('ccCurrenciesModal'); });
        if (curCancel) curCancel.addEventListener('click', function(){ closeModal('ccCurrenciesModal'); });
        const addRange = document.getElementById('ccAddRateRange');
        if (addRange) addRange.addEventListener('click', addRateRange);
        const fetchCbrt = document.getElementById('ccFetchCbrt');
        const fetchCbrtBulk = document.getElementById('ccFetchCbrtBulk');
        if (fetchCbrt || fetchCbrtBulk) {
            // Show only for Turkey
            const isTR = (currentCountry?.code||'').toUpperCase() === 'TR';
            if (!isTR) {
                if (fetchCbrt) fetchCbrt.style.display = 'none'; // Conditional visibility for Turkey
                if (fetchCbrtBulk) fetchCbrtBulk.style.display = 'none'; // Conditional visibility for Turkey
            } else {
                if (fetchCbrt) fetchCbrt.addEventListener('click', fetchCbrtRates);
                if (fetchCbrtBulk) fetchCbrtBulk.addEventListener('click', fetchCbrtRatesBulk);
            }
        }

        // Edit modal controls
        const mClose = document.getElementById('ccRateEditClose');
        const mCancel = document.getElementById('ccRateEditCancel');
        const mSave = document.getElementById('ccRateEditSave');
        const modal = document.getElementById('ccRateEditModal');
        if (mClose) mClose.addEventListener('click', closeEditModal);
        if (mCancel) mCancel.addEventListener('click', closeEditModal);
        if (mSave) mSave.addEventListener('click', saveEditModal);
        if (modal) {
            modal.addEventListener('click', function(e){ if (e.target === modal) closeEditModal(); });
        }

        // Date edit modal controls
        const dClose = document.getElementById('ccDateEditClose');
        const dCancel = document.getElementById('ccDateEditCancel');
        const dSave = document.getElementById('ccDateEditSave');
        const dModal = document.getElementById('ccDateEditModal');
        if (dClose) dClose.addEventListener('click', closeDateEditModal);
        if (dCancel) dCancel.addEventListener('click', closeDateEditModal);
        if (dSave) dSave.addEventListener('click', saveDateEditModal);
        if (dModal) { dModal.addEventListener('click', function(e){ if (e.target === dModal) closeDateEditModal(); }); }

        // Initialize date range picker using global library
        if (typeof window.initializeDateRangePicker === 'function') {
            const translations = {
                common: tCommon,
                clear: tCommon.cancel,
                apply: tCommon.confirm
            };
            window.initializeDateRangePicker('ccRateRange', 'ccRateStart', 'ccRateEnd', 'ccRangePicker', translations);
        }
    }

    async function loadCountries(){
        try {
            const resp = await fetch(`${API_BASE}?action=countries`);
            const res = await resp.json();
            if (res.success) countries = res.data || []; else countries = [];
        } catch(e){ console.error(e); countries = []; }
    }

    async function loadAllCurrencies(){
        try {
            const resp = await fetch(`${API_BASE}?action=currencies`);
            const res = await resp.json();
            if (res.success) allCurrencies = res.data || []; else allCurrencies = [];
            fillAddCurrencySelect();
            fillBaseCurrencySelect(currentCountry);
        } catch(e){ console.error(e); allCurrencies = []; }
    }

    async function loadCountryCurrencies(countryId){
        try {
            const resp = await fetch(`${API_BASE}?action=country_currencies&country_id=${countryId}`);
            const res = await resp.json();
            if (res.success) countryCurrencies = res.data || []; else countryCurrencies = [];
            fillAddCurrencySelect();
        } catch(e){ console.error(e); countryCurrencies = []; }
    }

    function fillBaseCurrencySelect(country){
        const sel = document.getElementById('ccBaseCurrency');
        if (!sel) return;
        sel.innerHTML = `<option value="">${tCurrencies.select_currency||'Select currency'}</option>`;
        (allCurrencies||[]).filter(c=>c.is_active).forEach(c=>{
            const opt = document.createElement('option');
            const code = (c.code||'').toUpperCase();
            opt.value = code; opt.textContent = `${code} - ${c.name||''}`;
            sel.appendChild(opt);
        });
        if (country && country.local_currency_code) sel.value = (country.local_currency_code||'').toUpperCase();
    }

    function fillAddCurrencySelect(){
        const sel = document.getElementById('ccAddCurrency');
        if (!sel) return;
        const assigned = new Set(countryCurrencies.map(x => (x.currency_code||'').toUpperCase()));
        const baseCode = (currentCountry?.local_currency_code||'').toUpperCase();
        sel.innerHTML = `<option value="">${tCurrencies.select_currency||'Select currency'}</option>`;
        (allCurrencies||[]).filter(c=>c.is_active).forEach(c=>{
            const code = (c.code||'').toUpperCase();
            if (code === baseCode) return; // Do not allow adding country's base currency here
            const opt = document.createElement('option');
            opt.value = code; opt.textContent = `${code} - ${c.name||''}`;
            if (assigned.has(code)) opt.disabled = true;
            sel.appendChild(opt);
        });
    }

    function fillRateCurrencySelect(){
        const sel = document.getElementById('ccRateCurrency');
        if (!sel) return;
        const assigned = countryCurrencies
            .filter(x => (x.is_active===true)||(x.is_active==='t')||(x.is_active===1)||(x.is_active==='1'))
            .map(x => (x.currency_code||'').toUpperCase());
        sel.innerHTML = `<option value="">${tCurrencies.select_currency||'Select currency'}</option>`;
        const baseCode = (currentCountry?.local_currency_code||'').toUpperCase();
        assigned.filter(code => code !== baseCode).forEach(code => {
            const name = (countryCurrencies.find(c=> (c.currency_code||'').toUpperCase()===code)?.currency_name)||'';
            const opt = document.createElement('option');
            opt.value = code; opt.textContent = `${code} - ${name}`;
            sel.appendChild(opt);
        });
    }

    async function loadRates(){
        const ratesContainer = document.getElementById('ccRatesList');
        const loadingMsg = tCurrencies.loading_rates || tCurrencies.loading_exchange_rates || 'Kurlar yükleniyor...';
        if (ratesContainer && (!window.__ccRates || window.__ccRates.length === 0)) {
            ratesContainer.innerHTML = `<div class="loading"><span class="material-symbols-rounded">sync</span><p>${loadingMsg}</p></div>`;
        }
        let attempt = 0; const maxAttempts = 2; let lastErr = null;
        while (attempt < maxAttempts) {
            try {
                const resp = await fetch(`${API_BASE}?action=rates&country_id=${COUNTRY_ID}`);
                const res = await resp.json();
                if (res.success) { window.__ccRates = res.data || []; return; }
                window.__ccRates = []; return;
            } catch(e){ lastErr = e; attempt++; await sleep(150); }
        }
        console.error(lastErr||new Error('Failed to fetch rates'));
        window.__ccRates = [];
    }

    function addRatePayload(date, start, end){
        const code = (document.getElementById('ccRateCurrency')?.value)||'';
        const rateVal = parseFloat(document.getElementById('ccRateValue')?.value||'0');
        return { country_id: COUNTRY_ID, currency_code: code, rate: rateVal, rate_date: date||undefined, start_date: start||undefined, end_date: end||undefined };
    }

    // Expand date range to array of dates
    function expandDateRange(start, end) {
        const dates = [];
        const startDate = new Date(start + 'T00:00:00');
        const endDate = new Date(end + 'T00:00:00');
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return dates;
        
        const current = new Date(startDate);
        while (current <= endDate) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${day}`);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }

    async function addRateRange(){
        const code = (document.getElementById('ccRateCurrency')?.value)||'';
        let start = (document.getElementById('ccRateStart')?.value)||'';
        let end = (document.getElementById('ccRateEnd')?.value)||'';
        const rateStr = (document.getElementById('ccRateValue')?.value)||'';
        
        // Both start and end date are required
        if (!code || !rateStr) { 
            showToast('warning', tCommon.fill_required_fields || 'Fill required fields'); 
            return; 
        }
        
        // Validate start date is required
        if (!start) {
            showToast('warning', tCommon.start_date_required || 'Start date is required'); 
            return; 
        }
        
        // If start is set but end is not, auto-fill end with same date (single day)
        if (start && !end) {
            end = start;
            const endInput = document.getElementById('ccRateEnd');
            if (endInput) endInput.value = start;
        }
        
        // Final validation - end date must be set
        if (!end) {
            showToast('warning', tCommon.end_date_required || 'End date is required'); 
            return; 
        }
        if (new Date(start) > new Date(end)) { showToast('warning', (tCurrencies.invalid_date_range||'Start date cannot be after end date')); return; }
        
        // Check if any dates in the range already exist for this currency
        if (window.__ccRates && window.__ccRates.length > 0) {
            const existingRates = window.__ccRates.filter(r => 
                (r.currency_code || '').toUpperCase() === code.toUpperCase()
            );
            const dateRange = expandDateRange(start, end);
            const existingDates = new Set(existingRates.map(r => r.rate_date));
            const conflictingDates = dateRange.filter(d => existingDates.has(d));
            
            if (conflictingDates.length > 0) {
                const conflictingDatesFormatted = conflictingDates.slice(0, 5).map(d => formatDateDisplay(d)).join(', ') + (conflictingDates.length > 5 ? '...' : '');
                showToast('error', (tCurrencies.duplicate_rates_error || 'Bu tarihler için kur zaten mevcut') + ': ' + conflictingDatesFormatted);
                return;
            }
        }
        
        const payload = addRatePayload(null, start, end);
        try {
            // Get CSRF token
            let token = null;
            if (typeof window.getCsrfToken === 'function') {
                token = window.getCsrfToken();
            } else if (window.pageConfig && window.pageConfig.csrfToken) {
                token = window.pageConfig.csrfToken;
            } else if (pageConfig && pageConfig.csrfToken) {
                token = pageConfig.csrfToken;
            }
            
            if (!token) {
                console.error('CSRF token not found');
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            payload.csrf_token = token;
            const resp = await fetch(`${API_BASE}?action=rate_manual`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
            const res = await resp.json();
            if (!res.success) { showToast('error', res.message || (tCommon.save_failed||'Save failed')); return; }
            const loadingMsg = tCurrencies.loading_rates || tCurrencies.loading_exchange_rates || 'Loading exchange rates...';
            const ratesContainer = document.getElementById('ccRatesList');
            if (ratesContainer) {
                ratesContainer.innerHTML = `<div class="loading"><span class="material-symbols-rounded">sync</span><p>${loadingMsg}</p></div>`;
            }
            await loadRates(); renderRatesPivot(); showToast('success', (tCurrencies.rates_added||'Rates added'));
        } catch(e){ console.error(e); showToast('error', tCommon.save_failed||'Save failed'); }
    }

    async function fetchCbrtRates(){
        const code = (document.getElementById('ccRateCurrency')?.value)||'';
        const start = (document.getElementById('ccRateStart')?.value)||'';
        const end = (document.getElementById('ccRateEnd')?.value)||'';
        
        // Support single date: if only start is provided, or start equals end, use single date
        if (!code || !start) { showToast('warning', tCommon.fill_required_fields || 'Fill required fields'); return; }
        
        // Show loading immediately
        const loadingMsg = tCurrencies.loading_rates || tCurrencies.loading_exchange_rates || 'Kurlar yükleniyor...';
        const ratesContainer = document.getElementById('ccRatesList');
        if (ratesContainer) {
            ratesContainer.innerHTML = `<div class="loading"><span class="material-symbols-rounded">sync</span><p>${loadingMsg}</p></div>`;
        }
        
        let payload;
        const useSingleDate = !end || start === end;
        if (useSingleDate) {
            // Single date
            payload = { country_id: COUNTRY_ID, currency_code: code, rate_date: start };
        } else {
            // Date range
            if (new Date(start) > new Date(end)) { 
                showToast('warning', (tCurrencies.invalid_date_range||'Start date cannot be after end date')); 
                renderRatesPivot(); // Restore previous view
                return; 
            }
            payload = { country_id: COUNTRY_ID, currency_code: code, start_date: start, end_date: end };
        }
        
        try {
            // Get CSRF token
            let token = null;
            if (typeof window.getCsrfToken === 'function') {
                token = window.getCsrfToken();
            } else if (window.pageConfig && window.pageConfig.csrfToken) {
                token = window.pageConfig.csrfToken;
            } else if (pageConfig && pageConfig.csrfToken) {
                token = pageConfig.csrfToken;
            }
            
            if (!token) {
                console.error('CSRF token not found');
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            payload.csrf_token = token;
            const resp = await fetch(`${API_BASE}?action=rate_cbrt`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
            const res = await resp.json();
            if (!res.success) { 
                await loadRates(); renderRatesPivot();
                showToast('error', res.message || (tCommon.save_failed||'Save failed')); 
                return; 
            }
            await loadRates(); renderRatesPivot(); 
            
            // Show dates dialog for not found dates - ALWAYS show if there are any
            if (res.not_found > 0) {
                const notFoundDates = res.not_found_dates || [];
                
                // Always show dialog if we have dates list from API
                if (notFoundDates && Array.isArray(notFoundDates) && notFoundDates.length > 0) {
                    const title = (res.inserted > 0 || res.already_exists > 0)
                        ? (tCurrencies.dates_had_no_rates || '{count} dates had no rates found').replace('{count}', res.not_found)
                        : (tCurrencies.rates_not_available || 'Rates not available');
                    
                    // Show dialog - ensure it's displayed
                    setTimeout(() => {
                        if (typeof window.showDatesDialog === 'function') {
                            try {
                                window.showDatesDialog(title, notFoundDates);
                            } catch (e) {
                                console.error('Error calling showDatesDialog:', e);
                                // Fallback: show dates in toast
                                const datesStr = notFoundDates.join(', ');
                                showToast('warning', `${title} - ${tCurrencies.dates_without_rates || 'Dates without rates'}: ${datesStr}`);
                            }
                        } else {
                            // Function not available, show dates in toast
                            const datesStr = notFoundDates.join(', ');
                            showToast('warning', `${title} - ${tCurrencies.dates_without_rates || 'Dates without rates'}: ${datesStr}`);
                        }
                    }, 100);
                } else {
                    // No dates list in response, show toast with count
                    const titleMsg = (tCurrencies.dates_had_no_rates || '{count} dates had no rates found').replace('{count}', res.not_found);
                    showToast('warning', titleMsg);
                }
            }
            
            // If nothing was found at all, return early
            if (res.not_found > 0 && (res.inserted === 0 || !res.inserted) && (res.already_exists === 0 || !res.already_exists)) {
                return;
            }
            
            // Show success message if we have any results
            let msg = tCurrencies.rates_added || 'Rates added';
            if (res.already_exists && res.already_exists > 0) {
                const parts = [];
                if (res.inserted > 0) parts.push(`${res.inserted} ${tCurrencies.new_rates || 'new'}`);
                if (res.already_exists > 0) parts.push(`${res.already_exists} ${tCurrencies.already_exists || 'already exists'}`);
                msg += ` (${parts.join(', ')})`;
            } else if (res.inserted) {
                msg = `${msg} (${res.inserted} ${tCurrencies.added || 'added'})`;
            }
            
            if (res.inserted > 0 || res.already_exists > 0) {
                showToast('success', msg);
            }
        } catch(e){ 
            console.error(e); 
            await loadRates(); renderRatesPivot();
            showToast('error', tCommon.save_failed||'Save failed'); 
        }
    }

    async function fetchCbrtRatesBulk(){
        const start = (document.getElementById('ccRateStart')?.value)||'';
        const end = (document.getElementById('ccRateEnd')?.value)||'';
        if (!start) { showToast('warning', tCommon.fill_required_fields || 'Fill required fields'); return; }
        
        // Show loading immediately
        const loadingMsg = tCurrencies.loading_rates || tCurrencies.loading_exchange_rates || 'Kurlar yükleniyor...';
        const ratesContainer = document.getElementById('ccRatesList');
        if (ratesContainer) {
            ratesContainer.innerHTML = `<div class="loading"><span class="material-symbols-rounded">sync</span><p>${loadingMsg}</p></div>`;
        }
        
        // Support single date or date range
        const useSingleDate = !end || start === end;
        if (end && new Date(start) > new Date(end)) { 
            showToast('warning', (tCurrencies.invalid_date_range||'Start date cannot be after end date')); 
            renderRatesPivot(); // Restore previous view
            return; 
        }
        
        const baseCode = (currentCountry?.local_currency_code||'').toUpperCase();
        const codes = countryCurrencies
            .filter(x => (x.is_active===true)||(x.is_active==='t')||(x.is_active===1)||(x.is_active==='1'))
            .map(x => (x.currency_code||'').toUpperCase())
            .filter(c => c && c !== baseCode);
        if (!codes.length) { 
            renderRatesPivot(); // Restore previous view
            showToast('warning', tCurrencies.no_country_currencies || 'No currencies assigned'); 
            return; 
        }
        
            try {
            const chunks = chunkArray(codes, 3);
            let ok = 0; let total = 0;
            let totalInserted = 0; let totalAlreadyExists = 0; let totalNotFound = 0;
            let allNotFoundDates = []; // Collect all dates that had no rates
            for (const grp of chunks){
                const tasks = grp.map(code => {
                    const payload = useSingleDate 
                        ? { country_id: COUNTRY_ID, currency_code: code, rate_date: start }
                        : { country_id: COUNTRY_ID, currency_code: code, start_date: start, end_date: end };
                    // Get CSRF token for retry
                    let token = null;
                    if (typeof window.getCsrfToken === 'function') {
                        token = window.getCsrfToken();
                    } else if (window.pageConfig && window.pageConfig.csrfToken) {
                        token = window.pageConfig.csrfToken;
                    } else if (pageConfig && pageConfig.csrfToken) {
                        token = pageConfig.csrfToken;
                    }
                    if (token) {
                        payload.csrf_token = token;
                    }
                    return fetch(`${API_BASE}?action=rate_cbrt`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
                        .then(r=>r.json()).catch(()=>({success:false}));
                });
                const results = await Promise.all(tasks);
                results.forEach(r => {
                    if (r && r.success) {
                        ok++;
                        totalInserted += (r.inserted || 0);
                        totalAlreadyExists += (r.already_exists || 0);
                        totalNotFound += (r.not_found || 0);
                        // Collect all not found dates from this response
                        if (r.not_found_dates && Array.isArray(r.not_found_dates)) {
                            r.not_found_dates.forEach(date => {
                                if (!allNotFoundDates.includes(date)) {
                                    allNotFoundDates.push(date);
                                }
                            });
                        }
                    }
                });
                total += results.length;
                await sleep(120);
            }
            // Sort dates
            allNotFoundDates.sort();
            
            await loadRates(); renderRatesPivot();
            
            // If nothing was found at all, show warning with dates
            if (ok === 0 && totalInserted === 0 && totalAlreadyExists === 0) {
                if (totalNotFound > 0 && allNotFoundDates.length > 0) {
                    // Show dialog with all dates that had no rates
                    showDatesDialog(
                        tCurrencies.rates_not_available || 'Rates not available',
                        allNotFoundDates
                    );
                } else {
                    const dateRange = useSingleDate ? start : `${start} - ${end}`;
                    showToast('warning', `${tCurrencies.rates_not_available || 'Rates not available'} - ${tCurrencies.selected_dates || 'Selected dates'}: ${dateRange}`);
                }
            } else {
                let msg = tCurrencies.rates_added || 'Rates added';
                const parts = [];
                if (totalInserted > 0) parts.push(`${totalInserted} ${tCurrencies.new_rates || 'new'}`);
                if (totalAlreadyExists > 0) parts.push(`${totalAlreadyExists} ${tCurrencies.already_exists || 'already exists'}`);
                
                if (parts.length > 0) {
                    msg += ` (${parts.join(', ')})`;
                } else {
                    msg += ` (${ok}/${total} ${tCurrencies.successful || 'successful'})`;
                }
                
                // Show dialog with dates for not found rates
                if (totalNotFound > 0 && allNotFoundDates.length > 0) {
                    setTimeout(() => {
                        if (typeof window.showDatesDialog === 'function') {
                            try {
                                window.showDatesDialog(
                                    (tCurrencies.dates_had_no_rates || '{count} dates had no rates found').replace('{count}', totalNotFound),
                                    allNotFoundDates
                                );
                            } catch (e) {
                                console.error('Error showing dates dialog:', e);
                                // Fallback: show dates in toast
                                const datesStr = allNotFoundDates.join(', ');
                                const titleMsg = (tCurrencies.dates_had_no_rates || '{count} dates had no rates found').replace('{count}', totalNotFound);
                                showToast('warning', `${titleMsg} - ${tCurrencies.dates_without_rates || 'Dates without rates'}: ${datesStr}`);
                            }
                        } else {
                            // Fallback if function not available
                            const datesStr = allNotFoundDates.join(', ');
                            const titleMsg = (tCurrencies.dates_had_no_rates || '{count} dates had no rates found').replace('{count}', totalNotFound);
                            showToast('warning', `${titleMsg} - ${tCurrencies.dates_without_rates || 'Dates without rates'}: ${datesStr}`);
                        }
                    }, 100);
                } else if (totalNotFound > 0) {
                    // Fallback if dates not available
                    const titleMsg = (tCurrencies.dates_had_no_rates || '{count} dates had no rates found').replace('{count}', totalNotFound);
                    showToast('warning', titleMsg);
                }
                
                if (totalInserted > 0 || totalAlreadyExists > 0) {
                    showToast('success', msg);
                }
            }
        } catch(e){ 
            console.error(e); 
            await loadRates(); renderRatesPivot();
            showToast('error', tCommon.save_failed||'Save failed'); 
        }
    }

    function chunkArray(arr, size){
        const out = []; for (let i=0;i<arr.length;i+=size){ out.push(arr.slice(i, i+size)); } return out;
    }
    function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

    function renderRatesPivot(){
        const container = document.getElementById('ccRatesList');
        if (!container) return;
        const rows = window.__ccRates || [];
        // Build list of currency codes from countryCurrencies to order columns
        const baseCode = (currentCountry?.local_currency_code||'').toUpperCase();
        const codes = countryCurrencies
            .filter(x => (x.is_active===true)||(x.is_active==='t')||(x.is_active===1)||(x.is_active==='1'))
            .map(x => (x.currency_code||'').toUpperCase())
            .filter(c => c !== baseCode);
        const byDate = {};
        rows.forEach(r => {
            const d = r.rate_date; const code = (r.currency_code||'').toUpperCase();
            if (code === baseCode) return;
            byDate[d] = byDate[d] || {};
            byDate[d][code] = { id: r.id, rate: r.rate, source: r.source };
        });
        const dates = Object.keys(byDate).sort().reverse();
        if (dates.length === 0) { container.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">inventory_2</span><h3>${tCurrencies.no_rates||'No rates'}</h3></div>`; return; }
        let html = '<table class="table"><thead><tr><th>'+(tCurrencies.date||'Date')+'</th>';
        codes.forEach(c => {
            const meta = countryCurrencies.find(x => (x.currency_code||'').toUpperCase() === c);
            const sym = meta && meta.symbol ? ` ${meta.symbol}` : '';
            html += `<th>${c}${sym}</th>`;
        });
        html += `<th>${tCurrencies.actions||'Actions'}</th></tr></thead><tbody>`;
        dates.forEach(d => {
            // Format date as DD/MM/YYYY
            const formattedDate = formatDateDisplay(d) || d;
            html += `<tr><td>${formattedDate}</td>`;
            codes.forEach(c => {
                const obj = byDate[d][c];
                if (obj && obj.id) {
                    html += `<td>${Number(obj.rate).toFixed(6)}</td>`;
                } else {
                    html += `<td>-</td>`;
                }
            });
            html += `<td>
                        <button class="btn-icon" data-act="edit-date" data-date="${d}" title="${tCurrencies.edit||'Edit'}"><span class="material-symbols-rounded">edit_note</span></button>
                        <button class="btn-icon btn-danger" data-act="del-date" data-date="${d}" title="${tCurrencies.delete||'Delete'}"><span class="material-symbols-rounded">delete</span></button>
                     </td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
        // Row actions
        // Date row edit handler
        container.querySelectorAll('button[data-act="edit-date"][data-date]').forEach(btn => {
            btn.addEventListener('click', function(){
                const d = this.getAttribute('data-date');
                // rebuild map for this date
                const rowsForDate = (window.__ccRates||[]).filter(r => r.rate_date === d);
                const mapByCode = {};
                rowsForDate.forEach(r => { const code = (r.currency_code||'').toUpperCase(); mapByCode[code] = { id: r.id, rate: r.rate }; });
                openDateEditModal(d, mapByCode);
            });
        });
        // Date row delete handler
        container.querySelectorAll('button[data-act="del-date"][data-date]').forEach(btn => {
            btn.addEventListener('click', function(){
                const d = this.getAttribute('data-date');
                // Use showConfirmDialog instead of confirm()
                const confirmMsg = tCommon.delete_confirm || 'Bu kaydı silmek istediğinizden emin misiniz?';
                showConfirmDialog(confirmMsg, async function() {
                    const resp = await window.apiFetch(`${API_BASE}?action=rates_by_date&country_id=${COUNTRY_ID}&date=${encodeURIComponent(d)}`, { method:'DELETE' });
                    const res = await resp.json();
                    if (!res.success) { showToast('error', res.message || (tCommon.delete_failed||'Delete failed')); return; }
                    const loadingMsg = tCurrencies.loading_rates || tCurrencies.loading_exchange_rates || 'Loading exchange rates...';
                    const ratesContainer = document.getElementById('ccRatesList');
                    if (ratesContainer) {
                        ratesContainer.innerHTML = `<div class="loading"><span class="material-symbols-rounded">sync</span><p>${loadingMsg}</p></div>`;
                    }
                    await loadRates(); renderRatesPivot(); showToast('success', tCommon.deleted_successfully||'Deleted');
                });
            });
        });
    }

    function openEditModal(row){
        currentEditRate = row;
        const modal = document.getElementById('ccRateEditModal');
        if (!modal) return;
        document.getElementById('ccRateEditCurrency').value = (row.currency_code||'').toUpperCase();
        const editDateInput = document.getElementById('ccRateEditDate');
        if (editDateInput) {
            const dateValue = row.rate_date || '';
            editDateInput.value = dateValue ? formatDateDisplay(dateValue) : '';
        }
        document.getElementById('ccRateEditValue').value = Number(row.rate).toFixed(6);
        document.getElementById('ccRateEditId').value = row.id;
        openModal('ccRateEditModal');
    }

    function closeEditModal(){
        closeModal('ccRateEditModal');
        currentEditRate = null;
    }

    async function saveEditModal(){
        const id = parseInt(document.getElementById('ccRateEditId').value||'0');
        const valStr = document.getElementById('ccRateEditValue').value||'';
        const num = parseFloat(valStr);
        if (!(num>0)) { showToast('warning', tCurrencies.rate_must_be_positive||'Rate must be > 0'); return; }
        try {
            // Get CSRF token
            let token = null;
            if (typeof window.getCsrfToken === 'function') {
                token = window.getCsrfToken();
            } else if (window.pageConfig && window.pageConfig.csrfToken) {
                token = window.pageConfig.csrfToken;
            } else if (pageConfig && pageConfig.csrfToken) {
                token = pageConfig.csrfToken;
            }
            
            if (!token) {
                console.error('CSRF token not found');
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            const resp = await fetch(`${API_BASE}?action=rate`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, rate: num, csrf_token: token }) });
            const res = await resp.json();
            if (!res.success) { showToast('error', res.message || (tCommon.update_failed||'Update failed')); return; }
            closeEditModal();
            const loadingMsg = tCurrencies.loading_rates || tCurrencies.loading_exchange_rates || 'Loading exchange rates...';
            const ratesContainer = document.getElementById('ccRatesList');
            if (ratesContainer) {
                ratesContainer.innerHTML = `<div class="loading"><span class="material-symbols-rounded">sync</span><p>${loadingMsg}</p></div>`;
            }
            await loadRates(); renderRatesPivot(); showToast('success', tCommon.saved_successfully||'Saved');
        } catch(e){ console.error(e); showToast('error', tCommon.update_failed||'Update failed'); }
    }

    function openDateEditModal(dateStr, mapByCode){
        currentEditDate = dateStr; // Store ISO format for API
        const modal = document.getElementById('ccDateEditModal');
        const dateInput = document.getElementById('ccDateEditDate');
        const list = document.getElementById('ccDateEditList');
        if (!modal || !dateInput || !list) return;
        dateInput.value = formatDateDisplay(dateStr); // Display in DD/MM/YYYY
        const baseCode = (currentCountry?.local_currency_code||'').toUpperCase();
        const codes = countryCurrencies
            .filter(x => (x.is_active===true)||(x.is_active==='t')||(x.is_active===1)||(x.is_active==='1'))
            .map(x => (x.currency_code||'').toUpperCase())
            .filter(c => c !== baseCode);
        let html = '';
        codes.forEach(code => {
            const obj = mapByCode[code];
            const val = obj && obj.rate ? Number(obj.rate).toFixed(6) : '';
            const id = obj && obj.id ? obj.id : '';
            const meta = countryCurrencies.find(x => (x.currency_code||'').toUpperCase() === code);
            const sym = meta && meta.symbol ? ` ${meta.symbol}` : '';
            html += `<div class="currency-country-date-edit-row">
                        <label class="currency-country-date-edit-label">${code}${sym}</label>
                        <input type="number" step="0.000001" class="ccDateEditInput" data-id="${id}" data-code="${code}" value="${val}" placeholder="${tCurrencies.rate||'Rate'}" />
                    </div>`;
        });
        list.innerHTML = html;
        openModal('ccDateEditModal');
    }

    function closeDateEditModal(){
        closeModal('ccDateEditModal');
        currentEditDate = null;
    }

    async function saveDateEditModal(){
        const inputs = Array.from(document.querySelectorAll('.ccDateEditInput'));
        const updates = [];
        for (const inp of inputs){
            const id = parseInt(inp.getAttribute('data-id')||'0');
            const code = inp.getAttribute('data-code');
            const valStr = inp.value.trim();
            if (valStr === '') continue;
            const num = parseFloat(valStr);
            if (!(num>0)) { showToast('warning', tCurrencies.rate_must_be_positive||'Rate must be > 0'); return; }
            // Get CSRF token
            let token = null;
            if (typeof window.getCsrfToken === 'function') {
                token = window.getCsrfToken();
            } else if (window.pageConfig && window.pageConfig.csrfToken) {
                token = window.pageConfig.csrfToken;
            } else if (pageConfig && pageConfig.csrfToken) {
                token = pageConfig.csrfToken;
            }
            
            if (!token) {
                console.error('CSRF token not found');
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            if (id>0){
                updates.push(fetch(`${API_BASE}?action=rate`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, rate: num, csrf_token: token }) }));
            } else {
                updates.push(fetch(`${API_BASE}?action=rate_manual`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ country_id: COUNTRY_ID, currency_code: code, rate: num, rate_date: currentEditDate, csrf_token: token }) }));
            }
        }
        try {
            await Promise.all(updates);
            closeDateEditModal();
            const loadingMsg = tCurrencies.loading_rates || tCurrencies.loading_exchange_rates || 'Loading exchange rates...';
            const ratesContainer = document.getElementById('ccRatesList');
            if (ratesContainer) {
                ratesContainer.innerHTML = `<div class="loading"><span class="material-symbols-rounded">sync</span><p>${loadingMsg}</p></div>`;
            }
            await loadRates(); renderRatesPivot();
            showToast('success', tCommon.saved_successfully||'Saved');
        } catch(e){ console.error(e); showToast('error', tCommon.save_failed||'Save failed'); }
    }

    async function saveBaseCurrency(){
        const sel = document.getElementById('ccBaseCurrency');
        if (!sel || !COUNTRY_ID) return;
        const code = sel.value || '';
        try {
            // Get CSRF token
            let token = null;
            if (typeof window.getCsrfToken === 'function') {
                token = window.getCsrfToken();
            } else if (window.pageConfig && window.pageConfig.csrfToken) {
                token = window.pageConfig.csrfToken;
            } else if (pageConfig && pageConfig.csrfToken) {
                token = pageConfig.csrfToken;
            }
            
            if (!token) {
                console.error('CSRF token not found');
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            const resp = await fetch(`${API_BASE}?action=country`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: COUNTRY_ID, local_currency_code: code, csrf_token: token }) });
            const res = await resp.json();
            if (res.success) showToast('success', tCommon.saved_successfully||'Saved'); else showToast('error', res.message || (tCommon.update_failed||'Update failed'));
        } catch(e){ console.error(e); showToast('error', tCommon.update_failed||'Update failed'); }
    }

    async function addCountryCurrency(){
        const sel = document.getElementById('ccAddCurrency');
        const unit = document.getElementById('ccUnitName');
        const isActive = document.getElementById('ccIsActive');
        const code = sel && sel.value ? sel.value : '';
        if (!code) { showToast('warning', tCurrencies.select_currency_first||'Please select a currency'); return; }
        try {
            // Get CSRF token
            let token = null;
            if (typeof window.getCsrfToken === 'function') {
                token = window.getCsrfToken();
            } else if (window.pageConfig && window.pageConfig.csrfToken) {
                token = window.pageConfig.csrfToken;
            } else if (pageConfig && pageConfig.csrfToken) {
                token = pageConfig.csrfToken;
            }
            
            if (!token) {
                console.error('CSRF token not found');
                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                return;
            }
            
            const resp = await fetch(`${API_BASE}?action=country_currency`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ country_id: COUNTRY_ID, currency_code: code, unit_name: unit?.value || '', is_active: !!(isActive && isActive.checked), csrf_token: token }) });
            const res = await resp.json();
            if (!res.success) { showToast('error', res.message || (tCommon.save_failed||'Save failed')); return; }
            unit && (unit.value = ''); sel && (sel.value = '');
            await loadCountryCurrencies(COUNTRY_ID);
            renderCountryCurrencies();
            showToast('success', tCommon.saved_successfully||'Saved');
        } catch(e){ console.error(e); showToast('error', tCommon.save_failed||'Save failed'); }
    }

    function renderCountryCurrencies(){
        const container = document.getElementById('ccCurrenciesList');
        if (!container) return;
        if (!countryCurrencies.length) { container.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">inventory_2</span><h3>${tCurrencies.no_country_currencies||'No currencies assigned'}</h3></div>`; return; }
        let html = '<table class="table"><thead><tr>' +
            `<th>${tCurrencies.currency||'Currency'}</th>`+
            `<th>${tCurrencies.unit_name||'Unit'}</th>`+
            `<th>${tCurrencies.status||'Status'}</th>`+
            `<th>${tCurrencies.actions||'Actions'}</th>`+
            '</tr></thead><tbody>';
        countryCurrencies.forEach(item=>{
            const active = (item.is_active===true)||(item.is_active==='t')||(item.is_active===1)||(item.is_active==='1');
            const toggleIcon = active ? 'toggle_on' : 'toggle_off';
            const toggleColor = active ? '#16a34a' : '#dc2626';
            html += `<tr>
                <td><strong>${(item.currency_code||'').toUpperCase()}</strong> - ${item.currency_name||''}</td>
                <td>${item.unit_name||'-'}</td>
                <td><span class="status-badge ${active?'active':'inactive'}">${active?(tCurrencies.active||'Active'):(tCurrencies.inactive||'Inactive')}</span></td>
                <td>
                    <button class="btn-icon" data-action="toggle" data-id="${item.id}" style="color:${toggleColor}"><span class="material-symbols-rounded">${toggleIcon}</span></button>
                    <button class="btn-icon" data-action="edit" data-id="${item.id}"><span class="material-symbols-rounded">edit</span></button>
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
        container.querySelectorAll('button[data-action][data-id]').forEach(btn=>{
            btn.addEventListener('click', async function(){
                const id = parseInt(this.getAttribute('data-id'));
                const action = this.getAttribute('data-action');
                const row = countryCurrencies.find(x=>x.id==id);
                if (!row) return;
                if (action==='toggle') {
                    const active = (row.is_active===true)||(row.is_active==='t')||(row.is_active===1)||(row.is_active==='1');
                    // Get CSRF token
                    let token = null;
                    if (typeof window.getCsrfToken === 'function') {
                        token = window.getCsrfToken();
                    } else if (window.pageConfig && window.pageConfig.csrfToken) {
                        token = window.pageConfig.csrfToken;
                    } else if (pageConfig && pageConfig.csrfToken) {
                        token = pageConfig.csrfToken;
                    }
                    if (token) {
                        await fetch(`${API_BASE}?action=country_currency`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, is_active: !active, csrf_token: token }) });
                    } else {
                        console.error('CSRF token not found');
                        showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                        return;
                    }
                } else if (action==='edit') {
                    // Use modal for unit name editing (already implemented in currencies.js)
                    // For currency-country.js, create a simple modal inline
                    const modalId = 'ccUnitNameEditModal';
                    let modal = document.getElementById(modalId);
                    
                    if (!modal) {
                        modal = document.createElement('div');
                        modal.id = modalId;
                        modal.className = 'modal';
                        modal.style.display = 'none';
                        modal.innerHTML = `
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h2>${tCurrencies.enter_unit_name || 'Enter unit name'}</h2>
                                    <button class="btn-close" id="ccCloseUnitNameModal">
                                        <span class="material-symbols-rounded">close</span>
                                    </button>
                                </div>
                                <div class="form-group">
                                    <label>${tCurrencies.unit_name || 'Unit name'}</label>
                                    <input type="text" id="ccUnitNameInput" placeholder="${tCurrencies.enter_unit_name || 'Enter unit name (leave empty to clear)'}" />
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn-secondary" id="ccCancelUnitNameModal">${tCommon.cancel || 'Cancel'}</button>
                                    <button type="button" class="btn-primary" id="ccSaveUnitNameModal">${tCommon.save || 'Save'}</button>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(modal);
                        
                        document.getElementById('ccCloseUnitNameModal').addEventListener('click', () => {
                            closeModal(modalId);
                        });
                        document.getElementById('ccCancelUnitNameModal').addEventListener('click', () => {
                            closeModal(modalId);
                        });
                        document.getElementById('ccSaveUnitNameModal').addEventListener('click', async () => {
                            const input = document.getElementById('ccUnitNameInput');
                            const newUnit = input.value.trim();
                            // Get CSRF token
                            let token = null;
                            if (typeof window.getCsrfToken === 'function') {
                                token = window.getCsrfToken();
                            } else if (window.pageConfig && window.pageConfig.csrfToken) {
                                token = window.pageConfig.csrfToken;
                            } else if (pageConfig && pageConfig.csrfToken) {
                                token = pageConfig.csrfToken;
                            }
                            if (token) {
                                await fetch(`${API_BASE}?action=country_currency`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, unit_name: newUnit, csrf_token: token }) });
                            } else {
                                console.error('CSRF token not found');
                                showToast('error', tCommon.security_token_expired || 'Security token expired. Please refresh the page and try again.');
                                return;
                            }
                            closeModal(modalId);
                            await loadCountryCurrencies(COUNTRY_ID);
                            renderCountryCurrencies();
                        });
                        modal.addEventListener('click', function(e) {
                            if (e.target === this) {
                                closeModal(modalId);
                            }
                        });
                    }
                    
                    document.getElementById('ccUnitNameInput').value = row.unit_name || '';
                    openModal(modalId);
                    setTimeout(() => document.getElementById('ccUnitNameInput')?.focus(), 100);
                }
                await loadCountryCurrencies(COUNTRY_ID);
                renderCountryCurrencies();
            });
        });
    }

    // Toast notifications use global showToast from toast.js
})();


