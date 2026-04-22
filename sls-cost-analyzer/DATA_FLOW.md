# SLS 费用分析系统 - 数据流程说明

## 📊 系统架构

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   前端 (Vite)   │────▶│  后端 (Express)  │────▶│  数据文件 (CSV)  │
│  localhost:5173 │     │  localhost:3000  │     │ /workspace/data │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## 🔄 数据流程

### 1. 后端生成数据

**触发方式:**
```bash
# 手动生成（默认最近 30 天）
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-03-18","endDate":"2026-04-17"}'

# 定时任务（未来扩展）
# 每天凌晨自动生成当日数据
```

**生成文件:**
- `sls-cost-YYYY-MM-DD.csv` - 详细数据（CSV 格式）
- `sls-cost-YYYY-MM-DD.json` - 汇总统计（JSON 格式）

### 2. 前端获取数据

**自动加载:**
```typescript
// Dashboard 组件加载时自动获取最新数据
useEffect(() => {
  const loadData = async () => {
    const costData = await fetchCostData();
    setData(costData);
  };
  loadData();
}, []);
```

**API 端点:**
- `GET /api/latest` - 获取最新 CSV 数据
- `GET /api/csv/:date` - 获取指定日期数据
- `GET /api/csv-files` - 获取所有数据文件列表

### 3. CSV 数据格式

```csv
date,projectId,projectName,readTraffic,writeTraffic,indexedTraffic,storageSize,readCost,writeCost,indexCost,storageCost,totalCost
2026-04-17,proj-001，生产环境日志，383.89,497.24,640.32,2302.25,30.71,29.83,64.03,11.51,136.09
2026-04-17,proj-002，测试环境日志，453.63,618.87,591.98,800.74,36.29,37.13,59.2,4,136.62
```

**字段说明:**
| 字段 | 说明 | 单位 |
|------|------|------|
| date | 日期 | YYYY-MM-DD |
| projectId | 项目 ID | - |
| projectName | 项目名称 | - |
| readTraffic | 读取流量 | GB |
| writeTraffic | 写入流量 | GB |
| indexedTraffic | 索引流量 | GB |
| storageSize | 存储大小 | GB |
| readCost | 读取费用 | 元 |
| writeCost | 写入费用 | 元 |
| indexCost | 索引费用 | 元 |
| storageCost | 存储费用 | 元 |
| totalCost | 总费用 | 元 |

## 📁 数据文件位置

```
/root/.openclaw/workspace/data/
├── sls-cost-2026-04-17.csv    # CSV 详细数据
├── sls-cost-2026-04-17.json   # JSON 汇总统计
├── sls-cost-2026-04-16.csv    # 历史数据...
└── sls-cost-2026-04-16.json
```

## 🔧 后端 API

### 生成数据
```bash
POST /api/generate
Body: {
  "startDate": "2026-03-18",
  "endDate": "2026-04-17",
  "projectIds": ["proj-001", "proj-002"]  // 可选
}
```

### 获取最新数据
```bash
GET /api/latest
Response: {
  "success": true,
  "csv": "date,projectId,...",  // CSV 文本
  "summary": {                   // 汇总统计
    "totalCost": 20004.77,
    "avgDailyCost": 645.32,
    "projectSummaries": [...]
  },
  "source": "file",
  "filename": "sls-cost-2026-04-17.csv"
}
```

### 获取文件列表
```bash
GET /api/csv-files
Response: {
  "success": true,
  "files": [
    {
      "filename": "sls-cost-2026-04-17.csv",
      "date": "2026-04-17",
      "createdAt": "2026-04-17T09:06:17.010Z",
      "size": 15360
    }
  ]
}
```

## 🚀 服务启动

### 后端服务
```bash
cd /root/.openclaw/workspace/sls-cost-analyzer-backend
npm run dev
# 运行在 http://localhost:3000
```

### 前端服务
```bash
cd /root/.openclaw/workspace/sls-cost-analyzer
npm run dev
# 运行在 http://localhost:5173
```

## 📝 未来扩展

### 1. 定时任务
- 每天凌晨自动生成当日数据
- 使用 `node-cron` 实现

### 2. 数据处理规则
- 从真实 SLS 日志导入数据
- 数据清洗和验证
- 异常数据检测

### 3. 数据导出
- 导出 Excel 格式
- 导出 PDF 报告
- 邮件发送日报

### 4. 数据可视化增强
- 更多图表类型
- 自定义时间范围
- 数据对比功能

## 🎯 计费标准

当前模拟的 SLS 计费标准（元/GB）：

| 项目 | 单价 |
|------|------|
| 读取流量 | ¥0.08/GB |
| 写入流量 | ¥0.06/GB |
| 索引流量 | ¥0.10/GB |
| 存储 | ¥0.005/GB/天 |

---

**最后更新:** 2026-04-17
