#!/usr/bin/env node

/**
 * kesi-deploy - KESI 项目部署工具
 * 将项目打包并上传到 KESI 平台
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// 颜色输出
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';
const bold = '\x1b[1m';

function log(text) { console.log(text); }
function success(text) { console.log(`${green}✔${reset} ${text}`); }
function info(text) { console.log(`${cyan}ℹ${reset} ${text}`); }
function error(text) { console.log(`${red}✖${reset} ${text}`); }
function warn(text) { console.log(`${yellow}⚠${reset} ${text}`); }

/**
 * 读取配置文件
 */
function readConfig() {
  const projectConfigPath = path.join(process.cwd(), '.kesi', 'config.json');
  const globalConfigPath = path.join(process.env.HOME || process.env.USERPROFILE, '.kesi', 'config.json');

  // 优先读取项目配置
  if (fs.existsSync(projectConfigPath)) {
    try {
      const content = fs.readFileSync(projectConfigPath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      error(`读取项目配置失败: ${err.message}`);
    }
  }

  // 其次读取全局配置
  if (fs.existsSync(globalConfigPath)) {
    try {
      const content = fs.readFileSync(globalConfigPath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      error(`读取全局配置失败: ${err.message}`);
    }
  }

  return null;
}

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        config[key] = value;
        i++;
      } else {
        config[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      const value = args[i + 1];
      if (value && !value.startsWith('-')) {
        config[key] = value;
        i++;
      } else {
        config[key] = true;
      }
    }
  }

  return config;
}

/**
 * 参数映射
 */
function mapArgs(args) {
  const mapping = {
    'server-url': 'serverUrl',
    's': 'serverUrl',
    'token': 'token',
    't': 'token',
    'project-id': 'projectId',
    'p': 'projectId',
    'file': 'file',
    'f': 'file',
  };

  const result = {};
  for (const [key, value] of Object.entries(args)) {
    const mappedKey = mapping[key] || key;
    result[mappedKey] = value;
  }

  return result;
}

/**
 * 创建 FormData (手动实现，无需外部依赖)
 */
function createFormData(filePath) {
  const boundary = '----KESIFormBoundary' + Date.now().toString(36);

  const fileBuffer = fs.readFileSync(filePath);
  const fileStats = fs.statSync(filePath);

  let body = '';

  // 添加文件字段
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="${path.basename(filePath)}"\r\n`;
  body += `Content-Type: application/zip\r\n`;
  body += `Content-Length: ${fileStats.size}\r\n`;
  body += `\r\n`;

  const headerBuffer = Buffer.from(body, 'utf-8');
  const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');

  return {
    boundary,
    body: Buffer.concat([headerBuffer, fileBuffer, footerBuffer]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

/**
 * 上传文件到 KESI 平台
 */
function uploadFile(serverUrl, token, projectId, filePath) {
  return new Promise((resolve, reject) => {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      reject(new Error(`文件不存在: ${filePath}`));
      return;
    }

    // 解析服务器 URL
    let url;
    try {
      url = new URL(serverUrl);
    } catch (e) {
      reject(new Error(`无效的服务器地址: ${serverUrl}`));
      return;
    }

    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    // 创建 FormData
    const formData = createFormData(filePath);

    // 构建请求路径: /rest/projects/upload
    const uploadPath = path.join(url.pathname || '/', 'rest', 'projects', 'upload').replace(/\\/g, '/');

    // 发送请求
    const options = {
      method: 'POST',
      host: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: uploadPath,
      headers: {
        'Content-Type': formData.contentType,
        'Content-Length': formData.body.length,
        'Authorization': `Bearer ${token}`,
        'x-request-project': projectId,
      },
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch {
            resolve({ message: '上传成功', raw: data });
          }
        } else {
          try {
            const errorData = JSON.parse(data);
            reject(new Error(errorData.error || errorData.message || `上传失败 (${res.statusCode})`));
          } catch {
            reject(new Error(`上传失败 (${res.statusCode}): ${data}`));
          }
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(formData.body);
    req.end();
  });
}

/**
 * 显示帮助
 */
function showHelp() {
  log('');
  log(`${bold}${green}kesi-deploy${reset} - KESI 项目部署工具`);
  log('');
  log('用法:');
  log('  kesi-deploy [选项]');
  log('');
  log('选项:');
  log('  --server-url, -s <url>    KESI 服务器地址');
  log('  --token, -t <token>       认证令牌');
  log('  --project-id, -p <id>     KESI 项目 ID');
  log('  --file, -f <file>         ZIP 文件路径');
  log('  --help, -h                显示帮助');
  log('');
  log('配置文件:');
  log('  创建 ~/.kesi/config.json 或项目根目录 .kesi/config.json:');
  log('  {');
  log('    "serverUrl": "http://kesi-server.com",');
  log('    "token": "your-token-here",');
  log('    "projectId": "project-123"');
  log('  }');
  log('');
  log('示例:');
  log('  # 使用配置文件');
  log('  kesi-deploy --file my-project.zip');
  log('');
  log('  # 完整参数');
  log('  kesi-deploy -s http://server.com -t abc123 -p my-project -f project.zip');
  log('');
}

/**
 * 主函数
 */
async function main() {
  // 解析参数
  const args = mapArgs(parseArgs());

  // 显示帮助
  if (args.help || args.h) {
    showHelp();
    process.exit(0);
  }

  // 读取配置文件
  const config = readConfig() || {};

  // 合并配置（命令行参数优先）
  const serverUrl = args.serverUrl || config.serverUrl;
  const token = args.token || config.token;
  const projectId = args.projectId || config.projectId;
  const filePath = args.file;

  // 验证必需参数
  if (!serverUrl) {
    error('缺少 serverUrl 参数');
    log('');
    log('提示: 创建 ~/.kesi/config.json 配置文件或使用 --server-url 参数');
    log('运行 kesi-deploy --help 查看帮助');
    process.exit(1);
  }

  if (!token) {
    error('缺少 token 参数');
    log('');
    log('提示: 创建 ~/.kesi/config.json 配置文件或使用 --token 参数');
    process.exit(1);
  }

  if (!projectId) {
    error('缺少 projectId 参数');
    log('');
    log('提示: 创建 ~/.kesi/config.json 配置文件或使用 --project-id 参数');
    process.exit(1);
  }

  if (!filePath) {
    error('缺少 file 参数');
    log('');
    log('提示: 使用 --file 参数指定 ZIP 文件');
    process.exit(1);
  }

  // 上传
  log('');
  info(`正在上传 ${path.basename(filePath)}...`);
  log('');

  try {
    const result = await uploadFile(serverUrl, token, projectId, filePath);

    success('上传成功！');
    log('');
    log(`  项目ID: ${cyan}${projectId}${reset}`);
    log(`  访问路径: ${cyan}/${projectId}/${reset}`);
    log('');
  } catch (err) {
    error(err.message);
    log('');
    log('提示:');
    log('  - 检查服务器地址是否正确');
    log('  - 检查 token 是否有效');
    log('  - 检查项目 ID 是否正确');
    log('  - 检查 ZIP 文件是否存在');
    log('');
    process.exit(1);
  }
}

main().catch(err => {
  error(err.message);
  process.exit(1);
});
