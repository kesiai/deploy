# 项目检测逻辑

## 检测流程

```
1. 检查 package.json 是否存在
   ↓
2. 读取 package.json 获取依赖信息
   ↓
3. 检测构建工具（查找配置文件）
   ↓
4. 确定项目类型
   ↓
5. 输出检测报告
```

---

## 检测规则

### 1. 构建工具检测

| 检测文件 | 构建工具 | 配置文件 |
|---------|---------|---------|
| `vite.config.ts` | Vite | TypeScript |
| `vite.config.js` | Vite | JavaScript |
| `webpack.config.js` | Webpack | JavaScript |
| `vue.config.js` | Vue CLI | JavaScript |
| `next.config.js` | Next.js | JavaScript/TypeScript |
| `nuxt.config.js` | Nuxt | JavaScript/TypeScript |
| 以上都没有 | 纯静态 | 无 |

**检测优先级：** Vite > Webpack > Vue CLI > Next.js > Nuxt > 静态

### 2. 框架检测（可选信息）

通过 `package.json` 的 dependencies 检测：

| 依赖 | 框架 |
|------|------|
| `react` | React |
| `vue` | Vue |
| `svelte` | Svelte |
| `@angular/core` | Angular |

**注意：** 框架检测仅用于信息展示，不影响配置逻辑。

### 3. 包管理器检测

| 锁文件 | 包管理器 | 构建命令 |
|-------|---------|---------|
| `package-lock.json` | npm | `npm run build` |
| `yarn.lock` | yarn | `yarn build` |
| `pnpm-lock.yaml` | pnpm | `pnpm build` |
| `bun.lockb` | bun | `bun run build` |

---

## 检测报告格式

```json
{
  "name": "my-project",
  "route": "my-project",
  "framework": "React 19",
  "builder": "Vite",
  "configFile": "vite.config.ts",
  "configFormat": "ts",
  "packageManager": "npm",
  "needsProxy": false,
  "hasKesiClient": false
}
```

---

## 特殊情况处理

### 没有 package.json

创建最小版本：

```json
{
  "name": "my-project",
  "route": "my-project"
}
```

### 配置文件是 .js 而不是 .ts

处理逻辑：
1. 优先读取 `.ts` 文件
2. 如果不存在，读取 `.js` 文件
3. 修改时保持原格式

### 没有构建配置文件

如果是纯静态项目（有 `index.html`），无需构建配置。

---

## 检测伪代码

```javascript
function detectProject(projectPath) {
  // 1. 检查 package.json
  const pkgPath = join(projectPath, 'package.json')
  if (!existsSync(pkgPath)) {
    // 检查是否是纯静态项目
    if (existsSync(join(projectPath, 'index.html'))) {
      return { type: 'static', needsPackageJson: true }
    }
    throw new Error('无法识别的项目类型')
  }

  const pkg = JSON.parse(readFileSync(pkgPath))

  // 2. 检测构建工具
  const configFiles = [
    'vite.config.ts',
    'vite.config.js',
    'webpack.config.js',
    'vue.config.js'
  ]

  for (const file of configFiles) {
    if (existsSync(join(projectPath, file))) {
      return {
        type: detectBuilderType(file),
        configFile: file,
        configFormat: file.endsWith('.ts') ? 'ts' : 'js'
      }
    }
  }

  // 3. 检查依赖中的构建工具
  if (pkg.devDependencies?.vite) {
    return { type: 'vite', configFile: null, needsConfig: true }
  }

  // 4. 纯静态
  return { type: 'static' }
}
```
