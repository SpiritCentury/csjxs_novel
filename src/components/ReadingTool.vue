<script setup>
import {onMounted, ref, watch, computed} from "vue";
import {getItemInfoFromDB, updateItemInfoToDB, deleteItemInDB} from "@/js/NovelItemsHandle.js"
import {ElMessage} from "element-plus";

// defineEmits defineProps
const emit = defineEmits(['reloadItems', 'setFocusOnNovel'])
const props = defineProps({
  chapterObj: {
    type: Object, default: () => {
    }
  },
  selectedWord: {type: String, default: ""},
  noteItemList: {type: Array, default: () => []}
})

// ref
const itemInfoFormRef = ref(null)
// props
let chapterId = ref(null)
let chapterContent = ref(null);

// other
const characterInfoItem = ref({
  name: '',
  aliaNames: [],
  type: '',
  labels: [],
  superPowerType: '',
  superPowerLevel: [{value: '', version: 0}],
  introduction: [{value: '', version: 0}],
  personalExperience: [{value: '', version: 0}],
  additionalSupplement: '',
  prominenceChapters: {
    implicitMention: [],
    mention: [],
    prominence: []
  },
  friendLinks: [],
})
// 词库更新Form
const itemInfoForm = ref({
  name: '',
  aliaNames: [],
  type: '',
  labels: [],
  superPowerType: '',
  superPowerLevel: '',
  introduction: '',
  personalExperience: '',
  additionalSupplement: '',
  friendLinks: [],
  firstProminence: false,
  lastProminence: false,
  firstProminenceChapter: 0,
  lastProminenceChapter: 0,
})
// form选项
const itemInfoFormTypeOptions = ref(['人物', '地点', '道具', '装备', '组织', '任务'])
const itemInfoFormSuperPowerTypeOptions = ref(['机械', '武道', '异能', '魔法', '念力', '？？'])
const itemInfoFormSuperPowerLevelOptions = ref(['F', 'E', 'D', 'C', 'B', 'A', 'S', 'S+', 'Ss', 'X'])
const itemInfoFormFriendLinksOptions = computed(() => {
  return props.noteItemList.map(item => {
    return item.name
  })
})
// 折叠面板展开
let collapseActiveName = ref(['2'])
// 本章人物列表
let charactersInChapter = ref([])
const characterLineColor = ['color0', 'color1', 'color2']

defineExpose({
  closeCollapse
})
onMounted(() => {
})
watch(() => props.chapterObj, (newVal) => {
  chapterId.value = newVal.id
  chapterContent.value = newVal.content
  if (props.noteItemList && props.noteItemList.length > 0) {
    handleCharacterList()
  }
})
watch(() => props.noteItemList, () => {
  if (props.chapterObj && props.chapterObj.id) {
    handleCharacterList()
  }
})
watch(() => props.selectedWord, (newVal) => {
  if (!newVal || itemInfoForm.value.name !== '') {
    return;
  }
  fillItemInfoToForm(newVal, 'selectedWatch')
})
watch(itemInfoForm, (newVal) => {
  if (newVal.name) {
    openCollapse('1')
  }
}, {deep: true})

// 折叠面板的控制
function collapseChanged(val) {
}

function openCollapse(val) {
  if (collapseActiveName.value.indexOf(val) === -1) {
    collapseActiveName.value.push(val)
  }
}

function closeCollapse(val) {
  const index = collapseActiveName.value.indexOf(val)
  if (index !== -1 && !itemInfoForm.value.name) {
    collapseActiveName.value.splice(index, 1)
  }
}

// 词库更新，表单处理
function itemSave(param) {
  switch (itemInfoForm.value.type) {
    case '人物':
      characterSave(param)
      break;
    case '地点':
      placeSave(param)
      break;
    default:
      defaultItemSave(param)
  }
}

function formValidate() {
  if (itemInfoForm.value.name === '') {
    ElMessage.error('名称不可为空')
    return false
  }
  if (itemInfoForm.value.type === '') {
    ElMessage.error('类型不可为空')
    return false
  }
  if (itemInfoForm.value.introduction === '') {
    ElMessage.error('介绍不可为空')
    return false
  }
  return true
}
function fillItemInfoToForm(val, from) { // 查找后填充信息至表单
  getItemInfoFromDB(val).then((res) => {
    if (res !== undefined) { // 查到了相关信息
      const tempObj = {
        firstProminence: itemInfoForm.value.firstProminence,
        lastProminence: itemInfoForm.value.lastProminence,
      }
      itemInfoForm.value = JSON.parse(JSON.stringify(res))
      itemInfoForm.value.firstProminence = tempObj.firstProminence
      itemInfoForm.value.lastProminence = tempObj.lastProminence
    } else {
      // resetForm()
      itemInfoForm.value.name = val
      if (from === 'selectedWatch'){
        itemInfoForm.value.firstProminence = true
      }
    }
  })
}
function characterSave(param) {
  // todo 先查询原有的数据，进行部分增量修改
  if (!formValidate()) {
    return;
  }
  const obj = JSON.parse(JSON.stringify(itemInfoForm.value))
  delete obj.firstProminence
  delete obj.lastProminence
  if (itemInfoForm.value.firstProminence) {
    obj.firstProminenceChapter = chapterId.value
  }
  if (itemInfoForm.value.lastProminence) {
    obj.lastProminenceChapter = chapterId.value
  }
  updateItemInfoToDB(obj).then((data) => {
    if (data === 'success') {
      saveSuccess(param)
    }
  })
}

