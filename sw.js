/* The production build replaces these two values with the release ID and asset list. */
const cacheName = 'hiyori-shell-04ec29137f5fab85';
const shell = new URL('./', self.registration.scope).href;
const assets = ["assets/index-naVlk-E2.css","assets/decimal-CaUHonIL.js","assets/vendor-BZ9F2_8S.js","assets/index-BhTiBm-8.js","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png"].map(path => new URL(path, shell).href);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll([shell, ...assets].map(url => new Request(url, {cache:'reload'})));
    const html = await (await cache.match(shell)).text();
    if (!assets.filter(url=>url.endsWith('.js')).every(url => !url.includes('/index-') || html.includes(new URL(url).pathname.split('/').pop()))) {
      await caches.delete(cacheName);
      throw new Error('Ledger release is still publishing');
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
    for (const name of await caches.keys()) {
      if (name.startsWith('hiyori-shell-') && name !== cacheName) await caches.delete(name);
    }
  })());
});
self.addEventListener('fetch', event => {
  const {request} = event;
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate' && [shell, shell+'index.html'].includes(request.url.split('?')[0])) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) return response;
      } catch { /* Use the complete cached build when the server is unreachable. */ }
      return (await caches.open(cacheName)).match(shell);
    })());
  } else if (assets.includes(request.url)) {
    event.respondWith((async () => (await (await caches.open(cacheName)).match(request.url,{ignoreVary:true})) ?? fetch(request))());
  }
});
