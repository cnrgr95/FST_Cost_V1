// Sidebar JavaScript
(function() {
  'use strict';

  // Toggle the visibility of a dropdown menu
  const toggleDropdown = (dropdown, menu, isOpen) => {
    dropdown.classList.toggle("open", isOpen);
    if (isOpen) {
      // Calculate proper height based on content
      menu.style.height = 'auto';
      const height = menu.scrollHeight;
      menu.style.height = `${height}px`;
    } else {
      menu.style.height = '0';
    }
  };
  
  // Restore dropdown menu heights and positions when sidebar expands
  const restoreDropdownHeights = () => {
    document.querySelectorAll(".dropdown-container.open").forEach((dropdown) => {
      const menu = dropdown.querySelector(".dropdown-menu");
      if (menu && dropdown.classList.contains("open")) {
        // Remove collapsed-specific inline styles to let CSS take over
        menu.style.removeProperty('position');
        menu.style.removeProperty('left');
        menu.style.removeProperty('opacity');
        menu.style.removeProperty('pointer-events');
        menu.style.removeProperty('top');
        
        // Calculate and set proper height for expanded mode
        // First set to auto to get true scrollHeight
        const currentHeight = menu.style.height;
        menu.style.height = 'auto';
        const scrollHeight = menu.scrollHeight;
        // Restore height with calculated value
        menu.style.height = scrollHeight > 0 ? `${scrollHeight}px` : '';
      }
    });
  };

  // Close all open dropdowns
  const closeAllDropdowns = () => {
    document.querySelectorAll(".dropdown-container.open").forEach((openDropdown) => {
      toggleDropdown(openDropdown, openDropdown.querySelector(".dropdown-menu"), false);
    });
  };

  // Attach click event to all dropdown toggles
  document.querySelectorAll(".dropdown-toggle").forEach((dropdownToggle) => {
    dropdownToggle.addEventListener("click", (e) => {
      e.preventDefault();

      const dropdown = dropdownToggle.closest(".dropdown-container");
      const menu = dropdown.querySelector(".dropdown-menu");
      const isOpen = dropdown.classList.contains("open");

      closeAllDropdowns(); // Close all open dropdowns
      toggleDropdown(dropdown, menu, !isOpen); // Toggle current dropdown visibility
    });
  });

  // Save sidebar state to localStorage
  const saveSidebarState = (isCollapsed) => {
    try {
      localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
    } catch (e) {
      console.warn('Failed to save sidebar state to localStorage:', e);
    }
  };

  // Load sidebar state from localStorage
  const loadSidebarState = () => {
    try {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        return savedState === 'true';
      }
    } catch (e) {
      console.warn('Failed to load sidebar state from localStorage:', e);
    }
    return false; // Default to expanded
  };

  // Apply sidebar state on page load (only on desktop)
  const applySidebarState = () => {
    if (window.innerWidth > 768) {
      const sidebar = document.querySelector(".sidebar") || document.querySelector("#main-sidebar");
      if (sidebar) {
        const isCollapsed = loadSidebarState();
        if (isCollapsed) {
          sidebar.classList.add("collapsed");
        } else {
          sidebar.classList.remove("collapsed");
        }
        // Remove opacity restriction if it was set
        sidebar.style.opacity = '';
      }
    }
  };

  // Apply state immediately when DOM is ready or if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySidebarState);
  } else {
    // DOM already loaded, apply immediately
    applySidebarState();
  }

  // Attach click event to sidebar toggle buttons
  document.querySelectorAll(".sidebar-toggler, .sidebar-menu-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const sidebar = document.querySelector(".sidebar");
      const overlay = document.querySelector(".sidebar-overlay");
      
      // Handle mobile sidebar
      if (window.innerWidth <= 768) {
        // On mobile, close dropdowns when toggling sidebar
        closeAllDropdowns();
        
        if (button.classList.contains("sidebar-menu-button")) {
          // Toggle menu button - open/close sidebar
          sidebar.classList.toggle("active");
          if (overlay) {
            overlay.classList.toggle("active");
          }
          // Prevent body scroll when sidebar is open
          if (sidebar.classList.contains("active")) {
            document.body.style.overflow = "hidden";
          } else {
            document.body.style.overflow = "";
          }
        } else if (button.classList.contains("sidebar-toggler")) {
          // Close sidebar on mobile when clicking toggler (close button)
          sidebar.classList.remove("active");
          if (overlay) {
            overlay.classList.remove("active");
          }
          document.body.style.overflow = "";
        }
      } else {
        // Desktop: toggle collapsed and save state
        // DO NOT close dropdowns when toggling sidebar - preserve open state
        const wasCollapsed = sidebar.classList.contains("collapsed");
        
        // Add collapsing class and hide dropdowns before toggling to prevent flash
        if (!wasCollapsed) {
          sidebar.classList.add('collapsing');
          
          // Immediately hide all dropdowns synchronously before transition starts
          document.querySelectorAll(".dropdown-container.open").forEach((dropdown) => {
            const menu = dropdown.querySelector(".dropdown-menu");
            if (menu) {
              menu.style.opacity = '0';
              menu.style.visibility = 'hidden';
              menu.style.pointerEvents = 'none';
              menu.style.transition = 'opacity 0s ease, visibility 0s ease';
            }
          });
          
          // Force a reflow to ensure styles are applied
          void sidebar.offsetHeight;
          
          // Now toggle collapsed class
          sidebar.classList.toggle("collapsed");
        } else {
          sidebar.classList.toggle("collapsed");
        }
        
        const isNowCollapsed = sidebar.classList.contains("collapsed");
        saveSidebarState(isNowCollapsed);
        
        // When expanding from collapsed to expanded, restore dropdown heights and positions
        if (wasCollapsed && !isNowCollapsed) {
          // Remove collapsing class when expanding
          sidebar.classList.remove('collapsing');
          // Sidebar just expanded - restore any open dropdowns
          // Remove collapsed-specific inline styles immediately
          document.querySelectorAll(".dropdown-container.open").forEach((dropdown) => {
            const menu = dropdown.querySelector(".dropdown-menu");
            if (menu) {
              // Clear all collapsed-specific inline styles
              menu.style.removeProperty('position');
              menu.style.removeProperty('left');
              menu.style.removeProperty('opacity');
              menu.style.removeProperty('pointer-events');
              menu.style.removeProperty('top');
            }
          });
          
          // Force reflow to apply CSS changes
          void sidebar.offsetHeight;
          
          // Restore heights after a frame to let CSS transition start
          requestAnimationFrame(() => {
            restoreDropdownHeights();
          });
          
          // Final restore after sidebar transition completes (0.4s)
          setTimeout(() => {
            restoreDropdownHeights();
          }, 450);
        } else if (!wasCollapsed && isNowCollapsed) {
          // Sidebar just collapsed - dropdowns already hidden above
          // Clear inline height to let CSS handle collapsed positioning
          document.querySelectorAll(".dropdown-container.open").forEach((dropdown) => {
            const menu = dropdown.querySelector(".dropdown-menu");
            if (menu) {
              menu.style.removeProperty('height');
            }
          });
          
          // Remove collapsing class and clear inline styles after sidebar transition completes
          setTimeout(() => {
            sidebar.classList.remove('collapsing');
            // Clear inline styles to allow CSS to handle hover states
            document.querySelectorAll(".dropdown-container.open").forEach((dropdown) => {
              const menu = dropdown.querySelector(".dropdown-menu");
              if (menu) {
                menu.style.removeProperty('opacity');
                menu.style.removeProperty('visibility');
                menu.style.removeProperty('pointer-events');
                menu.style.removeProperty('transition');
              }
            });
          }, 450);
        }
      }
    });
  });

  // Handle overlay click to close sidebar on mobile
  document.querySelector(".sidebar-overlay")?.addEventListener("click", () => {
    const sidebar = document.querySelector(".sidebar");
    sidebar.classList.remove("active");
    document.querySelector(".sidebar-overlay").classList.remove("active");
    document.body.style.overflow = "";
  });

  // User dropdown functionality
  const profileElement = document.querySelector(".topbar-profile");
  const userDropdown = document.querySelector(".user-dropdown");
  
  if (profileElement && userDropdown) {
    profileElement.addEventListener("click", (e) => {
      e.stopPropagation();
      profileElement.classList.toggle("active");
      userDropdown.classList.toggle("active");
      
      // Close language dropdown if open
      const languageElement = document.querySelector(".topbar-language");
      const languageDropdown = document.querySelector(".language-dropdown");
      if (languageElement && languageDropdown) {
        languageElement.classList.remove("active");
        languageDropdown.classList.remove("active");
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!profileElement.contains(e.target) && !userDropdown.contains(e.target)) {
        profileElement.classList.remove("active");
        userDropdown.classList.remove("active");
      }
    });
  }

  // Language dropdown functionality
  const languageElement = document.querySelector(".topbar-language");
  const languageDropdown = document.querySelector(".language-dropdown");
  
  if (languageElement && languageDropdown) {
    languageElement.addEventListener("click", (e) => {
      e.stopPropagation();
      languageElement.classList.toggle("active");
      languageDropdown.classList.toggle("active");
      
      // Close user dropdown if open
      if (profileElement && userDropdown) {
        profileElement.classList.remove("active");
        userDropdown.classList.remove("active");
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!languageElement.contains(e.target) && !languageDropdown.contains(e.target)) {
        languageElement.classList.remove("active");
        languageDropdown.classList.remove("active");
      }
    });
  }

  // Handle responsive sidebar behavior
  const handleResize = () => {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");
    
    // Close sidebar on mobile if it's open
    if (window.innerWidth <= 768) {
      // Remove active state from mobile view
      sidebar.classList.remove("active");
      if (overlay) {
        overlay.classList.remove("active");
      }
      // Don't collapse on mobile - keep it hidden by default
      sidebar.classList.remove("collapsed");
      // Restore body scroll
      document.body.style.overflow = "";
    } else {
      // On desktop, restore saved sidebar state when resizing from mobile to desktop
      const isCollapsed = loadSidebarState();
      if (isCollapsed) {
        sidebar.classList.add("collapsed");
      } else {
        sidebar.classList.remove("collapsed");
      }
      // Ensure body scroll is restored
      document.body.style.overflow = "";
    }
  };

  // Close dropdowns when window is resized
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      closeAllDropdowns();
      handleResize();
    }, 250);
  });
  
  // Initial call
  handleResize();
})();