function placeSave(param) {
  defaultItemSave(param)
}

function defaultItemSave(param) {
  if (!formValidate()) {
    return;
  }
  const obj = JSON.parse(JSON.stringify(itemInfoForm.value))
  updateItemInfoToDB(obj).then((data) => {
    if (data === 'success') {
      saveSuccess(param)
    }
  })
}

function saveSuccess(param) {
  ElMessage.success('保存成功')
  if (param === 'noReset') {
    itemInfoForm.value.name = ''
  } else {
    resetForm()
    setFocusOnNovel()
  }
  emit('reloadItems')
}

function resetForm() {
  itemInfoFormRef.value.resetFields()
}

let deleteBtnConfirm = ref(false)
function itemDelete() {
  if (deleteBtnConfirm.value) {
    const result = deleteItemInDB(itemInfoForm.value.name)
    if (result === undefined) {
      ElMessage.success('删除成功')
      emit('reloadItems')
    }
  }
  deleteBtnConfirm.value = !deleteBtnConfirm.value
}

// 解析本章出现的人物
function handleCharacterList() {
  charactersInChapter.value.length = 0
  const tempArray = []
  const lastProminenceArray = []
  const firstProminenceArray = []
  props.noteItemList.forEach(item => {
    if (item.type === '人物'
        && (!item.lastProminenceChapter || item.lastProminenceChapter >= chapterId.value)
        && (!item.firstProminenceChapter || item.firstProminenceChapter <= chapterId.value)) {
      let namesArray = [item.name]
      if (item.aliaNames && item.aliaNames.length > 0) {
        namesArray = [item.name, ...item.aliaNames]
      }
      const index = findCharacterFirstPosition(namesArray)
      if (index !== -1) {
        const obj = {
          name: item.name,
          superPowerType: item.superPowerType,
          superPowerLevel: item.superPowerLevel,
          firstProminence: item.firstProminenceChapter && item.firstProminenceChapter === chapterId.value,
          lastProminence: item.lastProminenceChapter && item.lastProminenceChapter === chapterId.value,
          index: index
        }
        if (item.lastProminenceChapter === chapterId.value) {
          lastProminenceArray.push(obj)
        } else if (item.firstProminenceChapter === chapterId.value) {
          firstProminenceArray.push(obj)
        } else {
          tempArray.push(obj)
        }
      }
    }
  })
  // 排序：最后一次出场的人物排在最前，首次出场的人物其次，剩余角色按在本章出场顺序排序
  lastProminenceArray.sort((a, b) => a.index - b.index)
  firstProminenceArray.sort((a, b) => a.index - b.index)
  tempArray.sort((a, b) => a.index - b.index)
  charactersInChapter.value = [...lastProminenceArray, ...firstProminenceArray, ...tempArray]
}
function findCharacterFirstPosition(names) {
  let firstPosition = -1;
  for (const name of names) {
    const position = chapterContent.value.indexOf(name);
    if (position !== -1 && (firstPosition === -1 || position < firstPosition)) {
      firstPosition = position;
    }
  }
  return firstPosition;
}

function editCharacter(character) {
  itemInfoForm.value.name = character.name
  itemInfoForm.value.firstProminence = character.firstProminence
  itemInfoForm.value.lastProminence = character.lastProminence
  fillItemInfoToForm(character.name, 'editCharacter')
}


// 其他UI处理
function setFocusOnNovel() {
  emit('setFocusOnNovel')
  closeCollapse('1')
}

</script>

