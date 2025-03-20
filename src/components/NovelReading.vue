<script setup>
import {onMounted, onUnmounted, ref, watch} from "vue";
import {ArrowLeft, ArrowRight, Expand, Reading, Search, Setting} from "@element-plus/icons-vue";
import { ElMessage } from 'element-plus'
import ReadingTool from "@/components/ReadingTool.vue";
import NoteCard from "@/components/NoteCard.vue";
import { getAllItemsFromDB } from "@/js/NovelItemsHandle.js"
import { getChapterObjFromDB, getChapterNumFromDB, getCatalogsFromDB } from "@/js/NovelHandle.js"

// 全局搜索
let searchInput = ref('')

// 记忆功能
let lastReadChapter = ref(null)
let paragraphProgress = ref(0)

// 当前章节对象
let chapterObj = ref({})
let textArray = ref([])

// 章节总数量
let chapterLength = ref(0)

// 备注功能
let noteItemList = ref([])
let noteNameList = ref([])
let clickWordList = ref([])
let clickPosition = ref([])
let matchNoteList = ref([])

// ref
let novelContent = ref(null)
let novelParagraphs = ref([])
let catalogListRef = ref(null)
let catalogItemRef = ref([])
let readingToolRef = ref(null)

// 目录
const catalogs = ref([])
let catalogSearchInput = ref('')

// UI/状态
let catalogReady = ref(false)
let catalogOpen = ref(false)

// 全部的监听事件
const listeners = [];
// 生命钩子
onMounted(() => {
  // 获取上次阅读进度
  getLastReadProgress()
  // 加载小说文本
  getNovelTextFromIndexDB(lastReadChapter.value, 'history')
  // 加载小说目录
  getNovelCatalog()
  // 加载备注词库
  getNovelNotes()
  // 添加键盘监听
  handleKeyDownEvent()
  // 左键事件监听
  handleClickEvent()
  // 右键事件监听
  handleRightClick()
  // 选取事件监听
  handleSelectionWords()
  // 滚动监听
  handleScroll()
})
onUnmounted(() => {
  listeners.forEach((element, type, handler) => {
    try {
      element?.removeEventListener(type, handler)
    } catch {}
  })
})

// 目录的搜索
watch(catalogSearchInput, (value, oldValue) => {
  catalogs.value.forEach((item) => {
    item.visible = item.chapterTitle.indexOf(value) !== -1
  })
})
// 备注卡片的展示
watch(clickWordList, (value) => {
  openNoteCard(value)
}, { deep: true })
// 展示卡片
function openNoteCard(wordArray) {
  if (wordArray.length === 0) {
    return;
  }
  wordArray.forEach(item => {
    noteItemList.value.forEach(note => {
      if (item === note.name) {
        if (!(matchNoteList.value.find(e => e.name === item))) { // 避免重复打开同一个词条
          matchNoteList.value.push(note)
        }
      }
    })
  })
}

// First: 获取上次阅读进度
function getLastReadProgress() {
  const temp = localStorage.getItem('lastReadChapter')
  if (!temp) {
    lastReadChapter.value = 1
    localStorage.setItem('lastReadChapter', 1)
  } else {
    lastReadChapter.value = parseInt(temp, 10)
  }
  if (!lastReadChapter) {
    lastReadChapter.value = 1
    localStorage.setItem('lastReadChapter', lastReadChapter)
  }
}
// 加载小说文本
function getNovelTextFromIndexDB(chapter, type = 'num') {
  getChapterObjFromDB(chapter).then(res => {
    chapterObj.value = res
    textArray = chapterObj.value.content.split('\n')
    localStorage.setItem('lastReadChapter', chapter)
    setTimeout(() => {
      const lastReadParagraph = localStorage.getItem('lastReadParagraph')
      if (lastReadParagraph && type === 'history') {
        const paragraph = parseInt(lastReadParagraph, 10)
        scrollParagraphProgress(paragraph)
      } else {
        if (novelContent.value)
          novelContent.value.scrollTop = 0
      }
      setFocusOnNovelContent()
    }, 200)
  })
  getChapterNumFromDB().then(res => {
    chapterLength.value = res
  })
}
function scrollParagraphProgress(paragraph) {
  if (paragraph <= 2) {
    return
  }
  const child = novelParagraphs.value[paragraph - 2]
  const childTop = child.offsetTop
  novelContent.value.scrollTo({
    top: childTop,
    behavior: 'smooth'
  })
}

// 加载小说目录
function getNovelCatalog() {
  getCatalogsFromDB().then(res => {
    catalogs.value = res
    catalogs.value.forEach((catalog) => {
      catalog.visible = true
    })
    catalogReady.value = true
  })
}

