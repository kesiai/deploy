# 构建工具配置详解

## Vite

### 配置文件

- `vite.config.ts`
- `vite.config.js`

### 必需修改

#### 1. 添加 base 配置

```typescript
export default defineConfig({
  base: "/__ROUTE__/",
  // ... 其他配置
})
```

**base 作用：** 设置部署后的资源路径前缀

| base 值 | 资源路径示例 |
|---------|-------------|
| `/my-project/` | `/my-project/assets/index-abc.js` |
| `/` | `/assets/index-abc.js` (在子路径会 404) |

#### 2. 添加 API 代理（可选）

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/rest': {
        target: '__SERVER_URL__',
        changeOrigin: true,
      },
      '/ws': {
        target: '__WS_URL__',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
```

**什么时候需要代理：**
- 项目需要调用 KESI REST API (`/rest/*`)
- 项目需要 WebSocket 订阅 (`/ws`)

**什么时候不需要代理：**
- 项目只是展示页面
- API 通过 CORS 允许跨域

### 完整配置示例

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/__ROUTE__/",
  plugins: [react()],
  server: {
    proxy: {
      '/rest': {
        target: '__SERVER_URL__',
        changeOrigin: true,
      },
      '/ws': {
        target: '__WS_URL__',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
```

---

## Webpack

### 配置文件

- `webpack.config.js`

### 必需修改

#### 1. 添加 publicPath 配置

```javascript
module.exports = {
  output: {
    publicPath: "/__ROUTE__/"
  }
}
```

#### 2. 添加 API 代理（可选）

```javascript
module.exports = {
  devServer: {
    proxy: {
      '/rest': {
        target: '__SERVER_URL__',
        changeOrigin: true,
      },
      '/ws': {
        target: '__WS_URL__',
        ws: true,
      },
    },
  },
}
```

### 完整配置示例

```javascript
const path = require('path')

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: "/__ROUTE__/"
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    proxy: {
      '/rest': {
        target: '__SERVER_URL__',
        changeOrigin: true,
      },
      '/ws': {
        target: '__WS_URL__',
        ws: true,
      },
    },
  },
}
```

---

## Vue CLI

### 配置文件

- `vue.config.js`

### 必需修改

#### 1. 添加 publicPath 配置

```javascript
module.exports = {
  publicPath: "/__ROUTE__/"
}
```

#### 2. 添加 API 代理（可选）

```javascript
module.exports = {
  devServer: {
    proxy: {
      '/rest': {
        target: '__SERVER_URL__',
        changeOrigin: true,
      },
      '/ws': {
        target: '__WS_URL__',
        ws: true,
      },
    },
  },
}
```

### 完整配置示例

```javascript
module.exports = {
  publicPath: "/__ROUTE__/",
  devServer: {
    proxy: {
      '/rest': {
        target: '__SERVER_URL__',
        changeOrigin: true,
      },
      '/ws': {
        target: '__WS_URL__',
        ws: true,
      },
    },
  },
}
```

---

## 纯静态项目

无需构建配置。

**项目结构：**
```
my-project/
├── index.html
├── style.css
└── app.js
```

**只需要：**
- 创建 `package.json` 添加 `route` 字段
- 直接打包所有文件

---

## 配置对照表

| 构建工具 | 资源路径配置 | API 代理配置 | 配置文件 |
|---------|-------------|-------------|---------|
| Vite | `base` | `server.proxy` | `vite.config.ts/js` |
| Webpack | `output.publicPath` | `devServer.proxy` | `webpack.config.js` |
| Vue CLI | `publicPath` | `devServer.proxy` | `vue.config.js` |
| 纯静态 | 无 | 无 | 无 |

---

## 占位符说明

| 占位符 | 含义 | 替换来源 |
|--------|------|---------|
| `__ROUTE__` | 项目路由 | package.json 的 route 或 name |
| `__SERVER_URL__` | KESI 服务器地址 | 用户输入/配置文件 |
| `__WS_URL__` | WebSocket 地址 | 用户输入/配置文件 |

**替换示例：**

```
__ROUTE__ → "my-project"
__SERVER_URL__ → "http://kesi-server.com"
__WS_URL__ → "ws://kesi-server.com"
```
