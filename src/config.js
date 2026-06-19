// ============================================
// CONFIGURATION MODULE
// Environment variables and API settings
// ============================================

export const CONFIG = {
    // GitHub API Base URL
    GITHUB_API_BASE: 'https://api.github.com',
    
    // Rate limit endpoints
    RATE_LIMIT_URL: 'https://api.github.com/rate_limit',
    
    // User and repos endpoints
    USER_URL: (username) => `https://api.github.com/users/${username}`,
    REPOS_URL: (username) => `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
    ORGS_URL: (username) => `https://api.github.com/users/${username}/orgs`,
    
    // Default user for demo
    DEFAULT_USER: 'octocat',
    
    // Fetch token dynamically from localStorage
    get GITHUB_TOKEN() {
        return localStorage.getItem('github_explorer_token') || '';
    },
    
    set GITHUB_TOKEN(value) {
        if (value) {
            localStorage.setItem('github_explorer_token', value.trim());
        } else {
            localStorage.removeItem('github_explorer_token');
        }
    },
    
    // Request headers
    getHeaders() {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        const token = this.GITHUB_TOKEN;
        if (token) {
            headers['Authorization'] = `token ${token}`;
        }
        return headers;
    }
};
