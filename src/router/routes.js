import { createRouter as _createRouter, createMemoryHistory, createWebHistory } from 'vue-router'

const pages = import.meta.glob('../pages/*.vue')

const routes = Object.keys(pages).map((path) => {
  // ../pages/About.vue
  // ../pages/Home.vue
  console.log(path)
  // (.*) 捕獲組，捕獲名稱
  const name = path.match(/\.\.\/pages(.*)\.vue$/)[1].toLowerCase()
  // /about
  // /home
  console.log(name)
  return {
    // 判斷 /home 設為起始頁
    path: name === '/home' ? '/' : name,
    // () => import('../pages/*.vue')
    // pages 的 key 是對應路徑的動態導入方法
    component: pages[path]
  }
})

console.log(routes)

export function createRouter() {
  return _createRouter({
    // 服務端渲染的路由，使用 Node 和 SRR 要求 createMemoryHistory，否則會出現 window is not defined
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes,
  })
}