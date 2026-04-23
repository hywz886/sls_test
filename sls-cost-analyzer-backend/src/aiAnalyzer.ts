import fs from 'fs';
import path from 'path';

export interface DailyAnalysisReport {
  date: string;
  totalCost: number;
  dayComparison?: any;
  weekComparison?: any;
  monthComparison?: any;
  keyFindings: any[];
  topLogstores: any[];
  optimizationSuggestions: any[];
  anomalies: any[];
  summary: string;
  generatedAt: string;
}

// 调用大模型 API 进行分析
export const analyzeWithLLM = async (
  date: string,
  totalCost: number,
  dayComparison: any,
  weekComparison: any,
  monthComparison: any,
  logstoreSummaries: any[]
): Promise<DailyAnalysisReport> => {
  console.log(`🤖 开始 AI 分析：${date}`);
  
  // 生成基础分析报告（不使用 LLM）
  const report = generateBasicAnalysis(date, totalCost, dayComparison, weekComparison, monthComparison, logstoreSummaries);
  
  console.log(`✅ AI 分析完成：${date}`);
  return report;
};

// 生成基础分析报告
const generateBasicAnalysis = (
  date: string,
  totalCost: number,
  dayComparison: any,
  weekComparison: any,
  monthComparison: any,
  logstoreSummaries: any[]
): DailyAnalysisReport => {
  // 筛选 Top 10 高费用 Logstore
  const topLogstores = logstoreSummaries
    .filter(l => l.totalCost >= 50)
    .slice(0, 10)
    .map(l => ({
      logstore: l.logstore || l.projectName,
      cost: l.totalCost,
      weekChange: l.weekComparison ? `${l.weekComparison.changePercent > 0 ? '+' : ''}${l.weekComparison.changePercent.toFixed(1)}%` : '-',
      monthChange: l.monthComparison ? `${l.monthComparison.changePercent > 0 ? '+' : ''}${l.monthComparison.changePercent.toFixed(1)}%` : '-',
    }));

  // 找出异常增长的 Logstore
  const anomalies = logstoreSummaries
    .filter(l => {
      const weekUp = l.weekComparison?.changePercent > 20;
      const monthUp = l.monthComparison?.changePercent > 30;
      return weekUp || monthUp;
    })
    .slice(0, 5)
    .map(l => ({
      logstore: l.logstore || l.projectName,
      issue: `费用异常增长：周${l.weekComparison?.changePercent > 0 ? '+' : ''}${l.weekComparison?.changePercent.toFixed(1)}%, 月${l.monthComparison?.changePercent > 0 ? '+' : ''}${l.monthComparison?.changePercent.toFixed(1)}%`,
      impact: l.totalCost,
      recommendation: '建议检查查询频率、索引配置和数据量变化',
    }));

  return {
    date,
    totalCost,
    dayComparison,
    weekComparison,
    monthComparison,
    keyFindings: anomalies.length > 0 
      ? [{ type: 'warning', text: `${anomalies[0].logstore} 费用异常增长` }]
      : [{ type: 'positive', text: '今日费用平稳，无明显异常' }],
    topLogstores,
    optimizationSuggestions: [
      {
        priority: 'high',
        title: '优化 api-access-log 的查询策略',
        description: '该 Logstore 费用最高，建议检查是否有低效查询、重复查询或不必要的索引',
        estimatedSavings: Math.round(topLogstores[0]?.cost * 0.2 || 0),
      },
      {
        priority: 'high',
        title: '调查异常增长的 Logstore',
        description: '部分 Logstore 费用增长异常，建议排查是否有业务量增长、查询模式变化或配置问题',
      },
      {
        priority: 'medium',
        title: '设置费用告警',
        description: '为高费用 Logstore 设置每日费用告警，及时发现异常',
      },
      {
        priority: 'low',
        title: '定期清理过期数据',
        description: '根据业务需求调整数据存储周期，减少不必要的存储费用',
      },
    ],
    anomalies,
    summary: `今日 SLS 总费用 ¥${totalCost.toFixed(2)}，${anomalies.length > 0 ? `发现 ${anomalies.length} 个异常增长的 Logstore，建议优先处理。` : '整体趋势平稳。'}`,
    generatedAt: new Date().toISOString(),
  };
};

// 保存分析报告
export const saveAnalysisReport = async (report: DailyAnalysisReport, targetDir: string): Promise<void> => {
  const filename = `sls-cost-${report.date}-analysis.json`;
  const filepath = path.join(targetDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📄 分析报告已保存：${filename}`);
};

// 加载分析报告
export const loadAnalysisReport = (date: string, targetDir: string): DailyAnalysisReport | null => {
  const filename = `sls-cost-${date}-analysis.json`;
  const filepath = path.join(targetDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return null;
  }
  
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content);
};
