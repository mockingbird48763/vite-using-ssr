// 預渲染的工作
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const toAbsolute = p => path.resolve(__dirname, p)

// 使用 require 導入 JSON
// import { createRequire } from 'module'
// const require = createRequire(import.meta.url)
// const manifest = require('./dist/static/ssr-manifest.json')

// 使用 import 導入 JSON

import manifest from './dist/static/ssr-manifest.json'

// 讀取入口文件
const template = fs.readFileSync(toAbsolute('dist/static/index.html'), 'utf-8')

import { render } from './dist/server/entry-server.js'


const routesToPrerender = fs
  .readdirSync(toAbsolute('src/pages'))
  .map(file => {
    // 替換副檔名為空，最終獲取 home, about
    const name = file.replace(/\.vue$/, '').toLowerCase()
    return name === 'home' ? '/' : `/${name}`
  })


  ; (async () => {
    for (const url of routesToPrerender) {
      const appHtml = await render(url, manifest)
      const html = template.replace('<!--ssr-outlet-->', appHtml)
      const filePath = `dist/static${url === '/' ? '/index' : url}.html`
      // 生成靜態文件
      fs.writeFileSync(toAbsolute(filePath), html)
    }

    // 使用完 ssr-manifest.json 刪除文件，不刪除也沒關係
    fs.unlinkSync(toAbsolute('dist/static/ssr-manifest.json'))

  })()