function setTheme(theme, isSystem = false) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    localStorage.setItem('isSystemTheme', isSystem);
    
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function getPreferredTheme() {
    // Check if user has manually set theme
    const savedTheme = localStorage.getItem('theme');
    const isSystemTheme = localStorage.getItem('isSystemTheme') === 'true';
    
    if (savedTheme && !isSystemTheme) {
        return savedTheme;
    }
    
    // Use system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Initialize theme
document.addEventListener('DOMContentLoaded', () => {
    // Apply theme immediately to prevent flash
    setTheme(getPreferredTheme(), true);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('isSystemTheme') === 'true') {
            setTheme(e.matches ? 'dark' : 'light', true);
        }
    });

    // Theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            setTheme(currentTheme === 'dark' ? 'light' : 'dark', false);
        });
    }
});
