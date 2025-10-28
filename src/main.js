async function getArticle(url) {
    try {
        const response = await fetch(url, { mode: 'no-cors'});
        if (!response.ok) {
          console.log(response);
            throw new Error(`Response status: ${response.status}`);
        }
        const result = await response.text();
        console.log(result);
    } catch (error) {
        console.error(error.message);
    }
}

console.log(
    getArticle('https://hackmd.io/@staryuehtech/cms-privacy')
)