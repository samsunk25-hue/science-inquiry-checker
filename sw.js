// 서비스워커 — 앱을 통째로 캐시해 인터넷 없이도 열리게 합니다.
// 파일이 몇 개뿐이라 설치 시 미리 받아 두고, 이후에는 캐시에서 바로 냅니다.
const CACHE = 'inquiry-checker-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // 아이콘 PNG가 아직 없어도 설치가 실패하지 않도록 개별적으로 담습니다.
      return Promise.all(ASSETS.map(function (url) {
        return c.add(url).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  var isPage = e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').indexOf('text/html') !== -1;

  if (isPage) {
    // 화면(HTML)은 최신을 먼저 받아 옵니다. 그래야 업데이트가 바로 보입니다.
    // 인터넷이 안 되면 그때 캐시로 엽니다(오프라인 대비).
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); }).catch(function () {});
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) { return hit || caches.match('./index.html'); });
      })
    );
    return;
  }

  // 아이콘·매니페스트 등은 캐시를 먼저 씁니다(빠르고 오프라인에도 강함).
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
        return res;
      });
    })
  );
});
