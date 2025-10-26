// Sidebar JavaScript
(function() {
  'use strict';

  // Toggle the visibility of a dropdown menu
  const toggleDropdown = (dropdown, menu, isOpen) => {
    dropdown.classList.toggle("open", isOpen);
    menu.style.height = isOpen ? `${menu.scrollHeight}px` : 0;
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

  // Attach click event to sidebar toggle buttons
  document.querySelectorAll(".sidebar-toggler, .sidebar-menu-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      closeAllDropdowns(); // Close all open dropdowns
      const sidebar = document.querySelector(".sidebar");
      const overlay = document.querySelector(".sidebar-overlay");
      
      // Handle mobile sidebar
      if (window.innerWidth <= 768) {
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
        // Desktop: toggle collapsed
        sidebar.classList.toggle("collapsed");
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
      // On desktop, ensure collapsed class is handled properly
      // Don't force collapse, let user control it
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

