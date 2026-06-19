// ============================================
// MAIN APPLICATION - GitHub DevExplorer Entry
// Coordinates ES Modules, state, and event bindings
// ============================================

import { CONFIG } from './config.js';
import { 
    fetchRateLimit, 
    fetchUserProfile, 
    fetchUserRepos, 
    fetchUserOrgs, 
    setRateLimitCallback 
} from './api.js';
import { 
    DOM, 
    renderProfile, 
    renderOrgs, 
    renderLanguageChart, 
    renderReposTable, 
    updateRateLimitUI, 
    toggleTokenModal, 
    setFeedback, 
    showLoading, 
    hideLoading 
} from './ui.js';

// Application State
const state = {
    currentRepos: [],
    currentUsername: '',
    currentProfile: null,
    activeLanguageFilter: null
};

// Wire API rate-limit handler updates directly to UI badge updater
setRateLimitCallback((remaining, limit) => {
    updateRateLimitUI(remaining, limit);
});

// Helper: Calculate language frequency breakdown (excluding forks)
function computeLanguageBreakdown(repos) {
    const langMap = {};
    let totalCount = 0;

    repos.forEach(repo => {
        if (!repo.fork && repo.language) {
            langMap[repo.language] = (langMap[repo.language] || 0) + 1;
            totalCount++;
        }
    });

    const sorted = Object.entries(langMap).sort((a, b) => b[1] - a[1]);
    return { breakdown: sorted, total: totalCount };
}

// Helper: Filter and Sort logic
function applyFiltersAndSort() {
    let repos = [...state.currentRepos];

    // 1. Filter: Local repository search query
    const searchVal = DOM.repoSearchInput.value.trim().toLowerCase();
    if (searchVal) {
        repos = repos.filter(repo => 
            repo.name.toLowerCase().includes(searchVal) || 
            (repo.description && repo.description.toLowerCase().includes(searchVal))
        );
    }

    // 2. Filter: Repo Type (Source vs Fork)
    const typeVal = DOM.repoTypeSelect.value;
    if (typeVal === 'source') {
        repos = repos.filter(repo => !repo.fork);
    } else if (typeVal === 'fork') {
        repos = repos.filter(repo => repo.fork);
    }

    // 3. Filter: Interactive Language Legend click
    if (state.activeLanguageFilter) {
        repos = repos.filter(repo => repo.language === state.activeLanguageFilter);
    }

    // 4. Sort selection
    const sortVal = DOM.sortSelect.value;
    if (sortVal === 'stars') {
        repos.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
    } else if (sortVal === 'forks') {
        repos.sort((a, b) => (b.forks_count || 0) - (a.forks_count || 0));
    } else if (sortVal === 'updated') {
        repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } else if (sortVal === 'name') {
        repos.sort((a, b) => a.name.localeCompare(b.name));
    }

    renderReposTable(repos);
}

// Event callback when legend items are clicked
function handleLanguageFilterToggle(lang) {
    if (state.activeLanguageFilter === lang) {
        state.activeLanguageFilter = null; // Toggle filter off
    } else {
        state.activeLanguageFilter = lang; // Toggle filter on
    }
    
    // Refresh table rendering
    applyFiltersAndSort();
    
    // Re-render chart to highlight the active legend tag
    const langData = computeLanguageBreakdown(state.currentRepos);
    renderLanguageChart(
        langData.breakdown, 
        langData.total, 
        state.activeLanguageFilter, 
        handleLanguageFilterToggle
    );
}

