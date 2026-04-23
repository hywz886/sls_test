import type { CostAnalysis, LogstoreSummary } from '../../types';

export interface DashboardData {
  data: CostAnalysis | null;
  availableDates: string[];
  selectedDate: string;
  trendDateRange: [string, string] | null;
  selectedLogstore: string | null;
  loading: boolean;
}

export interface ControlBarProps {
  availableDates: string[];
  selectedDate: string;
  totalCost?: number;
  logstoreSummaries?: LogstoreSummary[];
  onDateChange: (date: string) => void;
  onLogstoreChange: (logstore: string | null) => void;
}

export interface StatCardsProps {
  totalCost?: number;
  projectCount?: number;
  logstoreCount?: number;
  avgDailyCost?: number;
  // 新卡片数据
  todayCost?: number;
  monthToDateCost?: number;
  dayComparison?: {
    currentDay: number;
    lastDay: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  };
  weekComparison?: {
    currentWeek: number;
    lastWeek: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  };
  monthComparison?: {
    currentMonth: number;
    lastMonth: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface ChartsProps {
  data: CostAnalysis | null;
  trendDateRange: [string, string] | null;
  selectedLogstore: string | null;
  availableDates: string[];
  selectedDate: string;
}

export interface DataTableProps {
  data: CostAnalysis | null;
  loading: boolean;
  availableDates?: string[];
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}
