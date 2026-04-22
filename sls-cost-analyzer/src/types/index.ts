// SLS 日志费用分析类型定义

export interface CostRecord {
  date: string;
  projectId: string;
  projectName: string;
  totalCost: number;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  totalCost: number;
  logstoreCount?: number;
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

export interface CostAnalysis {
  dailyCosts: CostRecord[];
  projectSummaries: ProjectSummary[];
  logstoreSummaries?: LogstoreSummary[];
  totalCost: number;
  avgDailyCost: number;
  maxDailyCost: number;
  isWorkday?: boolean;
  workdayReason?: string;
  // 对比数据（后端返回）
  weekComparison?: {
    lastPeriodTotal: number;
    changeAmount: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  };
  monthComparison?: {
    lastPeriodTotal: number;
    changeAmount: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface FilterOptions {
  dateRange: [string, string];
  projectIds: string[];
  minCost?: number;
}
