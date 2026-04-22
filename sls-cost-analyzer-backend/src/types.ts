// SLS 日志费用分析类型定义

export interface CostRecord {
  date: string;
  projectId: string;
  projectName: string;
  readTraffic: number; // GB
  writeTraffic: number; // GB
  indexedTraffic: number; // GB
  storageSize: number; // GB
  readCost: number; // 元
  writeCost: number; // 元
  indexCost: number; // 元
  storageCost: number; // 元
  totalCost: number; // 元
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  totalCost: number;
  readTraffic: number;
  writeTraffic: number;
  indexedTraffic: number;
  storageSize: number;
  trend: number[]; // 最近 7 天的费用趋势
}

export interface CostAnalysis {
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

export interface FilterOptions {
  startDate: string;
  endDate: string;
  projectIds?: string[];
}

export interface ProcessRequest {
  date: string; // 定时任务传入的日期，格式：YYYY-MM-DD
  sourceDir?: string; // 可选，源数据目录，默认 /root/.openclaw/workspace/data/
  targetDir?: string; // 可选，目标数据目录，默认 /opt/data/
}

export interface ComparisonData {
  lastPeriodTotal: number;
  changeAmount: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ProcessResponse {
  success: boolean;
  message: string;
  date: string;
  sourceFile: string;
  outputFile: string;
  recordCount: number;
  summary: {
    totalCost: number;
    avgDailyCost: number;
    projectCount: number;
    weekComparison?: ComparisonData;
    monthComparison?: ComparisonData;
  };
  processedAt: string;
}

export interface LogstoreSummary {
  projectId: string;
  projectName: string;
  logstore: string;
  totalCost: number;
  weekComparison?: {
    lastPeriodTotal: number;
    changeAmount: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  } | null;
  monthComparison?: {
    lastPeriodTotal: number;
    changeAmount: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  } | null;
}
