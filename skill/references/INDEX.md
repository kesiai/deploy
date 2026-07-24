# kesi-project-publish 参考文档索引

本文档目录包含 kesi-project-publish skill 的详细参考信息。

**⚠️ 不要一次性读取所有文件。**根据需要选择阅读。

---

## 核心文档

| 文件 | 主题 | 说明 |
|------|------|------|
| `detection.md` | 项目检测 | 如何检测项目类型和构建工具 |
| `builders.md` | 构建工具配置 | 各构建工具的 KESI 配置详解 |
| `upload.md` | 上传配置 | 上传 API 和 CLI 使用 |

---

## 按场景速查

| 场景 | 推荐阅读 |
|------|---------|
| 不知道项目用什么构建工具 | `detection.md` |
| Vite 项目配置 | `builders.md` (Vite 章节) |
| Webpack 项目配置 | `builders.md` (Webpack 章节) |
| 上传失败 | `upload.md` |

---

## 配置模板速查

| 构建工具 | 资源路径 | API 代理 |
|---------|---------|---------|
| Vite | `base: "/route/"` | `server.proxy` |
| Webpack | `output.publicPath: "/route/"` | `devServer.proxy` |
| Vue CLI | `publicPath: "/route/"` | `devServer.proxy` |
| 纯静态 | 无需配置 | 无需配置 |
