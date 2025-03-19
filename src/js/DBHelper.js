let db
export function openDatabase(dbName = 'CsjxsNovelDB') {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return
    }
    const request = indexedDB.open(dbName, 2);
    request.onupgradeneeded = () => {
      if (!db.objectStoreNames.contains('items')) {
        const itemStore = db.createObjectStore('items', {keyPath: 'name'});
        itemStore.createIndex('name', 'name', {unique: true});
        itemStore.createIndex('type', 'type', {unique: false});
      }
    }
    request.onsuccess = (event) => {
      db = event.target.result;
      // 监听连接关闭事件
      db.onclose = () => {
        console.log("Database connection closed.");
        db = null; // 清除引用
      };
      // 监听版本变化事件
      db.onversionchange = () => {
        console.log("Database version changed.");
        db.close(); // 关闭连接
        db = null; // 清除引用
      };
      resolve(db);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

export class DBHelper {
  constructor(db) {
    this.db = db;
  }
  
  getObjectStore(storeName, mode = "readonly") {
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }
  
  addItem(storeName, item) {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName, "readwrite");
      const request = store.add(item);
      
      request.onsuccess = () => resolve('success');
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  updateItem(storeName, item) {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName, "readwrite");
      const request = store.put(item);
      request.onsuccess = () => resolve('success');
      request.onerror = (event) => reject(event.target.error);
    })
  }
  
  getItem(storeName, key) {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  getAllKeys(storeName) {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName);
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    })
  }
  getKeysNum(storeName) {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    })
  }
  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    })
  }
  getDataByIndex(storeName, indexName) {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName);
      const storeIndex = store.index(indexName)
      const request = storeIndex.getAll()
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    })
  }
}