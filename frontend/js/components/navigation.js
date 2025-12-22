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

    // Projects button (circular, same styling as tabs)
    const projectsButtonHTML = `
        <button 
            id="btnProjects" 
            onclick="window.location.href='index.html'"
            class="btn btn-circle bg-base-100 shadow-lg hover:bg-base-200 border-0"
            title="Back to Projects">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        </button>
    `;

    navContainer.innerHTML = `
        <div class="flex items-center gap-3">
            ${threeToggleHTML}
            ${projectsButtonHTML}
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
