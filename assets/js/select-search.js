// Global Select Search Enhancement
// Creates a custom dropdown with search at the top and filtered list below
(function(){
    'use strict';

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
        dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #d1d5db; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000; display: none; max-height: 300px; overflow: hidden; margin-top: 4px;';

        // Create search input at top
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'select-search-input';
        searchInput.placeholder = config.searchPlaceholder;
        searchInput.style.cssText = 'width: 100%; padding: 8px 32px 8px 12px; border: none; border-bottom: 1px solid #e5e7eb; border-radius: 8px 8px 0 0; font-size: 14px; outline: none; box-sizing: border-box;';
        searchInput.setAttribute('autocomplete', 'off');

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
        trigger.style.cssText = 'width: 100%; padding: 10px 32px 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: white; text-align: left; font-size: 14px; cursor: pointer; position: relative; min-height: 42px; display: flex; align-items: center;';
        
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
                    optionDiv.style.cssText = 'padding: 10px 12px; cursor: pointer; font-size: 14px; color: #1f2937; transition: background 0.2s; border-bottom: 1px solid #f3f4f6;';
                    optionDiv.textContent = opt.text;
                    optionDiv.dataset.value = opt.value;

                    optionDiv.addEventListener('mouseenter', function() {
                        this.style.background = '#f3f4f6';
                    });

                    optionDiv.addEventListener('mouseleave', function() {
                        this.style.background = 'white';
                    });

                    optionDiv.addEventListener('click', function() {
                        select.value = opt.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        updateTrigger();
                        closeDropdown();
                    });

                    optionsContainer.appendChild(optionDiv);
                });
                return;
            }
            
            // No valid options - check if still loading
            if (hasLoadingInSelect && filteredOptions.length === 0) {
                const loadingMsg = document.createElement('div');
                loadingMsg.className = 'select-search-loading';
                loadingMsg.style.cssText = 'padding: 12px; text-align: center; color: #6b7280; font-size: 14px;';
                loadingMsg.textContent = 'Veriler yükleniyor...';
                optionsContainer.appendChild(loadingMsg);
            } else {
                const noResult = document.createElement('div');
                noResult.className = 'select-search-no-result';
                noResult.style.cssText = 'padding: 12px; text-align: center; color: #6b7280; font-size: 14px;';
                noResult.textContent = 'Sonuç bulunamadı';
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

        // Open dropdown
        function openDropdown() {
            if (isOpen) return;
            
            // Always reload options when opening (to catch dynamically loaded data)
            loadAllOptions();
            
            // Check if we have valid options (not just loading messages)
            if (allOptions.length > 0) {
                filterOptions('');
                dropdown.style.display = 'block';
                triggerIcon.style.transform = 'translateY(-50%) rotate(180deg)';
                isOpen = true;
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
                    dropdown.style.display = 'block';
                    triggerIcon.style.transform = 'translateY(-50%) rotate(180deg)';
                    isOpen = true;
                    setTimeout(() => {
                        searchInput.focus();
                    }, 50);
                }, 100);
            }
        }

        // Close dropdown
        function closeDropdown() {
            if (!isOpen) return;
            dropdown.style.display = 'none';
            searchInput.value = '';
            filterOptions('');
            triggerIcon.style.transform = 'translateY(-50%) rotate(0deg)';
            isOpen = false;
        }

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

        // Keyboard navigation
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeDropdown();
                trigger.focus();
                e.preventDefault();
            } else if (e.key === 'Enter') {
                const firstOption = optionsContainer.querySelector('.select-search-option');
                if (firstOption) {
                    firstOption.click();
                    e.preventDefault();
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const options = optionsContainer.querySelectorAll('.select-search-option');
                if (options.length > 0) {
                    options[0].focus();
                }
            }
        });

        // Close on outside click
        document.addEventListener('click', function(e) {
            if (!wrapper.contains(e.target) && isOpen) {
                closeDropdown();
            }
        });

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

        // Also watch for option text changes
        if (window.MutationObserver) {
            const textObserver = new MutationObserver(function() {
                loadAllOptions();
                updateTrigger();
            });
            
            Array.from(select.options).forEach(function(opt) {
                textObserver.observe(opt, {
                    characterData: true,
                    subtree: true
                });
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
            clearInterval(checkInterval);
        }, 10000);

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
