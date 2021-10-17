// import syntax to use other packages in sw
// importScripts() method of the WorkerGlobalScope interface synchronously imports
// one or more scripts into the worker's scope

// note - idb is promise-based wrapper for IndexedDB that allows much faster code development via nice, simple syntax
importScripts('/src/js/idb.js');

// indexDB utility
importScripts('/src/js/indexDB.js');

var CACHE_STATIC_NAME = 'static-v18';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
];

// To start working with IndexedDB, we first need to open (connect to) a database
// This method opens a database, and returns a promise for an enhanced IDBDatabase

// indexedDB.open(name, version)
// name – a string, the database name.
// version – a positive integer version, by default 1
// const dbPromise = idb.open('posts-store', 1, function (db) {
//   // note - It's triggered when database is created or when we update the version of our database
//   // Use it to specify the schema for the database.
//   // This is similar to the 'upgradeneeded' event in plain IndexedDB.
//   // we can compare versions and upgrade data structures as needed.
//   // To store something in IndexedDB, we need to create Object Store here - data table.

//   // we can provide a key when we add a value to the store, similar to localStorage.
//   // But when we store objects, IndexedDB allows setting up an object property as the key,
//   // which is much more convenient. Or we can auto-generate keys

//   // note - This create new Object Store. We will use this Promise here whenever we want to access our database
//   // At the same time create a Object Store - data table but we only want to do it if Object Store does not
//   // exists yet.
//   if (!db.objectStoreNames.contains('posts')) {
//     // if this Object Store does not exists, create it

//     // db.createObjectStore(name[, keyOptions]);
//     // name - first arg is the store name, e.g. "books" for books

//     // keyOptions - second arg is an optional object to define Primary Key with one of two properties:
//     // keyPath prop – a path to an object property to get data that IndexedDB will use as the key - String, e.g. id.
//     // autoIncrement prop – if true, then the key for a newly stored object is generated automatically,
//     // as an ever-incrementing number.
//     // note - keyPath: 'id'- makes easy to query related object with any given id
//     db.createObjectStore('posts', { keyPath: 'id' });
//   }
// });

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName)
//     .then(function (cache) {
//       return cache.keys()
//         .then(function (keys) {
//           if (keys.length > maxItems) {
//             cache.delete(keys[0])
//               .then(trimCache(cacheName, maxItems));
//           }
//         });
//     })
// }

self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(function (cache) {
      console.log('[Service Worker] Precaching App Shell');
      cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache.', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log('matched ', string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

// NOTE - Whenever we get a Response Data we also want to store in indexDB
self.addEventListener('fetch', function (event) {
  var url = 'https://pwa-test-e5885-default-rtdb.firebaseio.com/posts';
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request).then(function (res) {
        // trimCache(CACHE_DYNAMIC_NAME, 3);

        // First need to create a copy of the response data with clone()
        // because the original Response always need to be returned even we store the Copy One
        // otherwise the fetch request from our main Application will fail.
        const clonedRes = res.clone(); // cloning

        // note - need to clear data in cache to serve fresh data on every render
        // clearing cache before adding data
        clearAllData('posts').then(function () {
          // Under this function, we will continue adding items after clearing
          // returns json data with a promise
          clonedRes.json().then(function (data) {
            console.log('POSTS', data); // {first-post: {…}}
            for (const key in data) {
              // {first-post: {…}} - key is the prop 'first-post' & value is an Object
              writeData('posts', data[key]);
              // just for testing
              // note - we also immediately DELETE data after adding
              // .then(function () {
              //   deleteItemFromData('posts', key);
              // });
              // // STORING DATA IN indexDB
              // dbPromise.then(function (db) {
              //   // writing data in db - we can add an item to the store, like this:
              //   // Creating transaction operation which is require in db
              //   // first arg is the Store we want to work with
              //   // second arg is the type of transaction - readonly – can only read, the default &
              //   // readwrite – can only read and write the data, but not create/remove/alter object stores
              //   const transaction = db.transaction('posts', 'readwrite'); // step 1
              //   // get an object store to operate on it
              //   const store = transaction.objectStore('posts'); // step 2
              //   // adding data in Object Store
              //   // {first-post: {…}} - key is the prop 'first-post' & value is an Object
              //   store.put(data[key]);

              //   // closing operation with 'complete' property
              //   return transaction.complete;

              //   // There were basically four steps:

              //   // Create a transaction, mentioning all the stores it’s going to access, at (1).
              //   // Get the store object using transaction.objectStore(name), at (2).
              //   // Perform the request to the object store books.add(book), at (3).
              //   // …Handle request success/error (4), then we can make other requests if needed, etc.
              //   // Object stores support two methods to store a value:

              //   // put(value, [key]) Add the value to the store. The key is supplied only if the object store did not have keyPath or autoIncrement option. If there’s already a value with the same key, it will be replaced.

              //   // add(value, [key]) Same as put, but if there’s already a value with the same key, then the request fails, and an error with the name "ConstraintError" is generated.

              //   // Similar to opening a database, we can send a request: books.add(book), and then wait for success/error events.

              //   // The request.result for add is the key of the new object.
              //   // The error is in request.error (if any).
              // });
            }
          });
        });

        return res; // returning original response
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(caches.match(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then(function (response) {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(function (res) {
              return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
                // trimCache(CACHE_DYNAMIC_NAME, 3);
                cache.put(event.request.url, res.clone());
                return res;
              });
            })
            .catch(function (err) {
              return caches.open(CACHE_STATIC_NAME).then(function (cache) {
                if (event.request.headers.get('accept').includes('text/html')) {
                  return cache.match('/offline.html');
                }
              });
            });
        }
      })
    );
  }
});

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response) {
//         if (response) {
//           return response;
//         } else {
//           return fetch(event.request)
//             .then(function(res) {
//               return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//             })
//             .catch(function(err) {
//               return caches.open(CACHE_STATIC_NAME)
//                 .then(function(cache) {
//                   return cache.match('/offline.html');
//                 });
//             });
//         }
//       })
//   );
// });

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(function(res) {
//         return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//       })
//       .catch(function(err) {
//         return caches.match(event.request);
//       })
//   );
// });

// Cache-only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

// Network-only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     fetch(event.request)
//   );
// });
