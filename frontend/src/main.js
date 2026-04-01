import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // <-- 1. IMPORTA EL ROUTER
import './assets/main.css'

const app = createApp(App)

app.use(router) // <-- 2. DILE A VUE QUE USE EL ROUTER

app.mount('#app')