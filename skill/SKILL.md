---
name: kesi-deploy
description: "KESI 项目部署工具 — 将现有前端项目部署到 KESI 平台：分析项目、执行编译、验证修复、打包上传"
keywords: "kesi, deploy, upload, vite, webpack"
---

# kesi-deploy

将制作好的前端项目部署到 KESI 平台的 AI 工具。

## ⚠️ 核心原则

- **技术栈无关**：支持 React/Vue/纯 HTML，只关心构建工具
- **最小侵入**：只添加 KESI 必需配置
- **自动检测**：AI 自动分析项目类型和构建工具
- **闭环验证**：Build → 验证 → 修复 → 再验证 → 确认无误才上传

## 快速开始

```
用户: /kesi-deploy 帮我部署这个项目

AI 自动执行：
1. 分析项目（构建工具、框架、路由名称）
2. 添加 route 字段到 package.json
3. 执行编译（npm/yarn/pnpm build）
4. 验证构建结果（检查资源路径是否正确）
5. 如果不正确 → 分析原因 → 修改配置 → 重新编译 → 再次验证
6. 验证通过 → 打包
7. 上传到 KESI 平台
```

---

## 工作流程

### Step 1: 项目分析

AI 检测并输出项目信息：

```json
{
  "name": "my-project",
  "route": "my-project",
  "builder": "Vite",
  "configFile": "vite.config.ts"
}
```

**检测逻辑：**

| 检测项 | 方式 | 输出 |
|-------|------|------|
| 构建工具 | 查找 `vite.config.ts/js`、`webpack.config.js`、`vue.config.js` | Vite/Webpack/Vue CLI/无 |
| 路由名称 | `package.json` 的 `route` 或 `name` | 用于部署路径 |
| 包管理器 | 查找 `package-lock.json`、`yarn.lock`、`pnpm-lock.yaml` | npm/yarn/pnpm |

---

### Step 2: 添加 route 字段

**必需修改：** 在 `package.json` 中添加 `route` 字段

```diff
{
  "name": "my-project",
+ "route": "my-project"
}
```

**⚠️ 跳过资源路径配置：** 暂时不修改构建配置，先 build 看看效果

---

### Step 3: 执行编译

AI 自动检测包管理器并执行构建：

| 检测到 | 构建命令 |
|-------|---------|
| `package-lock.json` | `npm run build` |
| `yarn.lock` | `yarn build` |
| `pnpm-lock.yaml` | `pnpm build` |
| `bun.lockb` | `bun run build` |

**如果构建失败：**
- 显示错误信息
- 提示用户检查并修复
- 等待用户指示继续

---

### Step 4: 验证构建结果 ⭐ 核心

构建完成后，**必须验证**资源路径是否正确。

**验证方法：**

```bash
# 检查 build/index.html 中的资源路径
cat build/index.html | grep -o 'href="[^"]*"' | head -5
```

**验证标准：**

| 检查项 | 正确示例 | 错误示例 |
|-------|---------|---------|
| 有占位符 | - | `href="/__ROUTE__/..."` |
| 路径匹配 | `href="/my-project/..."` | `href="/static/..."` |
| 相对路径 | `href="static/..."`（需确认） | - |

**验证结果处理：**

```
✅ 验证通过 → 进入 Step 5 打包
❌ 验证失败 → 进入 Step 4.1 分析修复
```

---

### Step 4.1: 分析修复（闭环核心）

如果验证失败，AI 分析原因并自动修复：

**情况1: 有占位符 `__ROUTE__`**

问题：使用了占位符但平台不会替换

| 构建配置文件 | 修复方式 |
|-------------|---------|
| `vite.config.ts/js` | `base: "/route-name/"`（替换为实际路由名） |
| `webpack.config.js` | `output.publicPath: "/route-name/"` |
| `vue.config.js` | `publicPath: "/route-name/"` |
| 无配置文件（CRA等） | 创建 `.env` 设置 `PUBLIC_URL=/route-name/` |

**情况2: 路径是 `/static/` 或 `/`**

问题：没有设置部署路径

修复方式同上，根据构建工具配置对应路径。

