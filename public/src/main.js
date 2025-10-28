const PROFILE_PREFIX = '@staryuehtech/';
const STORAGE_KEY = 'sv-article-preferences';
const DEFAULT_THEME = 'light';

// TODO: Update slug values to match the real HackMD documents you maintain.
const ARTICLES = [
    {
        id: 'privacy',
        label: '隱私權政策',
        languages: [
            { code: 'zh-TW', label: '繁體中文' },
            { code: 'en', label: 'English' },
        ],
    },
    {
        id: 'terms',
        label: '服務條款',
        languages: [
            { code: 'zh-TW', label: '繁體中文' },
            { code: 'en', label: 'English' },
        ],
    },
];

const articleSelect = document.getElementById('article-select');
const languageSelect = document.getElementById('language-select');
const themeSelect = document.getElementById('theme-select');
const articleContainer = document.getElementById('article-content');

let preferences = loadPreferences();

async function fetchHackmdMarkdown(id) {
    const parser = new DOMParser();
    const url = `https://hackmd.io/${PROFILE_PREFIX}${id}`;
    const res = await fetch('/api/proxy?url=' + encodeURIComponent(url));
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const text = await res.text();
    const htmlDoc = parser.parseFromString(text, 'text/html');
    const publishNode = htmlDoc.querySelector('#publish-page');
    if (!publishNode) throw new Error('無法解析 HackMD 內容');
    return publishNode.innerText;
}

async function fetchLocalMarkdown() {
    const res = await fetch('.test.html');
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.text();
}

function loadPreferences() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (err) {
        console.warn('Failed to parse preferences', err);
        return {};
    }
}

function savePreferences(prefs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function updatePreferences(partial) {
    preferences = { ...preferences, ...partial };
    savePreferences(preferences);
}

function populateArticleOptions(selectedId) {
    articleSelect.innerHTML = '';
    ARTICLES.forEach(({ id, label }) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = label;
        if (id === selectedId) option.selected = true;
        articleSelect.append(option);
    });
}

function populateLanguageOptions(article, selectedLanguageCode) {
    languageSelect.innerHTML = '';
    article.languages.forEach(({ code, label }) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = label;
        if (code === selectedLanguageCode) option.selected = true;
        languageSelect.append(option);
    });
}

function applyTheme(theme) {
    const resolved = theme || DEFAULT_THEME;
    document.documentElement.dataset.theme = resolved;
    themeSelect.value = resolved;
}

function getArticleConfig(id) {
    return ARTICLES.find((article) => article.id === id);
}

function getLanguageConfig(article, code) {
    return article.languages.find((language) => language.code === code);
}

async function loadArticle(articleId, languageCode) {
    const articleConfig = getArticleConfig(articleId);
    if (!articleConfig) throw new Error('未知的文章');
    const languageConfig = getLanguageConfig(articleConfig, languageCode) || articleConfig.languages[0];

    // Show loading feedback to the authoring team.
    articleContainer.innerHTML = '<p class="placeholder">載入中...</p>';

    try {
        // const md = await fetchHackmdMarkdown(slug);
        const md = await fetchLocalMarkdown();
        const html = marked.parse(md);
        articleContainer.innerHTML = html;
    } catch (err) {
        console.error(err);
        articleContainer.innerHTML = `<p class="error">載入失敗：${err.message}</p>`;
    }
}

(function init() {
    const initialArticle = getArticleConfig(preferences.articleId) ? preferences.articleId : ARTICLES[0].id;
    const initialArticleConfig = getArticleConfig(initialArticle);
    const initialLanguage = getLanguageConfig(initialArticleConfig, preferences.languageCode)
        ? preferences.languageCode
        : initialArticleConfig.languages[0].code;
    const initialTheme = preferences.theme || DEFAULT_THEME;

    populateArticleOptions(initialArticle);
    populateLanguageOptions(initialArticleConfig, initialLanguage);
    applyTheme(initialTheme);

    updatePreferences({
        articleId: initialArticle,
        languageCode: initialLanguage,
        theme: initialTheme,
    });

    loadArticle(initialArticle, initialLanguage);

    articleSelect.addEventListener('change', () => {
        const articleId = articleSelect.value;
        const article = getArticleConfig(articleId);
        if (!article) return;
        const languageCode = article.languages[0].code;
        populateLanguageOptions(article, languageCode);
        updatePreferences({ articleId, languageCode });
        loadArticle(articleId, languageCode);
    });

    languageSelect.addEventListener('change', () => {
        const articleId = articleSelect.value;
        const languageCode = languageSelect.value;
        updatePreferences({ articleId, languageCode });
        loadArticle(articleId, languageCode);
    });

    themeSelect.addEventListener('change', () => {
        const theme = themeSelect.value;
        applyTheme(theme);
        updatePreferences({ theme });
    });
})();
