// =================================================================
// SHARED NAVIGATION COMPONENT
// =================================================================

/**
 * Creates consistent navigation across all pages
 * Now uses a three-toggle for Actors/Timeline/Calendar and a separate Projects button
 * @param {string} projectId - The current project ID
 * @param {string} activePage - Which page is currently active ('timeline', 'calendar', 'actors')
 */
export function createNavigation(projectId, activePage = '') {
    const navContainer = document.getElementById('topNavigation');
    if (!navContainer) return;

    // Three-toggle for main navigation
    const threeToggleHTML = `
        <div role="tablist" class="tabs tabs-boxed bg-base-100 shadow-lg">
            <a id="navActors" 
               href="actors.html?project=${projectId}" 
               role="tab" 
               class="tab ${activePage === 'actors' ? 'tab-active' : ''}">
                Actors
            </a>
            <a id="navTimeline" 
               href="timeline.html?project=${projectId}" 
               role="tab" 
               class="tab ${activePage === 'timeline' ? 'tab-active' : ''}">
                Timeline
            </a>
            <a id="navCalendar" 
               href="calendar.html?project=${projectId}" 
               role="tab" 
               class="tab ${activePage === 'calendar' ? 'tab-active' : ''}">
                Calendar
            </a>
        </div>
    `;

    // Projects button (circular, matches tab height)
    const projectsButtonHTML = `
        <button 
            id="btnProjects" 
            onclick="window.location.href='projects.html'"
            class="btn btn-sm btn-circle bg-base-100 shadow-lg hover:bg-base-200 border-0"
            title="Back to Projects">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        </button>
    `;

    // User menu pill (matches tab height)
    const userMenuHTML = `
        <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-sm btn-ghost bg-base-100 shadow-lg rounded-full pl-1 pr-3 gap-1">
                <div class="avatar placeholder">
                    <div class="bg-primary text-primary-content rounded-full w-6 h-6">
                        <span class="text-xs" id="userInitials">U</span>
                    </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 mt-2">
                <li class="menu-title">
                    <span id="userEmailDisplay">User</span>
                </li>
                <li><a href="users.html" id="menuManageUsers" style="display: none;">Manage Users</a></li>
                <li><a href="projects.html">My Projects</a></li>
                <li><a onclick="handleLogout()" class="text-error">Logout</a></li>
            </ul>
        </div>
    `;

    navContainer.innerHTML = `
        <div class="flex items-center gap-3">
            ${threeToggleHTML}
            ${projectsButtonHTML}
            ${userMenuHTML}
        </div>
    `;

    // Populate user info after rendering
    setTimeout(() => {
        populateUserInfo();
        setupDropdownToggle();
    }, 0);
}

/**
 * Setup dropdown toggle behavior - close on second click
 */
function setupDropdownToggle() {
    const dropdown = document.querySelector('.dropdown');
    const dropdownBtn = dropdown?.querySelector('[role="button"]');
    
    if (!dropdownBtn) return;
    
    let isOpen = false;
    
    // Track when dropdown opens
    dropdownBtn.addEventListener('focus', () => {
        isOpen = true;
    });
    
    // Track when dropdown closes
    dropdownBtn.addEventListener('blur', () => {
        isOpen = false;
    });
    
    // Handle click to toggle
    dropdownBtn.addEventListener('mousedown', (e) => {
        if (isOpen) {
            e.preventDefault();
            dropdownBtn.blur();
        }
    });
}

/**
 * Initialize navigation with project ID from URL
 * @param {string} activePage - Which page is currently active
 */
export function initNavigation(activePage = '') {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');
    
    if (projectId) {
        createNavigation(projectId, activePage);
    }
}

/**
 * Populate user information in the menu
 */
function populateUserInfo() {
    const session = JSON.parse(localStorage.getItem('continuity_session') || 'null');
    if (!session || !session.user) return;

    const { user } = session;
    
    // Set initials
    const initialsEl = document.getElementById('userInitials');
    if (initialsEl && user.name) {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        initialsEl.textContent = initials;
    }

    // Set email
    const emailEl = document.getElementById('userEmailDisplay');
    if (emailEl) {
        emailEl.textContent = user.email;
    }

    // Show "Manage Users" link only for superadmin
    if (user.role === 'superadmin') {
        const manageUsersLink = document.getElementById('menuManageUsers');
        if (manageUsersLink) {
            manageUsersLink.style.display = 'block';
        }
    }
}

/**
 * Handle logout
 */
window.handleLogout = function() {
    localStorage.removeItem('continuity_session');
    localStorage.removeItem('continuityManager_currentProject');
    window.location.href = 'login.html';
};
