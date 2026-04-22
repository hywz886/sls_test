# SLS Cost Analyzer Backend API

## 基础信息

- **基础 URL**: `http://localhost:3000/api`
- **响应格式**: JSON
- **CORS**: 已启用

## API 端点

### 1. 健康检查

```http
GET /api/health
```

**响应示例:**
```json
{
  "success": true,
  "message": "SLS Cost Analyzer API is running",
  "timestamp": "2026-04-17T08:41:07.124Z"
}
```

---

### 2. 获取文件列表

```http
GET /api/files
```

**响应示例:**
```json
{
  "success": true,
  "files": [
    {
      "filename": "sls-cost-2026-04-17.csv",
      "date": "2026-04-17",
      "type": "csv",
      "createdAt": "2026-04-17T10:30:00.000Z",
      "size": 12345
    },
    {
      "filename": "sls-cost-2026-04-17.json",
      "date": "2026-04-17",
      "type": "json",
      "createdAt": "2026-04-17T10:30:00.000Z",
      "size": 5678
    }
  ]
}
```

---

### 3. 获取项目列表

```http
GET /api/projects
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    { "id": "proj-001", "name": "生产环境日志" },
    { "id": "proj-002", "name": "测试环境日志" },
    { "id": "proj-003", "name": "用户行为日志" },
    { "id": "proj-004", "name": "API 访问日志" },
    { "id": "proj-005", "name": "系统监控日志" }
  ]
}
```

---

### 3. 处理每日数据（定时任务调用）

```http
POST /api/process/daily
```

**请求体:**
```json
{
  "date": "2026-04-17",
  "sourceDir": "/root/.openclaw/workspace/data",
  "targetDir": "/opt/data"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "文件已处理完成",
  "date": "2026-04-17",
  "sourceFile": "sls-cost-2026-04-17.csv",
  "outputFile": "sls-cost-2026-04-17.csv",
  "recordCount": 150,
  "summary": {
    "totalCost": 1234.56,
    "avgDailyCost": 1234.56,
    "projectCount": 15,
    "weekComparison": {
      "lastWeekTotal": 1100.00,
      "changeAmount": 134.56,
      "changePercent": 12.23,
      "trend": "up"
    },
    "monthComparison": {
      "lastMonthTotal": 1000.00,
      "changeAmount": 234.56,
      "changePercent": 23.46,
      "trend": "up"
    }
  },
  "processedAt": "2026-04-17T10:30:00.000Z"
}
```

---

### 4. 获取费用对比数据

```http
GET /api/comparison?date=2026-04-17
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | 否 | 日期 (YYYY-MM-DD)，默认今天 |
| targetDir | string | 否 | 数据目录，默认 /opt/data |

**响应示例:**
```json
{
  "success": true,
  "date": "2026-04-17",
  "currentTotal": 1234.56,
  "weekComparison": {
    "lastPeriodTotal": 1100.00,
    "changeAmount": 134.56,
    "changePercent": 12.23,
    "trend": "up"
  },
  "monthComparison": {
    "lastPeriodTotal": 1000.00,
    "changeAmount": 234.56,
    "changePercent": 23.46,
    "trend": "up"
  },
  "metadata": {
    "lastWeekDate": "2026-04-10",
    "lastMonthDate": "2026-03-17"
  }
}
```

**对比趋势说明:**
- `trend: "up"` - 费用上涨
- `trend: "down"` - 费用下降
- `trend: "stable"` - 基本持平（变化 < 1%）

---

### 5. 获取费用分析数据

```http
GET /api/cost-analysis?startDate=2026-03-18&endDate=2026-04-17
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 (YYYY-MM-DD)，默认 30 天前 |
| endDate | string | 否 | 结束日期 (YYYY-MM-DD)，默认今天 |
| projectIds | string[] | 否 | 项目 ID 列表，可重复传递 |