// 加载备注词库
function getNovelNotes() {
  getAllItemsFromDB().then(res => {
    noteItemList.value = JSON.parse(JSON.stringify(res))
    // 处理提示词
    handleNoteWord()
  })
}

// 键盘事件
function handleKeyDownEvent() {
  const handler = (event) => {
    const focusedElementTagName = document.activeElement?.tagName.toLowerCase()
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        if (!(focusedElementTagName && ['input', 'textarea'].indexOf(focusedElementTagName) !== -1)) {
          switchChapterByKey(event)
        }
        break;
      default:
        break;
    }
  }
  window.addEventListener('keydown', handler)
  listeners.push({ element: window, type: 'keydown', handler: handler })
}
function switchChapterByKey(event) {
  event.preventDefault(); // 阻止默认事件
  const arrow = event.key
  switchChapterByArrow(arrow === 'ArrowLeft' ? 'left' : 'right')
}

// 左键事件
function handleClickEvent() {
  const handler = () => {
    matchNoteList.value.length = 0
    highestZIndex = 1
    readingToolRef.value.closeCollapse('1')
  }
  novelContent.value.addEventListener('click', handler)
  listeners.push({ element: novelContent.value, type: 'click', handler: handler })
}

// 右键事件监听
function handleRightClick() {
  const handler = (e) => {
    e.preventDefault()
    const range = document.caretPositionFromPoint(e.clientX, e.clientY);
    clickPosition.value = [e.clientX, e.clientY];
    if (range?.offsetNode.nodeType === 3) {
      matchClickWord(range.offsetNode.nodeValue, range.offset)
    }
  }
  novelContent.value.addEventListener('contextmenu', handler)
  listeners.push({ element: novelContent.value, type: 'contextmenu', handler: handler })
}
function matchClickWord(nodeText, offset) {
  const wholeLength = nodeText.length
  const clickWord = []
  if (offset > 0) {
    clickWord.push({ offset: offset - 1, word: nodeText[offset - 1] })
  }
  clickWord.push({ offset: offset, word: nodeText[offset] })
  if (offset < wholeLength - 1) {
    clickWord.push({ offset: offset + 1, word: nodeText[offset + 1] })
  }
  const firstMatchWords = new Set()
  const finalMatchWords = new Set()
  clickWord.forEach(click => {
    noteNameList.value.forEach(word => {
      const matchNoteWordOffset = word.toString().indexOf(click.word)
      if (matchNoteWordOffset !== -1) {
        firstMatchWords.add({ offset: click.offset, matchNoteWord: word, matchNoteWordOffset: matchNoteWordOffset })
      }
    })
  })
  firstMatchWords.forEach(match => {
    if (match.offset >= match.matchNoteWordOffset && (match.offset + match.matchNoteWord.length) <= wholeLength) {
      const originWord = nodeText.toString().substring(match.offset - match.matchNoteWordOffset, match.offset - match.matchNoteWordOffset + match.matchNoteWord.length)
      if (originWord === match.matchNoteWord) {
        finalMatchWords.add(originWord)
      }
    }
  })
  clickWordList.value = [...finalMatchWords]
}

// 记忆功能
function handleParagraphProgress() {
  const container = novelContent.value
  const children = novelParagraphs.value
  let closestChild = null;
  let minDistance = Infinity;
  children.forEach(child => {
    const rect = child.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();

    const distance = rect.top - parentRect.top;

    if (distance < minDistance && distance > 0) {
      minDistance = distance;
      closestChild = child;
    }
  })
  paragraphProgress.value = parseInt(closestChild.getAttribute('index'), 10)
}

// 处理提示词
function handleNoteWord() {
  noteNameList.value.length = 0
  noteItemList.value.forEach(note => {
    noteNameList.value.push(note.name)
  })
  noteNameList.value.sort((a, b) => a.localeCompare(b, 'zh'))
}

// 选取事件监听
let selectedWord = ref('')
function handleSelectionWords() {
  const handler = () => {
    selectedWord.value = window.getSelection().toString()
  }
  novelContent.value.addEventListener('mouseup', handler)
  listeners.push({ element: novelContent.value, type: 'mouseup', handler: handler })
}

// 滚动事件监听
function handleScroll() {
  const handler =  () => {
    handleParagraphProgress()
    localStorage.setItem('lastReadParagraph', paragraphProgress.value)
  }
  novelContent.value.addEventListener('scroll', handler)
  listeners.push({ element: novelContent.value, type: 'scroll', handler: handler })
}

