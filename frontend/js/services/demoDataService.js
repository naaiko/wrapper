// =================================================================
// DEMO DATA SERVICE - Bogus data for previews, onboarding, demos
// =================================================================

/**
 * Demo data service provides realistic sample data for:
 * - Settings previews
 * - Onboarding tutorials
 * - Feature demonstrations
 * - UI testing
 * 
 * Future: Make this configurable via superadmin interface
 */

const demoDataService = {
    /**
     * Get a fully populated demo scene with maximum data
     * Shows all possible elements on a scene card
     */
    getMaximalDemoScene() {
        return {
            id: 'demo-scene-001',
            scene_number: '42A',
            description: 'Sarah confronts Marcus about the missing documents',
            location_id: 'demo-location-001',
            int_ext: 'INT',
            time: 'day',
            conditions: ['sunny', 'hot'],
            continuity: 'continuous',
            notes: 'Requires practical blood effects. Ensure coffee cups match previous scene.',
            pages: 3.5,
            estimated_duration: 8,
            split_group_id: 'demo-split-001',
            priority: 'high',
            status: 'approved'
        };
    },

    /**
     * Get demo location that matches the demo scene
     */
    getDemoLocation() {
        return {
            id: 'demo-location-001',
            name: 'COFFEE SHOP',
            description: 'Cozy downtown coffee shop with large windows',
            address: '123 Main Street',
            notes: 'Available Mon-Fri, 6am-10am only'
        };
    },

    /**
     * Get demo project with full configuration
     */
    getDemoProject() {
        return {
            id: 'demo-project-001',
            name: 'The Last Witness',
            description: 'A psychological thriller about memory and truth',
            times: this.getDefaultTimes(),
            conditions: this.getDefaultConditions(),
            settings: {
                show_int_ext: true,
                show_location: true,
                show_time: true,
                show_continuity: true,
                continuity_options: this.getDefaultContinuityOptions()
            }
        };
    },

    /**
     * Default times configuration
     */
    getDefaultTimes() {
        return [
            { id: 'morning', label: 'Morning', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />', enabled: true },
            { id: 'day', label: 'Day', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />', enabled: true },
            { id: 'evening', label: 'Evening', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />', enabled: true },
            { id: 'night', label: 'Night', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />', enabled: true },
        ];
    },

    /**
     * Default conditions configuration
     */
    getDefaultConditions() {
        return [
            { id: 'sunny', label: 'Sunny', icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>', enabled: true },
            { id: 'rainy', label: 'Rainy', icon: '<path d="M16 13v8"/><path d="M8 13v8"/><path d="M12 15v8"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>', enabled: true },
            { id: 'stormy', label: 'Stormy', icon: '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>', enabled: true },
            { id: 'cold', label: 'Cold', icon: '<path d="M2 12h20"/><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m4.93 19.07 14.14-14.14"/>', enabled: true },
            { id: 'hot', label: 'Hot', icon: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>', enabled: true },
            { id: 'chilly', label: 'Chilly', icon: '<path d="M2 12h20"/><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m4.93 19.07 14.14-14.14"/>', enabled: true },
        ];
    },

    /**
     * Default continuity options
     */
    getDefaultContinuityOptions() {
        return [
            { id: 'continuous', label: 'Continuous' },
            { id: 'later', label: 'Later' },
            { id: 'same-time', label: 'Same Time' }
        ];
    }
};

export default demoDataService;
