// src/services/authService.js
import api from './service.js';

/**
 * Authentication service for handling login, registration, and user sessions
 */
const authService = {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @param {string} userData.firstName - User's first name
     * @param {string} userData.lastName - User's last name
     * @param {string} userData.email - User's email address
     * @param {string} userData.password - User's password
     * @returns {Promise<Object>} Response containing user data and token
     */
    register: async (userData) => {
        try {
            const response = await api.post('/auth/signup', userData);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Login an existing user with email and password
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<Object>} Response containing user data and token
     */
    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Sign in or sign up with Google
     * @param {string} googleToken - Google authentication token
     * @returns {Promise<Object>} Response containing user data and token
     */
    googleAuth: async (googleToken) => {
        try {
            const response = await api.post('/auth/google', { token: googleToken });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Logout the current user
     * @returns {Promise<void>}
     */
    logout: async () => {
        try {
            // Optional: Call the backend logout endpoint if you need to invalidate tokens
            // await api.post('/auth/logout');

            // Remove user data from local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } catch (error) {
            console.error('Logout error:', error);
            // Still remove items from localStorage even if API call fails
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    /**
     * Get the current authenticated user's details
     * @returns {Promise<Object>} Current user data
     */
    getCurrentUser: async () => {
        // First try from localStorage for faster response
        const userStr = localStorage.getItem('user');
        const cachedUser = userStr ? JSON.parse(userStr) : null;

        // If we have a token, verify and get fresh user data
        if (localStorage.getItem('token')) {
            try {
                const response = await api.get('/auth/me');
                // Update local storage with latest user data
                localStorage.setItem('user', JSON.stringify(response.data.user));
                return response.data.user;
            } catch (error) {
                // If token is invalid, clear storage
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    return null;
                }
                // If network error or other issue, return cached user
                return cachedUser;
            }
        }
        return null;
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    }
};

export default authService;