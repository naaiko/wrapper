import { supabaseClient } from '../api/supabaseClient.js';

/**
 * Load intro.js onboarding steps from database
 * @param {string} page - Page name ('timeline', 'actors', 'calendar', etc.')
 * @returns {Promise<Array>} - Array of intro.js step objects
 */
export async function loadOnboardingSteps(page) {
    try {
        const { data, error } = await supabaseClient.db
            .from('intro_steps')
            .select('*')
            .eq('page', page)
            .eq('is_visible', true)
            .order('step_order', { ascending: true });
        
        if (error) {
            console.error('Error loading onboarding steps:', error);
            return [];
        }
        
        if (!data || data.length === 0) {
            console.warn(`No onboarding steps found for page: ${page}`);
            return [];
        }
        
        // Convert database steps to intro.js format
        return data.map(step => {
            const stepConfig = {
                title: step.title,
                intro: step.intro,
                position: step.position || 'bottom'
            };
            
            // Add element if specified
            if (step.element) {
                stepConfig.element = step.element;
            }
            
            return stepConfig;
        });
    } catch (error) {
        console.error('Error in loadOnboardingSteps:', error);
        return [];
    }
}
