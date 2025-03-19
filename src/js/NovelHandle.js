/*
* 小说的处理
*/
import {DBHelper, openDatabase} from "./dbHelper";

export function getChapterObjFromDB(id) {
  return new Promise((resolve, reject) => {
    openDatabase().then(db => {
      const dbHelper = new DBHelper(db)
      dbHelper.getItem('chapters', id).then(data => {
        resolve(data)
      }).catch(error => {
        reject(error);
      })
    })
  })
}
export function getChapterNumFromDB() {
  return new Promise((resolve, reject) => {
    openDatabase().then(db => {
      const dbHelper = new DBHelper(db)
      dbHelper.getKeysNum('chapters').then(data => {
        resolve(data)
      }).catch(error => {
        reject(error);
      })
    })
  })
}

export function getCatalogsFromDB() {
  return new Promise((resolve, reject) => {
    openDatabase().then(db => {
      const dbHelper = new DBHelper(db)
      dbHelper.getItem('catalog', 1).then(data => {
        resolve(data?.catalogs)
      }).catch(error => {
        reject(error);
      })
    })
  })
}