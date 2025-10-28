async function getArticle(id, language) {
    const parser = new DOMParser();
    const url = `https://hackmd.io/@staryuehtech/cms-${id}`;
    const res = await fetch('/api/proxy?url=' + encodeURIComponent(url));
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const text = await res.text();
    const htmlDoc = parser.parseFromString(text, 'text/html');
    return htmlDoc.querySelector('#publish-page').innerText;
}

async function getFakeArticle(id) {
    const parser = new DOMParser();
    const res = await fetch('.test.html');
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.text();
}

(async () => {
    try {
        // const md = await getArticle('privacy', 'zh_TC');
        const md = await getFakeArticle();
        const html = marked.parse(md);
        console.log(html);
    } catch (err) {
        console.error(err);
    }
})();