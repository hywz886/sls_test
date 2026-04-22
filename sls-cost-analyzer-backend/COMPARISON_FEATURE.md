# 每日总费用周对比和月对比功能

## 功能概述

在 SLS 费用分析系统中新增了**每日总费用的周对比和月对比**功能，自动计算当前日期费用与上周同日、上月同日的费用变化。

## 实现内容

### 1. 类型定义 (`src/types.ts`)

新增 `ComparisonData` 接口：

```typescript
export interface ComparisonData {
  lastPeriodTotal: number;      // 上期总费用
  changeAmount: number;         // 变化金额
  changePercent: number;        // 变化百分比
  trend: 'up' | 'down' | 'stable';  // 趋势
}
```

### 2. 新增 API 端点 (`src/server.ts`)

#### `GET /api/comparison`

获取指定日期的费用对比数据。

**请求参数：**
- `date` (可选): 日期，格式 YYYY-MM-DD，默认今天
- `targetDir` (可选): 数据目录，默认 `/opt/data`

**响应示例：**
```json
{
  "success": true,
  "date": "2026-04-17",
  "currentTotal": 205.77,
  "weekComparison": {
    "lastPeriodTotal": 180,
    "changeAmount": 25.77,
    "changePercent": 14.32,
    "trend": "up"
  },
  "monthComparison": {
    "lastPeriodTotal": 150,
    "changeAmount": 55.77,
    "changePercent": 37.18,
    "trend": "up"
  },
  "metadata": {
    "lastWeekDate": "2026-04-10",
    "lastMonthDate": "2026-03-17"
  }
}
```

### 3. 数据处理流程增强

`POST /api/process/daily` 接口在处理每日数据时，自动计算并返回对比数据：

```json
{
  "success": true,
  "summary": {
    "totalCost": 205.77,
    "weekComparison": {
      "lastPeriodTotal": 180,
      "changeAmount": 25.77,
      "changePercent": 14.32,
      "trend": "up"
    },
    "monthComparison": {
      "lastPeriodTotal": 150,
      "changeAmount": 55.77,
      "changePercent": 37.18,
      "trend": "up"
    }
  }
}
```

### 4. 趋势判断逻辑

- `up`: 费用上涨（变化金额 > 0）
- `down`: 费用下降（变化金额 < 0）
- `stable`: 基本持平（变化金额 = 0）

## 使用方式

### 方式一：通过对比 API 查询

```bash
# 查询今天的费用对比
curl http://localhost:3000/api/comparison

# 查询指定日期的费用对比
curl "http://localhost:3000/api/comparison?date=2026-04-17"
```

### 方式二：通过每日处理接口获取

```bash
# 处理每日数据时自动返回对比
curl -X POST http://localhost:3000/api/process/daily \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-04-17"}'
```

### 方式三：从 JSON 文件中读取

处理后的 JSON 文件包含完整的对比数据：

```bash
cat /opt/data/sls-cost-2026-04-17.json | jq '.summary.weekComparison'
cat /opt/data/sls-cost-2026-04-17.json | jq '.summary.monthComparison'
```

## 数据要求

对比功能需要历史数据文件存在：

- **周对比**: 需要上周同日的 JSON 文件（如查询 2026-04-17，需要 2026-04-10 的数据）
- **月对比**: 需要上月同日的 JSON 文件（如查询 2026-04-17，需要 2026-03-17 的数据）

如果历史数据不存在，对比字段返回 `null`。

## 测试验证

```bash
# 1. 创建测试数据
cat > /opt/data/sls-cost-2026-04-10.json << 'EOF'
{
  "sourceDate": "2026-04-10",
  "summary": {"totalCost": 180.00}
}
EOF

cat > /opt/data/sls-cost-2026-03-17.json << 'EOF'
{
  "sourceDate": "2026-03-17",
  "summary": {"totalCost": 150.00}
}
EOF

# 2. 测试对比 API
curl http://localhost:3000/api/comparison?date=2026-04-17 | jq '.'

# 预期输出：
# weekComparison: 14.32% up
# monthComparison: 37.18% up
```

## 文件清单

- `src/types.ts` - 类型定义（新增 `ComparisonData`）
- `src/server.ts` - 服务器代码（新增 `/api/comparison` 端点）
- `API.md` - API 文档（更新）
- `README.md` - 项目说明（更新）

## 后续优化建议

1. **前端展示**: 在前端界面中添加对比数据展示，用颜色标识趋势（红色上涨、绿色下降）
2. **告警功能**: 当费用上涨超过阈值（如 50%）时发送告警通知
3. **趋势图表**: 添加周/月对比趋势图表，直观展示费用变化
4. **批量对比**: 支持批量获取多日的对比数据

## 变更记录

- **2026-04-17**: 初始实现，新增周对比和月对比功能
