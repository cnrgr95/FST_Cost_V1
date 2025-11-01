// Topbar JavaScript
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {
      // Fullscreen request failed (browser may not support it)
    });
    document.querySelector('.topbar-fullscreen .material-symbols-rounded').textContent = 'fullscreen_exit';
  } else {
    document.exitFullscreen().catch(() => {
      // Exit fullscreen failed (browser may not support it)
    });
    document.querySelector('.topbar-fullscreen .material-symbols-rounded').textContent = 'fullscreen';
  }
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', function() {
  const icon = document.querySelector('.topbar-fullscreen .material-symbols-rounded');
  if (icon) {
    if (document.fullscreenElement) {
      icon.textContent = 'fullscreen_exit';
    } else {
      icon.textContent = 'fullscreen';
    }
  }
});

// Listen for F11 key
document.addEventListener('keydown', function(e) {
  if (e.key === 'F11') {
    e.preventDefault();
    toggleFullscreen();
  }
});

