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
    <div class="content">
      <div v-show="noteObj.labels" class="itemInfo">
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

<style scoped>
@import "src/css/main.css";
.cardHeader {
  height: 34px;
  border-bottom: 1px solid #ccc;
  cursor: move;
  display: flex;
  align-items: center;
  user-select: none;
  .itemName {
    height: 100%;
    font-family: 'HanYiKaiTi', cursive;
    font-size: 30px;
    font-weight: bold;
  }
  .itemType,.superPowerType {
    display: flex;
    align-items: flex-end;
    padding-bottom: 5px;
    margin-left: 5px;
    height: calc(100% - 5px);
    font-family: 'HanYiKaiTi', cursive;
    font-size: 16px;
  }
  .superPowerLevel {
    margin-left: auto;
    margin-right: 10px;
    font-size: 20px;
    font-weight: bold;
    color: cornflowerblue;
  }
}
.noteCard {
  height: 250px;
  width: 400px;
  background-color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, .1);
  border-radius: 12px;
  padding: 10px;
  transition: box-shadow 0.3s, transform 0.3s;
}
.noteCard.active {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); /* 置顶时的阴影效果 */
  transform: scale(1.05); /* 轻微放大效果 */
}
.content {
  cursor: auto;
  overflow: auto;
  .itemInfo {
    display: flex;
    margin: 10px 10px;
    font-family: 'HanYiKaiTi', cursive;
    align-items: center;
    overflow-x: auto;
  }

  .itemInfoContent {
    line-height: 1.5em;
    .el-tag+.el-tag {
      margin-left: 5px;
    }
    .el-tag {
      font-size: 14px;
    }
  }
}
.content::-webkit-scrollbar {
  display: none;
}
.itemInfo::-webkit-scrollbar {
  display: none;
}
</style>