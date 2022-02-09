//Set Up Cache Variables
const APP_PREFIX = 'BudgetTracker-';
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;

//Files to be included in cache
const FILES_TO_CACHE = [
    "/",
    "./css/styles.css",
    "./icons/icon-72x72.png",
    "./icons/icon-96x96.png",
    "./icons/icon-128x128.png",
    "./icons/icon-144x144.png",
    "./icons/icon-152x152.png",
    "./icons/icon-192x192.png",
    "./icons/icon-384x384.png",
    "./icons/icon-512x512.png",
    "./js/index.js",
    "./js/idb.js",
    "./index.html",
    "./manifest.json"
];

//INSTALL

//Use wait until to tell browser to wait until work is complete before terminating the service worker
//Use caches.open to find specific cache by name and add every file in files_to_cache to cache
self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('Your cache has installed ' + CACHE_NAME)
            return cache.addAll(FILES_TO_CACHE)
        })
    )
})

//ACTIVATE

//Clear old data from cache and manage cache
self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keyList) {
            //looks for all cache names under github username and filters ones with this app prefix
            let cacheKeeplist = keyList.filter(function (key) {
                return key.indexOf(APP_PREFIX);
            })
            //adds the current cache to the keeplist
            cacheKeeplist.push(CACHE_NAME);
            return Promise.all(keyList.map(function (key, i) {
                if (cacheKeeplist.indexOf(key) === -1) {
                    console.log('deleting cache : ' + keyList[i]);
                    return caches.delete(keyList[i]);
                }
            }));
        })
    );
});


//INTERCEPT FETCH REQUESTS

//Listen for the fetch event, log the URL of request and define how to respond
self.addEventListener('fetch', function (e) {
    console.log('fetch request : ' + e.request.url)
    e.respondWith(
        caches.match(e.request).then(function (request) {
            if (request) {
                console.log('responding with cache : ' + e.request.url)
                return request
            } else {
                console.log('file is not cached, fetching : ' + e.request.url)
                return fetch(e.request)
            }
        })
    )
})