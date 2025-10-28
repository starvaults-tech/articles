export default async (request) => {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) return new Response('missing url', { status: 400 });
    const allowHosts = new Set(['hackmd.io', 'raw.githubusercontent.com']);
    const th = new URL(target).hostname;
    if (!allowHosts.has(th)) return new Response('forbidden host', { status: 403 });

    const resp = await fetch(target);
    const headers = new Headers(resp.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Vary', 'Origin');

    return new Response(resp.body, { status: resp.status, headers });
};