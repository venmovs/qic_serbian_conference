<template>
  <div class="game-container">
    <canvas
        ref="canvasRef"
        class="game-canvas"
        :width="canvasSize.width"
        :height="canvasSize.height"
    />
    <div v-if="crashMessage" class="crash-overlay">
      <span class="crash-message">{{ crashMessage }}</span>
      <button class="resume-button" @click="resumeGame">
        Try again
      </button>
    </div>
    <Joystick
        v-if="isMobile"
        @update:x="joystickMove"
        @stop="joystickStop"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, onUnmounted, computed } from 'vue';
import Joystick from './Joystick.vue';
import mainCar from './cars/lc-main-car.png';
import enemyCar1 from './cars/toyota-enemy-car.png';
import enemyCar2 from './cars/kia-enemy-car.png';
import enemyCar3 from './cars/ford-enemy-car.png';
import { useScreenResizeHandler } from "../../composables/useScreenResizeHandler.ts";

const CAR_SCALE = 0.06;
const CAR_SCALE_MOB = 0.05;
const INITIAL_GAME_SPEED = 3;
const MAX_GAME_SPEED = 9;
const SPEED_INCREMENT_INTERVAL_MS = 5000;
const ROAD_LINE_WIDTH = 10;
const ROAD_LINE_HEIGHT = 40;
const ROAD_GAP_HEIGHT = 20;
const PLAYER_CAR_START_Y_OFFSET = 120;
const PLAYER_CAR_FRICTION = 0.95;
const PLAYER_CAR_SPEED = 30;

class Car {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  width = 0;
  height = 0;
  velocityX = 0;
  speed = PLAYER_CAR_SPEED;
  friction = PLAYER_CAR_FRICTION;
  image: HTMLImageElement;

  constructor (context: CanvasRenderingContext2D, imageSrc: string, isMobile: boolean) {
    this.context = context;
    this.x = 0;
    this.y = 0;
    this.image = new Image();
    this.image.src = imageSrc;

    this.image.onload = () => {
      const scale = isMobile ? CAR_SCALE_MOB : CAR_SCALE;
      this.width = this.image.width * scale;
      this.height = this.image.height * scale;
    };
  }

