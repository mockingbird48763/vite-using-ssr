// 幫助我們進行模塊的轉化

import { createApp } from './main'
import { renderToString } from 'vue/server-renderer'

export async function render(url) {
  const { app, router } = createApp()
  router.push(url)
  await router.isReady()

  const ctx = {}
  // 將組件轉換 HTML 字符串，並返回結果
  const html = await renderToString(app, ctx)

  return html
}