**修复后：** 重新执行 Step 3 编译 → Step 4 验证，直到通过。

---

### Step 5: 打包

验证通过后，执行打包：

```bash
# 创建 dist 目录结构的 zip
mkdir -p kesi-tmp/dist && cp -R build/* kesi-tmp/dist/ && cp package.json kesi-tmp/
cd kesi-tmp && zip -r ../{route}.zip . && cd .. && rm -rf kesi-tmp
```

**打包输出：** `{route}.zip`，包含 `dist/` 目录和 `package.json`

---

### Step 6: 上传

AI 读取上传配置，执行 CLI：

```bash
node .claude/skills/kesi-deploy/cli/index.cjs \
     --base-url <url> \
     --token <token> \
     --project-id <id> \
     --file {route}.zip
```

**配置获取方式（优先级：参数 > 环境变量）：**

| 字段 | CLI 参数 | 环境变量 |
|------|----------|----------|
| baseUrl | `--base-url` | `KESI_BASE_URL` |
| projectId | `--project-id` | `KESI_PROJECT` |
| token | `--token` | `KESI_TOKEN` |

**Token 获取：**
- 登录 KESI 平台后，从浏览器开发者工具 → Application → Local Storage 复制 `token`

---

## 配置文件修改模板

### Vite (vite.config.ts)

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  base: "/my-project/",  // 使用实际路由名称
})
```

### Webpack (webpack.config.js)

```javascript
module.exports = {
  output: {
    publicPath: "/my-project/"  // 使用实际路由名称
  }
}
```

### Vue CLI (vue.config.js)

```javascript
module.exports = {
  publicPath: "/my-project/"  // 使用实际路由名称
}
```

### Create React App (.env)

```bash
# .env
PUBLIC_URL=/my-project/
```

---

## 支持的项目类型

| 类型 | 构建工具 | 检测文件 | 配置方式 |
|------|---------|---------|---------|
| Vite 项目 | Vite | `vite.config.ts/js` | `base` |
| Webpack 项目 | Webpack | `webpack.config.js` | `output.publicPath` |
| Vue CLI 项目 | Vue CLI | `vue.config.js` | `publicPath` |
| CRA 项目 | 隐藏 | 无构建配置文件 | `.env` 的 `PUBLIC_URL` |
| 纯静态项目 | 无 | `index.html` | 无需配置 |

---

## 验证命令参考

**检查占位符：**
```bash
grep "__ROUTE__" build/index.html
```

**检查资源路径：**
```bash
# 查看 href 路径
grep -o 'href="[^"]*"' build/index.html

# 查看 src 路径
grep -o 'src="[^"]*"' build/index.html
```

**期望输出示例：**
```
href="/my-project/favicon.ico"
href="/my-project/logo192.png"
src="/my-project/static/js/main.js"
```

---

## 故障处理

| 问题 | 处理方式 |
|------|---------|
| 没有 package.json | 自动创建最小版本（含 name 和 route） |
| 构建失败 | 显示错误，等待用户修复 |
| 验证失败（有占位符） | 修改构建配置，重新 build |
| 验证失败（路径不对） | 修改构建配置，重新 build |
| 上传配置缺失 | 提示用户提供 |

---

## 示例对话

```
用户: /kesi-deploy 帮我部署这个项目

AI: 正在分析项目...
✓ 项目名称: my-dashboard
✓ 构建工具: Vite
✓ 配置文件: vite.config.ts
✓ 路由名称: my-dashboard

AI: 已添加 route 字段到 package.json

AI: 正在编译...
✓ 构建完成

AI: 正在验证构建结果...
✗ 发现问题：build/index.html 中包含占位符 __ROUTE__

AI: 正在修复...
✓ 修改 vite.config.ts，设置 base: "/my-dashboard/"

AI: 重新编译...
✓ 构建完成

AI: 再次验证...
✓ 验证通过：资源路径正确 (/my-dashboard/)

AI: 正在打包...
✓ 生成 my-dashboard.zip

AI: 正在上传...
✓ 上传成功！
  访问地址: http://kesi-server/my-dashboard/
```