  move (x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  draw (): void {
    if (this.width && this.height) {
      this.context.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }
}

export default defineComponent({
  components: {
    Joystick,
  },
  setup () {
    const joystickPositionX = ref(0);
    const carIsStopping = ref(false);
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const canvasContext = ref<CanvasRenderingContext2D | null>(null);
    const keys = ref<Record<string, boolean>>({});
    const gameSpeed = ref(INITIAL_GAME_SPEED);
    const crashMessage = ref('');
    const playerCar = ref<Car | null>(null);
    const enemyCars = ref<Car[]>([]);
    const roadOffset = ref(0);
    let gameSpeedIncreaseInterval: number;
    const { isMobile } = useScreenResizeHandler();

    const canvasSize = computed(() => {
      const height = window.innerHeight;
      const width = window.innerWidth > 800 ? 800 : window.innerWidth;
      const desktopParams = { height: height * 0.8, width: width - 20 };
      const mobileParams = { height: height * 0.7, width: width - 10 };
      return isMobile?.value ? mobileParams : desktopParams;
    });

    const getRandom = (min: number, max: number) =>
        Math.random() * (max - min) + min;

    const joystickMove = (x: number) => {
      carIsStopping.value = false;
      joystickPositionX.value = x;
    };

    const joystickStop = () => {
      carIsStopping.value = true;
    };

    const initializeCar = (context: CanvasRenderingContext2D, imageSrc: string,
                           x: number,
                           y: number
    ) => {
      const newCar = new Car(context, imageSrc, isMobile.value);
      newCar.move(x, y);
      return newCar;
    };

    const createRandomEnemyCar = (context: CanvasRenderingContext2D) => {
      const enemyImages = [enemyCar1, enemyCar2, enemyCar3];
      const enemyImage =
          enemyImages[Math.floor(Math.random() * enemyImages.length)];
      return initializeCar(
          context,
          enemyImage,
          getRandom(0, context.canvas.width),
          getRandom(-context.canvas.height, 0)
      );
    };

    const drawRoad = () => {
      const context = canvasContext.value!;
      const roadWidth = context.canvas.width;

      context.fillStyle = '#f1f4f6';
      context.fillRect(0, 0, roadWidth, context.canvas.height);

      roadOffset.value =
          (roadOffset.value + gameSpeed.value + 1) % (ROAD_LINE_HEIGHT + ROAD_GAP_HEIGHT);

      context.strokeStyle = '#5927ff';
      context.lineWidth = ROAD_LINE_WIDTH;
      context.setLineDash([ROAD_LINE_HEIGHT, ROAD_GAP_HEIGHT]);
      context.beginPath();
      context.moveTo(roadWidth / 2, roadOffset.value - (ROAD_LINE_HEIGHT + ROAD_GAP_HEIGHT));
      context.lineTo(roadWidth / 2, context.canvas.height);
      context.stroke();
    };

    const updatePlayerCarInMobile = () => {
      if (!crashMessage.value) {
        const context = canvasContext.value!;
        const player = playerCar.value!;
        if (carIsStopping.value) {
          player.velocityX *= player.friction;
        } else {
          player.velocityX = joystickPositionX.value * 3;
        }

        player.x = Math.min(
            Math.max(player.x + player.velocityX, 0),
            context.canvas.width - player.width
        );
      }

      playerCar.value!.draw();
    };

    const updatePlayerCar = () => {
      if (!crashMessage.value) {
        const context = canvasContext.value!;
        const player = playerCar.value!;

        if (keys.value.ArrowLeft && player.velocityX > -player.speed) {
          player.velocityX -= 1;
        }
        if (keys.value.ArrowRight && player.velocityX < player.speed) {
          player.velocityX += 1;
        }

        player.velocityX *= player.friction;
        player.x = Math.min(
            Math.max(player.x + player.velocityX, 0),
            context.canvas.width - player.width
        );
      }
      playerCar.value!.draw();
    };

    const updateEnemyCars = () => {
      enemyCars.value.forEach((enemyCar) => {
        enemyCar.move(enemyCar.x, enemyCar.y + gameSpeed.value);
        if (enemyCar.y > canvasContext.value!.canvas.height) {
          enemyCar.move(
              getRandom(0, canvasContext.value!.canvas.width),
              getRandom(-canvasContext.value!.canvas.height, 0)
          );
        }
        enemyCar.draw();
      });
    };

    const handleCollisions = () => {
      enemyCars.value.forEach((enemyCar) => {
        const player = playerCar.value!;
        const hasCollisionX =
            (enemyCar.x > player.x && enemyCar.x < player.x + player.width) ||
            (enemyCar.x + enemyCar.width > player.x &&
                enemyCar.x + enemyCar.width < player.x + player.width);

        const hasCollisionY = enemyCar.y + enemyCar.height > player.y;

        if (hasCollisionX && hasCollisionY) {
          if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(200);
          }
          gameSpeed.value = 0;
          crashMessage.value =
              'Don\'t worry, we cover such cases with insurance.';
        }
      });
    };

    const clearCanvas = () => {
      canvasContext.value!.clearRect(
          0,
          0,
          canvasContext.value!.canvas.width,
          canvasContext.value!.canvas.height
      );
    };

    const gameLoop = () => {
      clearCanvas();
      drawRoad();
      updateEnemyCars();
      isMobile.value ? updatePlayerCarInMobile() : updatePlayerCar();
      handleCollisions();
      requestAnimationFrame(gameLoop);
    };

    const resumeGame = () => {
      const context = canvasContext.value!;
      playerCar.value!.move(
          context.canvas.width / 2,
          context.canvas.height - PLAYER_CAR_START_Y_OFFSET
      );
      playerCar.value!.velocityX = 0;

      enemyCars.value.forEach((enemyCar) => {
        enemyCar.move(
            getRandom(0, context.canvas.width),
            getRandom(-context.canvas.height, 0)
        );
      });

      gameSpeed.value = INITIAL_GAME_SPEED;
      crashMessage.value = '';
    };

    const handleKeydown = (event: KeyboardEvent) => {
      keys.value[event.key] = true;
    };

    const handleKeyup = (event: KeyboardEvent) => {
      keys.value[event.key] = false;
    };

    onMounted(() => {
      const context = (canvasContext.value =
          canvasRef.value!.getContext('2d')!);
      playerCar.value = initializeCar(
          context,
          mainCar,
          context.canvas.width / 2,
          context.canvas.height - PLAYER_CAR_START_Y_OFFSET
      );

      const enemiesCount = isMobile.value ? 3 : 5;
      for (let i = 0; i < enemiesCount; i++) {
        enemyCars.value.push(createRandomEnemyCar(context));
      }

      document.body.addEventListener('keydown', handleKeydown);
      document.body.addEventListener('keyup', handleKeyup);

      gameSpeedIncreaseInterval = setInterval(() => {
        const acceleration = isMobile.value ? 0.1 : 1;
        gameSpeed.value = Math.min(gameSpeed.value + acceleration, MAX_GAME_SPEED);
      }, SPEED_INCREMENT_INTERVAL_MS);

      gameLoop();
    });

    onUnmounted(() => {
      document.body.removeEventListener('keydown', handleKeydown);
      document.body.removeEventListener('keyup', handleKeyup);
      clearInterval(gameSpeedIncreaseInterval);
    });

    return {
      canvasRef,
      crashMessage,
      resumeGame,
      joystickMove,
      joystickStop,
      isMobile,
      canvasSize,
    };
  },
});
</script>

<style>
body {
  overflow-x: hidden;
}
</style>

<style lang="scss" scoped>
@use 'game';
</style>
