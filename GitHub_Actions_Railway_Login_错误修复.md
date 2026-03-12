# GitHub Actions Railway Login 错误修复记录

## 问题描述
在GitHub Actions工作流中运行`railway login --headless`命令时出现错误：
```
error: unexpected argument '--headless' found
tip: a similar argument exists: '--help'
```

## 错误原因
Railway CLI已经更新，不再支持`--headless`参数。根据Railway CLI的帮助文档，正确的参数是`-b`或`--browserless`。

## 修复的文件

### 1. `.github/workflows/ci-cd.yml`
**原始代码（第313行）：**
```yaml
      - name: 登录 Railway
        run: railway login --headless ${{ secrets.RAILWAY_TOKEN }}
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

**修复后代码：**
```yaml
      - name: 登录 Railway
        run: railway login --browserless
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 2. `.github/workflows/deploy-dev.yml`
**原始代码（第45行）：**
```yaml
      - name: 登录 Railway
        run: railway login --headless ${{ secrets.RAILWAY_TOKEN }}
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

**修复后代码：**
```yaml
      - name: 登录 Railway
        run: railway login --browserless
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## 验证修复
通过运行`railway login --help`命令验证了正确的参数：
```
Login to your Railway account

Usage: railway.exe login [OPTIONS]

Options:
  -b, --browserless  Browserless login
  -h, --help         Print help
  -V, --version      Print version
```

## 关键更改
1. 将`--headless`参数改为`--browserless`
2. 移除了直接在命令中传递token的方式（现在通过环境变量传递）

## 预期效果
修复后，GitHub Actions工作流应该能够成功连接到Railway平台进行部署，不会再出现参数错误。

## 相关配置
确保在GitHub仓库的Secrets中设置了`RAILWAY_TOKEN`环境变量。

---
**修复日期：2026年3月12日**  
**修复人员：AI助手**  
**项目：五子棋游戏 (wuziqi)**