// Controller: Run full multi-endpoint analytics search
async function searchUser(username) {
    const query = username.trim();
    if (!query) {
        setFeedback('Please enter a valid GitHub username.', 'error');
        return;
    }

    setFeedback(`Analyzing "${query}" profile...`, 'info');
    showLoading();
    state.activeLanguageFilter = null; // Reset filters

    try {
        // Parallel API Fetch: User details, repositories and organizations memberships
        const [profile, repos, orgs] = await Promise.all([
            fetchUserProfile(query),
            fetchUserRepos(query),
            fetchUserOrgs(query)
        ]);

        // Calculate aggregated metrics
        const starSum = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
        const forkSum = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);

        // Update state
        state.currentUsername = query;
        state.currentRepos = repos;

        // Render profile card and organizations
        renderProfile(profile);
        renderOrgs(orgs);
        
        // Stars/Forks counts rendering
        DOM.totalStars.textContent = starSum;
        DOM.totalForks.textContent = forkSum;
        DOM.repoCount.textContent = repos.length;
        
        // Render repositories list
        applyFiltersAndSort();

        // Calculate and render languages breakdown chart
        const langData = computeLanguageBreakdown(repos);
        renderLanguageChart(
            langData.breakdown, 
            langData.total, 
            state.activeLanguageFilter, 
            handleLanguageFilterToggle
        );

        // Unhide workspace dashboard
        DOM.workspaceGrid.classList.remove('hidden');
        
        const exceedsAlert = profile.public_repos > repos.length ? ` (Showing first ${repos.length})` : '';
        setFeedback(`✅ Analytical profile generated${exceedsAlert}.`, 'success');
        
        DOM.workspaceGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        setFeedback(`❌ ${error.message}`, 'error');
        DOM.workspaceGrid.classList.add('hidden');
    } finally {
        hideLoading();
    }
}

async function handleRefreshRateLimit() {
    DOM.refreshRateBtn.querySelector('i').classList.add('spin');
    try {
        await fetchRateLimit();
    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => {
            DOM.refreshRateBtn.querySelector('i').classList.remove('spin');
        }, 600);
    }
}

async function saveToken() {
    const val = DOM.tokenInput.value.trim();
    CONFIG.GITHUB_TOKEN = val;
    
    setFeedback('Verifying GitHub Token rate permissions...', 'info');
    try {
        await fetchRateLimit();
        toggleTokenModal(false);
        setFeedback('✅ API Access Token configured successfully!', 'success');
        
        if (state.currentUsername) {
            searchUser(state.currentUsername);
        }
    } catch (e) {
        setFeedback('❌ Token validation failed. Check characters.', 'error');
        toggleTokenModal(true, val);
    }
}

function clearToken() {
    CONFIG.GITHUB_TOKEN = '';
    toggleTokenModal(false);
    fetchRateLimit();
    setFeedback('ℹ️ Token cleared. Resetting back to 60 req/hour limit.', 'info');
    
    if (state.currentUsername) {
        searchUser(state.currentUsername);
    }
}

// Bind event listeners
function registerEvents() {
    DOM.searchBtn.addEventListener('click', () => {
        searchUser(DOM.usernameInput.value);
    });
    DOM.usernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchUser(DOM.usernameInput.value);
        }
    });

    DOM.quickUserBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const user = e.target.getAttribute('data-username');
            DOM.usernameInput.value = user;
            searchUser(user);
        });
    });

    DOM.repoSearchInput.addEventListener('input', applyFiltersAndSort);
    DOM.repoTypeSelect.addEventListener('change', applyFiltersAndSort);
    DOM.sortSelect.addEventListener('change', applyFiltersAndSort);

    DOM.refreshRateBtn.addEventListener('click', handleRefreshRateLimit);

    DOM.tokenBtn.addEventListener('click', () => toggleTokenModal(true, CONFIG.GITHUB_TOKEN));
    DOM.closeTokenModal.addEventListener('click', () => toggleTokenModal(false));
    DOM.saveTokenBtn.addEventListener('click', saveToken);
    DOM.clearTokenBtn.addEventListener('click', clearToken);

    DOM.tokenModal.addEventListener('click', (e) => {
        if (e.target === DOM.tokenModal) {
            toggleTokenModal(false);
        }
    });
}

// App initial setup
async function init() {
    registerEvents();
    
    try {
        await fetchRateLimit();
    } catch (e) {
        console.error('Initial rate limits fetch failed:', e);
    }
    
    DOM.usernameInput.value = '';
}

document.addEventListener('DOMContentLoaded', init);
