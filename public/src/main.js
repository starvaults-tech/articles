const PROFILE_PREFIX = '@staryuehtech/';
const STORAGE_KEY = 'sv-article-preferences';
const DEFAULT_THEME = 'light';

const STYLE = JSON.parse(await (await fetch('./style.json')).text());

async function fetchHackmdJSON(url) {
    const parser = new DOMParser();
    const res = await fetch('/api/proxy?url=' + encodeURIComponent(url));
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const text = await res.text();
    const htmlDoc = parser.parseFromString(text, 'text/html');
    const publishNode = htmlDoc.querySelector('#publish-page');
    if (!publishNode) throw new Error('無法解析 HackMD 內容');
    const content = publishNode.innerText;
    return content.match(/```[\s\S]*?\n([\s\S]*?)```/)?.[1];
}

const LANGUAGES = {
    'zh_TC' : '繁體中文',
    'en_US' : 'English',
    'zh_CN' : '简体中文'
};
// const ARTICLES = JSON.parse(await fetchHackmdJSON("https://hackmd.io/@staryuehtech/article-tree"));
const ARTICLES = {
    "agreement": "用戶協議",
    "regulatory-authorization": "監管許可"
};
// const ARTICLES = [
//     {
//         id: 'privacy',
//         label: '隱私權政策',
//         languages: [
//             { code: 'zh_TC', label: '繁體中文' },
//             { code: 'en_US', label: 'English' },
//         ],
//     },
//     {
//         id: 'terms',
//         label: '服務條款',
//         languages: [
//             { code: 'zh_TC', label: '繁體中文' },
//             { code: 'en_US', label: 'English' },
//         ],
//     },
// ];

const articleSelect = document.getElementById('article-select');
const languageSelect = document.getElementById('language-select');
const themeSelect = document.getElementById('theme-select');
const articleContainer = document.getElementById('article-content');
const articleBody = document.getElementById('article-body');
const copyButton = document.getElementById('copy-article-btn');

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
    Object.entries(ARTICLES).forEach(([id, label]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = label;
        if (id === selectedId) option.selected = true;
        articleSelect.append(option);
    });
}

function populateLanguageOptions(selectedLanguageCode) {
    languageSelect.innerHTML = '';
    Object.entries(LANGUAGES).forEach(([code, label]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = label;
        if (code === selectedLanguageCode) option.selected = true;
        languageSelect.append(option);
    });
}

function setInlineStyle(el, property, value) {
    if (!el || !property) return;
    if (property.includes('-')) {
        el.style.setProperty(property, value);
    } else {
        el.style[property] = value;
    }
}

function applyStyle(dom) {
    Object.keys(STYLE).forEach((tag) => {
        const style = STYLE[tag];
        dom.parentNode.querySelectorAll(tag).forEach((el) => {
            Object.entries(style).forEach(([key, value]) => {
                setInlineStyle(el, key, value);
            });
        });
    });
    return dom;
}

function applyTheme(theme) {
    const resolved = theme || DEFAULT_THEME;
    document.documentElement.dataset.theme = resolved;
    themeSelect.value = resolved;
}

async function loadArticle(articleId, languageCode) {
    if (articleBody) {
        copyButton.style.opacity = 0;
        articleBody.innerHTML = '<p class="placeholder">載入中...</p>';
    }

    try {
        const parser = new DOMParser();
        const md = await fetchHackmdMarkdown(`${articleId}-cms-${languageCode}`);
        // const md = await fetchLocalMarkdown();
        const html = marked.parse(md);
        const dom = parser.parseFromString(html, 'text/html');
        if (articleBody) {
            articleBody.innerHTML = dom.body.innerHTML;
            const styledArticleBody = applyStyle(articleBody);
            copyButton.style.opacity = 1;
        }
    } catch (err) {
        copyButton.style.opacity = 0;
        console.error(err);
        if (articleBody) {
            articleBody.innerHTML = `<p class="error">載入失敗：${err.message}</p>`;
        }
    }
}

async function copyArticleHtml() {
    if (!articleBody || !copyButton) return;
    const html = articleBody.outerHTML;
    if (!html) return;

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(html);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = html;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }

        copyButton.dataset.state = 'copied';
        setTimeout(() => {
            copyButton.dataset.state = 'idle';
        }, 1600);
    } catch (error) {
        console.error('複製失敗', error);
        copyButton.dataset.state = 'error';
        setTimeout(() => {
            copyButton.dataset.state = 'idle';
        }, 1600);
    }
}

(function init() {
    const initialArticle = preferences.articleId || Object.keys(ARTICLES);
    const initialLanguage = preferences.languageCode || LANGUAGES[0];
    const initialTheme = preferences.theme || DEFAULT_THEME;
    let languageCode = initialLanguage;


    populateArticleOptions(initialArticle);
    populateLanguageOptions(initialLanguage);
    applyTheme(initialTheme);

    updatePreferences({
        articleId: initialArticle,
        languageCode: initialLanguage,
        theme: initialTheme,
    });

    loadArticle(initialArticle, initialLanguage);

    articleSelect.addEventListener('change', () => {
        const articleId = articleSelect.value;
        const article = ARTICLES[articleId];
        if (!article) return;
        updatePreferences({ articleId, languageCode });
        loadArticle(articleId, languageCode);
    });

    languageSelect.addEventListener('change', () => {
        const articleId = articleSelect.value;
        languageCode = languageSelect.value;
        updatePreferences({ articleId, languageCode });
        loadArticle(articleId, languageCode);
    });

    themeSelect.addEventListener('change', () => {
        const theme = themeSelect.value;
        applyTheme(theme);
        updatePreferences({ theme });
    });

    if (copyButton) {
        copyButton.addEventListener('click', copyArticleHtml);
    }
})();
