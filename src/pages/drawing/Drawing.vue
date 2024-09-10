<template>
  <div>
    <h3>Canvas Drawing</h3>
    <canvas
        ref="canvas"
        width="400"
        height="300"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart="startDrawing"
        @touchmove="draw"
        @touchend="stopDrawing"
        style="border: 1px solid black;"
    ></canvas>
    <button @click="clearCanvas">Clear Canvas</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const canvas = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref<boolean>(false);
const context = ref<CanvasRenderingContext2D | null>(null);
const lastX = ref<number>(0);
const lastY = ref<number>(0);

const getCoordinates = (event: MouseEvent | TouchEvent): { x: number, y: number } => {
  if (event instanceof MouseEvent) {
    return { x: event.offsetX, y: event.offsetY };
  } else if (event instanceof TouchEvent && canvas.value) {
    const rect = canvas.value.getBoundingClientRect();
    const touch = event.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }
  return { x: 0, y: 0 };
};

const startDrawing = (event: MouseEvent | TouchEvent) => {
  if (!canvas.value || !context.value) return;

  isDrawing.value = true;
  const { x, y } = getCoordinates(event);
  [lastX.value, lastY.value] = [x, y];
};

const draw = (event: MouseEvent | TouchEvent) => {
  if (!isDrawing.value || !canvas.value || !context.value) return;

  event.preventDefault(); // предотвращает прокрутку на мобильных устройствах при рисовании
  const { x, y } = getCoordinates(event);

  context.value.strokeStyle = 'white';
  context.value.lineJoin = 'round';
  context.value.lineCap = 'round';
  context.value.lineWidth = 5;

  context.value.beginPath();
  context.value.moveTo(lastX.value, lastY.value);
  context.value.lineTo(x, y);
  context.value.stroke();

  [lastX.value, lastY.value] = [x, y];
};

const stopDrawing = () => {
  isDrawing.value = false;
};

const clearCanvas = () => {
  if (!canvas.value || !context.value) return;

  context.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
};

onMounted(() => {
  if (canvas.value) {
    context.value = canvas.value.getContext('2d');
  }
});
</script>

<style scoped>
canvas {
  cursor: crosshair;
  touch-action: none; /* предотвращает прокрутку при касаниях на холсте */
}
button {
  margin-top: 10px;
}
</style>
