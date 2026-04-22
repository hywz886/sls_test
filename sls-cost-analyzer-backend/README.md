# SLS Cost Analyzer Backend

阿里云 SLS 日志服务费用分析工具的后端 API 服务。

## ✨ 功能特性

- 📊 **费用分析** - 提供详细的 SLS 日志服务费用数据
- 📈 **趋势分析** - 支持日期范围筛选和项目筛选
- 🎯 **项目排行** - 自动计算项目费用排行
- 💰 **分类统计** - 按读取、写入、索引、存储分类统计
- 🔄 **周/月对比** - 自动计算每日总费用的周环比和月环比
- 📥 **定时任务** - 支持每日自动处理费用数据
- 🔒 **CORS 支持** - 支持跨域请求
- 🚀 **热重载** - 开发模式支持代码热更新

## 📦 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

服务将在 `http://localhost:3000` 启动

### 生产构建

```bash
npm run build
npm start
```

## 📚 API 文档

详细 API 文档请查看 [API.md](./API.md)

### 主要端点

- `GET /api/health` - 健康检查
- `GET /api/projects` - 获取项目列表
- `GET /api/files` - 获取已处理文件列表
- `GET /api/comparison` - 📊 获取费用对比数据（周/月）
- `POST /api/process/daily` - 📥 处理每日费用数据
- `GET /api/cost-analysis` - 获取费用分析数据

### 使用示例

```bash
# 健康检查
curl http://localhost:3000/api/health

# 获取项目列表
curl http://localhost:3000/api/projects

# 获取已处理文件列表
curl http://localhost:3000/api/files

# 获取今天的费用对比（周环比、月环比）
curl http://localhost:3000/api/comparison

# 获取指定日期的费用对比
curl "http://localhost:3000/api/comparison?date=2026-04-17"

# 获取最近 30 天费用数据
curl http://localhost:3000/api/cost-analysis

# 获取指定日期范围
curl "http://localhost:3000/api/cost-analysis?startDate=2026-04-01&endDate=2026-04-17"

# 筛选特定项目
curl "http://localhost:3000/api/cost-analysis?projectIds=proj-001&projectIds=proj-002"

# 处理每日数据（定时任务调用）
curl -X POST http://localhost:3000/api/process/daily \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-04-17"}'
```

## 🛠️ 技术栈

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Dev Tool**: tsx (热重载)

## 📊 数据结构

### 计费标准

| 项目 | 单价 |
|------|------|
| 读取流量 | ¥0.08/GB |
| 写入流量 | ¥0.06/GB |
| 索引流量 | ¥0.10/GB |
| 存储 | ¥0.005/GB/天 |

## 🔧 配置

通过环境变量配置：

- `PORT` - 服务端口（默认：3000）

## 📝 许可证

MIT
