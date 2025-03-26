<script setup>
import { onMounted, ref } from "vue";
import { ElMessage } from 'element-plus'

let novelText = ''
function loadNovel() {
  if (readReady.value) {
    startReading()
  } else {
    const input = document.createElement('input');
    input.type = 'file';
    const handler = (event) => {
      const file = event.target.files[0];
      if (file) {
        console.time('loadNovel');
        console.log('开始加载小说')
        handelNovel(file)
      }
    }
    input.addEventListener('change', handler);
    input.click();
    input.removeEventListener('change', handler)
  }
}

function handelNovel(file) {
  const reader = new FileReader()
  reader.onload = function (event) {
    novelText = event.target.result
    if (novelText) {
      catchNovel(file.name)
    } else {
      ElMessage.error('所选文件内容为空')
      btnTextSwitch(true)
    }
  }
  reader.readAsText(file, "GB2312")
}
function catchNovel(fileName) {
  // 缓存小说内容和章节到 IndexedDB
  const request = indexedDB.open('CsjxsNovelDB', 2);
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('novels')) {
      db.createObjectStore('novels', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('chapters')) {
      db.createObjectStore('chapters', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('catalog')) {
      db.createObjectStore('catalog', { keyPath: 'id' });
    }
  };
  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction('novels', 'readwrite');
    const store = transaction.objectStore('novels');
    store.put({ id: 1, fileName: fileName, content: novelText });
    console.log('已缓存小说原本')
    catchChapters()
  };
}
function catchChapters() {
  console.log('开始处理章节')
  const request = indexedDB.open('CsjxsNovelDB', 2);
  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction('chapters', 'readwrite');
    const store = transaction.objectStore('chapters');
    store.clear()
    // 同步处理目录
    const catalogs = []
    let catalogObj = {
      id: 0,
      volumeId: 0,
      chapterTitle: '',
      volumeTitle: ''
    }
    const generator = handleChapter()
    let result = generator.next()
    while (!result.done) {
      const obj = result.value
      catalogObj.id = obj.id
      catalogObj.volumeId = obj.volumeId
      catalogObj.chapterTitle = obj.chapterTitle
      catalogObj.volumeTitle = obj.volumeTitle
      catalogs.push(JSON.parse(JSON.stringify(catalogObj)))
      store.add(obj)
      result = generator.next()
    }
    const catTransaction = db.transaction('catalog', 'readwrite');
    const catStore = catTransaction.objectStore('catalog');
    catStore.clear()
    catStore.put({ id: 1, catalogs: catalogs })
    console.log('章节与目录处理完毕')
    btnTextSwitch(true, '已经处理完毕，点击阅读')
    readReady.value = true
    console.log('本次处理小说用时：')
    console.timeEnd('loadNovel');
  };
}
function* handleChapter() {
  const array = novelText.split('\n')
  let chapterCount = 0
  let chapterObj = {
    id: 0,
    volumeId: 0,
    chapterTitle: '',
    volumeTitle: '',
    content: '',
    wordNum: 0
  }
  let newVolumeId = 0
  let newVolumeTitle = ''
  const titleReg = new RegExp('^第((\\d{1,4})|([零一二三四五六七八九十百千万]{1,10}))(章)')
  const volumeReg = new RegExp('^第((\\d{1,4})|([零一二三四五六七八九十百千万]{1,10}))(卷)')
  const chapterContentTempArray = []
  for (let i = 0; i < array.length; i++) {
    const line = array[i].trim()
    if (!line) { // 空白行略过
      continue
    }
    // 匹配到章节名或卷名或到达文章底部时，保存内容
    if (line.match(titleReg)) {
      if (chapterContentTempArray.length > 0 || i === array.length - 1) {
        chapterObj.id = chapterCount
        chapterObj.content = chapterContentTempArray.join('\n')
        const obj = JSON.parse(JSON.stringify(chapterObj))
        chapterContentTempArray.length = 0
        chapterObj.wordNum = 0
        yield obj
      }
      if (newVolumeId > 0) {
        chapterObj.volumeId = newVolumeId
        chapterObj.volumeTitle = newVolumeTitle
        newVolumeId = 0
        newVolumeTitle = ''
      }
      chapterCount++
      chapterObj.chapterTitle = '第' + chapterCount + '章 ' + line.replace(titleReg, '').trim()
    } else if (line.match(volumeReg)) { // 卷名匹配
      if (chapterContentTempArray.length > 0) { // 有正文内容时，先缓存卷信息
        newVolumeId = chapterObj.volumeId + 1
        newVolumeTitle = line
      } else {
        chapterObj.volumeId++
        chapterObj.volumeTitle = line
      }
    } else if (chapterObj.chapterTitle) {
      chapterContentTempArray.push(line)
      chapterObj.wordNum += line.length
    }
  }
}
function catchCatalog() {
  // 放方法仅用作单独处理目录，初始化书籍时目录将于章节一并处理
  const catalogs = []
  let catalogObj = {
    id: 0,
    volumeId: 0,
    chapterTitle: '',
    volumeTitle: ''
  }
  const request = indexedDB.open('CsjxsNovelDB', 2);
  request.onsuccess = (event) => {
    const db = event.target.result;
    const cTransaction = db.transaction('chapters', 'readwrite');
    const cStore = cTransaction.objectStore('chapters');
    const cursorRequest = cStore.openCursor(null, 'next')
    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const obj = cursor.value
        catalogObj.id = obj.id
        catalogObj.volumeId = obj.volumeId
        catalogObj.chapterTitle = obj.chapterTitle
        catalogObj.volumeTitle = obj.volumeTitle
        catalogs.push(JSON.parse(JSON.stringify(catalogObj)))
        cursor.continue
      } else {
        const catTransaction = db.transaction('catalog', 'readonly');
        const catStore = catTransaction.objectStore('catalog');
        catStore.clear()
        if (catalogs.length > 0) {
          catStore.put({ id: 1, catalogs: catalogs })
          console.log('目录处理完毕')
          btnTextSwitch(true, '目录已经处理完毕，点击阅读')
          readReady.value = true
        }
      }
    }
  }
}

