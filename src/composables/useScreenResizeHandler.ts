import { ref, onMounted, onUnmounted } from 'vue';

const useScreenResizeHandler = (maxMobileWidth = 768, handler = () => {
}) => {
    const isMobile = ref();

    const mediaQuery = window.matchMedia(`(max-width: ${maxMobileWidth}px)`);
    isMobile.value = mediaQuery.matches;

    const handleResize = (event: MediaQueryListEvent) => {
        isMobile.value = event.matches;
        handler();
    };

    onMounted(() => {
        mediaQuery.addEventListener('change', handleResize);
    });

    onUnmounted(() => {
        mediaQuery.removeEventListener('change', handleResize);
    });

    return {
        isMobile,
    };
};

export {useScreenResizeHandler};
