'use strict';

// To create IndexedDB, we first need to open (connect to) a database with 'indexedDB.open(dbName, dbVersion)'

// indexedDB.open() function takes two params
// name – a string, the database name.
// version – a positive integer version, by default 1.
const dbName = 'testdb';
const dbVersion = 5;

// the call returns an Object with Events that we can create Event Handlers to handle it
// creating database with given name & version
let openRequest = indexedDB.open(dbName, dbVersion);
console.log(openRequest);

// indexDB Events

// creating Event handlers to check if indexedDB.open() func is opened successfully or not
// 'onerror' event if database is not created - opening failed
openRequest.onerror = e => {
  console.log('Error', e.target.errorCode);
};

// 'onsuccess' event - there’s the “database object” in openRequest.result
// and we need to perform our operation
openRequest.onsuccess = e => {
  // return our database
  console.log('Success', e.target.result);
};

// note - It's triggered when database is created or when we update the version of our database
openRequest.onupgradeneeded = e => {
  console.log('Upgrade needed');
  const db = e.target.result;

  // we can compare versions and upgrade data structures as needed.
  // To store something in IndexedDB, we need an object store.

  // we can provide a key when we add a value to the store, similar to localStorage.
  // But when we store objects, IndexedDB allows setting up an object property as the key,
  // which is much more convenient. Or we can auto-generate keys

  // db.createObjectStore(name[, keyOptions]);
  // name - is the store name, e.g. "books" for books

  // keyOptions - is an optional object to define Primary Key with one of two properties:
  // keyPath prop – a path to an object property that IndexedDB will use as the key - String, e.g. id.
  // autoIncrement prop – if true, then the key for a newly stored object is generated automatically,
  // as an ever-incrementing number.

  // db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
  db.createObjectStore('notes', { autoIncrement: true });
};

// when database is not available or cannot be use
// To check if database is blocked or not
openRequest.onblocked = e => {
  console.log('Blocked');
};
