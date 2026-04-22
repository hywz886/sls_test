# SLS 费用分析系统 - 部署说明

## 🚀 快速访问

前端已通过 Nginx 在 **5175 端口** 暴露：

- **本地访问**: http://localhost:5175/
- **网络访问**: http://<服务器IP>:5175/

## 📦 部署结构

```
/var/www/sls-cost-analyzer/    # Nginx 静态文件目录
├── index.html
├── favicon.svg
├── icons.svg
└── assets/
    ├── index-xxxx.js
    └── index-xxxx.css
```

## 🔧 Nginx 配置

配置文件位置：`/etc/nginx/sites-available/sls-cost-analyzer`

主要配置：
- 监听端口：5175
- 静态文件目录：/var/www/sls-cost-analyzer
- 支持 SPA 路由（try_files）
- 开启 Gzip 压缩
- 静态资源缓存 1 年

## 📝 更新部署流程

```bash
# 1. 构建项目
cd /root/.openclaw/workspace/sls-cost-analyzer
npm run build

# 2. 复制到 Nginx 目录
cp -r dist/* /var/www/sls-cost-analyzer/
chown -R www-data:www-data /var/www/sls-cost-analyzer

# 3. 重载 Nginx（配置变更时需要）
nginx -s reload
```

## 🔍 常用命令

```bash
# 查看 Nginx 状态
ps aux | grep nginx

# 查看访问日志
tail -f /var/log/nginx/sls-cost-analyzer-access.log

# 查看错误日志
tail -f /var/log/nginx/sls-cost-analyzer-error.log

# 测试 Nginx 配置
nginx -t

# 重载 Nginx
nginx -s reload

# 重启 Nginx
nginx -s stop && nginx
```

## 🔐 防火墙配置

如需从外部访问，确保 5175 端口开放：

```bash
# Ubuntu UFW
ufw allow 5175/tcp

# 阿里云安全组
# 在控制台添加规则：TCP 5175 0.0.0.0/0
```

## 📊 项目目录

- **源码**: `/root/.openclaw/workspace/sls-cost-analyzer/`
- **构建输出**: `/root/.openclaw/workspace/sls-cost-analyzer/dist/`
- **部署目录**: `/var/www/sls-cost-analyzer/`
- **Nginx 配置**: `/etc/nginx/sites-available/sls-cost-analyzer`

## ⚠️ 注意事项

1. 每次代码更新后需要重新 `npm run build` 并复制文件
2. 确保 `/var/www/sls-cost-analyzer/` 目录权限正确（www-data 用户可读）
3. 生产环境建议配置 HTTPS
4. 如需更改端口，修改 Nginx 配置文件中的 `listen` 指令
