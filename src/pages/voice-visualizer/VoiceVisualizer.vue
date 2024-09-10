<template>
  <div>
    <h3>Voice Visualizer</h3>
    <canvas ref="canvas"></canvas>
    <button @click="startListening">Start</button>
    <button @click="stopListening" :disabled="!isListening">Stop</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const canvas = ref<HTMLCanvasElement | null>(null);
const isListening = ref<boolean>(false);

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let microphone: MediaStreamAudioSourceNode | null = null;
let dataArray: Uint8Array;
let animationFrameId: number | null = null;

const resizeCanvas = () => {
  if (canvas.value) {
    canvas.value.width = window.innerWidth * 0.9;
    canvas.value.height = window.innerHeight * 0.4;
  }
};

const drawVisualizer = () => {
  if (!canvas.value || !analyser) return;

  const canvasCtx = canvas.value!.getContext('2d');
  if (!canvasCtx) return;

  const width = canvas.value.width;
  const height = canvas.value.height;

  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  const draw = () => {
    if (!canvas.value || !analyser) return;
    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, width, height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();
    const sliceWidth = (width * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.value.width, canvas.value.height / 2);
    canvasCtx.stroke();

    animationFrameId = requestAnimationFrame(draw);
  };

  draw();
};

const startListening = async () => {
  if (isListening.value) return;

  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    analyser.fftSize = 2048;

    microphone.connect(analyser);

    isListening.value = true;
    drawVisualizer();
  } catch (err) {
    console.error('Error accessing microphone:', err);
  }
};

const stopListening = () => {
  if (!isListening.value || !audioContext) return;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  if (audioContext.state !== 'closed') {
    audioContext.close();
  }

  isListening.value = false;
};

onMounted(() => {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
});

onBeforeUnmount(() => {
  stopListening();
  window.removeEventListener('resize', resizeCanvas);
});
</script>

<style scoped>
canvas {
  border: 1px solid black;
  display: block;
  margin-bottom: 20px;
  max-width: 100%;
}
button {
  margin-right: 10px;
}
</style>
