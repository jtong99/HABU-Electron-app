// Supabase Client
const { createClient } = require('@supabase/supabase-js');
const config = require('./supabase-config');

// Initialize Supabase client
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

// ==================== COOKIES ====================

/**
 * Fetch the latest cookies from Supabase
 * @returns {Promise<Array|null>} Array of cookies or null if error
 */
async function fetchCookies() {
    try {
        const { data, error } = await supabase
            .from(config.TABLES.COOKIES)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching cookies:', error.message);
            return null;
        }

        if (data && data.cookies_data) {
            return typeof data.cookies_data === 'string'
                ? JSON.parse(data.cookies_data)
                : data.cookies_data;
        }

        return null;
    } catch (err) {
        console.error('Failed to fetch cookies from Supabase:', err.message);
        return null;
    }
}

/**
 * Get all cookies records
 * @returns {Promise<Array>} Array of cookie records
 */
async function getAllCookies() {
    try {
        const { data, error } = await supabase
            .from(config.TABLES.COOKIES)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Failed to get all cookies:', err.message);
        return [];
    }
}

/**
 * Save cookies to Supabase
 * @param {Array} cookies - Array of cookie objects
 * @param {string} name - Optional name/description for this cookie set
 * @returns {Promise<boolean>} Success status
 */
async function saveCookies(cookies, name = '') {
    try {
        // Extract earliest expiration date from cookies
        const expiresAt = getEarliestExpiration(cookies);

        const { error } = await supabase
            .from(config.TABLES.COOKIES)
            .insert({
                name: name || `Cookies ${new Date().toLocaleString()}`,
                cookies_data: cookies,
                expires_at: expiresAt,
                created_at: new Date().toISOString()
            });

        if (error) throw error;
        console.log('Cookies saved to Supabase successfully');
        return true;
    } catch (err) {
        console.error('Failed to save cookies to Supabase:', err.message);
        return false;
    }
}

/**
 * Get earliest expiration date from cookies array
 * @param {Array} cookies - Array of cookie objects
 * @returns {string|null} ISO date string or null
 */
function getEarliestExpiration(cookies) {
    if (!Array.isArray(cookies) || cookies.length === 0) return null;

    let earliestExp = null;

    for (const cookie of cookies) {
        let expDate = null;

        if (cookie.expirationDate) {
            // Unix timestamp in seconds - convert to milliseconds
            expDate = new Date(cookie.expirationDate * 1000);
        } else if (cookie.expires) {
            expDate = new Date(cookie.expires);
        }

        if (expDate && !isNaN(expDate.getTime())) {
            if (!earliestExp || expDate < earliestExp) {
                earliestExp = expDate;
            }
        }
    }

    return earliestExp ? earliestExp.toISOString() : null;
}

/**
 * Format expiration date for display
 * @param {string} expiresAt - ISO date string
 * @returns {Object} Formatted expiration info
 */
function formatExpiration(expiresAt) {
    if (!expiresAt) {
        return { text: 'Không xác định', status: 'unknown', color: '#888' };
    }

    const expDate = new Date(expiresAt);
    const now = new Date();

    if (expDate < now) {
        return { text: 'Đã hết hạn', status: 'expired', color: '#ea4335' };
    }

    const diffTime = expDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
        return { text: 'Hết hạn hôm nay', status: 'warning', color: '#fbbc05' };
    } else if (diffDays <= 7) {
        return { text: `Còn ${diffDays} ngày`, status: 'warning', color: '#fbbc05' };
    } else {
        return { text: `Còn ${diffDays} ngày`, status: 'valid', color: '#34a853' };
    }
}

/**
 * Delete cookies record by ID
 * @param {number} id - Record ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteCookies(id) {
    try {
        const { error } = await supabase
            .from(config.TABLES.COOKIES)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Failed to delete cookies:', err.message);
        return false;
    }
}

// ==================== APP CONFIG ====================

/**
 * Fetch app configuration from Supabase
 * @returns {Promise<Object|null>} App config object or null if error
 */
async function fetchAppConfig() {
    try {
        const { data, error } = await supabase
            .from(config.TABLES.APP_CONFIG)
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching app config:', error.message);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Failed to fetch app config from Supabase:', err.message);
        return null;
    }
}

