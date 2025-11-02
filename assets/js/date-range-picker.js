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
                if (rpStart) {
                    const startDisplay = formatDateDisplay(rpStart);
                    const endDisplay = rpEnd && rpEnd !== rpStart ? formatDateDisplay(rpEnd) : startDisplay;
                    startInput.value = rpStart;
                    endInput.value = rpEnd || rpStart;
                    if (rpEnd && rpEnd !== rpStart) {
                        rangeInput.value = `${startDisplay} - ${endDisplay}`;
                    } else {
                        rangeInput.value = startDisplay;
                    }
                }
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
            // Support single date: if clicking the same date again when start=end, keep as single date
            if (!rpStart || (rpStart && rpEnd)) { 
                // No selection or both selected - start fresh
                rpStart = iso; 
                rpEnd = ''; 
            } else if (rpStart && !rpEnd) {
                // Start is set but end is not - clicking another date sets the end
                if (new Date(iso) < new Date(rpStart)) {
                    // If clicked date is before start, swap them
                    rpEnd = rpStart;
                    rpStart = iso;
                } else if (iso === rpStart) {
                    // Same date clicked - keep as single date
                    rpEnd = iso;
                } else {
                    rpEnd = iso;
                }
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

        const parseRangeFromInput = () => {
            const raw = (rangeInput.value || '').trim();
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
                let dateISO = toISOFromDDMMYYYY(parts[0].trim());
                
                // If DD/MM/YYYY parse failed, try YYYY-MM-DD format
                if (!dateISO && /^\d{4}-\d{2}-\d{2}$/.test(parts[0].trim())) {
                    dateISO = parts[0].trim();
                }
                
                if (dateISO && /^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
                    startInput.value = dateISO;
                    endInput.value = dateISO;
                    rpStart = dateISO; 
                    rpEnd = dateISO;
                    rpBaseMonth = parseDDMMYYYY(formatDateDisplay(dateISO)) || new Date(dateISO);
                }
            }
        };

        rangeInput.addEventListener('change', function(){ parseRangeFromInput(); openRangePicker(rangeInput); });
        rangeInput.addEventListener('input', parseRangeFromInput);
        rangeInput.addEventListener('focus', function(){ openRangePicker(rangeInput); });
        rangeInput.addEventListener('click', function(){ openRangePicker(rangeInput); });
        startInput.addEventListener('change', function(){
            if (!endInput.value || new Date(endInput.value) < new Date(startInput.value)) {
                setTimeout(() => openRangePicker(rangeInput), 0);
            }
        });
        endInput.addEventListener('change', function(){
            if (startInput.value && endInput.value) {
                if (startInput.value === endInput.value) {
                    rangeInput.value = formatDateDisplay(startInput.value);
                } else {
                    rangeInput.value = `${formatDateDisplay(startInput.value)} - ${formatDateDisplay(endInput.value)}`;
                }
            } else if (startInput.value) {
                rangeInput.value = formatDateDisplay(startInput.value);
            }
        });
    };
})();

