// ── config ────────────────────────────────────────────────────────────────────
// Add a project: { repo: 'user/repo', links?: [{ label, url }] }
// GitHub supplies name, desc, URL, stars, forks, language automatically.
// links[] is for anything GitHub doesn't know (store URLs, live demos, etc.)

const REPOS = [
    {
        repo: 'Aadam-Gafar/Weight-Forecasting-Pipeline',
        name: 'Weight Forecasting Pipeline',
        description: 'Weight forecasting pipeline for athletes using daily nutrition data. Predicts weight trajectory from MacroFactor exports to support controlled weight cuts for combat sports.',
        stars: '-',
        forks: '-',
        language: 'Jupyter Notebook',
    },
    {
        repo: 'Aadam-Gafar/Mono-Hub',
        name: 'Mono Hub',
        description: `The official landing page for Mono, a suite of distraction-free tools designed to help users reclaim their time. Includes: 'Mono for Desktop' and 'Mono for YouTube'.`,
        stars: '-',
        forks: '-',
        language: 'CSS',
        links: [
            { label: 'website ↗', url: 'https://monoapp.uk' }        ]
    },
];

// ── constants ─────────────────────────────────────────────────────────────────

const LANG_COLORS = {
    Python: '#3572A5', JavaScript: '#f1e05a', HTML: '#e34c26',
    CSS: '#563d7c', TypeScript: '#2b7489', 'Jupyter Notebook': '#DA5B0B',
};

const BOOT_START_DELAY = 180;
const BOOT_TYPE_SPEED = 24;
const BOOT_ENTER_DELAY = 1000;
const FLOW_INTERVAL = 24;
const FLOW_ROWS_PER_FRAME = 2;
const FLOW_EDGE_ROWS = 3;
const DECODE_INTERVAL = 16;
const DECODE_CHARS_PER_FRAME = 2;
const MATRIX_GLITCH_SYMBOLS = '@#%&$WM8B';
const MATRIX_GLITCH_COUNT = 10;
const MATRIX_GLITCH_LENGTH = 500;
const MATRIX_GLITCH_INTERVAL = 100;
const MATRIX_ART_FILE = 'face-dark.txt';
const GITHUB_USER = 'Aadam-Gafar';
const GITHUB_REPO_CACHE_KEY = 'githubRepoMetadata';
const GITHUB_REPO_CACHE_TTL = 1000 * 60 * 60 * 6;
let githubReposRequest;

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n).padStart(3, '0');
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
}[char]));
const link = (cls, href, text) => href
    ? `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${text}</a>`
    : `<span class="${cls}">${text}</span>`;

async function fetchMatrixArt(file) {
    const r = await fetch(file, { cache: 'force-cache' });
    return r.ok ? (await r.text()).replace(/\r\n?/g, '\n') : '';
}

async function fetchRepo(path) {
    const repos = await fetchGitHubRepos();
    return repos.find(repo => repo.full_name?.toLowerCase() === path.toLowerCase()) || null;
}

function readGitHubRepoCache() {
    try {
        const cache = JSON.parse(localStorage.getItem(GITHUB_REPO_CACHE_KEY));
        return cache && Array.isArray(cache.data) ? cache : null;
    } catch {
        return null;
    }
}

function writeGitHubRepoCache(data) {
    try {
        localStorage.setItem(GITHUB_REPO_CACHE_KEY, JSON.stringify({
            createdAt: Date.now(),
            data,
        }));
    } catch {
        // Rendering should not depend on cache availability.
    }
}

async function fetchGitHubRepos() {
    const cache = readGitHubRepoCache();

    if (cache && Date.now() - cache.createdAt < GITHUB_REPO_CACHE_TTL) {
        return cache.data;
    }

    if (githubReposRequest) {
        return githubReposRequest;
    }

    githubReposRequest = fetchGitHubReposFromApi(cache);
    return githubReposRequest;
}

