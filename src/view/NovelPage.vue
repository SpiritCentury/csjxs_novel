<script setup>
import { ref } from "vue";
import NovelReading from "@/components/NovelReading.vue";
import Character from "@/components/Character.vue";
import ItemManage from "@/view/ItemManage.vue";
const emit = defineEmits(['backHome'])

function backHome() {
  emit('backHome')
}
const menuList = ref([
  { name: '阅读', value: 'reading' },
  { name: '人物', value: 'character' },
  { name: '词条管理', value: 'itemManage' },
  // { name: '设置', value: 'setting' }
])
function handleMenuClick(menuCode) {
  showPage.value = menuCode
}
let showPage = ref('reading')



</script>

<template>
  <div class="novelPage">
    <div class="leftMenu">
      <el-button class="backHomeBtn" @click="backHome">回到主页</el-button>
      <el-menu
          default-active="reading"
          class="elMenu"
          @select="handleMenuClick"
      >
        <el-menu-item
            class="elMenuItem"
            v-for="(menu, index) in menuList"
            :index="menu.value"
        >{{ menu.name }}</el-menu-item>
      </el-menu>
    </div>
    <div class="container">
      <NovelReading v-show="showPage === 'reading'"></NovelReading>
      <Character v-show="showPage === 'character'"></Character>
      <ItemManage v-show="showPage === 'itemManage'"></ItemManage>
    </div>
  </div>
</template>

<style scoped>

</style>