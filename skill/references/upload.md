# 上传配置和 CLI

## 配置来源

上传配置按以下优先级读取：

1. **项目根目录** `.kesi/config.json`
2. **全局配置** `~/.kesi/config.json`
3. **用户输入**（对话中提供）

---

## 配置文件格式

### .kesi/config.json

```json
{
  "serverUrl": "http://kesi-server.com",
  "token": "your-token-here",
  "projectId": "project-123"
}
```

**字段说明：**

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `serverUrl` | string | ✅ | KESI 服务器地址 |
| `token` | string | ✅ | 认证令牌 |
| `projectId` | string | ✅ | KESI 项目 ID |

---

## kesi-deploy CLI

### 无需安装

CLI 是 skill 自带的，无需 npm install：

```bash
# 直接使用 Node 运行
node /path/to/kesi-deploy/cli/index.cjs --file my-project.zip

# 或在 skill 目录下
K=node cli/index.cjs
$K --file my-project.zip
```

### 使用

```bash
kesi-deploy --server-url <url> \
             --token <token> \
             --project-id <id> \
             --file <zip-path>
```

**参数说明：**

| 参数 | 简写 | 必需 | 说明 |
|------|------|------|------|
| `--server-url` | `-s` | ✅ | KESI 服务器地址 |
| `--token` | `-t` | ✅ | 认证令牌 |
| `--project-id` | `-p` | ✅ | KESI 项目 ID |
| `--file` | `-f` | ✅ | ZIP 文件路径 |

### 使用配置文件

如果存在 `.kesi/config.json` 或 `~/.kesi/config.json`，可以省略参数：

```bash
# 自动读取配置文件
kesi-deploy --file my-project.zip
```

### 示例

```bash
# 完整参数
kesi-deploy \
  --server-url http://kesi-server.com \
  --token abc123 \
  --project-id my-project \
  --file my-project.zip

# 使用配置文件
kesi-deploy --file my-project.zip

# 简写形式
kesi-deploy -s http://kesi-server.com -t abc123 -p my-project -f my-project.zip
```

---

## AI 调用逻辑

### 1. 读取配置

AI 按优先级查找配置：

```javascript
// 1. 项目配置
const projectConfig = readFileSync('.kesi/config.json')
if (projectConfig) return projectConfig

// 2. 全局配置
const globalConfig = readFileSync('~/.kesi/config.json')
if (globalConfig) return globalConfig

// 3. 提示用户
return askUserForConfig()
```

### 2. 执行上传

```bash
kesi-deploy --server-url <serverUrl> \
            --token <token> \
            --project-id <projectId> \
            --file <zipFile>
```

---

## 上传接口详情

### API 端点

```
POST /rest/apps/upload
```

### 请求头

| 头 | 说明 | 示例 |
|----|------|------|
| `Authorization` | 认证令牌 | `Bearer {token}` |
| `x-request-project` | KESI 项目 ID | `{projectId}` |
| `Content-Type` | multipart/form-data | 自动设置 |

### 请求体

```
FormData {
  file: <zip file>
}
```

### 响应

**成功 (200):**
```json
{
  "success": true,
  "message": "项目上传成功"
}
```

**失败 (4xx/5xx):**
```json
{
  "error": "错误信息",
  "message": "详细描述"
}
```

---

### 3. 处理结果

| 结果 | AI 行为 |
|------|---------|
| 成功 | 显示访问地址 |
| 认证失败 | 提示检查 token |
| 网络错误 | 提示检查 serverUrl |
| 文件错误 | 提示检查 zip 文件 |

---

## 错误处理

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `Authentication failed` | Token 无效 | 检查 token 是否正确 |
| `Project not found` | 项目 ID 无效 | 检查 projectId 是否正确 |
| `Connection refused` | 服务器地址错误 | 检查 serverUrl 是否正确 |
| `File not found` | ZIP 文件不存在 | 检查文件路径 |
| `Config not found` | 无配置文件且无参数 | 创建配置文件或提供参数 |

---

## 示例对话

```
AI: 正在上传...

✓ 上传成功！

  访问地址: http://kesi-server.com/my-project/
  部署路径: /my-project
```

```
AI: 正在上传...

✗ 上传失败：Authentication failed

  请检查 token 是否正确，或在 ~/.kesi/config.json 中更新配置。
```
