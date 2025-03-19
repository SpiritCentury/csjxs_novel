<script setup>
import {onMounted, ref, watch, defineEmits, computed} from "vue";
import { getItemInfoFromDB, updateItemInfoToDB } from "@/js/NovelItemsHandle.js"
import {ElMessage} from "element-plus";
const emit = defineEmits(['reloadItems', 'setFocusOnNovel'])
defineExpose({
  closeCollapse
})
const props = defineProps({
  chapterObj: {
    type: Object,
    default: () => {
      return { id: null, volumeId: null, volumeTitle: '', chapterTitle: '', content: '', wordNum: null}
    }
  },
  selectedWord: {
    type: String,
    default: ""
  },
  noteItemList: {
    type: Array,
    default: () => []
  }
})
// ref
const itemInfoFormRef = ref(null)
// props
const chapterContent = ref(props.chapterObj.content);
let chapterId = ref(props.chapterObj.id)

// other
const characterList = ref(new Set())
const characterInfoItem = ref({
  name: '',
  type: '',
  labels: [],
  superPowerType: '',
  superPowerLevel:[{ value: '', version: 0 }],
  introduction: [{ value: '', version: 0 }],
  personalExperience: [{ value: '', version: 0 }],
  additionalSupplement: '',
  prominenceChapters: {
    implicitMention: [],
    mention: [],
    prominence: []
  },
  friendLinks: [],
})
const itemInfoForm = ref({
  name: '',
  type: '人物',
  labels: [],
  superPowerType: '',
  superPowerLevel: '',
  introduction: '',
  personalExperience: '',
  additionalSupplement: '',
  friendLinks: [],
})
// form选项
const itemInfoFormTypeOptions = ref(['人物', '地点', '道具', '装备', '组织', '任务'])
const itemInfoFormSuperPowerTypeOptions = ref(['机械', '武道', '异能', '魔法', '念力'])
const itemInfoFormSuperPowerLevelOptions = ref(['F', 'E', 'D', 'C', 'B', 'A', 'S', 'S+', 'Ss', 'X'])
const itemInfoFormFriendLinksOptions = computed(() => {
  return props.noteItemList.map(item => {
    return item.name
  })
})

// 折叠面板
let collapseActiveName = ref(['2'])


onMounted(() => {
})

watch(chapterId, (newVal, oldVal) => {
})
watch(() => props.selectedWord, (newVal) => {
  if (!newVal || itemInfoForm.value.name !== '') {
    return;
  }
  getItemInfoFromDB(newVal).then((res) => {
    if (res !== undefined) { // 查到了相关信息
      itemInfoForm.value = JSON.parse(JSON.stringify(res))
    } else {
      resetForm()
      itemInfoForm.value.name = newVal
    }
  })
})
watch(itemInfoForm, (newVal) => {
  if (newVal.name) {
    openCollapse('1')
  }
}, {deep: true})

// 解析本章出现的人物
function handelCharacterList() {
}
// 切换折叠面板
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
// 人物备注处理
// 保存
function characterSave() {
  if (!formValidate()) {
    return;
  }
  // todo 先查询原有的数据，进行部分增量修改
  // 保存新的数据
  defaultItemSave()
}
function placeSave() {
  defaultItemSave()
}
function defaultItemSave() {
  if (!formValidate()) {
    return;
  }
  const obj = JSON.parse(JSON.stringify(itemInfoForm.value))
  updateItemInfoToDB(obj).then((data) => {
    if (data === 'success') {
      saveSuccess()
    }
  })
}
function saveSuccess() {
  ElMessage.success('保存成功')
  resetForm()
  emit('reloadItems')
  setFocusOnNovel()
}

// 其他UI处理
function setFocusOnNovel() {
  emit('setFocusOnNovel')
  closeCollapse('1')
}

// 表单处理
function itemSave() {
  switch (itemInfoForm.value.type) {
    case '人物':
      characterSave()
      break;
    case '地点':
      placeSave()
      break;
    default:
      defaultItemSave()
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
function itemDelete() {
}
function resetForm() {
  itemInfoFormRef.value.resetFields()
}

</script>

<template>
  <div class="readingTools">
    <div class="chapterInfo">
      <div class="card">
        <div class="inlineDiv"><div class="infoTitle width5">所在卷名：</div><div class="infoContent">{{ chapterObj.volumeTitle }}</div></div>
        <div class="inlineDiv"><div class="infoTitle width5">本章字数：</div><div class="infoContent">{{ chapterObj.wordNum }}</div></div>
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
                  <el-option v-for="item in itemInfoFormTypeOptions" :key="item" :label="item" :value="item"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item v-show="itemInfoForm.type === '人物'" label="标签" style="width: 100%" class="girdFullRow" prop="labels">
                <el-input-tag v-model="itemInfoForm.labels"></el-input-tag>
              </el-form-item>
              <el-form-item v-show="itemInfoForm.type === '人物'" label="超能体系" prop="superPowerType">
                <el-select v-model="itemInfoForm.superPowerType">
                  <el-option v-for="item in itemInfoFormSuperPowerTypeOptions" :key="item" :label="item" :value="item"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item v-show="itemInfoForm.type === '人物'" label="超能阶位" prop="superPowerLevel">
                <el-select v-model="itemInfoForm.superPowerLevel">
                  <el-option v-for="item in itemInfoFormSuperPowerLevelOptions" :key="item" :label="item" :value="item"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="介绍" class="girdFullRow" prop="introduction">
                <el-input type="textarea" v-model="itemInfoForm.introduction"></el-input>
              </el-form-item>
              <el-form-item v-show="itemInfoForm.type === '人物'" label="人物经历" class="girdFullRow" prop="personalExperience">
                <el-input type="textarea" v-model="itemInfoForm.personalExperience"></el-input>
              </el-form-item>
              <el-form-item label="额外补充" class="girdFullRow" prop="additionalSupplement">
                <el-input type="textarea" v-model="itemInfoForm.additionalSupplement"></el-input>
              </el-form-item>
              <el-form-item label="友情链接" class="girdFullRow" prop="friendLinks">
                <el-select v-model="itemInfoForm.friendLinks" multiple allow-create filterable>
                  <el-option v-for="item in itemInfoFormFriendLinksOptions" :key="item" :label="item" :value="item"></el-option>
                </el-select>
              </el-form-item>
              <div class="girdFullRow centerOperation">
                <el-button type="primary" @click="itemSave">保存</el-button>
                <el-button type="danger" @click="itemDelete">删除</el-button>
                <el-button type="info" @click="resetForm">重置</el-button>
              </div>
            </el-form>
          </div>
        </el-collapse-item>
        <el-collapse-item title="本章人物" name="2">
          <div class=""></div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<style>
@import "src/css/readingTool.css";
</style>