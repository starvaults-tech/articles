async function getArticle(id) {
    const parser = new DOMParser();
    const url = `https://hackmd.io/@staryuehtech/cms-${id}`;
    const res = await fetch('/api/proxy?url=' + encodeURIComponent(url));
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const text = await res.text();
    const htmlDoc = parser.parseFromString(text, 'text/html');
    return htmlDoc.querySelector('#publish-page').innerText;
}

(async () => {
    try {
        const md = await getArticle('privacy');
        const html = marked.parse(md);
        console.log(html);
    } catch (err) {
        console.error(err);
    }
})();