/**
 * Get all app configs
 * @returns {Promise<Array>} Array of app config records
 */
async function getAllAppConfigs() {
    try {
        const { data, error } = await supabase
            .from(config.TABLES.APP_CONFIG)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Failed to get all app configs:', err.message);
        return [];
    }
}

/**
 * Save app config to Supabase
 * @param {Object} configData - App config object
 * @returns {Promise<boolean>} Success status
 */
async function saveAppConfig(configData) {
    try {
        const { error } = await supabase
            .from(config.TABLES.APP_CONFIG)
            .insert({
                app_name: configData.app_name || 'HABU AI',
                app_url: configData.app_url,
                is_active: configData.is_active !== false,
                created_at: new Date().toISOString()
            });

        if (error) throw error;
        console.log('App config saved to Supabase successfully');
        return true;
    } catch (err) {
        console.error('Failed to save app config to Supabase:', err.message);
        return false;
    }
}

/**
 * Update app config
 * @param {number} id - Record ID
 * @param {Object} configData - App config object
 * @returns {Promise<boolean>} Success status
 */
async function updateAppConfig(id, configData) {
    try {
        const { error } = await supabase
            .from(config.TABLES.APP_CONFIG)
            .update({
                app_name: configData.app_name,
                app_url: configData.app_url,
                is_active: configData.is_active
            })
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Failed to update app config:', err.message);
        return false;
    }
}

/**
 * Delete app config by ID
 * @param {number} id - Record ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteAppConfig(id) {
    try {
        const { error } = await supabase
            .from(config.TABLES.APP_CONFIG)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Failed to delete app config:', err.message);
        return false;
    }
}

// ==================== SUPERUSERS ====================

/**
 * Verify admin login
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Promise<Object|null>} User object or null if invalid
 */
async function verifyAdmin(username, password) {
    try {
        const { data, error } = await supabase
            .from(config.TABLES.SUPERUSERS)
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .eq('is_active', true)
            .single();

        if (error) {
            console.error('Admin verification failed:', error.message);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Failed to verify admin:', err.message);
        return null;
    }
}

/**
 * Get all superusers
 * @returns {Promise<Array>} Array of superuser records
 */
async function getAllSuperusers() {
    try {
        const { data, error } = await supabase
            .from(config.TABLES.SUPERUSERS)
            .select('id, username, email, is_active, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Failed to get all superusers:', err.message);
        return [];
    }
}

/**
 * Create a new superuser
 * @param {Object} userData - User data object
 * @returns {Promise<boolean>} Success status
 */
async function createSuperuser(userData) {
    try {
        const { error } = await supabase
            .from(config.TABLES.SUPERUSERS)
            .insert({
                username: userData.username,
                password: userData.password,
                email: userData.email || null,
                is_active: true,
                created_at: new Date().toISOString()
            });

        if (error) throw error;
        console.log('Superuser created successfully');
        return true;
    } catch (err) {
        console.error('Failed to create superuser:', err.message);
        return false;
    }
}

/**
 * Update superuser
 * @param {number} id - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<boolean>} Success status
 */
async function updateSuperuser(id, userData) {
    try {
        const updateData = {};
        if (userData.username) updateData.username = userData.username;
        if (userData.password) updateData.password = userData.password;
        if (userData.email !== undefined) updateData.email = userData.email;
        if (userData.is_active !== undefined) updateData.is_active = userData.is_active;

        const { error } = await supabase
            .from(config.TABLES.SUPERUSERS)
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Failed to update superuser:', err.message);
        return false;
    }
}

/**
 * Delete superuser by ID
 * @param {number} id - User ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteSuperuser(id) {
    try {
        const { error } = await supabase
            .from(config.TABLES.SUPERUSERS)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Failed to delete superuser:', err.message);
        return false;
    }
}

module.exports = {
    supabase,
    // Cookies
    fetchCookies,
    getAllCookies,
    saveCookies,
    deleteCookies,
    formatExpiration,
    // App Config
    fetchAppConfig,
    getAllAppConfigs,
    saveAppConfig,
    updateAppConfig,
    deleteAppConfig,
    // Superusers
    verifyAdmin,
    getAllSuperusers,
    createSuperuser,
    updateSuperuser,
    deleteSuperuser
};
