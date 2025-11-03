// Global Date Range Picker
// Usage: initializeDateRangePicker(rangeInputId, startInputId, endInputId, pickerId, translations)
(function(){
    'use strict';

    // Date formatting functions
    function toISO(d){ 
        const m=(d.getMonth()+1).toString().padStart(2,'0'); 
        const day=d.getDate().toString().padStart(2,'0'); 
        return `${d.getFullYear()}-${m}-${day}`; 
    }
    
    function toDDMMYYYY(d){ 
        const day=d.getDate().toString().padStart(2,'0'); 
        const m=(d.getMonth()+1).toString().padStart(2,'0'); 
        return `${day}/${m}/${d.getFullYear()}`; 
    }
    
    function parseDDMMYYYY(str){
        if (!str || typeof str !== 'string') return null;
        const parts = str.trim().split('/');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        // Validate month range
        if (month < 0 || month > 11) return null;
        // Create date and validate
        const d = new Date(year, month, day);
        // Check if date is valid (handles invalid dates like 31/11/2025)
        if (isNaN(d.getTime())) return null;
        // Verify the date components match (catches invalid dates like 31/11)
        if (d.getDate() !== day || d.getMonth() !== month || d.getFullYear() !== year) return null;
        return d;
    }
    
    function toISOFromDDMMYYYY(str){
        const d = parseDDMMYYYY(str);
        return d ? toISO(d) : null;
    }
    
    function formatDateDisplay(isoStr){
        if (!isoStr) return '';
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoStr)) return isoStr;
        if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
            const d = new Date(isoStr + 'T00:00:00');
            return d && !isNaN(d.getTime()) ? toDDMMYYYY(d) : isoStr;
        }
        const d = parseDDMMYYYY(isoStr);
        if (d && !isNaN(d.getTime())) return toDDMMYYYY(d);
        const dateObj = new Date(isoStr);
        return dateObj && !isNaN(dateObj.getTime()) ? toDDMMYYYY(dateObj) : isoStr;
    }

    // Export formatDateDisplay globally for use in other scripts
    window.formatDateDisplay = formatDateDisplay;

    function startOfMonth(d){ const x=new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
    function endOfMonth(d){ const x=new Date(d); x.setMonth(x.getMonth()+1,0); x.setHours(0,0,0,0); return x; }
    function addMonths(d, n){ const x=new Date(d); x.setMonth(x.getMonth()+n); return x; }
    function dayOfWeekMon(d){ const dow=d.getDay(); return dow===0?7:dow; }

    window.initializeDateRangePicker = function(rangeInputId, startInputId, endInputId, pickerId, translations = {}) {
        const rangeInput = document.getElementById(rangeInputId);
        const startInput = document.getElementById(startInputId);
        const endInput = document.getElementById(endInputId);
        const picker = document.getElementById(pickerId);
        
        if (!rangeInput || !startInput || !endInput || !picker) {
            console.warn('Date range picker: Required elements not found');
            return;
        }

        const tCommon = translations.common || {};
        const months = tCommon.months || {};
        const monthNames = months.names || ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const weekdays = tCommon.weekdays || {};
        const dayNames = weekdays.short || ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

        let rpOpen = false;
        let rpStart = '';
        let rpEnd = '';
        let rpAnchor = null;
        let rpBaseMonth = null;

        function formatMonthYear(d){ 
            const monthIndex = d.getMonth();
            const monthName = monthNames[monthIndex] || d.toLocaleString(undefined,{ month:'long' });
            return `${monthName} ${d.getFullYear()}`;
        }

        function renderRangePicker(){
            if (!picker) return;
            const base = startOfMonth(rpBaseMonth || new Date());
            const next = addMonths(base, 1);
            const header = `
                <div class="range-picker-header">
                    <button type="button" data-rp-act="prev" class="range-picker-nav-btn">
                        <span class="material-symbols-rounded">chevron_left</span>
                    </button>
                    <div class="range-picker-months">
                        <span>${formatMonthYear(base)}</span>
                        <span>${formatMonthYear(next)}</span>
                    </div>
                    <button type="button" data-rp-act="next" class="range-picker-nav-btn">
                        <span class="material-symbols-rounded">chevron_right</span>
                    </button>
                </div>`;
            const grids = `
                <div class="range-picker-grids">
                    ${renderMonthGrid(base)}
                    ${renderMonthGrid(next)}
                </div>
                <div class="range-picker-footer">
                    <button type="button" data-rp-act="clear" class="btn-secondary">${translations.clear || translations.common?.cancel || 'Clear'}</button>
                    <button type="button" data-rp-act="apply" class="btn-primary">${translations.apply || translations.common?.confirm || 'Confirm'}</button>
                </div>`;
            picker.innerHTML = header + grids;
            picker.querySelector('[data-rp-act="prev"]').onclick = () => { rpBaseMonth = addMonths(base, -1); renderRangePicker(); };
            picker.querySelector('[data-rp-act="next"]').onclick = () => { rpBaseMonth = addMonths(base, 1); renderRangePicker(); };
            picker.querySelector('[data-rp-act="clear"]').onclick = () => { rpStart=''; rpEnd=''; startInput.value=''; endInput.value=''; rangeInput.value=''; closeRangePicker(); };
            picker.querySelector('[data-rp-act="apply"]').onclick = () => { 
                // Start date is required
                if (!rpStart) {
                    closeRangePicker();
                    return;
                }
                
                // If end date is not set but start is set, auto-fill end with same date (single day)
                if (rpStart && !rpEnd) {
                    rpEnd = rpStart; // Auto-fill end date for single day selection
                }
                
                // Final check - both must be set
                if (!rpStart || !rpEnd) {
                    closeRangePicker();
                    return;
                }
                
                const startDisplay = formatDateDisplay(rpStart);
                const endDisplay = formatDateDisplay(rpEnd);
                
                // Set both hidden inputs
                startInput.value = rpStart;
                endInput.value = rpEnd;
                
                // Always show with " - " format
                rangeInput.value = `${startDisplay} - ${endDisplay}`;
                
                closeRangePicker(); 
            };
            picker.querySelectorAll('button[data-rp-date]').forEach(btn => {
                btn.onclick = () => handleDateClick(btn.getAttribute('data-rp-date'));
            });
        }

        function renderMonthGrid(monthDate){
            const first = startOfMonth(monthDate);
            const last = endOfMonth(monthDate);
            const lead = (dayOfWeekMon(first)+6)%7;
            const totalDays = last.getDate();
            const days = dayNames;
            let cells = '';
            for (let i=0;i<lead;i++){ cells += `<div></div>`; }
            for (let d=1; d<=totalDays; d++){
                const iso = toISO(new Date(first.getFullYear(), first.getMonth(), d));
                const inRange = rpStart && rpEnd && (new Date(iso) >= new Date(rpStart)) && (new Date(iso) <= new Date(rpEnd));
                const isStart = rpStart && iso===rpStart;
                const isEnd = rpEnd && iso===rpEnd;
                const cls = `rp-day${inRange?' in-range':''}${isStart?' start':''}${isEnd?' end':''}`;
                cells += `<button type="button" data-rp-date="${iso}" class="${cls}">${d}</button>`;
            }
            const weekHeader = `<div class="range-picker-weekdays">${days.map(w=>`<div>${w}</div>`).join('')}</div>`;
            const grid = `<div class="range-picker-days">${cells}</div>`;
            return `<div class="range-picker-month">${weekHeader}${grid}</div>`;
        }

        function handleDateClick(iso){
            // Strategy for single date selection:
            // - First click: set both start and end to same date (single day - auto-fill end)
            // - Second click (different date): set end date (range selection)
            // - Third click: reset to new single date (both same)
            
            if (!rpStart) {
                // No start date - set both to same date (single day - auto-fill end)
                rpStart = iso;
                rpEnd = iso; // Auto-fill end date with same date
            } else if (rpStart && !rpEnd) {
                // Start is set but end is not - set end date
                if (new Date(iso) < new Date(rpStart)) {
                    // If clicked date is before start, swap them
                    rpEnd = rpStart;
                    rpStart = iso;
                } else {
                    rpEnd = iso; // End date is now set
                }
            } else if (rpStart && rpEnd) {
                // Both dates are set - clicking resets to new single date (both same - auto-fill)
                rpStart = iso;
                rpEnd = iso; // Auto-fill end date with same date for single day selection
            }
            
            renderRangePicker();
        }

        function openRangePicker(anchor){
            if (!picker) return;
            rpAnchor = anchor;
            rpOpen = true;
            if (!rpBaseMonth) rpBaseMonth = new Date();
            renderRangePicker();
            // Remove hidden class to ensure picker is visible
            picker.classList.remove('hidden');
            picker.style.display = 'block';
            const rect = anchor.getBoundingClientRect();
            
            // Use fixed position to escape modal overflow constraints
            picker.style.position = 'fixed';
            
            // Calculate position ensuring picker stays within viewport
            const pickerHeight = picker.offsetHeight || 400; // Approximate height
            const pickerWidth = picker.offsetWidth || 600; // Approximate width
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            let top = rect.bottom + 6;
            let left = rect.left;
            
            // If picker would go below viewport, show it above the input
            if (top + pickerHeight > viewportHeight) {
                top = rect.top - pickerHeight - 6;
                // If still doesn't fit above, position at bottom of viewport
                if (top < 0) {
                    top = viewportHeight - pickerHeight - 10;
                }
            }
            
            // If picker would go beyond right edge, align to right
            if (left + pickerWidth > viewportWidth) {
                left = viewportWidth - pickerWidth - 10;
            }
            
            // Ensure picker doesn't go beyond left edge
            if (left < 10) {
                left = 10;
            }
            
            picker.style.top = `${Math.max(10, top)}px`;
            picker.style.left = `${left}px`;
            // Higher z-index than modal (1000) to ensure visibility
            picker.style.zIndex = '10000';
            document.addEventListener('click', outsideClose, true);
            document.addEventListener('keydown', escClose, true);
        }

        function closeRangePicker(){
            if (!picker) return;
            rpOpen = false;
            picker.style.display = 'none';
            // Optionally add hidden class back (but inline style should override it)
            document.removeEventListener('click', outsideClose, true);
            document.removeEventListener('keydown', escClose, true);
        }

        function outsideClose(e){
            if (!rpOpen) return;
            if (picker.contains(e.target) || (rpAnchor && rpAnchor.contains(e.target))) return;
            closeRangePicker();
        }

        function escClose(e){ if (e.key === 'Escape') closeRangePicker(); }

        // Auto-format date input: automatically add slashes
        function autoFormatDateInput(input, event) {
            let value = input.value;
            // Remove all non-numeric characters
            const numbers = value.replace(/\D/g, '');
            
            if (numbers.length <= 2) {
                input.value = numbers;
            } else if (numbers.length <= 4) {
                input.value = numbers.slice(0, 2) + '/' + numbers.slice(2);
            } else {
                input.value = numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8);
            }
        }

        // Auto-format date range input: handle single date or range
        function autoFormatDateRangeInput(input, event) {
            let value = input.value;
            const cursorPos = input.selectionStart || 0;
            
            // Remove all non-numeric characters except dash to count pure numbers
            const numOnly = value.replace(/\D/g, '');
            
            // If contains dash or "to", it's a range
            if (value.includes('-') || value.includes('–') || value.includes('—') || /to/i.test(value)) {
                const parts = value.split(/\s*(?:-|–|—|to)\s*/i);
                if (parts.length >= 2) {
                    // Format first date
                    let first = parts[0].trim().replace(/\D/g, '');
                    if (first.length <= 2) {
                        parts[0] = first;
                    } else if (first.length <= 4) {
                        parts[0] = first.slice(0, 2) + '/' + first.slice(2);
                    } else {
                        parts[0] = first.slice(0, 2) + '/' + first.slice(2, 4) + '/' + first.slice(4, 8);
                    }
                    
                    // Format second date
                    let second = parts[1].trim().replace(/\D/g, '');
                    if (second.length <= 2) {
                        parts[1] = second;
                    } else if (second.length <= 4) {
                        parts[1] = second.slice(0, 2) + '/' + second.slice(2);
                    } else {
                        parts[1] = second.slice(0, 2) + '/' + second.slice(2, 4) + '/' + second.slice(4, 8);
                    }
                    
                    input.value = parts[0] + ' - ' + parts[1];
                    
                    // Set cursor position after the dash
                    setTimeout(() => {
                        const formatted = parts[0] + ' - ' + parts[1];
                        const newCursorPos = formatted.length;
                        input.setSelectionRange(newCursorPos, newCursorPos);
                    }, 0);
                } else {
                    // Single date with dash - format it
                    if (numOnly.length <= 2) {
                        input.value = numOnly;
                    } else if (numOnly.length <= 4) {
                        input.value = numOnly.slice(0, 2) + '/' + numOnly.slice(2);
                    } else {
                        input.value = numOnly.slice(0, 2) + '/' + numOnly.slice(2, 4) + '/' + numOnly.slice(4, 8);
                    }
                }
            } else {
                // Single date - format it
                if (numOnly.length <= 2) {
                    input.value = numOnly;
                } else if (numOnly.length <= 4) {
                    input.value = numOnly.slice(0, 2) + '/' + numOnly.slice(2);
                } else if (numOnly.length === 8) {
                    // Complete first date - automatically add " - " and force end date input
                    const formattedDate = numOnly.slice(0, 2) + '/' + numOnly.slice(2, 4) + '/' + numOnly.slice(4, 8);
                    input.value = formattedDate + ' - ';
                    
                    // Set cursor position after " - " to force end date entry
                    setTimeout(() => {
                        const newCursorPos = input.value.length;
                        input.setSelectionRange(newCursorPos, newCursorPos);
                        input.focus();
                    }, 0);
                } else if (numOnly.length > 8) {
                    // First date complete and second date started
                    const firstDate = numOnly.slice(0, 8);
                    const secondDate = numOnly.slice(8);
                    const formattedFirst = firstDate.slice(0, 2) + '/' + firstDate.slice(2, 4) + '/' + firstDate.slice(4, 8);
                    
                    if (secondDate.length <= 2) {
                        input.value = formattedFirst + ' - ' + secondDate;
                    } else if (secondDate.length <= 4) {
                        input.value = formattedFirst + ' - ' + secondDate.slice(0, 2) + '/' + secondDate.slice(2);
                    } else {
                        input.value = formattedFirst + ' - ' + secondDate.slice(0, 2) + '/' + secondDate.slice(2, 4) + '/' + secondDate.slice(4, 8);
                    }
                } else {
                    input.value = numOnly.slice(0, 2) + '/' + numOnly.slice(2, 4) + '/' + numOnly.slice(4, 8);
                }
            }
        }

        const parseRangeFromInput = () => {
            const raw = (rangeInput.value || '').trim();
            
            // If input ends with " - " (with space), user is still typing end date - don't parse yet
            if (raw.endsWith(' - ')) {
                return; // Wait for user to complete end date
            }
            
            const parts = raw.split(/\s*(?:-|–|—|to)\s*/i).filter(Boolean);
            if (parts.length >= 2) {
                let startISO = toISOFromDDMMYYYY(parts[0].trim());
                let endISO = toISOFromDDMMYYYY(parts[1].trim());
                
                // If DD/MM/YYYY parse failed, try YYYY-MM-DD format
                if (!startISO && /^\d{4}-\d{2}-\d{2}$/.test(parts[0].trim())) {
                    startISO = parts[0].trim();
                }
                if (!endISO && /^\d{4}-\d{2}-\d{2}$/.test(parts[1].trim())) {
                    endISO = parts[1].trim();
                }
                
                // Only set values if valid ISO dates
                if (startISO && /^\d{4}-\d{2}-\d{2}$/.test(startISO)) {
                    startInput.value = startISO;
                    rpStart = startISO;
                }
                if (endISO && /^\d{4}-\d{2}-\d{2}$/.test(endISO)) {
                    endInput.value = endISO;
                    rpEnd = endISO;
                }
                
                if (rpStart) {
                    rpBaseMonth = parseDDMMYYYY(formatDateDisplay(rpStart)) || new Date(rpStart);
                } else {
                    rpBaseMonth = new Date();
                }
            } else if (parts.length === 1) {
                // Single date entered - set both start and end to same date (single day - auto-fill end)
                let dateISO = toISOFromDDMMYYYY(parts[0].trim());
                
                // If DD/MM/YYYY parse failed, try YYYY-MM-DD format
                if (!dateISO && /^\d{4}-\d{2}-\d{2}$/.test(parts[0].trim())) {
                    dateISO = parts[0].trim();
                }
                
                // If we have a complete first date but no dash yet, we're waiting for "- " to be added
                // But still set both dates for single day selection (auto-fill end)
                if (dateISO && /^\d{4}-\d{2}-\d{2}$/.test(dateISO) && !raw.includes('-')) {
                    // Complete date but no range indicator - set both to same date (single day - auto-fill end)
                    startInput.value = dateISO;
                    endInput.value = dateISO; // Auto-fill end date with same date
                    rpStart = dateISO; 
                    rpEnd = dateISO; // Auto-fill end date for single day
                    rpBaseMonth = parseDDMMYYYY(formatDateDisplay(dateISO)) || new Date(dateISO);
                    return;
                }
                
                if (dateISO && /^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
                    // Single date entered - set both to same date (auto-fill end)
                    startInput.value = dateISO;
                    endInput.value = dateISO; // Auto-fill end date with same date
                    rpStart = dateISO;
                    rpEnd = dateISO; // Auto-fill end date for single day selection
                    rpBaseMonth = parseDDMMYYYY(formatDateDisplay(dateISO)) || new Date(dateISO);
                }
            }
            
            // Final check: if start is set but end is not, auto-fill end with same date (single day)
            if (rpStart && !rpEnd) {
                rpEnd = rpStart;
                if (endInput) endInput.value = rpStart;
            }
        };

        // Add auto-format on input event
        rangeInput.addEventListener('input', function(e) {
            const beforeValue = rangeInput.value;
            autoFormatDateRangeInput(rangeInput, e);
            const afterValue = rangeInput.value;
            
            // If auto-format added " - ", parse immediately so date picker can work
            if (afterValue.includes(' - ') && !beforeValue.includes(' - ')) {
                setTimeout(parseRangeFromInput, 50);
            } else {
                // Parse after a short delay to allow user to finish typing
                setTimeout(parseRangeFromInput, 100);
            }
        });
        
        rangeInput.addEventListener('change', function(){ parseRangeFromInput(); openRangePicker(rangeInput); });
        rangeInput.addEventListener('focus', function(){ openRangePicker(rangeInput); });
        rangeInput.addEventListener('click', function(){ openRangePicker(rangeInput); });
        startInput.addEventListener('change', function(){
            // Update internal state
            rpStart = startInput.value || '';
            
            // If start is set but end is not, auto-fill end with same date (single day)
            if (startInput.value && !endInput.value) {
                endInput.value = startInput.value;
                rpEnd = startInput.value;
            }
            
            // Update display if both are set
            if (startInput.value && endInput.value) {
                const startDisplay = formatDateDisplay(startInput.value);
                const endDisplay = formatDateDisplay(endInput.value);
                rangeInput.value = `${startDisplay} - ${endDisplay}`;
                
                // If end is before start, show warning
                if (new Date(endInput.value) < new Date(startInput.value)) {
                    if (typeof window.showToast === 'function') {
                        window.showToast('warning', translations.invalid_date_range || translations.common?.invalid_date_range || 'End date cannot be before start date');
                    }
                }
            } else if (startInput.value) {
                // Start is set but end is not - auto-fill end (already done above)
                const startDisplay = formatDateDisplay(startInput.value);
                const endDisplay = formatDateDisplay(endInput.value);
                rangeInput.value = `${startDisplay} - ${endDisplay}`;
            } else if (endInput.value) {
                // Start is empty but end is set - invalid state, clear end
                endInput.value = '';
                rpEnd = '';
                rangeInput.value = '';
            }
        });
        
        endInput.addEventListener('change', function(){
            // Update internal state
            rpEnd = endInput.value || '';
            
            // If end is set but start is not, auto-fill start with same date (single day)
            if (endInput.value && !startInput.value) {
                startInput.value = endInput.value;
                rpStart = endInput.value;
            }
            
            // Update display if both are set
            if (startInput.value && endInput.value) {
                const startDisplay = formatDateDisplay(startInput.value);
                const endDisplay = formatDateDisplay(endInput.value);
                rangeInput.value = `${startDisplay} - ${endDisplay}`;
                
                // If end is before start, show warning
                if (new Date(endInput.value) < new Date(startInput.value)) {
                    if (typeof window.showToast === 'function') {
                        window.showToast('warning', translations.invalid_date_range || translations.common?.invalid_date_range || 'End date cannot be before start date');
                    }
                }
            } else if (!endInput.value && startInput.value) {
                // End is cleared but start is set - auto-fill end with start (single day)
                endInput.value = startInput.value;
                rpEnd = startInput.value;
                const startDisplay = formatDateDisplay(startInput.value);
                rangeInput.value = `${startDisplay} - ${startDisplay}`;
            }
        });
    };
})();

