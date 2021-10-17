// creating reusable code in this utility file

// SETTING UP IndexDB Promise with idb.open() & creates a new Object Store - table
// To start working with IndexedDB, we first need to open (connect to) a database
// This method opens a database, and returns a promise for an enhanced IDBDatabase

// indexedDB.open(name, version)
// name – a string, the database name.
// version – a positive integer version, by default 1
const dbPromise = idb.open('posts-store', 1, function (db) {
  // note - It's triggered when database is created or when we update the version of our database
  // Use it to specify the schema for the database.
  // This is similar to the 'upgradeneeded' event in plain IndexedDB.
  // we can compare versions and upgrade data structures as needed.
  // To store something in IndexedDB, we need to create Object Store here - data table.

  // we can provide a key when we add a value to the store, similar to localStorage.
  // But when we store objects, IndexedDB allows setting up an object property as the key,
  // which is much more convenient. Or we can auto-generate keys

  // note - This create new Object Store. We will use this Promise here whenever we want to access our database
  // At the same time create a Object Store - data table but we only want to do it if Object Store does not
  // exists yet.
  if (!db.objectStoreNames.contains('posts')) {
    // if this Object Store does not exists, create it

    // db.createObjectStore(name[, keyOptions]);
    // name - first arg is the store name, e.g. "books" for books

    // keyOptions - second arg is an optional object to define Primary Key with one of two properties:
    // keyPath prop – a path to an object property to get data that IndexedDB will use as the key - String, e.g. id.
    // autoIncrement prop – if true, then the key for a newly stored object is generated automatically,
    // as an ever-incrementing number.
    // note - keyPath: 'id'- makes easy to query related object with any given id
    db.createObjectStore('posts', { keyPath: 'id' });
  }
});

// utility function to write data - add items to the store
function writeData(store, data) {
  // STORING DATA IN indexDB
  return dbPromise.then(function (db) {
    // writing data in db - we can add an item to the store, like this:
    // Creating transaction operation which is require in db
    // first arg is the Store we want to work with
    // second arg is the type of transaction - readonly – can only read, the default &
    // readwrite – can only read and write the data, but not create/remove/alter object stores
    const transaction = db.transaction(store, 'readwrite'); // step 1
    // get an object store to operate on it
    const storage = transaction.objectStore(store); // step 2
    // adding data in Object Store
    // {first-post: {…}} - key is the prop 'first-post' & value is an Object
    storage.put(data);

    // closing operation with 'complete' property
    return transaction.complete;
  });
}

// utility function to read data - get items from the store
function readAllData(store) {
  return dbPromise.then(function (db) {
    const transaction = db.transaction(store, 'readonly');
    const storage = transaction.objectStore(store);
    // store.getAll([query], [count]) – search for all values, limit by count if given
    return storage.getAll();
  });
}
