// 使用 node 接管 vite 的啟動服務

import express from 'express'
import fs from 'fs'

// vite 創建 server 的方法
import { createServer as createViteServer } from 'vite'

// ESM 使用 __dirname
import { fileURLToPath } from 'url'
import path from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// file:///D:/vite/vite-advanced-ssr-vue3/server.js
// console.log(import.meta.url)

// D:\vite\vite-advanced-ssr-vue3\server.js
// console.log(__filename)

// D:\vite\vite-advanced-ssr-vue3
// console.log(__dirname)

// 參數判斷是否在生產環境之下
// NODE_ENV 是在運行 npm run serve 傳入的值
async function createServer(isProd = process.env.NODE_ENV === 'production') {

  // 預渲染使用變數
  const manifest = isProd ? import('./dist/static/ssr-manifest.json') : {}
  console.log(manifest)

  const app = express()

  // 以中間件模式創建 Vite 應用，這將禁用 Vite 自身的 HTML 服務邏輯
  // 並讓上級服務器接管控制
  // 該方法返回 promise 對象
  // 如果是在開發環境之下，需要 createViteServer 創建 vite 實例
  // 如果是在生產環境之下，只需要定義靜態目錄即可
  let vite
  if (!isProd) {
    // 開發環境
    vite = await createViteServer({
      server: {
        middlewareMode: true
      },
      // custom | spa | mpa
      appType: 'custom'
    })
    // 使用 vite 的 Connect 實例作為中間件
    app.use(vite.middlewares)
  } else {
    // 生產環境
    // app.use(
    //   (await import('serve-static')).default(path.resolve(__dirname, 'dist/client'), {
    //     // 不自動打開索引頁面
    //     index: false
    //   })
    // )

    // express 內置定義靜態目錄
    app.use(
      express.static('dist/client', {
        index: false
      })
    )
  }


  // 攔截任意請求
  app.use('*', async (req, res) => {
    // /aobut
    const url = req.originalUrl
    let template
    let render

    try {
      if (!isProd) {
        // 開發環境
        // (開發環境) 1. 讀取 index.html 文件
        template = fs.readFileSync(
          // __dirname = server.js 的物理路徑
          path.resolve(__dirname, './index.html'),
          'utf-8'
        )

        // (開發環境) 2. 應用 Vite HTML 轉換，這將會注入 Vite HMR 客戶端
        // 同時也會從 Vite 插件應用 HTML 轉換
        template = await vite.transformIndexHtml(url, template)
        // 返回 HTML 內容
        console.log(template)

        // (開發環境) 3. 加載服務器入口，vite.ssrLoadModule 將自動轉換
        // 使 ESM 源碼可以在 Nodj.js 中運行，無需打包
        // 並提供類似 HMR 的根據情況隨時失效
        // entry-server.js 導出的 render 方法
        render = (await vite.ssrLoadModule('/src/entry-server.js')).render
      } else {
        // 生產環境
        // 生產環境是讀取 dist 底下已打包的文件，所以不需要借助 vite 的方法轉換
        // (生產環境) 1. 讀取 index.html 文件
        template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
        // (生產環境) 2~3. 加載 entry-server.js 中的 render 即可
        render = (await import('./dist/server/entry-server.js')).render
      }

      // (共通) 4. 渲染應用的 HTML，傳入 manifest 供預渲染使用
      const appHtml = await render(url, manifest)
      // 轉化完成的 HTML 內容
      console.log(appHtml)

      // (共通) 5. 注入渲染後應用程序 HTML 到模板中
      // <!--ssr-outlet--> 是 index.html 中的註釋
      const html = template.replace('<!--ssr-outlet-->', appHtml)

      // (共通) 6. 返回渲染後的 html 給前端
      res.status(200).set({
        'content-type': 'text/html'
      }).end(html)

    } catch (e) {
      // 如果捕獲到一個錯誤，讓 vite 修復該堆棧，這樣它就可以映射回你的實際源碼中
      vite.ssrFixStacktrace(e)
      console.error(e)
      res.status(500).end(e.message)
    }
  })
  app.listen(3000)
}

createServer()