function readNovelFromIndexDB() {
  const request = indexedDB.open('CsjxsNovelDB', 2);
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('novels')) {
      db.createObjectStore('novels', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('chapters')) {
      db.createObjectStore('chapters', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('catalog')) {
      db.createObjectStore('catalog', { keyPath: 'id' });
    }
  };
  request.onsuccess = (event) => {
    const db = event.target.result;
    const nTransaction = db.transaction('novels', 'readonly');
    const nStore = nTransaction.objectStore('novels');
    const readRequest = nStore.get(1)
    readRequest.onsuccess = (e) => {
      novelText = e.target.result ? e.target.result.content : ''
      if (novelText.length === 0) {
        btnTextSwitch(true)
      } else {
        const cTransaction = db.transaction('chapters', 'readonly');
        const cStore = cTransaction.objectStore('chapters');
        const keyCountRequest = cStore.count();
        keyCountRequest.onsuccess = function() {
          if (keyCountRequest.result < 1462) {
            catchChapters() // 处理章节
          } else {
            const catTransaction = db.transaction('catalog', 'readonly');
            const catStore = catTransaction.objectStore('catalog');
            const catRequest = catStore.get(1)
            catRequest.onsuccess = function(event) {
              const catalog = event.target.result?.catalogs
              if (catalog && catalog.length === 1462) {
                btnTextSwitch(true, '点击阅读《超神机械师》')
                readReady.value = true
              } else {
                catchCatalog() // 处理目录
              }
            }
          }
        };
        keyCountRequest.onerror = function(event) {
          btnTextSwitch(true)
        };
      }
    }
    readRequest.onerror = (e) => {
      btnTextSwitch(true)
    }
  };
}

let readReady = ref(false)
const emit = defineEmits(['startReading'])
function startReading() {
  // 数据准备完毕，可以开始阅读
  btnTextSwitch(true, '点击阅读《超神机械师》')
  emit('startReading')
}

onMounted(() => {
  readNovelFromIndexDB()
})

let importBtnDisabled = ref(true)
let importBtnText = ref("正在检查《超神机械师》数据")
function btnTextSwitch(clickable, content = '导入《超神机械师》文本文件') {
  importBtnDisabled.value = !clickable
  importBtnText.value = content
}

</script>

<template>
  <div class="contentCenter">
    <el-button class="homePageImportBtn" :disabled="importBtnDisabled" @click="loadNovel">{{ importBtnText }}</el-button>
  </div>
</template>

<style scoped>

</style>