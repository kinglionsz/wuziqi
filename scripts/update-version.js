#!/usr/bin/env node
/**
 * 版本号统一更新脚本
 * 用法: node scripts/update-version.js <新版本号>
 * 示例: node scripts/update-version.js 2.1.0
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// 版本号文件映射配置
const VERSION_FILES = [
  {
    path: 'package.json',
    pattern: /"version":\s*"[\d.]+"/,
    replacement: (version) => `"version": "${version}"`
  },
  {
    path: 'railway-frontend/package.json',
    pattern: /"version":\s*"[\d.]+"/,
    replacement: (version) => `"version": "${version}"`
  },
  {
    path: 'railway-backend/package.json',
    pattern: /"version":\s*"[\d.]+"/,
    replacement: (version) => `"version": "${version}"`
  },
  {
    path: 'src/App.jsx',
    pattern: /App\.jsx\s*v[\d.]+/,
    replacement: (version) => `App.jsx v${version}`
  },
  {
    path: 'src/App.jsx',
    pattern: /xiaochidian\s*v[\d.]+/,
    replacement: (version) => `xiaochidian v${version}`
  },
  {
    path: 'src/App.jsx',
    pattern: /版本\s*v[\d.]+/,
    replacement: (version) => `版本 v${version}`
  },
  {
    path: 'index.html',
    pattern: /content="v[\d.]+"/,
    replacement: (version) => `content="v${version}"`
  },
  {
    path: 'index.html',
    pattern: /五子棋游戏\s*v[\d.]+/,
    replacement: (version) => `五子棋游戏 v${version}`
  },
  {
    path: 'railway-backend/server.js',
    pattern: /服务器\s*\(Railway\)\s*v[\d.]+/,
    replacement: (version) => `服务器 (Railway) v${version}`
  }
];

function updateFile(filePath, patterns, newVersion) {
  const fullPath = join(ROOT_DIR, filePath);
  try {
    let content = readFileSync(fullPath, 'utf-8');
    let updated = false;

    // 支持单模式或多模式
    const patternList = Array.isArray(patterns) ? patterns : [patterns];
    
    for (const config of patternList) {
      const pattern = config.pattern || config;
      const replacement = config.replacement || ((v) => v);
      
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement(newVersion));
        updated = true;
      }
    }

    if (updated) {
      writeFileSync(fullPath, content, 'utf-8');
      console.log(`✅ 已更新: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️ 未找到匹配: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 更新失败: ${filePath} - ${error.message}`);
    return false;
  }
}

function main() {
  const newVersion = process.argv[2];
  
  if (!newVersion) {
    console.error('❌ 请提供新版本号');
    console.error('用法: node scripts/update-version.js <新版本号>');
    console.error('示例: node scripts/update-version.js 2.1.0');
    process.exit(1);
  }

  // 验证版本号格式
  if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error('❌ 版本号格式错误，请使用语义化版本格式: x.y.z');
    process.exit(1);
  }

  console.log(`🚀 开始更新版本号到 v${newVersion}...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const config of VERSION_FILES) {
    const result = updateFile(config.path, config, newVersion);
    if (result) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n📊 更新完成: ${successCount} 成功, ${failCount} 失败`);
  console.log(`\n💡 提示: 记得更新以下文件中的版本历史记录:`);
  console.log('   - README.md (版本历史表格)');
  console.log('   - railway-frontend/dist/docs.html (最新更新部分)');
  console.log('   - 提交信息中注明版本更新内容');
}

main();
