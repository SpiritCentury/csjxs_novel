<script setup>
import HomePage from "@/view/HomePage.vue";
import NovelPage from "@/view/NovelPage.vue";
import {ref} from "vue";
let homePageVisible = ref(true)
let readyToRead = ref(null)

function changeHomePageVisible() {
  homePageVisible.value = !homePageVisible.value
  if (!homePageVisible.value && readyToRead.value === null) {
    readyToRead.value = true
  }
}

</script>

<template>
  <HomePage v-show="homePageVisible" @start-reading="changeHomePageVisible"></HomePage>
  <NovelPage v-if="readyToRead" v-show="!homePageVisible" @back-home="changeHomePageVisible"></NovelPage>
</template>

<style scoped>

</style>
