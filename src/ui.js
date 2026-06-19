// ============================================
// UI PRESENTATION MODULE
// Handles all DOM manipulations and renderings
// ============================================

// DOM Selectors
export const DOM = {
    usernameInput: document.getElementById('usernameInput'),
    searchBtn: document.getElementById('searchBtn'),
    searchFeedback: document.getElementById('searchFeedback'),
    quickUserBtns: document.querySelectorAll('.quick-user-btn'),

    workspaceGrid: document.getElementById('workspaceGrid'),
    profileSection: document.getElementById('profileSection'),
    avatarImg: document.getElementById('avatarImg'),
    profileName: document.getElementById('profileName'),
    profileLogin: document.getElementById('profileLogin'),
    profileBio: document.getElementById('profileBio'),
    profileCompany: document.getElementById('profileCompany'),
    profileLocation: document.getElementById('profileLocation'),
    profileBlog: document.getElementById('profileBlog'),
    profileTwitter: document.getElementById('profileTwitter'),
    profileJoined: document.getElementById('profileJoined'),
    
    metaCompanyContainer: document.getElementById('metaCompanyContainer'),
    metaLocationContainer: document.getElementById('metaLocationContainer'),
    metaBlogContainer: document.getElementById('metaBlogContainer'),
    metaTwitterContainer: document.getElementById('metaTwitterContainer'),

    followers: document.getElementById('followers'),
    following: document.getElementById('following'),
    publicRepos: document.getElementById('publicRepos'),
    totalStars: document.getElementById('totalStars'),
    totalForks: document.getElementById('totalForks'),
    profileLink: document.getElementById('profileLink'),

    orgsSection: document.getElementById('orgsSection'),
    orgsList: document.getElementById('orgsList'),

    reposSection: document.getElementById('reposSection'),
    repoCount: document.getElementById('repoCount'),
    repoSearchInput: document.getElementById('repoSearchInput'),
    repoTypeSelect: document.getElementById('repoTypeSelect'),
    sortSelect: document.getElementById('sortSelect'),
    langTrackBar: document.getElementById('langTrackBar'),
    langBars: document.getElementById('langBars'),
    repoTableBody: document.getElementById('repoTableBody'),
    repoFeedback: document.getElementById('repoFeedback'),

    rateLimitText: document.getElementById('rateLimitText'),
    refreshRateBtn: document.getElementById('refreshRateBtn'),

    // Token Modal
    tokenBtn: document.getElementById('tokenBtn'),
    tokenModal: document.getElementById('tokenModal'),
    closeTokenModal: document.getElementById('closeTokenModal'),
    tokenInput: document.getElementById('tokenInput'),
    saveTokenBtn: document.getElementById('saveTokenBtn'),
    clearTokenBtn: document.getElementById('clearTokenBtn')
};

// Standard GitHub Colors for Languages
const LANG_COLORS = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572a5',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Go: '#00add8',
    Rust: '#dea584',
    Java: '#b07219',
    Ruby: '#701516',
    PHP: '#4f5d95',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    Swift: '#f05138',
    Kotlin: '#a97bff',
    Shell: '#89e051',
    Vue: '#41b883',
    React: '#61dafb',
    Svelte: '#ff3e00',
    Dart: '#00b4ab',
    Scala: '#c22d40',
    R: '#198ce7'
};

