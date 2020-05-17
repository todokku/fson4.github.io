const cacheName = "N-A_#001",
	appCache = [
		"https://fson4.github.io",
		"app.webmanifest",
		"resource/style.css",
		"resource/script.js",
		"icon/icon.svg",
		"icon/x192.png",
		"icon/x512.png"
	];
self.addEventListener("install", e => e.waitUntil(caches.open(cacheName).then(cache => cache.addAll(appCache))));
self.addEventListener("activate", e => {
	e.waitUntil(caches.keys().then(keyList => {
		return Promise.all(keyList.map(key => {
			if(key !== cacheName) return caches.delete(key);
		}));
	}));
});
self.addEventListener("fetch", e => {
	e.respondWith(caches.match(e.request).then(r => {
		return r || fetch(e.request);
	}));
});
