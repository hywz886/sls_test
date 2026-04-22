# Webhook 接口使用指南

## 📥 接口说明

**端点**: `POST /api/webhook/ingest`

**用途**: 接收定时任务推送的每日费用数据，自动处理并保存为 CSV/JSON 文件

**地址**: `http://localhost:3000/api/webhook/ingest`

---

## 📝 请求格式

### Request Body

```json
{
  "filters": {
    "startDate": "2026-04-01",
    "endDate": "2026-04-17",
    "projectIds": ["proj-001", "proj-002"]  // 可选
  },
  "dailyCosts": [
    {
      "date": "2026-04-17",
      "projectId": "proj-001",
      "projectName": "生产环境日志",
      "readTraffic": 383.89,
      "writeTraffic": 497.24,
      "indexedTraffic": 640.32,
      "storageSize": 2302.25,
      "readCost": 30.71,
      "writeCost": 29.83,
      "indexCost": 64.03,
      "storageCost": 11.51,
      "totalCost": 136.09
    }
  ]
}
```

### 字段说明

#### filters (可选)
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 (YYYY-MM-DD) |
| endDate | string | 否 | 结束日期 (YYYY-MM-DD) |
| projectIds | string[] | 否 | 项目 ID 列表 |

#### dailyCosts (必填)
数组，每个元素包含：
| 字段 | 类型 | 说明 |
|------|------|------|
| date | string | 日期 (YYYY-MM-DD) |
| projectId | string | 项目 ID |
| projectName | string | 项目名称 |
| readTraffic | number | 读取流量 (GB) |
| writeTraffic | number | 写入流量 (GB) |
| indexedTraffic | number | 索引流量 (GB) |
| storageSize | number | 存储大小 (GB) |
| readCost | number | 读取费用 (元) |
| writeCost | number | 写入费用 (元) |
| indexCost | number | 索引费用 (元) |
| storageCost | number | 存储费用 (元) |
| totalCost | number | 总费用 (元) |

---

## ✅ 响应格式

### 成功响应 (200)

```json
{
  "success": true,
  "message": "数据已接收并保存",
  "csvFile": "sls-cost-2026-04-17.csv",
  "jsonFile": "sls-cost-2026-04-17.json",
  "recordCount": 155,
  "processedAt": "2026-04-17T09:16:05.926Z"
}
```

### 错误响应 (400/500)

```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息"
}
```

---

## 🔧 使用示例

### 1. cURL 命令

```bash
curl -X POST http://localhost:3000/api/webhook/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "startDate": "2026-04-01",
      "endDate": "2026-04-17"
    },
    "dailyCosts": [
      {
        "date": "2026-04-17",
        "projectId": "proj-001",
        "projectName": "生产环境日志",
        "readTraffic": 383.89,
        "writeTraffic": 497.24,
        "indexedTraffic": 640.32,
        "storageSize": 2302.25,
        "readCost": 30.71,
        "writeCost": 29.83,
        "indexCost": 64.03,
        "storageCost": 11.51,
        "totalCost": 136.09
      }
    ]
  }'
```

### 2. Python 示例

```python
import requests
import json

url = "http://localhost:3000/api/webhook/ingest"

data = {
    "filters": {
        "startDate": "2026-04-01",
        "endDate": "2026-04-17"
    },
    "dailyCosts": [
        {
            "date": "2026-04-17",
            "projectId": "proj-001",
            "projectName": "生产环境日志",
            "readTraffic": 383.89,
            "writeTraffic": 497.24,
            "indexedTraffic": 640.32,
            "storageSize": 2302.25,
            "readCost": 30.71,
            "writeCost": 29.83,
            "indexCost": 64.03,
            "storageCost": 11.51,
            "totalCost": 136.09
        }
    ]
}

response = requests.post(url, json=data)
print(response.json())
```

### 3. Node.js 示例

```javascript
const fetch = require('node-fetch');

const url = 'http://localhost:3000/api/webhook/ingest';

const data = {
  filters: {
    startDate: '2026-04-01',
    endDate: '2026-04-17'
  },
  dailyCosts: [
    {
      date: '2026-04-17',
      projectId: 'proj-001',
      projectName: '生产环境日志',
      readTraffic: 383.89,
      writeTraffic: 497.24,
      indexedTraffic: 640.32,
      storageSize: 2302.25,
      readCost: 30.71,
      writeCost: 29.83,
      indexCost: 64.03,
      storageCost: 11.51,
      totalCost: 136.09
    }
  ]
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## ⏰ 定时任务配置

### Crontab 示例

```bash
# 每天凌晨 2 点执行
0 2 * * * /path/to/your/script.sh
```

### script.sh 示例

```bash
#!/bin/bash

# 从 SLS API 拉取数据
DATA=$(curl -s https://sls.aliyuncs.com/... | python3 process.py)

# 推送到后端
curl -X POST http://localhost:3000/api/webhook/ingest \
  -H "Content-Type: application/json" \
  -d "$DATA"
```

### Systemd Timer 示例

```ini
# /etc/systemd/system/sls-cost-daily.service
[Unit]
Description=Daily SLS Cost Data Fetcher

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -X POST http://localhost:3000/api/webhook/ingest \
  -H "Content-Type: application/json" \
  -d @/opt/scripts/sls-data.json

# /etc/systemd/system/sls-cost-daily.timer
[Unit]
Description=Run SLS cost fetcher daily at 2 AM

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

---

## 📁 数据保存位置

处理后的数据保存在：
- **CSV**: `/opt/data/sls-cost-YYYY-MM-DD.csv`
- **JSON**: `/opt/data/sls-cost-YYYY-MM-DD.json`

前端通过 `http://localhost:3000/data/` 直接读取这些文件。

---

## 🔍 验证数据

### 1. 检查文件列表
```bash
curl http://localhost:3000/api/files
```

### 2. 查看生成的 CSV
```bash
cat /opt/data/sls-cost-2026-04-17.csv
```

### 3. 查看汇总 JSON
```bash
cat /opt/data/sls-cost-2026-04-17.json | jq .summary
```

---

## ⚠️ 注意事项

1. **数据格式**: 确保 `dailyCosts` 是数组，每个元素包含所有必填字段
2. **日期格式**: 所有日期必须使用 `YYYY-MM-DD` 格式
3. **数值精度**: 建议保留 2 位小数
4. **幂等性**: 同一天多次推送会覆盖之前的数据
5. **文件大小**: 单次推送建议不超过 10000 条记录

---

## 🚨 错误处理

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `缺少 dailyCosts 数据` | 请求体中没有 dailyCosts 字段 | 确保发送正确的 JSON 结构 |
| `处理数据失败` | 数据格式错误或服务器异常 | 检查数据格式，查看服务器日志 |
| `400 Bad Request` | 请求格式不正确 | 检查 Content-Type 和 JSON 格式 |

---

**最后更新**: 2026-04-17  
**版本**: v1.0
