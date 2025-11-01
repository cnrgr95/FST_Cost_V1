// Global Select Search Enhancement
// Creates a custom dropdown with search at the top and filtered list below
(function(){
    'use strict';

    // Global state: track currently open dropdown to ensure only one is open at a time
    let currentlyOpenDropdown = null;
    let currentlyOpenInstance = null;

    // Close any open dropdown
    function closeAllDropdowns(excludeInstance = null) {
        // Close dropdown via the stored instance
        if (currentlyOpenInstance && currentlyOpenInstance !== excludeInstance) {
            if (typeof currentlyOpenInstance.closeDropdown === 'function') {
                currentlyOpenInstance.closeDropdown();
            }
        }
        // Fallback: close all visible dropdowns
        document.querySelectorAll('.select-search-dropdown').forEach(dd => {
            if (dd.style.display !== 'none' && dd !== excludeInstance?.dropdown) {
                dd.style.display = 'none';
                const trigger = dd.parentElement?.querySelector('.select-search-trigger');
                if (trigger) {
                    const icon = trigger.querySelector('.select-search-arrow');
                    if (icon) {
                        icon.style.transform = 'translateY(-50%) rotate(0deg)';
                    }
                }
            }
        });
        currentlyOpenDropdown = null;
        currentlyOpenInstance = null;
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        // Check if click is outside any select-search component
        const clickedWrapper = e.target.closest('.select-search-wrapper');
        const clickedDropdown = e.target.closest('.select-search-dropdown');
        
        if (!clickedWrapper && !clickedDropdown) {
            closeAllDropdowns();
        }
    }, true); // Use capture phase to catch clicks early

    window.initializeSelectSearch = function(selectId, options = {}) {
        const select = typeof selectId === 'string' ? document.getElementById(selectId) : selectId;
        if (!select) {
            console.warn('Select search: Element not found', selectId);
            return;
        }

        // Already initialized
        if (select.dataset.searchInitialized === 'true') return;

        // Try to get translation from page or use default
        let defaultPlaceholder = 'Ara...';
        if (typeof tCommon !== 'undefined' && tCommon.search) {
            defaultPlaceholder = tCommon.search;
        } else if (typeof translations !== 'undefined' && translations.common && translations.common.search) {
            defaultPlaceholder = translations.common.search;
        }

        const config = {
            searchPlaceholder: options.searchPlaceholder || defaultPlaceholder,
            minChars: options.minChars || 0,
            searchDelay: options.searchDelay || 200,
            apiEndpoint: options.apiEndpoint || null,
            apiParams: options.apiParams || {},
            displayField: options.displayField || 'text',
            valueField: options.valueField || 'value',
            filterLocal: options.filterLocal !== false
        };

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'select-search-wrapper';
        wrapper.style.position = 'relative';
        
        // Create custom dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'select-search-dropdown';
        dropdown.setAttribute('role', 'listbox');
        dropdown.style.cssText = 'position: fixed; background: white; border: 1.5px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.08); z-index: 10000; display: none; max-height: 300px; overflow: hidden; margin: 0; min-width: 200px;';

        // Create search input at top
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'select-search-input';
        searchInput.placeholder = config.searchPlaceholder;
        searchInput.style.cssText = 'width: 100%; padding: 12px 40px 12px 16px; border: none; border-bottom: 1.5px solid #f3f4f6; border-radius: 12px 12px 0 0; font-size: 15px; outline: none; box-sizing: border-box; background: #fafafa;';
        searchInput.setAttribute('autocomplete', 'off');
        searchInput.setAttribute('role', 'searchbox');
        searchInput.setAttribute('aria-label', 'Search options');

        // Add search icon
        const searchIcon = document.createElement('span');
        searchIcon.className = 'material-symbols-rounded select-search-icon';
        searchIcon.textContent = 'search';
        searchIcon.style.cssText = 'position: absolute; right: 8px; top: 8px; color: #6b7280; font-size: 18px; pointer-events: none;';

        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'select-search-options';
        optionsContainer.style.cssText = 'max-height: 250px; overflow-y: auto;';

        // Build dropdown structure
        dropdown.appendChild(searchInput);
        dropdown.appendChild(searchIcon);
        dropdown.appendChild(optionsContainer);

        // Insert wrapper before select
        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);
        wrapper.appendChild(dropdown);

        // Hide original select visually but keep it for form submission
        const originalStyle = select.style.cssText;
        select.style.cssText = originalStyle + 'width: 100%;';
        select.style.position = 'absolute';
        select.style.opacity = '0';
        select.style.pointerEvents = 'none';
        select.style.height = '0';
        select.style.overflow = 'hidden';

        // Create visible button to trigger dropdown
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'select-search-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('role', 'combobox');
        trigger.style.cssText = 'width: 100%; padding: 12px 40px 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; background: white; text-align: left; font-size: 15px; cursor: pointer; position: relative; min-height: 46px; display: flex; align-items: center;';
        
        const triggerText = document.createElement('span');
        triggerText.className = 'select-search-trigger-text';
        triggerText.style.cssText = 'flex: 1; color: #1f2937;';
        
        const triggerIcon = document.createElement('span');
        triggerIcon.className = 'material-symbols-rounded select-search-arrow';
        triggerIcon.textContent = 'expand_more';
        triggerIcon.style.cssText = 'position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #6b7280; font-size: 20px; pointer-events: none; transition: transform 0.2s;';

        trigger.appendChild(triggerText);
        trigger.appendChild(triggerIcon);
        wrapper.insertBefore(trigger, select);

        let allOptions = [];
        let isOpen = false;
        let searchTimeout = null;
        let optionsObserver = null;
        
        // Store instance reference for global state management
        const instance = {
            dropdown: dropdown,
            trigger: trigger,
            closeDropdown: null, // Will be set below after function is defined
            isOpen: false
        };

        // Load all options
        function loadAllOptions() {
            const currentOptions = Array.from(select.options);
            
            // Filter out loading/empty options
            const validOptions = currentOptions.filter(opt => {
                const text = opt.textContent.trim();
                const value = opt.value.trim();
                
                // Skip if it's a loading message (more comprehensive list)
                const loadingTexts = [
                    'loading', 'yükleniyor', 'loading...', 'veriler yükleniyor', 
                    'loading_data', 'loading_companies', 'loading_types', 'loading_contracts',
                    'araç firmaları yükleniyor', 'araç tipleri yükleniyor', 'kontratlar yükleniyor'
                ];
                const lowerText = text.toLowerCase();
                
                // Skip any option that contains loading text
                if (loadingTexts.some(lt => lowerText.includes(lt))) {
                    return false;
                }
                
                // Keep options that have a value (actual data)
                if (value !== '' && value !== '0') {
                    return true;
                }
                
                // Skip empty placeholder options unless it's a meaningful empty option
                if (value === '' && (text === '' || text === 'Seçin...' || text === 'Select...' || text.toLowerCase() === 'select')) {
                    return false;
                }
                
                // Keep other options (might be placeholders with meaning)
                return true;
            });
            
            allOptions = validOptions.map(opt => ({
                value: opt.value,
                text: opt.textContent,
                element: opt.cloneNode(true),
                original: opt
            }));
            
            // If dropdown is open, re-render
            if (isOpen) {
                filterOptions(searchInput.value.trim());
            }
        }

        // Render options
        function renderOptions(filteredOptions) {
            optionsContainer.innerHTML = '';
            
            // Filter out loading messages from displayed options
            const validOptions = filteredOptions.filter(opt => {
                const text = opt.text.trim().toLowerCase();
                const loadingTexts = ['loading', 'yükleniyor', 'veriler yükleniyor', 'loading_data', 'loading...'];
                return !loadingTexts.some(lt => text.includes(lt)) && opt.value !== '' || (opt.value === '' && opt.text.trim() && !loadingTexts.some(lt => text.includes(lt)));
            });
            
            // Check if original select still has loading option
            const hasLoadingInSelect = Array.from(select.options).some(opt => {
                const text = opt.textContent.trim().toLowerCase();
                return text.includes('loading') || text.includes('yükleniyor');
            });
            
            // If we have valid options, show them (even if select still says loading)
            if (validOptions.length > 0) {
                validOptions.forEach(opt => {
                    const optionDiv = document.createElement('div');
                    optionDiv.className = 'select-search-option';
                    optionDiv.textContent = opt.text;
                    optionDiv.dataset.value = opt.value;
                    
                    // Mark as selected if it matches current select value
                    if (select.value === opt.value) {
                        optionDiv.classList.add('selected');
                    }
                    
                    // Add tabindex for keyboard navigation
                    optionDiv.setAttribute('tabindex', '0');
                    optionDiv.setAttribute('role', 'option');
                    optionDiv.setAttribute('aria-selected', select.value === opt.value ? 'true' : 'false');

                    optionDiv.addEventListener('click', function() {
                        select.value = opt.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        updateTrigger();
                        
                        // Update selected state
                        optionsContainer.querySelectorAll('.select-search-option').forEach(o => {
                            o.classList.remove('selected');
                            o.setAttribute('aria-selected', 'false');
                        });
                        optionDiv.classList.add('selected');
                        optionDiv.setAttribute('aria-selected', 'true');
                        
                        closeDropdown();
                    });
                    
                    // Keyboard support
                    optionDiv.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            optionDiv.click();
                        }
                    });

                    optionsContainer.appendChild(optionDiv);
                });
                return;
            }
            
            // No valid options - check if still loading
            if (hasLoadingInSelect && filteredOptions.length === 0) {
                const loadingMsg = document.createElement('div');
                loadingMsg.className = 'select-search-loading';
                // Try to get translation
                let loadingText = 'Veriler yükleniyor...';
                if (typeof tCommon !== 'undefined' && tCommon.loading) {
                    loadingText = tCommon.loading;
                }
                loadingMsg.textContent = loadingText;
                optionsContainer.appendChild(loadingMsg);
            } else {
                const noResult = document.createElement('div');
                noResult.className = 'select-search-no-result';
                // Try to get translation
                let noResultText = 'Sonuç bulunamadı';
                if (typeof tCommon !== 'undefined' && tCommon.no_results) {
                    noResultText = tCommon.no_results;
                } else if (typeof tCommon !== 'undefined' && tCommon.not_found) {
                    noResultText = tCommon.not_found;
                }
                noResult.textContent = noResultText;
                optionsContainer.appendChild(noResult);
            }
        }

        // Filter options
        function filterOptions(searchTerm) {
            if (!config.filterLocal) return;
            
            const term = searchTerm.toLowerCase().trim();
            
            if (term.length === 0) {
                renderOptions(allOptions);
                return;
            }
            
            const filtered = term.length >= config.minChars
                ? allOptions.filter(opt => opt.text.toLowerCase().includes(term))
                : allOptions;

            renderOptions(filtered);
        }

        // Search API
        function searchAPI(searchTerm) {
            if (!config.apiEndpoint || searchTerm.length < config.minChars) {
                filterOptions(searchTerm);
                return;
            }

            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                try {
                    const params = new URLSearchParams({
                        ...config.apiParams,
                        search: searchTerm
                    });
                    const response = await fetch(`${config.apiEndpoint}?${params}`);
                    const data = await response.json();
                    
                    if (data.success && Array.isArray(data.data)) {
                        const apiOptions = data.data.map(item => ({
                            value: item[config.valueField],
                            text: item[config.displayField],
                            element: null
                        }));
                        renderOptions(apiOptions);
                    } else {
                        filterOptions(searchTerm);
                    }
                } catch (error) {
                    console.error('Select search API error:', error);
                    filterOptions(searchTerm);
                }
            }, config.searchDelay);
        }

        // Update trigger button text
        function updateTrigger() {
            const selectedOption = Array.from(select.options).find(opt => opt.value === select.value);
            if (selectedOption && selectedOption.textContent.trim()) {
                triggerText.textContent = selectedOption.textContent;
                triggerText.style.color = '#1f2937';
            } else {
                const placeholder = select.dataset.placeholder || select.options[0]?.textContent || 'Seçin...';
                triggerText.textContent = placeholder;
                triggerText.style.color = '#9ca3af';
            }
        }

        // Position dropdown - always align with trigger button
        // IMPORTANT: Using position: fixed, so coordinates must be viewport-relative (no scroll offset)
        function positionDropdown() {
            if (!trigger || !dropdown) return;
            
            try {
                const rect = trigger.getBoundingClientRect();
                if (!rect || rect.width === 0 || rect.height === 0) {
                    // Element not visible or has no dimensions
                    return false;
                }
                
                // With position: fixed, we use viewport coordinates (getBoundingClientRect already gives this)
                // NO scroll offset needed!
                const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                const preferredDropdownHeight = 300; // Preferred max-height
                const gap = 4; // Gap between trigger and dropdown
                const margin = 10; // Minimum margin from viewport edges
                const MIN_OPEN_SPACE = 100; // Absolute minimum space required
                
                // Always align with trigger horizontally
                let left = rect.left;
                let width = rect.width;
                
                // Ensure minimum width
                if (width < 200) {
                    width = 200;
                }
                
                // Check if dropdown would go off-screen to the right
                if (left + width > viewportWidth - margin) {
                    // Adjust to fit in viewport, but try to keep alignment
                    const overflow = (left + width) - (viewportWidth - margin);
                    // Try to maintain left alignment if possible
                    if (left - overflow >= margin) {
                        left = left - overflow;
                    } else {
                        // Can't maintain alignment, fit to viewport
                        left = margin;
                        width = viewportWidth - (margin * 2);
                    }
                }
                
                // Ensure it doesn't go off left edge
                if (left < margin) {
                    left = margin;
                    if (left + width > viewportWidth - margin) {
                        width = viewportWidth - (margin * 2);
                    }
                }
                
                // Calculate available space (viewport coordinates, no scroll)
                const spaceBelow = viewportHeight - rect.bottom;
                const availableSpace = spaceBelow - gap - margin;
                
                // ALWAYS open downward, attached to trigger button
                let top = rect.bottom + gap; // Always directly below trigger with gap
                let calculatedHeight;
                
                // If space is insufficient, we'll use scrollbar - maximize height
                if (availableSpace < MIN_OPEN_SPACE) {
                    // Very limited space - use minimum but with scrollbar
                    calculatedHeight = Math.max(MIN_OPEN_SPACE, availableSpace);
                } else if (availableSpace < preferredDropdownHeight) {
                    // Limited space - use all available space (will have scrollbar if needed)
                    calculatedHeight = availableSpace;
                } else {
                    // Plenty of space - use preferred height
                    calculatedHeight = preferredDropdownHeight;
                }
                
                // Ensure dropdown fits in viewport
                const actualBottom = top + calculatedHeight;
                if (actualBottom > viewportHeight - margin) {
                    // Adjust height to fit exactly in viewport
                    calculatedHeight = Math.max(MIN_OPEN_SPACE, viewportHeight - top - margin);
                }
                
                // Ensure minimum height is maintained
                if (calculatedHeight < MIN_OPEN_SPACE) {
                    calculatedHeight = MIN_OPEN_SPACE;
                }
                
                // Apply calculated values
                dropdown.style.top = `${top}px`;
                dropdown.style.left = `${left}px`;
                dropdown.style.width = `${width}px`;
                dropdown.style.maxHeight = `${calculatedHeight}px`;
                dropdown.style.overflow = 'hidden'; // Container overflow hidden
                
                // Ensure options container has proper overflow
                optionsContainer.style.maxHeight = `${calculatedHeight - 45}px`; // Subtract search input height (~45px)
                optionsContainer.style.overflowY = 'auto'; // Always show scrollbar when needed
                
                // Always remove upward class (never opening upward)
                dropdown.classList.remove('select-search-dropdown-upward');
                
                return true; // Success
                
            } catch (error) {
                console.error('Error positioning dropdown:', error);
                return false; // Failure
            }
        }

        // Open dropdown
        function openDropdown() {
            if (isOpen) return;
            
            // Close any other open dropdown first (global state management)
            closeAllDropdowns(instance);
            
            // Always reload options when opening (to catch dynamically loaded data)
            loadAllOptions();
            
            // Check if we need to scroll to make room
            const rect = trigger.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const preferredHeight = 300;
            const gap = 4;
            const margin = 10;
            const minSpace = 100;
            
            // Calculate if scrolling is needed
            const needsScroll = spaceBelow < (preferredHeight + gap + margin);
            
            // If space is very limited, scroll down to make room
            if (needsScroll && spaceBelow < minSpace + gap + margin) {
                // Calculate how much to scroll
                const shortage = (minSpace + gap + margin) - spaceBelow;
                const scrollAmount = shortage + 20; // Add extra for comfortable viewing
                const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
                const newScroll = currentScroll + scrollAmount;
                
                // Scroll smoothly to make room
                window.scrollTo({
                    top: newScroll,
                    behavior: 'smooth'
                });
                
                // Wait for scroll animation to complete (300ms for smooth scroll)
                setTimeout(() => {
                    positionAndOpenDropdown();
                }, 350);
            } else {
                // Enough space or reasonable space - open immediately
                positionAndOpenDropdown();
            }
        }
        
        // Position and open dropdown (separated for reuse)
        function positionAndOpenDropdown() {
            // Position dropdown before showing - check if positioning is successful
            const positioned = positionDropdown();
            
            // Should always succeed now (we scrolled if needed)
            if (positioned === false) {
                console.warn('Select search: Failed to position dropdown even after scroll');
                // Still try to open with minimal space
                const rect = trigger.getBoundingClientRect();
                if (!rect) return;
                
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                const spaceBelow = viewportHeight - rect.bottom;
                const minSpace = 100;
                
                if (spaceBelow < minSpace) {
                    // Still not enough - show message
                    let errorMsg = 'Yeterli alan yok. Sayfayı kaydırın ve tekrar deneyin.';
                    if (typeof tCommon !== 'undefined' && tCommon.not_enough_space) {
                        errorMsg = tCommon.not_enough_space;
                    }
                    if (typeof showToast !== 'undefined') {
                        showToast('warning', errorMsg);
                    }
                    return;
                }
            }
            
            // Check if we have valid options (not just loading messages)
            if (allOptions.length > 0) {
                filterOptions('');
                dropdown.style.display = 'block';
                // Reposition after showing (to ensure correct alignment)
                setTimeout(() => {
                    positionDropdown(); // Recalculate with current viewport
                }, 0);
                triggerIcon.style.transform = 'translateY(-50%) rotate(180deg)';
                trigger.setAttribute('aria-expanded', 'true');
                isOpen = true;
                instance.isOpen = true;
                
                // Update global state
                currentlyOpenDropdown = dropdown;
                currentlyOpenInstance = instance;
                
                setTimeout(() => {
                    searchInput.focus();
                }, 50);
            } else {
                // No valid options yet - wait a moment for AJAX to complete
                setTimeout(() => {
                    loadAllOptions(); // Reload after AJAX might have completed
                    if (allOptions.length > 0) {
                        filterOptions('');
                    } else {
                        renderOptions([]); // Show loading message
                    }
                    
                    // Reposition dropdown after AJAX
                    positionDropdown();
                    
                    dropdown.style.display = 'block';
                    // Reposition again after rendering
                    setTimeout(() => {
                        positionDropdown(); // Final positioning
                    }, 0);
                    triggerIcon.style.transform = 'translateY(-50%) rotate(180deg)';
                    isOpen = true;
                    instance.isOpen = true;
                    
                    // Update global state
                    currentlyOpenDropdown = dropdown;
                    currentlyOpenInstance = instance;
                    
                    setTimeout(() => {
                        searchInput.focus();
                    }, 50);
                }, 100);
            }
        }

        // Enhanced keyboard navigation
        let focusedOptionIndex = -1;
        
        // Close dropdown
        function closeDropdownInternal() {
            if (!isOpen) return;
            dropdown.style.display = 'none';
            searchInput.value = '';
            filterOptions('');
            triggerIcon.style.transform = 'translateY(-50%) rotate(0deg)';
            trigger.setAttribute('aria-expanded', 'false');
            isOpen = false;
            instance.isOpen = false;
            
            // Clear global state if this was the open one
            if (currentlyOpenDropdown === dropdown) {
                currentlyOpenDropdown = null;
                currentlyOpenInstance = null;
            }
        }
        
        // Wrapped closeDropdown to reset focus index
        function closeDropdown() {
            focusedOptionIndex = -1;
            closeDropdownInternal();
        }
        
        // Store closeDropdown function in instance (needed for global state management)
        instance.closeDropdown = closeDropdown;

        // Toggle dropdown
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            if (isOpen) {
                closeDropdown();
            } else {
                openDropdown();
            }
        });

        // Search input handling
        searchInput.addEventListener('input', function(e) {
            const term = e.target.value.trim();
            if (config.apiEndpoint) {
                searchAPI(term);
            } else {
                filterOptions(term);
            }
        });

        searchInput.addEventListener('keydown', function(e) {
            const options = Array.from(optionsContainer.querySelectorAll('.select-search-option'));
            
            if (e.key === 'Escape') {
                closeDropdown();
                trigger.focus();
                e.preventDefault();
            } else if (e.key === 'Enter') {
                const focused = optionsContainer.querySelector('.select-search-option:focus');
                if (focused) {
                    focused.click();
                } else {
                    const firstOption = options[0];
                    if (firstOption) {
                        firstOption.click();
                    }
                }
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                focusedOptionIndex = Math.min(focusedOptionIndex + 1, options.length - 1);
                if (options[focusedOptionIndex]) {
                    options[focusedOptionIndex].focus();
                    // Scroll into view smoothly
                    options[focusedOptionIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                focusedOptionIndex = Math.max(focusedOptionIndex - 1, 0);
                if (options[focusedOptionIndex]) {
                    options[focusedOptionIndex].focus();
                    // Scroll into view smoothly
                    options[focusedOptionIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            } else if (e.key === 'Home') {
                e.preventDefault();
                focusedOptionIndex = 0;
                if (options[0]) {
                    options[0].focus();
                    options[0].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            } else if (e.key === 'End') {
                e.preventDefault();
                focusedOptionIndex = options.length - 1;
                if (options[focusedOptionIndex]) {
                    options[focusedOptionIndex].focus();
                    options[focusedOptionIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
        });

        // Close on outside click
        document.addEventListener('click', function(e) {
            if (!wrapper.contains(e.target) && !dropdown.contains(e.target) && isOpen) {
                closeDropdown();
            }
        });
        
        // Reposition on scroll/resize
        let resizeTimeout = null;
        const scrollHandler = function() {
            if (isOpen) {
                if (resizeTimeout) clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(function() {
                    positionDropdown();
                }, 10);
            }
        };
        
        const resizeHandler = function() {
            if (isOpen) {
                if (resizeTimeout) clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(function() {
                    positionDropdown();
                }, 10);
            }
        };
        
        window.addEventListener('scroll', scrollHandler, true);
        window.addEventListener('resize', resizeHandler);
        
        // Store handlers for cleanup
        wrapper._scrollHandler = scrollHandler;
        wrapper._resizeHandler = resizeHandler;

        // Initialize
        loadAllOptions();
        updateTrigger();

        // Watch for programmatic changes to select (when options are added dynamically)
        select.addEventListener('change', function() {
            updateTrigger();
        });

        // Observe select for option changes (when AJAX loads data)
        if (window.MutationObserver) {
            optionsObserver = new MutationObserver(function(mutations) {
                let shouldReload = false;
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        shouldReload = true;
                    }
                });
                if (shouldReload) {
                    // Small delay to ensure all options are added
                    setTimeout(function() {
                        loadAllOptions();
                        updateTrigger();
                    }, 100);
                }
            });
            
            optionsObserver.observe(select, {
                childList: true,
                subtree: false
            });
        }

        // Periodic check for new options (fallback for older browsers)
        let checkInterval = setInterval(function() {
            const currentOptionCount = Array.from(select.options)
                .filter(opt => {
                    const text = opt.textContent.trim().toLowerCase();
                    return !text.includes('loading') && !text.includes('yükleniyor');
                }).length;
            
            if (currentOptionCount !== allOptions.length && currentOptionCount > 0) {
                loadAllOptions();
                updateTrigger();
            }
        }, 500);
        
        // Clear interval after 10 seconds (options should be loaded by then)
        setTimeout(function() {
            if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
            }
        }, 10000);

        // Cleanup function (called on page unload or component destroy)
        function cleanup() {
            try {
                if (optionsObserver) {
                    optionsObserver.disconnect();
                    optionsObserver = null;
                }
                if (checkInterval) {
                    clearInterval(checkInterval);
                    checkInterval = null;
                }
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                    searchTimeout = null;
                }
                if (resizeTimeout) {
                    clearTimeout(resizeTimeout);
                    resizeTimeout = null;
                }
                // Remove event listeners
                if (wrapper._scrollHandler) {
                    window.removeEventListener('scroll', wrapper._scrollHandler, true);
                }
                if (wrapper._resizeHandler) {
                    window.removeEventListener('resize', wrapper._resizeHandler);
                }
            } catch (error) {
                console.error('Error during cleanup:', error);
            }
        }

        // Store cleanup function on select element
        select.dataset.searchCleanup = 'true';
        select._selectSearchCleanup = cleanup;

        // Cleanup on page unload
        window.addEventListener('beforeunload', cleanup);

        // Mark as initialized
        select.dataset.searchInitialized = 'true';
    };

    // Auto-initialize all selects (except those with data-search="false")
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('select:not([data-search="false"])').forEach(select => {
            if (select.dataset.searchInitialized === 'true') return;
            
            const options = {
                searchPlaceholder: select.dataset.searchPlaceholder || null,
                apiEndpoint: select.dataset.searchApi || null,
                filterLocal: select.dataset.searchLocal !== 'false'
            };
            window.initializeSelectSearch(select, options);
        });
    });
})();

