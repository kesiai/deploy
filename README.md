# kesi-deploy

KESI 项目发布工具 — 将现有前端项目部署到 KESI 平台。

## 功能

- ✅ **项目分析**：自动检测构建工具和框架类型
- ✅ **配置修改**：添加 KESI 必需配置（route、base、proxy）
- ✅ **自动编译**：支持 npm/yarn/pnpm/bun
- ✅ **打包上传**：一键打包并上传到 KESI 平台

## 使用方式

### AI Skill 模式（推荐）

```
用户: /kesi-deploy 帮我部署这个项目

AI 自动执行：
1. 分析项目
2. 修改配置
3. 执行编译
4. 打包上传
```

### CLI 工具模式

```bash
# 安装
npm install -g @kesi/upload

# 使用
kesi-upload --server-url <url> \
            --token <token> \
            --project-id <id> \
            --file <zip-path>
```

## 支持的项目类型

| 类型 | 构建工具 | 检测文件 |
|------|---------|---------|
| Vite 项目 | Vite | `vite.config.ts/js` |
| Webpack 项目 | Webpack | `webpack.config.js` |
| Vue CLI 项目 | Vue CLI (Webpack) | `vue.config.js` |
| 纯静态项目 | 无 | `index.html` |

## 配置文件

### .kesi/config.json

```json
{
  "serverUrl": "http://kesi-server.com",
  "token": "your-token-here",
  "projectId": "project-123"
}
```

## 文件结构

```
kesi-deploy/
├── skill/
│   ├── SKILL.md              # AI 主文档
│   └── references/           # 参考文档
│       ├── INDEX.md
│       ├── detection.md
│       ├── builders.md
│       └── upload.md
└── cli/
    ├── index.cjs             # kesi-upload CLI
    └── package.json
```

## 与其他工具的关系

| 工具 | 用途 |
|------|------|
| create-kesi-app | 从零创建 KESI 项目 |
| kesi-deploy | 部署现有项目到 KESI |
