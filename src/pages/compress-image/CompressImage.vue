<template>
  <div>
    <!-- Загрузка изображения -->
    <input type="file" @change="handleFileUpload" accept="image/*" />

    <!-- Оригинальное изображение -->
    <div v-if="originalImageUrl">
      <h3>Original Image</h3>
      <img :src="originalImageUrl" alt="Original Image" style="max-width: 100%; max-height: 300px;" />
      <p>Original size: {{ formatFileSize(originalFileSize) }}</p>
    </div>

    <!-- Сжатое изображение -->
    <div v-if="compressedImageUrl">
      <h3>Compressed Image</h3>
      <img :src="compressedImageUrl" alt="Compressed Image" style="max-width: 100%; max-height: 300px;" />
      <p>Compressed size: {{ formatFileSize(compressedFileSize) }}</p>
      <a :href="compressedImageUrl" :download="compressedFileName">Download Compressed Image</a>
    </div>

    <!-- Статус сжатия -->
    <p v-if="loading">Compressing image...</p>
    <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Функция сжатия изображения с типизацией
const compressImageFile = (
    imageFile: File,
    imageQuality: number = 0.7,
    maxWidth: number = 800,
    maxHeight: number = 600
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(imageFile);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Изменение размеров изображения
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);

        const type = imageFile.type;
        canvas.toBlob(
            (blob) => {
              if (blob) {
                const fileName = imageFile.name;
                const compressedFile = new File([blob], fileName, {
                  lastModified: Date.now(),
                  type: type,
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed: Blob is null'));
              }
            },
            type,
            imageQuality
        );
      } else {
        reject(new Error('Canvas context is not available'));
      }
    };

    img.onerror = (error) => reject(error);
  });
};

// Состояния компонента
const originalImageUrl = ref<string | null>(null);
const compressedImageUrl = ref<string | null>(null);
const compressedFileName = ref<string | null>(null);
const loading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const originalFileSize = ref<number | null>(null);
const compressedFileSize = ref<number | null>(null);

// Форматирование размера файла
const formatFileSize = (size: number | null): string => {
  if (size === null) return '';
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (size / Math.pow(1024, i)).toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
};

// Обработка загрузки файла
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    originalImageUrl.value = URL.createObjectURL(file);
    originalFileSize.value = file.size;

    // Начинаем процесс сжатия
    compressImage(file);
  }
};

// Функция сжатия изображения
const compressImage = async (file: File) => {
  loading.value = true;
  errorMessage.value = null;
  try {
    const compressedFile = await compressImageFile(file);
    compressedFileName.value = compressedFile.name;
    compressedImageUrl.value = URL.createObjectURL(compressedFile);
    compressedFileSize.value = compressedFile.size;
  } catch (error) {
    errorMessage.value = (error as Error).message;
    console.error('Image compression error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
img {
  border: 1px solid #ddd;
  margin-bottom: 10px;
}
a {
  display: inline-block;
  margin-top: 10px;
  color: blue;
  text-decoration: underline;
}
</style>
