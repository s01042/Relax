
/*
    ServiceWorkers are totaly event driven
    so you have to hook in to the corresponding events

    inspect ServiceWorkers with 
    chrome://inspect/#service-workers
    chrome://serviceworker-internals/
*/

const cacheName = 'Relaxe-V1'

/**
 * our static assets should be as compact as possible
 * keep in mind that we load and cache other resources on demand
 * see networkAndCache
 */
const staticAssets = [
    './',
    './index.html',
    './script.js',
    './serviceWorker-Relax.js',
    './styles.css',
    './img/background.jpg',
    './img/deep_breath.jpg',
    './img/icon.png',
    './img/icon64.png',
    './audio/klangschale.mp3',
    './audio/small_bell.mp3',
    './manifest.webmanifest'
]

/**
 * first the ServiceWorker must be installed 
 * we open the client side cache and store all
 * static content that made up our little app into 
 * the cache.
 * keep in mind async/await is syntactic sugar for promises
 * so you can also use for example caches.open(cacheName).then(...)
 */
self.addEventListener('install', async (e) => {
    const cache = await caches.open(cacheName)
    await cache.addAll(staticAssets)
    return self.skipWaiting()
})

/**
 * When a service worker is initially registered, 
 * pages won't use it until they next load. 
 * The claim() method causes those pages to be controlled immediately.
 */
self.addEventListener('activate', (e) =>{
    self.clients.claim()
})

/**
 * let add some push notification later
 */
self.addEventListener('push', (e) =>{
    console.log(`push event handler active`)
})

/**
 * let's establish a chat between the app and the ServiceWorker
 * it's like in the Electron Framework
 */

self.addEventListener('message', (e) =>{
    //console.dir(e)
    if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
        showNotification()
    }
})

/**
 * example of showing a notification 
 */
function showNotification() {
    const msg = {
        body: "Playing 'Hello Brian' by s01042",
        icon: './img/icon.png',
        image: './img/deep_breath.jpg',
        tag: 'notification'
    }
    if (Notification.permission === 'granted') {
        self.registration.showNotification('Relax', msg)
    }
}

/**
 * event handler for clicking on the notification
 * see here: https://docs.w3cub.com/dom/serviceworkerglobalscope/onnotificationclick/
 * @param {*} event 
 */
self.onnotificationclick = function(event) {
    //console.log('On notification click: ', event.notification.tag)
    event.notification.close()
  
    // This looks to see if the current is already open and
    // focuses if it is
    event.waitUntil(clients.matchAll({type: "window"})
        .then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                //check if focus method is available
                if ('focus' in client) {
                    return client.focus();
                }
                
            }
            /**
             * the next code fragment would open a new window
             */
            /*
                if (clients.openWindow)
                    return clients.openWindow('/');
            */
        })
    )
}

/**
 * now we are implementing a hook so that our ServiceWorker 
 * can intercept every request
 */
self.addEventListener('fetch', (e) =>{
    const req = e.request
    const url = new URL(req.url)
    /**
     * here we can implement various cache strategies
     * e.g. cacheFirst or networkAndCache (see implementation details there)
     */
    // if (url.origin === location.origin) {
    //     e.respondWith(cacheFirst(req))
    // } else {
    //     e.respondWith(networkAndCache(req))
    // }
    //e.respondWith(networkAndCache(req))
    e.respondWith (cacheFirst (req))
})

/**
 * here is the cache first strategy 
 * we open the chache, we search the cache for the requested resource
 * and we serve from the cache if found, otherwise we are fetching the 
 * resource from the network
 * @param {*} req 
 */
async function cacheFirst(req) {
    //console.log(`cacheFirst: ${JSON.stringify(req)}`)
    const cache = await caches.open(cacheName)
    const cached = await cache.match(req)
    return cached || fetch(req)
}

/**
 * here is the opposite strategy: we try to fetch from 
 * the network, update the cache with new data and use
 * cached data only if the fetch fails
 * @param {*} req 
 */
async function networkAndCache(req) {
    //console.dir(req)
    const cache = await caches.open(cacheName)
    try {
        //we try to fetch. if it fails e.g. because we are 
        //offline it will be catched and we will serve from the cache
        //what ever we have there
        const fresh = await fetch(req)
        /**
         * a response of fetch is a stream and because we want the 
         * browser to consume the response as well as the cache 
         * consuming the response, we need to clone it so we have two
         * streams
         */
        await cache.put(req, fresh.clone()) 
        return fresh
    } catch (e) {
        const cached = await cache.match(req)
        return cached
    }
}

