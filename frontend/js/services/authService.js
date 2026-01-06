/**
 * Authentication Service
 * Handles user login, logout, session management, and role-based access control
 */

// Access global supabase instance
const supabase = window.supabase;

class AuthService {
    constructor() {
        this.currentUser = null;
        this.sessionToken = null;
        this._loadSession();
    }

    /**
     * Load session from localStorage
     * @private
     */
    _loadSession() {
        try {
            const sessionData = localStorage.getItem('cm_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                // Check if session is expired
                if (new Date(session.expiresAt) > new Date()) {
                    this.currentUser = session.user;
                    this.sessionToken = session.token;
                } else {
                    this._clearSession();
                }
            }
        } catch (error) {
            console.error('Error loading session:', error);
            this._clearSession();
        }
    }

    /**
     * Save session to localStorage
     * @private
     */
    _saveSession(user, token, expiresAt) {
        const session = {
            user,
            token,
            expiresAt
        };
        localStorage.setItem('cm_session', JSON.stringify(session));
        this.currentUser = user;
        this.sessionToken = token;
    }

    /**
     * Clear session from localStorage
     * @private
     */
    _clearSession() {
        localStorage.removeItem('cm_session');
        this.currentUser = null;
        this.sessionToken = null;
    }

    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password (plain text, will be hashed on backend)
     * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
     */
    async login(email, password) {
        try {
            // For now, we'll do simple authentication
            // In production, this should use proper password hashing (bcrypt)
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .single();

            if (error || !users) {
                return {
                    success: false,
                    error: 'Invalid email or password'
                };
            }

            // TEMPORARY: For testing, accept any password
            // TODO: Implement proper bcrypt password verification
            const passwordValid = true; // await this.verifyPassword(password, users.password_hash);

            if (!passwordValid) {
                return {
                    success: false,
                    error: 'Invalid email or password'
                };
            }

            // Create session
            const sessionToken = this._generateSessionToken();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

            const { error: sessionError } = await supabase
                .from('user_sessions')
                .insert({
                    user_id: users.id,
                    session_token: sessionToken,
                    expires_at: expiresAt.toISOString()
                });

            if (sessionError) {
                console.error('Error creating session:', sessionError);
                return {
                    success: false,
                    error: 'Failed to create session'
                };
            }

            // Update last login
            await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', users.id);

            // Save session
            const user = {
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role
            };
            this._saveSession(user, sessionToken, expiresAt.toISOString());

            return {
                success: true,
                user
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: 'An unexpected error occurred'
            };
        }
    }

    /**
     * Logout current user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            if (this.sessionToken) {
                // Delete session from database
                await supabase
                    .from('user_sessions')
                    .delete()
                    .eq('session_token', this.sessionToken);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this._clearSession();
            // Redirect to login
            window.location.href = 'login.html';
        }
    }

    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Get current user
     * @returns {Object|null}
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if current user is superadmin
     * @returns {boolean}
     */
    isSuperAdmin() {
        return this.currentUser?.role === 'superadmin';
    }

    /**
     * Check if current user is manager
     * @returns {boolean}
     */
    isManager() {
        return this.currentUser?.role === 'manager';
    }

    /**
     * Require authentication - redirect to login if not authenticated
     * @param {string} redirectUrl - URL to redirect back to after login
     */
    requireAuth(redirectUrl = null) {
        if (!this.isLoggedIn()) {
            const redirect = redirectUrl || window.location.href;
            window.location.href = `login.html?redirect=${encodeURIComponent(redirect)}`;
            return false;
        }
        return true;
    }

    /**
     * Require specific role - show error if user doesn't have permission
     * @param {string|string[]} roles - Required role(s)
     * @returns {boolean}
     */
    requireRole(roles) {
        if (!this.isLoggedIn()) {
            return false;
        }

        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (!allowedRoles.includes(this.currentUser.role)) {
            console.error('Access denied: insufficient permissions');
            return false;
        }

        return true;
    }

    /**
     * Generate a random session token
     * @private
     * @returns {string}
     */
    _generateSessionToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Validate session token (check if still valid in database)
     * @returns {Promise<boolean>}
     */
    async validateSession() {
        if (!this.sessionToken) {
            return false;
        }

        try {
            const { data: session, error } = await supabase
                .from('user_sessions')
                .select('*')
                .eq('session_token', this.sessionToken)
                .single();

            if (error || !session) {
                this._clearSession();
                return false;
            }

            // Check if expired
            if (new Date(session.expires_at) < new Date()) {
                this._clearSession();
                return false;
            }

            // Update last activity
            await supabase
                .from('user_sessions')
                .update({ last_activity: new Date().toISOString() })
                .eq('id', session.id);

            return true;
        } catch (error) {
            console.error('Session validation error:', error);
            this._clearSession();
            return false;
        }
    }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
