#!/usr/bin/env node

/**
 * kesi-pack - 为 KESI 部署打包项目
 * 将 dist/ 和 package.json 打包成 ZIP 文件
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { createWriteStream, createReadStream } from 'node:fs'
import archiver from 'archiver'
import { createInterface } from 'node:readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// 使用 process.cwd() 作为项目根目录，因为 npm 脚本在项目根目录运行
const PROJECT_ROOT = process.cwd()

// 调试信息
if (process.env.DEBUG) {
  console.error('DEBUG: __filename =', __filename)
  console.error('DEBUG: __dirname =', __dirname)
  console.error('DEBUG: PROJECT_ROOT =', PROJECT_ROOT)
  console.error('DEBUG: cwd =', process.cwd())
}

// 颜色输出
const cyan = '\x1b[36m'
const green = '\x1b[32m'
const yellow = '\x1b[33m'
const red = '\x1b[31m'
const bold = '\x1b[1m'
const reset = '\x1b[0m'

function log(text) { console.log(text) }
function success(text) { console.log(`${green}✔${reset} ${text}`) }
function info(text) { console.log(`${cyan}ℹ${reset} ${text}`) }
function warn(text) { console.log(`${yellow}⚠${reset} ${text}`) }
function error(text) { console.log(`${red}✖${reset} ${text}`) }

// 读取 package.json
function readPackageJson() {
  const pkgPath = join(PROJECT_ROOT, 'package.json')
  if (!existsSync(pkgPath)) {
    error('找不到 package.json 文件')
    process.exit(1)
  }

  const content = readFileSync(pkgPath, 'utf-8')
  return JSON.parse(content)
}

// 检查 dist 是否存在
function checkDist() {
  const distPath = join(PROJECT_ROOT, 'dist')
  if (!existsSync(distPath)) {
    warn('dist 目录不存在，是否先运行 npm run build？')
    return false
  }
  return true
}

// 创建 ZIP 文件
async function createZip(route) {
  return new Promise((resolve, reject) => {
    const outputFileName = `${route}.zip`
    const outputPath = join(PROJECT_ROOT, outputFileName)
    const output = createWriteStream(outputPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => {
      success(`打包完成: ${outputFileName}`)
      info(`文件大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`)
      resolve(outputPath)
    })

    archive.on('error', (err) => {
      error(`打包失败: ${err.message}`)
      reject(err)
    })

    archive.pipe(output)

    // 添加 dist 目录
    const distPath = join(PROJECT_ROOT, 'dist')
    archive.directory(distPath, 'dist')

    // 添加 package.json
    const pkgPath = join(PROJECT_ROOT, 'package.json')
    archive.file(pkgPath, { name: 'package.json' })

    archive.finalize()
  })
}

// 主流程
async function main() {
  log('')
  log(`${bold}${cyan}📦 kesi-pack - KESI 项目打包工具${reset}`)
  log('')

  // 读取 package.json
  const pkg = readPackageJson()
  info(`项目名称: ${pkg.name}`)
  info(`项目路由: ${pkg.route || pkg.name}`)
  log('')

  // 检查 dist 目录
  if (!checkDist()) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await new Promise(resolve => {
      rl.question('是否自动运行 npm run build? (y/N) ', resolve)
    })
    rl.close()

    if (answer.toLowerCase() === 'y') {
      info('正在运行 npm run build...')
      try {
        execSync('npm run build', { cwd: PROJECT_ROOT, stdio: 'inherit' })
        success('构建完成')
        log('')
      } catch {
        error('构建失败')
        process.exit(1)
      }
    } else {
      error('需要先运行 npm run build')
      process.exit(1)
    }
  }

  // 确定路由名称
  let route = pkg.route || pkg.name
  log('')

  // 创建 ZIP
  info('正在打包...')
  await createZip(route)

  log('')
  log(`${bold}${green}✨ 打包成功！${reset}`)
  log('')
}

main().catch(err => {
  error(err.message)
  process.exit(1)
})
