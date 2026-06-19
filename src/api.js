// ============================================
// API MODULE
// Encapsulates all GitHub API operations
// ============================================

import { CONFIG } from './config.js';

let rateLimitCallback = null;

/**
 * Register a callback to be executed when rate limits are updated.
 * @param {Function} callback - Callback function receiving (remaining, limit)
 */
export function setRateLimitCallback(callback) {
    rateLimitCallback = callback;
}

function updateRateLimitFromHeaders(headers) {
    const remaining = headers.get('x-ratelimit-remaining');
    const limit = headers.get('x-ratelimit-limit');
    if (remaining !== null && limit !== null && rateLimitCallback) {
        rateLimitCallback(parseInt(remaining), parseInt(limit));
    }
}

export async function apiFetch(url) {
    const headers = CONFIG.getHeaders();
    let response;
    try {
        response = await fetch(url, { headers });
    } catch (e) {
        throw new Error('Network error. Check your connection.');
    }

    if (response.headers) {
        updateRateLimitFromHeaders(response.headers);
    }

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('User not found');
        }
        if (response.status === 403) {
            const errBody = await response.json().catch(() => ({}));
            if (errBody.message && errBody.message.includes('rate limit')) {
                throw new Error('Rate limit exceeded. Provide an API Token to bypass.');
            }
            throw new Error('Access forbidden (403)');
        }
        if (response.status === 401) {
            throw new Error('Invalid API Token credentials.');
        }
        throw new Error(`API Error (${response.status})`);
    }

    return response.json();
}

export async function fetchRateLimit() {
    const data = await apiFetch(CONFIG.RATE_LIMIT_URL);
    const { remaining, limit } = data.resources.core;
    if (rateLimitCallback) {
        rateLimitCallback(remaining, limit);
    }
    return { remaining, limit };
}

export async function fetchUserProfile(username) {
    return apiFetch(CONFIG.USER_URL(username));
}

export async function fetchUserRepos(username) {
    return apiFetch(CONFIG.REPOS_URL(username));
}

export async function fetchUserOrgs(username) {
    try {
        return await apiFetch(CONFIG.ORGS_URL(username));
    } catch (e) {
        console.warn('Failed fetching organizations memberships:', e);
        return [];
    }
}
