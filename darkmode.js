// Shared dark mode functionality
class DarkModeManager {
    constructor() {
        this.init();
    }

    init() {
        this.createToggleButton();
        this.loadDarkModePreference();
        this.bindEvents();
    }

    createToggleButton() {
        const button = document.createElement('button');
        button.className = 'dark-mode-toggle';
        button.id = 'darkModeToggle';
        button.title = 'Try Dark Mode!';
        button.innerHTML = '<i class="fas fa-moon"></i>';
        document.body.appendChild(button);
        
        const hint = document.createElement('div');
        hint.className = 'dark-mode-hint';
        hint.id = 'darkModeHint';
        hint.textContent = '✨ Try Dark Mode!';
        document.body.appendChild(hint);
        
        this.showHintAfterDelay();
    }

    bindEvents() {
        const toggle = document.getElementById('darkModeToggle');
        toggle.addEventListener('click', this.toggleDarkMode.bind(this));
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        const icon = document.querySelector('#darkModeToggle i');
        const button = document.getElementById('darkModeToggle');
        
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        button.title = isDark ? 'Switch to Light Mode' : 'Try Dark Mode!';
        
        localStorage.setItem('darkMode', isDark);
    }

    loadDarkModePreference() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
            const icon = document.querySelector('#darkModeToggle i');
            const button = document.getElementById('darkModeToggle');
            
            icon.className = 'fas fa-sun';
            button.title = 'Switch to Light Mode';
        }
    }
    
    showHintAfterDelay() {
        const hasSeenHint = localStorage.getItem('darkModeHintSeen');
        const isDark = localStorage.getItem('darkMode') === 'true';
        
        if (!hasSeenHint && !isDark) {
            setTimeout(() => {
                const hint = document.getElementById('darkModeHint');
                if (hint) {
                    hint.classList.add('show');
                    setTimeout(() => {
                        hint.classList.remove('show');
                        localStorage.setItem('darkModeHintSeen', 'true');
                    }, 3000);
                }
            }, 2000);
        }
    }
}

// Initialize dark mode on all pages
document.addEventListener('DOMContentLoaded', () => {
    new DarkModeManager();
});