// Helper: Color mapping fallback
export function getLangColor(lang) {
    if (LANG_COLORS[lang]) return LANG_COLORS[lang];
    let hash = 0;
    for (let i = 0; i < lang.length; i++) {
        hash = lang.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}

export function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export function setFeedback(message, type = 'info') {
    DOM.searchFeedback.textContent = message;
    DOM.searchFeedback.className = `feedback-msg ${type}`;
}

export function showLoading() {
    DOM.searchBtn.disabled = true;
    DOM.searchBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Analyzing...';
}

export function hideLoading() {
    DOM.searchBtn.disabled = false;
    DOM.searchBtn.innerHTML = '<span>Analyze Profile</span> <i class="fas fa-arrow-right"></i>';
}

export function updateRateLimitUI(remaining, limit) {
    DOM.rateLimitText.textContent = `${remaining} / ${limit}`;
    const badge = DOM.rateLimitText.closest('.rate-limit-badge');
    badge.className = 'rate-limit-badge';
    if (remaining === 0) {
        badge.classList.add('exhausted');
    } else if (remaining < 15) {
        badge.classList.add('warning');
    } else {
        badge.classList.add('normal');
    }
}

export function renderProfile(user) {
    DOM.avatarImg.src = user.avatar_url || '';
    DOM.avatarImg.alt = user.login || 'avatar';
    DOM.profileName.textContent = user.name || user.login;
    DOM.profileLogin.textContent = `@${user.login}`;
    DOM.profileBio.textContent = user.bio || 'No bio description available.';
    DOM.profileLink.href = user.html_url || '#';
    
    if (user.company) {
        DOM.profileCompany.textContent = user.company;
        DOM.metaCompanyContainer.classList.remove('hidden');
    } else {
        DOM.metaCompanyContainer.classList.add('hidden');
    }

    if (user.location) {
        DOM.profileLocation.textContent = user.location;
        DOM.metaLocationContainer.classList.remove('hidden');
    } else {
        DOM.metaLocationContainer.classList.add('hidden');
    }

    if (user.blog) {
        let url = user.blog;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        DOM.profileBlog.textContent = user.blog;
        DOM.profileBlog.href = url;
        DOM.metaBlogContainer.classList.remove('hidden');
    } else {
        DOM.metaBlogContainer.classList.add('hidden');
    }

    if (user.twitter_username) {
        DOM.profileTwitter.textContent = `@${user.twitter_username}`;
        DOM.metaTwitterContainer.classList.remove('hidden');
    } else {
        DOM.metaTwitterContainer.classList.add('hidden');
    }

    DOM.profileJoined.textContent = formatDate(user.created_at);
    DOM.followers.textContent = user.followers ?? 0;
    DOM.following.textContent = user.following ?? 0;
    DOM.publicRepos.textContent = user.public_repos ?? 0;
}

export function renderOrgs(orgs) {
    DOM.orgsList.innerHTML = '';
    if (!orgs || orgs.length === 0) {
        DOM.orgsSection.classList.add('hidden');
        return;
    }

    DOM.orgsSection.classList.remove('hidden');
    orgs.forEach(org => {
        const item = document.createElement('div');
        item.className = 'org-item';
        item.title = org.login;
        item.innerHTML = `<img src="${org.avatar_url}" alt="${org.login}" class="org-logo" />`;
        item.addEventListener('click', () => {
            window.open(`https://github.com/${org.login}`, '_blank');
        });
        DOM.orgsList.appendChild(item);
    });
}

export function renderLanguageChart(breakdown, total, activeLanguageFilter, onLegendClick) {
    DOM.langTrackBar.innerHTML = '';
    DOM.langBars.innerHTML = '';

    if (!breakdown.length) {
        DOM.langBars.innerHTML = '<span class="text-muted" style="font-size:0.8rem; padding:10px;">No language data available.</span>';
        DOM.langTrackBar.style.width = '0%';
        return;
    }

    const topLimit = 5;
    const topItems = breakdown.slice(0, topLimit);
    const otherItems = breakdown.slice(topLimit);
    
    let segments = [...topItems];
    let othersSum = otherItems.reduce((acc, [, val]) => acc + val, 0);
    
    if (othersSum > 0) {
        segments.push(['Others', othersSum]);
    }

    segments.forEach(([lang, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        const color = lang === 'Others' ? '#6e7681' : getLangColor(lang);

        const trackSegment = document.createElement('div');
        trackSegment.className = 'lang-track-segment';
        trackSegment.style.width = `${pct}%`;
        trackSegment.style.backgroundColor = color;
        trackSegment.title = `${lang}: ${count} repos (${pct.toFixed(1)}%)`;
        DOM.langTrackBar.appendChild(trackSegment);
    });

    breakdown.forEach(([lang, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        const color = getLangColor(lang);

        const legendItem = document.createElement('div');
        legendItem.className = 'lang-legend-item';
        if (activeLanguageFilter === lang) {
            legendItem.classList.add('active');
        }
        
        legendItem.innerHTML = `
            <span class="lang-color-dot" style="background-color: ${color}"></span>
            <span class="lang-legend-name" title="${lang}">${lang}</span>
            <span class="lang-legend-pct">${pct.toFixed(0)}%</span>
        `;

        legendItem.addEventListener('click', () => {
            if (onLegendClick) {
                onLegendClick(lang);
            }
        });

        DOM.langBars.appendChild(legendItem);
    });
}

export function renderReposTable(repos) {
    DOM.repoTableBody.innerHTML = '';
    
    if (repos.length === 0) {
        DOM.repoTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                    <i class="fas fa-folder-open" style="font-size: 1.5rem; margin-bottom: 0.5rem; display:block;"></i>
                    No repositories match filters.
                </td>
            </tr>
        `;
        return;
    }

    repos.forEach(repo => {
        const tr = document.createElement('tr');
        const color = repo.language ? getLangColor(repo.language) : '#6e7681';

        tr.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap: 0.5rem;">
                    <a href="${repo.html_url}" target="_blank" class="repo-name-link">
                        ${repo.name}
                    </a>
                    ${repo.fork ? '<span class="fork-badge-indicator">Fork</span>' : ''}
                </div>
                ${repo.description ? `<p class="repo-description" title="${repo.description}">${repo.description}</p>` : ''}
            </td>
            <td>
                ${repo.language ? `
                    <span class="repo-lang-badge">
                        <span class="lang-color-dot" style="background-color: ${color}"></span>
                        <span>${repo.language}</span>
                    </span>
                ` : '<span style="color:var(--text-muted)">—</span>'}
            </td>
            <td class="text-right stat-cell-num">${repo.stargazers_count ?? 0}</td>
            <td class="text-right stat-cell-num">${repo.forks_count ?? 0}</td>
            <td class="text-right hide-mobile text-xs stat-cell-num" style="color: var(--text-muted);">
                ${formatDate(repo.updated_at)}
            </td>
        `;
        DOM.repoTableBody.appendChild(tr);
    });
}

export function toggleTokenModal(show, currentToken = '') {
    if (show) {
        DOM.tokenInput.value = currentToken;
        DOM.tokenModal.classList.remove('hidden');
        DOM.tokenInput.focus();
    } else {
        DOM.tokenModal.classList.add('hidden');
    }
}