**示例请求:**
```bash
# 获取最近 30 天数据
curl http://localhost:3000/api/cost-analysis

# 获取指定日期范围
curl http://localhost:3000/api/cost-analysis?startDate=2026-04-01&endDate=2026-04-17

# 筛选特定项目
curl "http://localhost:3000/api/cost-analysis?projectIds=proj-001&projectIds=proj-002"
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "dailyCosts": [
      {
        "date": "2026-04-17",
        "projectId": "proj-001",
        "projectName": "生产环境日志",
        "readTraffic": 234.56,
        "writeTraffic": 1234.56,
        "indexedTraffic": 567.89,
        "storageSize": 2345.67,
        "readCost": 18.76,
        "writeCost": 74.07,
        "indexCost": 56.79,
        "storageCost": 11.73,
        "totalCost": 161.35
      }
    ],
    "projectSummaries": [
      {
        "projectId": "proj-001",
        "projectName": "生产环境日志",
        "totalCost": 4840.52,
        "readTraffic": 7034.21,
        "writeTraffic": 37012.45,
        "indexedTraffic": 17023.67,
        "storageSize": 70345.23,
        "trend": [156.23, 178.45, 145.67, 189.34, 167.89, 198.23, 161.35]
      }
    ],
    "totalCost": 24202.60,
    "avgDailyCost": 806.75,
    "maxDailyCost": 923.45,
    "costByCategory": {
      "read": 3872.42,
      "write": 8881.49,
      "index": 6809.47,
      "storage": 2639.22
    }
  },
  "filters": {
    "startDate": "2026-03-18",
    "endDate": "2026-04-17",
    "projectIds": ["proj-001", "proj-002"]
  }
}
```

### 6. 接收定时任务通知（兼容旧接口）

```http
POST /api/webhook/process
```

**请求体:**
```json
{
  "filename": "sls-cost-2026-04-17.csv",
  "date": "2026-04-17"
}
```

---

## 数据结构

### CostRecord (每日费用记录)
```typescript
interface CostRecord {
  date: string;              // 日期 (YYYY-MM-DD)
  projectId: string;         // 项目 ID
  projectName: string;       // 项目名称
  readTraffic: number;       // 读取流量 (GB)
  writeTraffic: number;      // 写入流量 (GB)
  indexedTraffic: number;    // 索引流量 (GB)
  storageSize: number;       // 存储大小 (GB)
  readCost: number;          // 读取费用 (元)
  writeCost: number;         // 写入费用 (元)
  indexCost: number;         // 索引费用 (元)
  storageCost: number;       // 存储费用 (元)
  totalCost: number;         // 总费用 (元)
}
```

### ProjectSummary (项目汇总)
```typescript
interface ProjectSummary {
  projectId: string;         // 项目 ID
  projectName: string;       // 项目名称
  totalCost: number;         // 总费用 (元)
  readTraffic: number;       // 总读取流量 (GB)
  writeTraffic: number;      // 总写入流量 (GB)
  indexedTraffic: number;    // 总索引流量 (GB)
  storageSize: number;       // 总存储大小 (GB)
  trend: number[];           // 最近 7 天费用趋势
}
```

### CostAnalysis (费用分析)
```typescript
interface CostAnalysis {
  dailyCosts: CostRecord[];
  projectSummaries: ProjectSummary[];
  totalCost: number;
  avgDailyCost: number;
  maxDailyCost: number;
  costByCategory: {
    read: number;
    write: number;
    index: number;
    storage: number;
  };
}
```

---

## 计费标准

当前模拟的 SLS 计费标准（元/GB）：

| 项目 | 单价 |
|------|------|
| 读取流量 | ¥0.08/GB |
| 写入流量 | ¥0.06/GB |
| 索引流量 | ¥0.10/GB |
| 存储 | ¥0.005/GB/天 |

---

## 开发命令

```bash
# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 运行生产版本
npm start
```

---

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 服务端口 | 3000 |

---

## 错误处理

所有错误响应遵循统一格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

常见错误：
- `500` - 服务器内部错误
