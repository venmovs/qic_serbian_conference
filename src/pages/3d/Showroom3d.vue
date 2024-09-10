<template>
  <div>
    <h3>3D Showroom</h3>
    <iframe
        :src="iframeSrc"
        width="100%"
        height="600px"
        frameborder="0"
        allowfullscreen
    ></iframe>
  </div>

  <a :href="iframeSrc" target="_blank">Link to project</a>
</template>

<script setup lang="ts">
const iframeSrc = "https://showroom3d.app/scene/tiguan/";
</script>

<style scoped>
iframe {
  border: none;
  display: block;
}
</style>
