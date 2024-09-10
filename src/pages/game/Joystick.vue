<template>
  <canvas ref="joystickCanvas" :width="canvasWidth" height="100" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const joystickCanvas = ref<HTMLCanvasElement | null>(null);
const joystickY = 50;
let isDragging = false;
const canvasWidth = 150;
const joystickRadius = canvasWidth * 0.2;
const center = canvasWidth / 2;
let joystickX = canvasWidth / 2;

const emit = defineEmits<
  {(event: 'update:x', x: number): void;
  (action: 'stop'): void }>();

const drawJoystick = (ctx: CanvasRenderingContext2D) => {
  if (!joystickCanvas.value) return;
  ctx.clearRect(0, 0, joystickCanvas.value.width, joystickCanvas.value.height);


  ctx.beginPath();
  ctx.roundRect(joystickRadius, joystickY - joystickRadius / 2,
    canvasWidth - joystickRadius * 2, joystickRadius, 20);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.roundRect(joystickRadius + 2, joystickY - joystickRadius / 2 + 2,
    canvasWidth - joystickRadius * 2 - 4, joystickRadius - 4, 18);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.stroke();
  ctx.closePath();

  ctx.beginPath();
  const joystickGradient = ctx.createLinearGradient(
    joystickX - joystickRadius, joystickY - joystickRadius,
    joystickX + joystickRadius, joystickY + joystickRadius);
  joystickGradient.addColorStop(0, '#6c3cff');
  joystickGradient.addColorStop(1, '#3c1e99');
  ctx.arc(joystickX, joystickY, joystickRadius, 0, Math.PI * 2);
  ctx.fillStyle = joystickGradient;
  ctx.fill();
  ctx.closePath();
};


const getPosition = (event: TouchEvent, axis: 'x' | 'y' = 'x') => {
  const touches = event.touches[0];
  return axis === 'x' ? touches.clientX : touches.clientY;
};

const onTouchMove = (event: TouchEvent) => {
  if (isDragging && joystickCanvas.value) {
    const rect = joystickCanvas.value.getBoundingClientRect();
    joystickX = getPosition(event) - rect.left;

    if (joystickX < joystickRadius) {
      joystickX = joystickRadius;
    } else if (joystickX > joystickCanvas.value.width - joystickRadius) {
      joystickX = joystickCanvas.value.width - joystickRadius;
    }

    const ctx = joystickCanvas.value.getContext('2d');
    if (ctx) drawJoystick(ctx);
    const onePercent = (center - joystickRadius) / 100;
    const percent = (joystickX - center) / onePercent;

    emit('update:x', percent / 100);
  }
};

const onTouchStart = (event: TouchEvent) => {
  if (!joystickCanvas.value) return;
  const rect = joystickCanvas.value.getBoundingClientRect();
  const mouseX = getPosition(event) - rect.left;
  const mouseY = getPosition(event, 'y') - rect.top;

  if (
    Math.pow(mouseX - joystickX, 2) + Math.pow(mouseY - joystickY, 2) <=
    Math.pow(joystickRadius, 2)
  ) {
    isDragging = true;
  }
};

const onTouchEnd = () => {
  isDragging = false;
  joystickX = center;
  const ctx = joystickCanvas.value?.getContext('2d');
  if (ctx) drawJoystick(ctx);
  emit('update:x', 0);
  emit('stop');
};

onMounted(() => {
  if (!joystickCanvas.value) return;
  const ctx = joystickCanvas.value.getContext('2d');
  if (ctx) drawJoystick(ctx);

  joystickCanvas.value.addEventListener('touchmove', onTouchMove);
  joystickCanvas.value.addEventListener('touchstart', onTouchStart);
  window.addEventListener('touchend', onTouchEnd);
});
</script>

<style scoped>
canvas {
  overflow: visible;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 123123;
  bottom: 10%;
}
</style>
