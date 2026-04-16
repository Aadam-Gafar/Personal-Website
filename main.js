// ── config ────────────────────────────────────────────────────────────────────
// Add a project: { repo: 'user/repo', links?: [{ label, url }] }
// GitHub supplies name, desc, URL, stars, forks, language automatically.
// links[] is for anything GitHub doesn't know (store URLs, live demos, etc.)

const REPOS = [
    { repo: 'Aadam-Gafar/Equity-Returns-Forecasting' },
    {
        repo: 'Aadam-Gafar/Mono-YouTube-Extension',
        links: [
            { label: 'chrome store ↗', url: 'https://chromewebstore.google.com/detail/focus-for-youtube/nppiofogichmlkadpbpkpojpidedifeh' },
            { label: 'firefox add-on ↗', url: 'https://addons.mozilla.org/en-US/firefox/addon/mono-extension/' },
        ],
    },
    { repo: 'Aadam-Gafar/Mono-Video-Browser'},
];

// ── constants ─────────────────────────────────────────────────────────────────

const LANG_COLORS = {
    Python: '#3572A5', JavaScript: '#f1e05a', HTML: '#e34c26',
    CSS: '#563d7c', TypeScript: '#2b7489', 'Jupyter Notebook': '#DA5B0B',
};

const ICONS = {
    star: `<svg viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>`,
    fork: `<svg viewBox="0 0 16 16"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0zM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0z"/></svg>`,
};

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
const link = (cls, href, text) => `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${text}</a>`;

async function fetchRepo(path) {
    try {
        const r = await fetch(`https://api.github.com/repos/${path}`);
        return r.ok ? r.json() : null;
    } catch { return null; }
}

// ── projects ──────────────────────────────────────────────────────────────────

function buildCard(p, d) {
    const lang = d?.language;
    const dot = lang && LANG_COLORS[lang] ? `<span class="lang-dot" style="background:${LANG_COLORS[lang]}"></span>` : '';
    const allLinks = [...(p.links || []), { label: 'github ↗', url: d?.html_url }];

    return `<div class="carousel-slide"><div class="card">
    <div class="card-header">
      ${link('card-title', d?.html_url, d?.name || p.repo.split('/')[1])}
      <div class="card-links">${allLinks.map(l => link('card-link', l.url, l.label)).join('')}</div>
    </div>
    ${d?.description ? `<p class="card-desc prose">${d.description}</p>` : ''}
    <div class="card-meta">
      <span class="meta-item">${ICONS.star} ${d ? fmt(d.stargazers_count) : '—'}</span>
      <span class="meta-item">${ICONS.fork} ${d ? fmt(d.forks_count) : '—'}</span>
      ${lang ? `<span class="meta-item">${dot} ${lang}</span>` : ''}
    </div>
  </div></div>`;
}

async function initProjects() {
    const track = document.getElementById('project-grid');
    track.innerHTML = REPOS.map(() =>
        `<div class="carousel-slide"><div class="card"><p class="loading">fetching...</p></div></div>`
    ).join('');
    const data = await Promise.all(REPOS.map(p => fetchRepo(p.repo)));
    track.innerHTML = REPOS.map((p, i) => buildCard(p, data[i])).join('');
    initCarousel(track);
}

function initCarousel(track) {
    const total = REPOS.length;
    let cur = 0;

    const dotsEl = document.getElementById('carousel-dots');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    dotsEl.innerHTML = Array.from({ length: total }, (_, i) =>
        `<button class="carousel-dot" aria-label="Go to project ${i + 1}"></button>`
    ).join('');
    const dots = [...dotsEl.querySelectorAll('.carousel-dot')];

    function go(idx) {
        cur = Math.max(0, Math.min(total - 1, idx));
        track.style.transform = `translateX(-${cur * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === cur));
        prevBtn.disabled = cur === 0;
        nextBtn.disabled = cur === total - 1;
    }

    prevBtn.addEventListener('click', () => go(cur - 1));
    nextBtn.addEventListener('click', () => go(cur + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') go(cur - 1);
        if (e.key === 'ArrowRight') go(cur + 1);
    });

    let touchStartX = null;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
        touchStartX = null;
    }, { passive: true });

    go(0);
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

// ── theme toggle ──────────────────────────────────────────────────────────────

function initTheme() {
    const btn = document.getElementById('theme-toggle');
    const stored = localStorage.getItem('theme');

    if (stored === 'light') {
        document.body.classList.add('light');
    }

    btn.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// ── init ──────────────────────────────────────────────────────────────────────

initProjects();
initContact();
initTheme();