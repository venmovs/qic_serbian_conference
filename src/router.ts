import { createRouter, createWebHistory } from 'vue-router';
import Game from './pages/game/Game.vue';
import CompressImage from "./pages/compress-image/CompressImage.vue";
import VoiceVisualizer from "./pages/voice-visualizer/VoiceVisualizer.vue";
import Drawing from "./pages/drawing/Drawing.vue";
import Home from "./pages/home/Home.vue";
import Links from "./pages/links/Links.vue";
import Showroom3d from "./pages/3d/Showroom3d.vue";

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home,
    },
    {
        path: '/game',
        name: 'Game',
        component: Game,
    },
    {
        path: '/compress-image',
        name: 'CompressImage',
        component: CompressImage,
    },
    {
        path: '/voice-visualizer',
        name: 'VoiceVisualizer',
        component: VoiceVisualizer,
    },
    {
        path: '/drawing',
        name: 'Drawing',
        component: Drawing,
    },
    {
        path: '/3d',
        name: '3D',
        component: Showroom3d
    },
    {
        path: '/links',
        name: 'Links',
        component: Links,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
