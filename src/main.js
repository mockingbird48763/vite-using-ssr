// 瀏覽器端的應用創建
// import { createApp } from 'vue'
// import './style.css'
// import App from './App.vue'
// import { createRouter } from './router/routes';

// createApp(App).use(createRouter()).mount('#app')

import App from './App.vue'
// 進行 SSR 渲染
import { createSSRApp } from 'vue'
import { createRouter } from './router/routes'

export function createApp() {
  const app = createSSRApp(App)
  const router = createRouter()
  app.use(router)
  return {
    app,
    router
  }
}