// 章节切换，基础功能
function switchChapterByArrow(arrow) {
  const chapterNum = chapterObj.value.id
  if (arrow === 'left' && chapterNum === 1) {
    ElMessage.info('目前是第一章，前面没有章节了')
  } else if (arrow === 'right' && chapterNum === chapterLength) {
    ElMessage.info('目前是最后一章，后面没有章节了')
  } else {
    const newChapterNum = arrow === 'left' ? (chapterNum > 1 ? chapterNum - 1 : chapterNum) : chapterNum + 1
    getNovelTextFromIndexDB(newChapterNum)
  }
}
// 章节跳转，基础功能
function switchChapterByChapterNum(id) {
  if (id >= 1 && id <= catalogs.value.length) {
    getNovelTextFromIndexDB(id)
    switchCatalog(false)
  }
}

// UI控制，基础功能
function switchCatalog(show) {
  if (show === false || show === true) {
    catalogOpen.value = show
  } else {
    catalogOpen.value = !catalogOpen.value
  }
  if (catalogOpen.value) {
    catalogListRef.value.focus()
    const currentChapter = chapterObj.value.id
    const child = catalogItemRef.value[currentChapter]
    child.scrollIntoView({
      block: 'center',
    })
  } else {
    catalogSearchInput.value = ''
  }
}
// 主阅读区焦点获取
function setFocusOnNovelContent() {
  novelContent.value.focus()
}
// 处理多卡片的置顶效果
let highestZIndex = 1
function handleCardNoteZIndex(openIndex) {
  if (matchNoteList.value.length === 1) {
    return;
  }
  const noteCards = document.querySelectorAll('.noteCard')
  if (noteCards[openIndex].classList.contains('active')) {
    return;
  }
  noteCards.forEach((card, index) => {
    if (index === openIndex) {
      card.style.zIndex = highestZIndex
      card.classList.add('active')
    } else {
      card.classList.remove('active')
    }
  })
  highestZIndex += 1;
}


function readSetting() {
}
</script>

<template>
  <div class="novelReading">
    <div class="novelContentPart">
      <div class="topSearch">
        <el-input
            v-model="searchInput"
            placeholder="搜索你想查询的词语"
            :prefix-icon="Search"
        ></el-input>
      </div>
      <div ref="novelContent" tabindex="-1" class="novelContentReading noFocusOutline">
        <div class="chapterTitle">
          {{ chapterObj.chapterTitle }}
        </div>
        <div v-for="(paragraph, index) in textArray" class="textParagraph" :key="index" ref="novelParagraphs" :index="index">
          {{ paragraph }}
        </div>
      </div>
      <div class="operationArea">
        <button v-if="catalogReady" class="operationBtn" @click="switchCatalog" :class="catalogOpen ? 'rotated' : ''"><el-icon :size="20"><Expand /></el-icon></button>
        <button class="operationBtn" @click="readSetting"><el-icon :size="20"><Setting /></el-icon></button>
        <button class="operationBtn" @click="switchChapterByArrow('left')"><el-icon :size="20"><ArrowLeft /></el-icon></button>
        <button class="operationBtn" @click="switchChapterByArrow('right')"><el-icon :size="20"><ArrowRight /></el-icon></button>
      </div>
      <div>
        <div class="mask" :class="catalogOpen ? 'maskShow' : ''" @click="switchCatalog(false)"></div>
        <div class="readCatalog" :class="catalogOpen ? 'readCatalogShow' : ''">
          <div class="catalogTop">
            <div class="catalogJump">
              <el-input v-model="catalogSearchInput" placeholder="输入章节数或章节名" :prefix-icon="Search"></el-input>
            </div>
          </div>
          <div class="catalogList noFocusOutline" ref="catalogListRef" tabindex="-1">
            <template v-for="(item, index) in catalogs" :key="index">
              <div v-show="item.visible !== false"
                   class="catalogItem"
                   :class="chapterObj.id === item.id ? 'currentReading' : ''"
                   ref="catalogItemRef"
                   @click="switchChapterByChapterNum(item.id)"
              >
                <div class="readingIconDiv">
                  <el-icon class="readingIcon" color="#1b88ee"><Reading /></el-icon>
                </div>
                <div class="catalogItemInner">
                  <div class="catalogItemInfo" >
                    {{ item.chapterTitle }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div class="rightToolPart">
      <ReadingTool
          ref="readingToolRef"
          :chapter-obj="chapterObj"
          :selected-word="selectedWord"
          :note-item-list="noteItemList"
          @reload-items="getNovelNotes"
          @set-focus-on-novel="setFocusOnNovelContent"
      ></ReadingTool>
    </div>
    <template v-for="(item, index) in matchNoteList">
      <NoteCard
          :note-obj="item"
          :click-position="clickPosition"
          :open-index="index"
          @handle-z-index="handleCardNoteZIndex"
      ></NoteCard>
    </template>
  </div>
</template>

<style>
.topSearch,.catalogJump{
  :deep(.el-input__wrapper) {
    border-radius: 16px;
  }
}
</style>