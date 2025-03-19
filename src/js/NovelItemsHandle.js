import {DBHelper, openDatabase} from "./dbHelper";

// 获取所有item信息（提供类型则只获取该类型的）
export function getAllItemsFromDB(itemType) {
  return new Promise((resolve, reject) => {
    openDatabase().then(db => {
      const dbHelper = new DBHelper(db)
      if (itemType) {
        dbHelper.getDataByIndex('items', itemType).then(data => {
          resolve(data)
        }).catch(error => {
          reject(error);
        })
      } else {
        dbHelper.getAll('items').then(data => {
          resolve(data)
        }).catch(error => {
          reject(error);
        })
      }
    })
  })
}

export function updateItemInfoToDB(item) {
  return new Promise((resolve, reject) => {
    openDatabase().then(db => {
      const dbHelper = new DBHelper(db)
      dbHelper.updateItem('items', item).then(data => {
        resolve(data)
      }).catch(error => {
        reject(error);
      })
    })
  })
}

export function getItemInfoFromDB(name) {
  return new Promise((resolve, reject) => {
    openDatabase().then(db => {
      const dbHelper = new DBHelper(db)
      dbHelper.getItem('items', name).then(data => {
        resolve(data)
      }).catch(error => {
        reject(error);
      })
    })
  })
}