<template>
  <div class="readingTools">
    <div class="chapterInfo">
      <div class="card inlineDiv">
        <div class="chapterTitleInfo">
          <div class="inlineDiv">
            <div class="infoTitle width5">所在卷名：</div>
            <div class="infoContent">{{ chapterObj.volumeTitle }}</div>
          </div>
          <div class="inlineDiv">
            <div class="infoTitle width5">本章节名：</div>
            <div class="infoContent">{{ chapterObj.chapterTitle }}</div>
          </div>
        </div>
        <div class="chapterNumInfo">
          <div class="infoContent">{{ chapterObj.wordNum }}字</div>
        </div>
      </div>
    </div>
    <div class="readingToolScrollPart noScrollbar">
      <el-collapse v-model="collapseActiveName" @change="collapseChanged" class="formCollapse">
        <el-collapse-item title="词库更新" name="1">
          <div class="card">
            <el-form ref="itemInfoFormRef" :model="itemInfoForm" label-width="80px" class="gridForm">
              <el-form-item label="名称" prop="name">
                <el-input v-model="itemInfoForm.name"></el-input>
              </el-form-item>
              <el-form-item label="类型" prop="type">
                <el-select v-model="itemInfoForm.type">
                  <el-option v-for="item in itemInfoFormTypeOptions" :key="item" :label="item"
                             :value="item"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="别名" prop="aliaNames">
                <el-input-tag v-model="itemInfoForm.aliaNames"></el-input-tag>
              </el-form-item>
              <el-form-item label="标签" prop="labels">
                <el-input-tag v-model="itemInfoForm.labels" clearable></el-input-tag>
              </el-form-item>
              <el-form-item v-show="itemInfoForm.type === '人物'" label="超能体系" prop="superPowerType">
                <el-select v-model="itemInfoForm.superPowerType" clearable>
                  <el-option v-for="item in itemInfoFormSuperPowerTypeOptions" :key="item" :label="item"
                             :value="item"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item v-show="itemInfoForm.type === '人物'" label="超能阶位" prop="superPowerLevel">
                <el-select v-model="itemInfoForm.superPowerLevel" clearable>
                  <el-option v-for="item in itemInfoFormSuperPowerLevelOptions" :key="item" :label="item"
                             :value="item"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="介绍" class="girdFullRow" prop="introduction">
                <el-input type="textarea" v-model="itemInfoForm.introduction" clearable></el-input>
              </el-form-item>
              <el-form-item v-show="itemInfoForm.type === '人物'" label="人物经历" class="girdFullRow"
                            prop="personalExperience">
                <el-input type="textarea" v-model="itemInfoForm.personalExperience" clearable></el-input>
              </el-form-item>
              <el-form-item label="额外补充" class="girdFullRow" prop="additionalSupplement">
                <el-input type="textarea" v-model="itemInfoForm.additionalSupplement" clearable></el-input>
              </el-form-item>
              <el-form-item label="友情链接" class="girdFullRow" prop="friendLinks">
                <el-select v-model="itemInfoForm.friendLinks" multiple allow-create filterable clearable>
                  <el-option v-for="item in itemInfoFormFriendLinksOptions" :key="item" :label="item"
                             :value="item"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item v-show="itemInfoForm.type === '人物'" label="首次出场" prop="firstProminence">
                <el-switch v-model="itemInfoForm.firstProminence" active-color="#13ce66"
                           inactive-color="#ff4949"></el-switch>
              </el-form-item>
              <el-form-item v-show="itemInfoForm.type === '人物'" label="最后出场" prop="lastProminence">
                <el-switch v-model="itemInfoForm.lastProminence" active-color="#13ce66"
                           inactive-color="#ff4949"></el-switch>
              </el-form-item>
              <div class="girdFullRow centerOperation">
                <el-button type="primary" @click="itemSave('noReset')">仅保存</el-button>
                <el-button type="primary" @click="itemSave">保存</el-button>
                <el-button v-show="!deleteBtnConfirm" type="danger" @click="itemDelete">删除</el-button>
                <el-button v-show="deleteBtnConfirm" type="danger" @click="itemDelete">确定删除</el-button>
                <el-button type="info" @click="resetForm">重置</el-button>
              </div>
            </el-form>
          </div>
        </el-collapse-item>
        <el-collapse-item title="本章人物" name="2">
          <div
              class="characterInChapter"
              v-for="(c, index) in charactersInChapter"
              :key="index"
              @click="editCharacter(c)"
          >
            <div class="lineHeader" :class="c.lastProminence ? 'color1' : 'color0'"></div>
            <div class="characterName">{{ c.name }}</div>
            <div class="characterDivider"></div>
            <div class="characterSuperPowerType" v-show="c.superPowerType">
              <el-tag type="primary">{{ c.superPowerType }}系</el-tag>
            </div>
            <div class="characterSuperPowerLevel">{{ c.superPowerLevel }}</div>
            <div class="characterProminenceFirstOrLast" >
              <el-tag v-show="c.firstProminence" type="primary">首次出场</el-tag>
              <el-tag v-show="c.lastProminence" type="danger">最后出场</el-tag>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<style scoped>
@import '@/css/readingTool.css';
</style>