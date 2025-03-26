<script setup>
import {getAllItemsFromDB, updateItemInfoToDB, deleteItemInDB} from '@/js/NovelItemsHandle.js'
import {computed, onMounted, onUpdated, ref} from "vue";
import Masonry from 'Masonry-layout';
import {Refresh, Loading} from '@element-plus/icons-vue'
import {ElMessage} from "element-plus";

let items = ref([])
const itemTypeArray = ['人物', '地点', '道具', '装备', '组织', '任务']
const cardColorClassArray = ['colorForCharacter', 'colorForPlace', 'colorForProps', '', 'colorForOrganization', '']
let searchInput = ref('')
let filterArray = ref([])
let itemsNumber = computed(() => {
  return items.value.length
})
let displayItemsNumber = computed(() => {
  return items.value.filter(item => !item.hidden).length
})

onMounted(() => {
  getAllItemsFromDB().then(data => {
    items.value = data
  })
})
onUpdated(() => {
  let grid = document.querySelector(".itemCardsContainer");
  new Masonry(grid, {
    itemSelector: ".itemCard",
    columnWidth: 200,
    gutter: 15,
    transitionDuration: '0.2s'
  });
})

function filterChange() {
  if (filterArray.value.length === 0) {
    items.value.forEach(item => {
      item.hidden = false
    })
  } else {
    items.value.forEach(item => {
      item.hidden = filterArray.value.indexOf(item.type) === -1;
    })
  }
}
function searchInputClick(event) {
  event.preventDefault()
  filterChange()
  if (searchInput.value) {
    items.value.forEach(item => {
      if (!item.hidden) {
        const nameMatch = item.name.indexOf(searchInput.value) !== -1
        const aliaMatch = item.aliaNames ? item.aliaNames.indexOf(searchInput.value) !== -1 : false
        item.hidden = !(nameMatch || aliaMatch);
      }
    })
  }
}

let refreshLoading = ref(false)
function refresh() {
  refreshLoading.value = true
  getAllItemsFromDB().then(data => {
    items.value = data
    refreshLoading.value = false
    ElMessage.success('刷新成功')
  })
}

</script>

<template>
  <div class="itemManage">
    <div class="searchAndFilter">
      <div class="refreshBtn">
        <div @click="refresh">
          <el-icon v-show="!refreshLoading"><Refresh /></el-icon>
          <el-icon v-show="refreshLoading"><Loading /></el-icon>
        </div>
      </div>
      <div class="searchInput">
        <el-form inline @submit="searchInputClick">
          <el-form-item label="">
            <el-input v-model="searchInput" clearable @clear="filterChange"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchInputClick">搜索</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="searchFilter">
        <el-form-item label="类型筛选：">
          <el-checkbox-group v-model="filterArray" @change="filterChange">
            <el-checkbox v-for="(type,index) in itemTypeArray" :value="type" :key="index">{{type}}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </div>
      <div class="numberDisplay">
        {{displayItemsNumber}}/{{itemsNumber}}
      </div>
    </div>
    <div class="outerContainer">
      <div class="itemCardsContainer">
        <template v-for="(item, index) in items">
          <div class="itemCard"
               :class="cardColorClassArray[itemTypeArray.indexOf(item.type)]"
               v-show="!item.hidden">
            <div class="itemHeader">
              <div class="itemName">{{ item.name }}</div>
              <div class="itemType">
                <el-tag type="primary">{{ item.type }}</el-tag>
              </div>
            </div>
            <div class="itemBody">
              <div class="itemInfo noScrollbar" v-show="item.labels && item.labels.length > 0">
                <span>标签：</span>
                <el-tag type="primary" v-for="(tag, index) in item.labels" :key="index">{{ tag }}</el-tag>
              </div>
              <div class="itemInfo">
                介绍：{{ item.introduction }}
              </div>
              <div class="itemInfo" v-show="item.personalExperience">
                经历：{{ item.personalExperience }}
              </div>
              <div class="itemInfo" v-show="item.additionalSupplement">
                补充：{{ item.additionalSupplement }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/css/itemManage.css';
</style>