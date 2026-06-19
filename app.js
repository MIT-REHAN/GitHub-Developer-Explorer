// ============================================
// MAIN APPLICATION - GitHub Explorer
// ============================================

// DOM Elements
const DOM = {
    usernameInput: document.getElementById('usernameInput'),
    searchBtn: document.getElementById('searchBtn'),
    searchFeedback: document.getElementById('searchFeedback'),

    profileSection: document.getElementById('profileSection'),
    avatarImg: document.getElementById('avatarImg'),
    profileName: document.getElementById('profileName'),
    profileLogin: document.getElementById('profileLogin'),
    profileBio: document.getElementById('profileBio'),
    followers: document.getElementById('followers'),
    following: document.getElementById('following'),
    publicRepos: document.getElementById('publicRepos'),
    profileLink: document.getElementById('profileLink'),

    reposSection: document.getElementById('reposSection'),
    repoCount: document.getElementById('repoCount'),
    repoTableBody: document.getElementById('repoTableBody'),
    repoFeedback: document.getElementById('repoFeedback'),
    langBars: document.getElementById('langBars'),
    sortSelect: document.getElementById('sortSelect'),

    rateLimitText: document.getElementById('rateLimitText'),
    refreshRateBtn: document.getElementById('refreshRateBtn')
};

// Application State
const state = {
    currentRepos: [],
    currentUsername: ''
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function setFeedback(element, message, isError = false) {
    element.textContent = message;
    element.className = `feedback ${isError ? 'error' : 'success'}`;
}

function showLoading(button) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Loading...';
}

function hideLoading(button) {
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-search"></i> Search';
}

// ============================================
// API FUNCTIONS
// ============================================

async function apiFetch(url) {
    const headers = CONFIG.getHeaders();
    const response = await fetch(url, { headers });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('User not found');
        }
        if (response.status === 403) {
            throw new Error('Rate limit exceeded. Please wait.');
        }
        throw new Error(`API Error (${response.status})`);
    }

    return response.json();
}

async function fetchRateLimit() {
    try {
        const data = await apiFetch(CONFIG.RATE_LIMIT_URL);
        const { remaining, limit } = data.resources.core;
        DOM.rateLimitText.textContent = `${remaining} / ${limit}`;
        return { remaining, limit };
    } catch (error) {
        DOM.rateLimitText.textContent = '⚠️ Error';
        return null;
    }
}

async function fetchUserProfile(username) {
    const url = CONFIG.USER_URL(username);
    return apiFetch(url);
}

async function fetchUserRepos(username) {
    const url = CONFIG.REPOS_URL(username);
    return apiFetch(url);
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function renderProfile(user) {
    DOM.profileSection.classList.remove('hidden');
    DOM.avatarImg.src = user.avatar_url || '';
    DOM.avatarImg.alt = user.login || 'avatar';
    DOM.profileName.textContent = user.name || user.login;
    DOM.profileLogin.textContent = `@${user.login}`;
    DOM.profileBio.textContent = user.bio || 'No bio available';
    DOM.followers.textContent = user.followers ?? 0;
    DOM.following.textContent = user.following ?? 0;
    DOM.publicRepos.textContent = user.public_repos ?? 0;
    DOM.profileLink.href = user.html_url || '#';
}

function computeLanguageBreakdown(repos) {
    const langMap = {};
    let total = 0;

    for (const repo of repos) {
        const lang = repo.language || 'Uncategorized';
        langMap[lang] = (langMap[lang] || 0) + 1;
        total++;
    }

    return Object.entries(langMap)
        .sort((a, b) => b[1] - a[1]);
}

function renderLanguageBars(breakdown, total) {
    DOM.langBars.innerHTML = '';

    if (!breakdown.length) {
        DOM.langBars.innerHTML = '<span class="text-gray-400">No language data</span>';
        return;
    }

    // Show top 5 + others
    const top = breakdown.slice(0, 5);
    const others = breakdown.slice(5);
    let othersCount = others.reduce((sum, [, count]) => sum + count, 0);

    const items = [...top];
    if (othersCount > 0) {
        items.push(['Others', othersCount]);
    }

    const colors = ['#3178c6', '#f1e05a', '#2b7489', '#b07219', '#563d7c', '#6e6e6e'];

    items.forEach(([lang, count], idx) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        const color = colors[idx % colors.length];

        const div = document.createElement('div');
        div.className = 'lang-item';
        div.innerHTML = `
            <span class="lang-name">${lang}</span>
            <div class="lang-bar-bg">
                <div class="lang-bar-fill" style="width:${pct}%; background-color:${color};"></div>
            </div>
            <span class="lang-percent">${pct.toFixed(0)}%</span>
        `;
        DOM.langBars.appendChild(div);
    });
}

