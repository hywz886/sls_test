import type { CostRecord, ProjectSummary, CostAnalysis, FilterOptions } from './types';

// SLS 项目配置
const projects = [
  { id: 'proj-001', name: '生产环境日志' },
  { id: 'proj-002', name: '测试环境日志' },
  { id: 'proj-003', name: '用户行为日志' },
  { id: 'proj-004', name: 'API 访问日志' },
  { id: 'proj-005', name: '系统监控日志' },
];

// SLS 计费标准（元/GB）
const PRICING = {
  read: 0.08,      // 读取流量
  write: 0.06,     // 写入流量
  index: 0.1,      // 索引流量
  storage: 0.005,  // 存储（元/GB/天）
};

// 生成随机数
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// 生成日期范围
const generateDates = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

// 生成模拟数据
export const generateData = (filters: FilterOptions): CostAnalysis => {
  const { startDate, endDate, projectIds } = filters;
  const dates = generateDates(startDate, endDate);
  const dailyCosts: CostRecord[] = [];
  const projectMap = new Map<string, ProjectSummary>();

  // 筛选项目
  const selectedProjects = projectIds 
    ? projects.filter(p => projectIds.includes(p.id))
    : projects;

  // 初始化项目汇总
  selectedProjects.forEach((proj) => {
    projectMap.set(proj.id, {
      projectId: proj.id,
      projectName: proj.name,
      totalCost: 0,
      readTraffic: 0,
      writeTraffic: 0,
      indexedTraffic: 0,
      storageSize: 0,
      trend: [],
    });
  });

  // 生成每日数据
  dates.forEach((date) => {
    selectedProjects.forEach((proj) => {
      // 生成随机流量数据（带一些波动）
      const dayOfWeek = new Date(date).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const weekendMultiplier = isWeekend ? 0.6 : 1.0; // 周末流量较少

      const readTraffic = random(10, 500) * weekendMultiplier;
      const writeTraffic = random(50, 2000) * weekendMultiplier;
      const indexedTraffic = random(20, 800) * weekendMultiplier;
      const storageSize = random(100, 5000);

      // 计算费用
      const readCost = readTraffic * PRICING.read;
      const writeCost = writeTraffic * PRICING.write;
      const indexCost = indexedTraffic * PRICING.index;
      const storageCost = storageSize * PRICING.storage;
      const totalCost = readCost + writeCost + indexCost + storageCost;

      const record: CostRecord = {
        date,
        projectId: proj.id,
        projectName: proj.name,
        readTraffic: Number(readTraffic.toFixed(2)),
        writeTraffic: Number(writeTraffic.toFixed(2)),
        indexedTraffic: Number(indexedTraffic.toFixed(2)),
        storageSize: Number(storageSize.toFixed(2)),
        readCost: Number(readCost.toFixed(2)),
        writeCost: Number(writeCost.toFixed(2)),
        indexCost: Number(indexCost.toFixed(2)),
        storageCost: Number(storageCost.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
      };

      dailyCosts.push(record);

      // 更新项目汇总
      const summary = projectMap.get(proj.id)!;
      summary.totalCost += totalCost;
      summary.readTraffic += readTraffic;
      summary.writeTraffic += writeTraffic;
      summary.indexedTraffic += indexedTraffic;
      summary.storageSize += storageSize;
    });
  });

  // 计算项目趋势（最近 7 天）
  const last7Days = dates.slice(-7);
  selectedProjects.forEach((proj) => {
    const summary = projectMap.get(proj.id)!;
    summary.trend = last7Days.map((date) => {
      const dayRecords = dailyCosts.filter(
        (r) => r.date === date && r.projectId === proj.id
      );
      return dayRecords.reduce((sum, r) => sum + r.totalCost, 0);
    });
  });

  // 计算总体统计
  const totalCost = dailyCosts.reduce((sum, r) => sum + r.totalCost, 0);
  const avgDailyCost = dates.length > 0 ? totalCost / dates.length : 0;
  const maxDailyCost = dates.length > 0 ? Math.max(
    ...dates.map((date) =>
      dailyCosts
        .filter((r) => r.date === date)
        .reduce((sum, r) => sum + r.totalCost, 0)
    )
  ) : 0;

  const costByCategory = {
    read: dailyCosts.reduce((sum, r) => sum + r.readCost, 0),
    write: dailyCosts.reduce((sum, r) => sum + r.writeCost, 0),
    index: dailyCosts.reduce((sum, r) => sum + r.indexCost, 0),
    storage: dailyCosts.reduce((sum, r) => sum + r.storageCost, 0),
  };

  return {
    dailyCosts,
    projectSummaries: Array.from(projectMap.values()),
    totalCost: Number(totalCost.toFixed(2)),
    avgDailyCost: Number(avgDailyCost.toFixed(2)),
    maxDailyCost: Number(maxDailyCost.toFixed(2)),
    costByCategory: {
      read: Number(costByCategory.read.toFixed(2)),
      write: Number(costByCategory.write.toFixed(2)),
      index: Number(costByCategory.index.toFixed(2)),
      storage: Number(costByCategory.storage.toFixed(2)),
    },
  };
};

// 获取所有项目列表
export const getProjects = () => projects;
