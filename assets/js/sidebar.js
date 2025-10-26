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
    button.addEventListener("click", () => {
      closeAllDropdowns(); // Close all open dropdowns
      const sidebar = document.querySelector(".sidebar");
      sidebar.classList.toggle("collapsed");
      
      // Handle overlay on mobile
      if (window.innerWidth <= 768) {
        const overlay = document.querySelector(".sidebar-overlay");
        if (overlay) {
          overlay.classList.toggle("active");
        }
      }
    });
  });

  // Handle overlay click to close sidebar on mobile
  document.querySelector(".sidebar-overlay")?.addEventListener("click", () => {
    const sidebar = document.querySelector(".sidebar");
    sidebar.classList.remove("active");
    document.querySelector(".sidebar-overlay").classList.remove("active");
  });

  // User dropdown functionality
  const profileElement = document.querySelector(".topbar-profile");
  const userDropdown = document.querySelector(".user-dropdown");
  
  if (profileElement && userDropdown) {
    profileElement.addEventListener("click", (e) => {
      e.stopPropagation();
      profileElement.classList.toggle("active");
      userDropdown.classList.toggle("active");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!profileElement.contains(e.target) && !userDropdown.contains(e.target)) {
        profileElement.classList.remove("active");
        userDropdown.classList.remove("active");
      }
    });
  }

  // Collapse sidebar by default on small screens
  if (window.innerWidth <= 768) {
    document.querySelector(".sidebar").classList.add("collapsed");
  }

  // Close dropdowns when window is resized
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      closeAllDropdowns();
      
      if (window.innerWidth <= 768) {
        document.querySelector(".sidebar").classList.add("collapsed");
      }
    }, 250);
  });
})();