async function fetchGitHubReposFromApi(cache) {
    try {
        const r = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`, {
            headers: { Accept: 'application/vnd.github+json' },
        });

        if (!r.ok) {
            console.warn(`GitHub metadata unavailable: ${r.status} ${r.statusText}`);
            return cache?.data || [];
        }

        const repos = await r.json();
        writeGitHubRepoCache(repos);
        return repos;
    } catch (error) {
        console.warn('GitHub metadata unavailable:', error);
        return cache?.data || [];
    }
}

async function initMatrixPortrait() {
    const portrait = document.getElementById('matrix-portrait');
    if (!portrait) return;

    try {
        const art = await fetchMatrixArt(MATRIX_ART_FILE);
        if (!art) return;

        const getArt = () => art;
        const start = () => flowInPortrait(portrait, art, () => initMatrixGlitch(portrait, getArt));

        if (document.documentElement.classList.contains('booting')) {
            window.addEventListener('bootdone', start, { once: true });
        } else {
            start();
        }
    } catch {
        portrait.remove();
    }
}

// reveals the art top-to-bottom: a scrambled leading edge sweeps down,
// resolving into the final characters row by row
function flowInPortrait(portrait, art, done) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        portrait.textContent = art;
        done();
        return;
    }

    const rows = art.split('\n');
    const scramble = row => [...row].map(char =>
        /\S/.test(char)
            ? MATRIX_GLITCH_SYMBOLS[Math.floor(Math.random() * MATRIX_GLITCH_SYMBOLS.length)]
            : char
    ).join('');

    let edge = 0;

    const step = () => {
        if (edge >= rows.length) {
            portrait.textContent = art;
            done();
            return;
        }

        portrait.innerHTML = rows.map((row, i) => {
            if (i < edge) return escapeHtml(row);
            if (i < edge + FLOW_EDGE_ROWS) return `<span class="matrix-glitch">${escapeHtml(scramble(row))}</span>`;
            return '';
        }).join('\n');

        edge += FLOW_ROWS_PER_FRAME;
        window.setTimeout(step, FLOW_INTERVAL);
    };

    step();
}

function initMatrixGlitch(portrait, getArt) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const renderGlitchFrame = (source, picked) => {
        portrait.innerHTML = source.map((char, index) => {
            if (!picked.has(index)) return escapeHtml(char);

            const symbol = MATRIX_GLITCH_SYMBOLS[Math.floor(Math.random() * MATRIX_GLITCH_SYMBOLS.length)];
            return `<span class="matrix-glitch">${escapeHtml(symbol)}</span>`;
        }).join('');
    };

    const glitch = () => {
        const source = [...getArt()];
        const glitchable = [];

        source.forEach((char, index) => {
            if (/\S/.test(char)) glitchable.push(index);
        });

        if (!glitchable.length) return;

        const picked = new Set();
        const count = Math.min(MATRIX_GLITCH_COUNT, glitchable.length);

        while (picked.size < count) {
            picked.add(glitchable[Math.floor(Math.random() * glitchable.length)]);
        }

        renderGlitchFrame(source, picked);

        window.setTimeout(() => {
            portrait.textContent = getArt();
            window.setTimeout(glitch, MATRIX_GLITCH_INTERVAL);
        }, MATRIX_GLITCH_LENGTH);
    };

    glitch();
}

// ── projects ──────────────────────────────────────────────────────────────────

function buildCard(p, d) {
    const lang = d?.language || p.language;
    const dot = lang && LANG_COLORS[lang] ? `<span class="lang-dot" style="background:${LANG_COLORS[lang]}"></span>` : '';
    const repoUrl = d?.html_url || `https://github.com/${p.repo}`;
    const repoName = d?.name || p.name || p.repo.split('/').pop();
    const description = d?.description || p.description;
    const stars = d?.stargazers_count ?? p.stars;
    const forks = d?.forks_count ?? p.forks;
    const allLinks = [...(p.links || []), { label: 'github ↗', url: repoUrl }];

    return `<article class="card">
    <div class="card-body">
      <div class="card-header">
        ${link('card-title', repoUrl, repoName)}
        <div class="card-links">${allLinks.map(l => link('card-link', l.url, l.label)).join('')}</div>
      </div>
      ${description ? `<p class="card-desc prose">${description}</p>` : ''}
      <div class="card-meta">
        <span class="meta-item">STARS <b>${Number.isFinite(stars) ? fmt(stars) : '—'}</b></span>
        <span class="meta-item">FORKS <b>${Number.isFinite(forks) ? fmt(forks) : '—'}</b></span>
        ${lang ? `<span class="meta-item">${dot} ${lang}</span>` : ''}
      </div>
    </div>
  </article>`;
}

async function initProjects() {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = REPOS.map(() =>
        `<div class="card"><p class="loading">retrieving records ...</p></div>`
    ).join('');
    const repos = await fetchGitHubRepos();
    const data = REPOS.map(p => repos.find(repo => repo.full_name?.toLowerCase() === p.repo.toLowerCase()) || null);
    grid.innerHTML = REPOS.map((p, i) => buildCard(p, data[i])).join('');
}

// ── contact form ──────────────────────────────────────────────────────────────

function initContact() {
    document.getElementById('contact-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('cf-name').value.trim();
        const email = document.getElementById('cf-email').value.trim();
        const msg = document.getElementById('cf-msg').value.trim();
        const subject = encodeURIComponent(`Portfolio contact from ${name}`);
        const body = encodeURIComponent(`From: ${name} <${email}>\n\n${msg}`);
        window.location.href = `mailto:aadamhgafar@gmail.com?subject=${subject}&body=${body}`;
    });
}

// ── boot sequence ─────────────────────────────────────────────────────────────
// Types the masthead prompt, "presses enter", then reveals the page by
// dropping html.booting (set inline in <head>; absent for reduced motion).

function initBootSequence() {
    const root = document.documentElement;
    if (!root.classList.contains('booting')) return;

    const reveal = () => {
        root.classList.remove('booting');
        decodeText(document.querySelector('h1'));
        window.dispatchEvent(new Event('bootdone'));
    };
    const cursor = document.querySelector('.cursor');
    const promptText = document.querySelector('.prompt > span')?.firstChild;

    if (!promptText) {
        reveal();
        return;
    }

    const fullText = promptText.textContent;
    let typed = 0;
    promptText.textContent = '';

    const type = () => {
        typed += 1;
        promptText.textContent = fullText.slice(0, typed);

        if (typed < fullText.length) {
            window.setTimeout(type, BOOT_TYPE_SPEED);
        } else {
            cursor?.classList.add('waiting');            // cursor blinks while idle
            window.setTimeout(reveal, BOOT_ENTER_DELAY); // enter ↵
        }
    };

    window.setTimeout(type, BOOT_START_DELAY);
}

// resolves an element's text left to right from scrambled glitch characters
function decodeText(el) {
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const finalText = el.textContent;
    let resolved = 0;

    const step = () => {
        if (resolved >= finalText.length) {
            el.textContent = finalText;
            return;
        }

        el.textContent = [...finalText].map((char, i) =>
            i < resolved || !/\S/.test(char)
                ? char
                : MATRIX_GLITCH_SYMBOLS[Math.floor(Math.random() * MATRIX_GLITCH_SYMBOLS.length)]
        ).join('');

        resolved += DECODE_CHARS_PER_FRAME;
        window.setTimeout(step, DECODE_INTERVAL);
    };

    step();
}

// ── init ──────────────────────────────────────────────────────────────────────

initBootSequence();
initMatrixPortrait();
initProjects();
initContact();