function renderRepos(repos, sortKey = 'name') {
    const sorted = [...repos];

    if (sortKey === 'name') {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey === 'stars') {
        sorted.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
    } else if (sortKey === 'updated') {
        sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    DOM.repoTableBody.innerHTML = '';

    if (!sorted.length) {
        DOM.repoTableBody.innerHTML = `
            <tr><td colspan="4" class="text-center py-4 text-gray-400">No repositories found</td></tr>
        `;
        return;
    }

    for (const repo of sorted) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <a href="${repo.html_url}" target="_blank" class="repo-name">${repo.name}</a>
                ${repo.description ? `<div class="repo-desc">${repo.description}</div>` : ''}
            </td>
            <td class="hide-mobile">${repo.language || '—'}</td>
            <td class="text-right">${repo.stargazers_count || 0}</td>
            <td class="text-right hide-tablet text-gray-400 text-xs">${formatDate(repo.updated_at)}</td>
        `;
        DOM.repoTableBody.appendChild(tr);
    }
}

// ============================================
// MAIN SEARCH FUNCTION
// ============================================

async function searchUser(username) {
    const trimmed = username.trim();

    if (!trimmed) {
        setFeedback(DOM.searchFeedback, 'Please enter a username.', true);
        return;
    }

    setFeedback(DOM.searchFeedback, `Fetching "${trimmed}" ...`);
    showLoading(DOM.searchBtn);

    try {
        // Fetch profile and repos in parallel
        const [user, repos] = await Promise.all([
            fetchUserProfile(trimmed),
            fetchUserRepos(trimmed)
        ]);

        // Update state
        state.currentUsername = trimmed;
        state.currentRepos = repos;

        // Render everything
        renderProfile(user);
        DOM.reposSection.classList.remove('hidden');
        DOM.repoCount.textContent = `(${repos.length})`;

        const breakdown = computeLanguageBreakdown(repos);
        renderLanguageBars(breakdown, repos.length);

        const sortVal = DOM.sortSelect.value;
        renderRepos(repos, sortVal);

        setFeedback(DOM.searchFeedback, `✅ ${repos.length} repositories loaded`);

    } catch (error) {
        setFeedback(DOM.searchFeedback, `❌ ${error.message}`, true);
        DOM.profileSection.classList.add('hidden');
        DOM.reposSection.classList.add('hidden');
    } finally {
        hideLoading(DOM.searchBtn);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

DOM.searchBtn.addEventListener('click', () => {
    searchUser(DOM.usernameInput.value);
});

DOM.usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        searchUser(DOM.usernameInput.value);
    }
});

DOM.sortSelect.addEventListener('change', () => {
    if (state.currentRepos.length) {
        renderRepos(state.currentRepos, DOM.sortSelect.value);
    }
});

DOM.refreshRateBtn.addEventListener('click', fetchRateLimit);

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    // Load rate limit
    await fetchRateLimit();

    // Load default user
    const defaultUser = CONFIG.DEFAULT_USER || 'octocat';
    DOM.usernameInput.value = defaultUser;
    await searchUser(defaultUser);
}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', init);