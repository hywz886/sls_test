# SLS 费用分析系统 - 新架构说明

## 📊 系统架构

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   前端 (Vite)   │────▶│  后端 (Express)  │────▶│  数据文件 (CSV)  │
│  localhost:5173 │     │  localhost:3000  │     │   /opt/data/    │
│                 │     │                  │     │                 │
│                 │     │  /api/generate  │     │                 │
│                 │     │  /api/files     │     │                 │
│                 │     │  /data/* (静态)  │────▶│                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## 🔄 数据流程

### 1. 后端处理数据并保存

**生成数据：**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-03-18","endDate":"2026-04-17"}'
```

**保存位置：** `/opt/data/`

**生成文件：**
- `sls-cost-2026-04-17.csv` - 详细数据（155 条记录）
- `sls-cost-2026-04-17.json` - 汇总统计

### 2. 前端直接读取文件

**流程：**
1. 调用 `GET /api/files` 获取文件列表
2. 找到最新的 CSV 文件
3. 直接请求 `http://localhost:3000/data/sls-cost-2026-04-17.csv`
4. 解析 CSV 并展示

**关键代码：**
```typescript
// 获取最新文件名
const response = await fetch('http://localhost:3000/api/files');
const { files } = await response.json();
const latestCsv = files.find(f => f.type === 'csv');

// 直接读取文件
const csvText = await fetch(`http://localhost:3000/data/${latestCsv.filename}`);
```

## 📁 文件结构

### 后端 (`/root/.openclaw/workspace/sls-cost-analyzer-backend`)
```
src/
├── server.ts      # Express 服务器 + 静态文件服务
├── data.ts        # 数据生成逻辑
└── types.ts       # TypeScript 类型定义
```

### 前端 (`/root/.openclaw/workspace/sls-cost-analyzer`)
```
src/
├── components/
│   └── Dashboard.tsx   # 主页面组件
├── services/
│   └── mockData.ts     # 数据获取服务（读取文件）
└── types/
    └── index.ts        # 类型定义
```

### 数据目录 (`/opt/data/`)
```
/opt/data/
├── sls-cost-2026-04-17.csv    # CSV 详细数据
├── sls-cost-2026-04-17.json   # JSON 汇总统计
├── sls-cost-2026-04-16.csv    # 历史数据...
└── sls-cost-2026-04-16.json
```

## 🛠️ API 端点

### 后端 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/projects` | GET | 获取项目列表 |
| `/api/files` | GET | 获取所有数据文件列表 |
| `/api/generate` | POST | 生成并保存数据 |
| `/data/*` | GET | **静态文件服务**（前端直接读取） |

### 静态文件访问

```bash
# 访问 CSV 文件
http://localhost:3000/data/sls-cost-2026-04-17.csv

# 访问 JSON 汇总
http://localhost:3000/data/sls-cost-2026-04-17.json

# 获取文件列表
http://localhost:3000/api/files
```

## 📝 CSV 文件格式

```csv
date,projectId,projectName,readTraffic,writeTraffic,indexedTraffic,storageSize,readCost,writeCost,indexCost,storageCost,totalCost
2026-03-18,proj-001，生产环境日志，383.89,497.24,640.32,2302.25,30.71,29.83,64.03,11.51,136.09
2026-03-18,proj-002，测试环境日志，453.63,618.87,591.98,800.74,36.29,37.13,59.2,4,136.62
```

## 🚀 服务启动

### 后端服务
```bash
cd /root/.openclaw/workspace/sls-cost-analyzer-backend
npm run dev
# 运行在 http://localhost:3000
# 数据保存在 /opt/data/
```

### 前端服务
```bash
cd /root/.openclaw/workspace/sls-cost-analyzer
npm run dev
# 运行在 http://localhost:5173
```

## ✅ 架构优势

1. **简化 API** - 后端只提供文件列表和生成功能
2. **直接读取** - 前端通过静态文件服务直接获取数据
3. **文件持久化** - 数据保存在 `/opt/data/`，易于管理和备份
4. **易于扩展** - 可以轻松添加更多数据处理规则

## 🔮 未来扩展

### 1. 定时任务
```bash
# 每天凌晨 2 点自动生成当日数据
0 2 * * * curl -X POST http://localhost:3000/api/generate
```

### 2. 数据处理规则
在 `src/data.ts` 中添加：
- 从真实 SLS API 导入数据
- 数据清洗和验证
- 异常检测

### 3. 文件管理
- 自动清理 30 天前的旧文件
- 数据压缩归档
- 导出备份

---

**最后更新:** 2026-04-17  
**数据目录:** `/opt/data/`
