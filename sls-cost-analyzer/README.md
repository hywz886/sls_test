# SLS 日志费用分析统计系统

阿里云 SLS（Simple Log Service）日志服务费用分析统计前端项目。

## 🚀 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI 组件库**: Ant Design 5
- **图表库**: ECharts 5
- **日期处理**: Day.js

## 📦 功能特性

- ✅ **费用概览**: 总费用、日均费用、最高日费用统计
- ✅ **趋势分析**: 每日费用趋势折线图，支持多项目对比
- ✅ **费用构成**: 饼图展示读取、写入、索引、存储费用占比
- ✅ **项目排行**: 项目费用 TOP5 柱状图
- ✅ **详细报表**: 完整的项目费用明细表格，支持排序和筛选
- ✅ **日期筛选**: 支持自定义日期范围查询
- ✅ **项目筛选**: 支持多项目选择过滤

## 🛠️ 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📁 项目结构

```
sls-cost-analyzer/
├── src/
│   ├── components/
│   │   └── Dashboard.tsx    # 主仪表板组件
│   ├── services/
│   │   └── mockData.ts      # 模拟数据服务
│   ├── types/
│   │   └── index.ts         # TypeScript 类型定义
│   ├── App.tsx              # 应用入口
│   ├── App.css              # 样式文件
│   └── main.tsx             # React 入口
├── index.html
├── package.json
└── README.md
```

## 🔌 数据接入

当前使用模拟数据，实际使用时可对接：

1. **阿里云 SLS API**: 通过阿里云 SDK 获取日志服务用量数据
2. **费用 API**: 对接阿里云费用中心 API 获取账单明细
3. **后端服务**: 通过自定义后端聚合 SLS 和费用数据

## 📊 计费说明（参考）

SLS 主要计费项：

| 计费项 | 单价（参考） |
|--------|-------------|
| 读取流量 | ¥0.08/GB |
| 写入流量 | ¥0.06/GB |
| 索引流量 | ¥0.10/GB |
| 存储容量 | ¥0.005/GB/天 |

> 实际价格请以阿里云官网为准

## 📝 License

MIT
