# 🤖 AI 日志分析功能

SLS 费用分析平台后端现已集成大模型 AI 分析功能，可自动对每日日志费用数据进行智能分析并生成详细报告。

## 功能特性

### 自动分析
- **触发时机**：每日数据处理完成后自动触发
- **分析内容**：费用趋势、异常检测、优化建议
- **输出格式**：JSON 格式报告，便于前端展示

### 报告内容
每份 AI 分析报告包含：

1. **关键发现 (keyFindings)**
   - ✅ 正面发现（费用下降、成本控制良好）
   - ⚠️ 警告发现（费用异常增长）
   - ℹ️ 信息提示

2. **Top Logstore 分析**
   - 费用排名前 10 的 Logstore
   - 周对比、月对比变化
   - 问题和优化建议

3. **优化建议 (optimizationSuggestions)**
   - 高/中/低优先级分类
   - 具体优化措施
   - 预估节省金额

4. **异常检测 (anomalies)**
   - 异常增长的 Logstore
   - 影响金额
   - 处理建议

5. **总结 (summary)**
   - 整体趋势判断
   - 关键问题概述

## API 使用

### 获取 AI 分析报告

```bash
GET /api/analysis?date=2026-04-21
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "date": "2026-04-21",
    "totalCost": 3598.98,
    "weekComparison": {
      "changePercent": 3.71,
      "trend": "up"
    },
    "monthComparison": {
      "changePercent": 9.89,
      "trend": "up"
    },
    "keyFindings": [
      {
        "type": "warning",
        "text": "rjhy-chat-record-trace 费用异常增长 74.6%"
      }
    ],
    "optimizationSuggestions": [
      {
        "priority": "high",
        "title": "优化 api-access-log 的查询策略",
        "description": "该 Logstore 费用最高，建议检查是否有低效查询...",
        "estimatedSavings": 76
      }
    ],
    "anomalies": [
      {
        "logstore": "gudao-market-subscribe",
        "issue": "费用异常增长：周 +91.5%, 月 +315.8%",
        "impact": 126.34,
        "recommendation": "建议检查查询频率、索引配置和数据量变化"
      }
    ],
    "summary": "今日 SLS 总费用 ¥3598.98，整体趋势上升。发现 1 个异常增长的 Logstore，建议优先处理。"
  }
}
```

## 配置大模型 API

### 1. 获取 API Key

支持以下大模型服务：

- **阿里云百炼（通义千问）** - 推荐
  - 官网：https://bailian.console.aliyun.com/
  - 模型：qwen-plus, qwen-max
  
- **DeepSeek**
  - 官网：https://platform.deepseek.com/
  - 模型：deepseek-chat

- **Moonshot（月之暗面）**
  - 官网：https://platform.moonshot.cn/
  - 模型：moonshot-v1-8k

### 2. 配置环境变量

复制配置文件：
```bash
cd /root/.openclaw/workspace/sls-cost-analyzer-backend
cp .env.example .env
```

编辑 `.env` 文件：
```bash
# 阿里云百炼示例
LLM_API_KEY=sk-your-api-key-here
LLM_API_ENDPOINT=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
```

### 3. 重启服务

```bash
systemctl restart sls-cost-analyzer.service
```

## 文件结构

分析报告保存在数据目录：
```
/opt/data/
├── sls-cost-2026-04-21.json          # 费用数据
├── sls-cost-2026-04-21-analysis.json  # AI 分析报告
└── ...
```

## 前端集成示例

### React/TypeScript

```typescript
interface AnalysisReport {
  date: string;
  totalCost: number;
  keyFindings: Array<{ type: 'positive' | 'warning' | 'info'; text: string }>;
  optimizationSuggestions: Array<{
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    estimatedSavings?: number;
  }>;
  anomalies: Array<{
    logstore: string;
    issue: string;
    impact: number;
    recommendation: string;
  }>;
  summary: string;
}

// 获取分析报告
const fetchAnalysis = async (date: string) => {
  const response = await fetch(`/api/analysis?date=${date}`);
  const result = await response.json();
  return result.data as AnalysisReport;
};
```

## 降级处理

如果未配置大模型 API 或 API 调用失败，系统会自动使用内置的基础分析逻辑：

- 基于规则的关键发现生成
- 固定的优化建议模板
- 异常检测（基于增长率阈值）

确保服务始终可用，不会因 AI 服务问题而中断。

## 成本估算

以大模型分析为例：
- 每次分析输入约 500-800 tokens
- 输出约 800-1200 tokens
- 按 qwen-plus 定价（¥0.004/1K tokens）
- **单次分析成本约 ¥0.01**
- **月度成本约 ¥0.30**（每天一次）

性价比极高，推荐配置使用！

---

**技术支持**：查看 `/root/.openclaw/workspace/sls-cost-analyzer-backend/src/aiAnalyzer.ts` 源码
