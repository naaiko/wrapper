// =================================================================
// SHARED NAVIGATION COMPONENT
// =================================================================

/**
 * Creates consistent navigation across all pages
 * @param {string} projectId - The current project ID
 * @param {string} activePage - Which page is currently active ('timeline', 'calendar', 'actors')
 */
export function createNavigation(projectId, activePage = '') {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const navLinks = [
        {
            id: 'navActors',
            href: `actors.html?project=${projectId}`,
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />`,
            label: 'Actors',
            page: 'actors'
        },
        {
            id: 'navTimeline',
            href: `timeline.html?project=${projectId}`,
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />`,
            label: 'Timeline',
            page: 'timeline'
        },
        {
            id: 'navCalendar',
            href: `calendar.html?project=${projectId}`,
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />`,
            label: 'Calendar',
            page: 'calendar'
        },
        {
            id: 'navProjects',
            href: 'projects.html',
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />`,
            label: 'Projects',
            page: 'projects'
        }
    ];

    navbar.innerHTML = `
        <div class="flex-1">
            <a href="projects.html" class="btn btn-ghost text-xl">Continuity Manager</a>
        </div>
        <div class="flex-none gap-2">
            ${navLinks.map(link => `
                <a id="${link.id}" href="${link.href}" class="btn btn-ghost ${activePage === link.page ? 'btn-active' : ''}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        ${link.icon}
                    </svg>
                    ${link.label}
                </a>
            `).join('')}
        </div>
    `;
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
