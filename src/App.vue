<template>
  <main :class="{ main: !isGamePage }">
    <router-view />
  </main>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, watch } from 'vue';

const route = useRoute();
const isGamePage = ref<boolean>(false);

const checkIfGamePage = (path: string): void => {
  isGamePage.value = path.includes('game');
};

checkIfGamePage(route.path);

watch(
    () => route.path,
    (newPath: string) => {
      checkIfGamePage(newPath);
    }
);
</script>

<style scoped>
.main {
  padding: 20px;
}
</style>
