import { createApp } from 'vue';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'vue-maplibre-gl/style.css';
import 'vue-maplibre-gl/draw.css';
import App from './App.vue';

const app = createApp(App);

app.mount('#app');
