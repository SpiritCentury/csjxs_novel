<script setup>
import {onMounted, ref} from "vue";
import { getChapterObjFromDB, getChapterNumFromDB } from "@/js/NovelHandle.js"
let input = ref('')
const prominenceChapters = ref([])
const colorArray = ref(['#fff', '#7AC8FB', '#e3a348', '#1d5ca3'])
const meansArray = ref(['未出场', '隐性提及', '提及', '出场'])
let chapterNum = ref(0)
let prominenceNum = ref(0)

function generate() {
  prominenceNum.value = 0
  for (let i = 1; i <= chapterNum.value; i++) {
    getChapterObjFromDB(i).then(chapterObj => {
      if(chapterObj.content.indexOf(input.value) !== -1) {
        prominenceNum.value++
        prominenceChapters.value[i - 1] = 3
      } else {
        prominenceChapters.value[i - 1] = 0
      }
    })
  }
}
onMounted(() => {
  getChapterNumFromDB().then(data => {
    chapterNum.value = data
    for (let i = 0; i < data; i++) {
      prominenceChapters.value.push(0)
    }
  })
})


</script>

<template>
  <div>
    <el-form class="form" ref="form" :inline="true" label-width="80px">
      <el-form-item>
        <el-input v-model="input" placeholder="placeholder"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="generate">生成</el-button>
      </el-form-item>
    </el-form>
    <div class="tagNote">
      <div class="tagNoteDiv" v-for="item in 4">
        <el-tag class="prominenceTag" :color="colorArray[item - 1]"></el-tag>:
        {{ meansArray[item - 1] }}
      </div>
    </div>
    <div class="prominence">
      <el-tag
          class="prominenceTag"
          v-for="(item, index) in prominenceChapters"
          :color="colorArray[item]"
      ></el-tag>
    </div>
    <div>
      出场章数：{{ prominenceNum }}/{{chapterNum}}
    </div>
    <div>
      出场率：{{ prominenceNum/chapterNum * 100 }} %
    </div>
  </div>
</template>

<style scoped>
.form {
  margin: 10px 5px 0 5px;
}
.prominence {
  margin: 10px;
  display: grid;
  grid-template-columns: repeat(50, 16px);
  span {
    box-sizing: border-box;
  }
}
.prominenceTag {
  height: 15px;
  width: 15px;
  padding: 0;
  margin: 1px;
  border-radius: 0;
  cursor: pointer;
}
.tagNote {
  display: flex;
  .tagNoteDiv {
    margin: 5px 10px;
  }
}

</style>