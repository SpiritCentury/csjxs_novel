<script setup>
import {onMounted, onUnmounted, ref, watch} from "vue";

const emit = defineEmits(['handleZIndex']);
const props = defineProps({
  noteObj: {
    type: Object,
    required: true,
    default() {
      return () => {};
    }
  },
  clickPosition: {
    type: Array,
    required: true,
    default() {
      return [];
    }
  },
  openIndex: {
    type: Number,
    required: true,
    default() { return 0 }
  }
})

const noteCard = ref(null); // 获取 DOM 元素
const isDragging = ref(false); // 是否正在拖拽
const constrainToViewport = ref(true); // 保持在视口内
const offsetX = ref(0); // 鼠标点击位置与 div 左上角的偏移量 X
const offsetY = ref(0); // 鼠标点击位置与 div 左上角的偏移量 Y
const divStyle = ref({
  position: 'fixed',
  left: `${props.clickPosition[0]}px`,
  top: `${props.clickPosition[1]}px`
});

// 开始拖拽
const startDrag = (e) => {
  isDragging.value = true;
  offsetX.value = (e.clientX - noteCard.value.getBoundingClientRect().left) * 1;
  offsetY.value = (e.clientY - noteCard.value.getBoundingClientRect().top) * 1;
};

// 拖拽中
const onDrag = (e) => {
  if (isDragging.value) {
    let left = e.clientX - offsetX.value;
    let top = e.clientY - offsetY.value;

    // 限制在视口内
    if (constrainToViewport.value) {
      const rect = noteCard.value.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      left = Math.max(0, Math.min(left, maxX));
      top = Math.max(0, Math.min(top, maxY));
    }

    divStyle.value.left = `${left}px`;
    divStyle.value.top = `${top}px`;
  }
};

// 停止拖拽
const stopDrag = () => {
  isDragging.value = false;
};

// 初始位置确定
function initPosition() {
  let positionX
  let positionY
  // 默认开启位置位于click点击位置的下方
  const textElement = document.getElementsByClassName('textParagraph')[0];
  const fontSize = parseInt(window.getComputedStyle(textElement).fontSize, 10)
  if (props.clickPosition[1] + fontSize * (1 + props.openIndex) + 250 < window.innerHeight) {
    positionY = props.clickPosition[1] + fontSize * (1 + props.openIndex)
  } else {
    positionY = props.clickPosition[1] - fontSize * (1 + props.openIndex) - 250
  }
  positionX = props.clickPosition[0] + fontSize * props.openIndex
  divStyle.value.left = `${positionX}px`;
  divStyle.value.top = `${positionY}px`;
}

// 处理卡片Z轴高度
function handleZIndex() {
  emit('handleZIndex', props.openIndex)
}

// 监听事件
onMounted(() => {
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
  noteCard.value.addEventListener('mousedown', handleZIndex);
  initPosition()
});

// 清理事件
onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  noteCard.value?.removeEventListener('mousedown', handleZIndex);
});

</script>

<template>
  <div :style="divStyle" class="noteCard" ref="noteCard">
    <div class="cardHeader" @mousedown="startDrag">
      <div class="itemName">{{ noteObj.name }}</div>
      <div class="itemType">[{{ noteObj.type }}]</div>
      <div v-show="noteObj.superPowerType" class="superPowerType">[{{ noteObj.superPowerType }}系]</div>
      <div v-show="noteObj.superPowerLevel" class="superPowerLevel">{{ noteObj.superPowerLevel }}</div>
    </div>
    <div class="content noScrollbar">
      <div v-show="noteObj.labels && noteObj.length > 0" class="itemInfo noScrollbar">
        <div class="itemInfoTitle">标签：</div>
        <div class="itemInfoContent">
          <el-tag type="primary" v-for="(tag, index) in noteObj.labels" :key="index">{{ tag }}</el-tag>
        </div>
      </div>
      <div v-show="noteObj.introduction" class="itemInfo">
        <div class="itemInfoContent">
          介绍：{{ noteObj.introduction }}
        </div>
      </div>
      <div v-show="noteObj.personalExperience" class="itemInfo">
        <div class="itemInfoContent">
          人物经历：{{ noteObj.personalExperience }}
        </div>
      </div>
      <div v-show="noteObj.additionalSupplement" class="itemInfo">
        <div class="itemInfoContent">
          额外补充：{{ noteObj.additionalSupplement }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>

</style>