import express from 'express';
import cors from 'cors';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { getProjects } from './data';
import type { FilterOptions, CostRecord, ProcessRequest, ProcessResponse, ComparisonData } from './types';
import { watch } from 'fs';

// 节假日数据缓存
let holidayCache: {
  data: Record<string, { date: string; isWorkday: boolean; type?: string; name?: string }>;
  lastFetch: Date | null;
} = {
  data: {},
  lastFetch: null,
};

// 获取中国节假日数据（调用免费 API）
const fetchChineseHolidays = async (year: number): Promise<Record<string, { date: string; isWorkday: boolean; type?: string; name?: string }>> => {
  return new Promise((resolve, reject) => {
    const url = `https://wangzhijie.top/api/holiday?year=${year}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const holidays: Record<string, { date: string; isWorkday: boolean; type?: string; name?: string }> = {};
          
          if (result.code === 0 && result.data) {
            result.data.forEach((item: any) => {
              holidays[item.date] = {
                date: item.date,
                isWorkday: item.isWorkday,
                type: item.type,
                name: item.name,
              };
            });
          }
          resolve(holidays);
        } catch (error) {
          console.error('Error parsing holiday API response:', error);
          resolve({});
        }
      });
    }).on('error', (error) => {
      console.error('Error fetching holidays:', error);
      resolve({});
    });
  });
};

// 判断是否为工作日
const isWorkday = async (date: string): Promise<{
  isWorkday: boolean;
  reason?: string;
  type?: string;
}> => {
  const year = parseInt(date.split('-')[0]);
  
  // 检查缓存
  if (!holidayCache.data || !holidayCache.lastFetch || 
      dayjs().diff(dayjs(holidayCache.lastFetch), 'hour') > 24) {
    // 缓存过期或不存在，重新获取
    holidayCache.data = {};
    holidayCache.lastFetch = new Date();
    
    // 获取当年和下一年的数据
    const currentYearData = await fetchChineseHolidays(year);
    const nextYearData = await fetchChineseHolidays(year + 1);
    holidayCache.data = { ...currentYearData, ...nextYearData };
  }
  
  const holidayInfo = holidayCache.data[date];
  
  if (holidayInfo) {
    return {
      isWorkday: holidayInfo.isWorkday,
      reason: holidayInfo.name,
      type: holidayInfo.type,
    };
  }
  
  // 没有特殊安排，按正常周末判断
  const dayOfWeek = dayjs(date).day();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  return {
    isWorkday: !isWeekend,
    reason: isWeekend ? '周末' : '正常工作日',
  };
};

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = '/opt/data'; // 目标数据目录（前端读取）
const SOURCE_DIR = '/root/.openclaw/workspace/data'; // 源数据目录（定时任务生成）

// 确保数据目录存在
[DATA_DIR, SOURCE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 提供静态文件服务（让前端直接读取 CSV/JSON 文件）
app.use('/data', express.static(DATA_DIR));

// CSV 解析函数（支持标准格式）
const parseCSV = (csvText: string): CostRecord[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const record: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      const numValue = parseFloat(value);
      record[header.trim()] = isNaN(numValue) ? value.trim() : numValue;
    });
    
    return record as CostRecord;
  });
};

// 解析 SLS 账单格式（Project, Logstore, 费用 (元)）
interface SLSBillRecord {
  project: string;
  logstore: string;
  cost: number;
}

const parseSLSBill = (csvText: string): SLSBillRecord[] => {
  const lines = csvText.trim().split('\n');
  // 跳过 BOM 和标题行
  const startIndex = lines[0].includes('Project') ? 1 : (lines[1]?.includes('Project') ? 2 : 1);
  
  return lines.slice(startIndex).map(line => {
    // 处理带引号的 CSV 格式
    const matches = line.match(/"([^"]*)","([^"]*)","([^"]*)"/);
    if (matches) {
      return {
        project: matches[1],
        logstore: matches[2],
        cost: parseFloat(matches[3]) || 0,
      };
    }
    return null;
  }).filter((r): r is SLSBillRecord => r !== null);
};

// Logstore 级别的数据结构
interface LogstoreData {
  projectId: string;
  projectName: string;
  logstore: string;
  totalCost: number;
}

// 计算对比数据（周对比、月对比）
const calculateComparison = (
  currentTotal: number,
  compareTotal: number
): {
  lastPeriodTotal: number;
  changeAmount: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
} => {
  const changeAmount = currentTotal - compareTotal;
  const changePercent = compareTotal > 0 ? (changeAmount / compareTotal) * 100 : 0;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (changeAmount > 0) trend = 'up';
  else if (changeAmount < 0) trend = 'down';
  
  return {
    lastPeriodTotal: Number(compareTotal.toFixed(2)),
    changeAmount: Number(changeAmount.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    trend,
  };
};

// 读取历史数据文件（Logstore 级别）
const loadHistoricalData = (targetDir: string): Map<string, { date: string; totalCost: number; logstoreCosts: Map<string, number>; isWorkday?: boolean }> => {
  const historicalData = new Map<string, { date: string; totalCost: number; logstoreCosts: Map<string, number>; isWorkday?: boolean }>();
  
  try {
    const files = fs.readdirSync(targetDir)
      .filter(f => f.startsWith('sls-cost-') && f.endsWith('.json'))
      .sort();
    
    for (const file of files) {
      const filepath = path.join(targetDir, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      const data = JSON.parse(content);
      
      const date = data.sourceDate;
      if (!date) continue;
      
      const logstoreCosts = new Map<string, number>();
      if (data.summary?.projectSummaries) {
        data.summary.projectSummaries.forEach((p: any) => {
          // 使用 projectId + logstore 作为 key
          const key = `${p.projectId}::${p.logstore || p.projectName}`;
          logstoreCosts.set(key, p.totalCost);
        });
      }
      
      historicalData.set(date, {
        date,
        totalCost: data.summary?.totalCost || 0,
        logstoreCosts,
        isWorkday: data.isWorkday, // 保存工作日标记
      });
    }
  } catch (error) {
    console.error('Error loading historical data:', error);
  }
  
  return historicalData;
};

// 获取上周同日数据（旧逻辑，保留兼容）
const getLastWeekData = (
  historicalData: Map<string, { date: string; totalCost: number; logstoreCosts: Map<string, number>; isWorkday?: boolean }>,
  currentDate: string
): { date: string; totalCost: number; logstoreCosts: Map<string, number>; isWorkday?: boolean } | null => {
  const lastWeekDate = dayjs(currentDate).subtract(7, 'day').format('YYYY-MM-DD');
  return historicalData.get(lastWeekDate) || null;
};

// 获取上月同日数据（旧逻辑，保留兼容）
const getLastMonthData = (
  historicalData: Map<string, { date: string; totalCost: number; logstoreCosts: Map<string, number>; isWorkday?: boolean }>,
  currentDate: string
): { date: string; totalCost: number; logstoreCosts: Map<string, number>; isWorkday?: boolean } | null => {
  const lastMonthDate = dayjs(currentDate).subtract(1, 'month').format('YYYY-MM-DD');
  return historicalData.get(lastMonthDate) || null;
};

// 获取前 N 个同类型日期（工作日/非工作日）的平均费用
const getAverageCostByWorkdayType = async (
  historicalData: Map<string, { date: string; totalCost: number; logstoreCosts: Map<string, number>; isWorkday?: boolean }>,
  currentDate: string,
  targetCount: number,
  isCurrentWorkday: boolean
): Promise<{
  avgTotalCost: number;
  avgLogstoreCosts: Map<string, number>;
  matchedDates: string[];
} | null> => {
  const matchedDates: string[] = [];
  const matchedData: Array<{ date: string; totalCost: number; logstoreCosts: Map<string, number>; isWorkday?: boolean }> = [];
  
  // 从当前日期往前遍历
  let current = dayjs(currentDate).subtract(1, 'day');
  const maxDaysToSearch = targetCount * 5; // 最多搜索 5 倍天数（考虑到周末 + 节假日数据缺失）
  
  while (matchedDates.length < targetCount && current.isAfter(dayjs(currentDate).subtract(maxDaysToSearch, 'day'))) {
    const dateStr = current.format('YYYY-MM-DD');
    const dayData = historicalData.get(dateStr);
    
    if (dayData) {
      // 优先使用 JSON 文件中已保存的 isWorkday 字段（避免重复调用 API）
      const savedIsWorkday = dayData.isWorkday;
      
      let isWorkdayType: boolean;
      if (savedIsWorkday !== undefined) {
        // 使用保存的值
        isWorkdayType = savedIsWorkday;
      } else {
        // 备用：调用 API 判断
        const workdayInfo = await isWorkday(dateStr);
        isWorkdayType = workdayInfo.isWorkday;
      }
      
      // 如果同类型（都是工作日或都是非工作日），加入统计
      if (isWorkdayType === isCurrentWorkday) {
        matchedDates.push(dateStr);
        matchedData.push(dayData);
      }
    }
    
    current = current.subtract(1, 'day');
  }
  
  // 如果匹配的日期数量不足目标数量的 50%，认为数据不足，返回 null
  const minRequiredCount = Math.ceil(targetCount * 0.5);
  if (matchedData.length < minRequiredCount) {
    
    return null;
  }
  
  // 计算平均总费用
  const avgTotalCost = matchedData.reduce((sum, d) => sum + d.totalCost, 0) / matchedData.length;
  
  // 计算每个 Logstore 的平均费用
  const avgLogstoreCosts = new Map<string, number>();
  matchedData.forEach(d => {
    d.logstoreCosts.forEach((cost, key) => {
      avgLogstoreCosts.set(key, (avgLogstoreCosts.get(key) || 0) + cost / matchedData.length);
    });
  });
  
  return {
    avgTotalCost,
    avgLogstoreCosts,
    matchedDates,
  };
};

// 将数据转换为 CSV 格式
const convertToCSV = (data: CostRecord[]): string => {
  if (data.length === 0) return '';
  
  const headers = [
    'date',
    'projectId',
    'projectName',
    'readTraffic',
    'writeTraffic',
    'indexedTraffic',
    'storageSize',
    'readCost',
    'writeCost',
    'indexCost',
    'storageCost',
    'totalCost'
  ];
  
  const rows = data.map(record => 
    headers.map(header => {
      const value = (record as any)[header];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
};

// 处理 CSV 文件并生成汇总统计
const processCSVFile = (csvFilename: string) => {
  const csvFilepath = path.join(DATA_DIR, csvFilename);
  
  if (!fs.existsSync(csvFilepath)) {
    throw new Error(`文件不存在：${csvFilename}`);
  }
  
  
  const csvContent = fs.readFileSync(csvFilepath, 'utf-8');
  const dailyCosts = parseCSV(csvContent);
  
  // 提取日期
  const today = dayjs().format('YYYY-MM-DD');
  const dateMatch = csvFilename.match(/sls-cost-(\d{4}-\d{2}-\d{2})\.csv/);
  const fileDate = dateMatch ? dateMatch[1] : today;
  
  // 计算汇总统计
  const projectMap = new Map<string, any>();
  dailyCosts.forEach(record => {
    if (!projectMap.has(record.projectId)) {
      projectMap.set(record.projectId, {
        projectId: record.projectId,
        projectName: record.projectName,
        totalCost: 0,
        readTraffic: 0,
        writeTraffic: 0,
        indexedTraffic: 0,
        storageSize: 0,
        trend: [],
      });
    }
    const summary = projectMap.get(record.projectId)!;
    summary.totalCost += (record.totalCost || 0);
    summary.readTraffic += (record.readTraffic || 0);
    summary.writeTraffic += (record.writeTraffic || 0);
    summary.indexedTraffic += (record.indexedTraffic || 0);
    summary.storageSize += (record.storageSize || 0);
  });
  
  const dates = Array.from(new Set(dailyCosts.map(r => r.date))).sort();
  const last7Days = dates.slice(-7);
  projectMap.forEach((summary, projectId) => {
    summary.trend = last7Days.map(date => {
      const dayRecords = dailyCosts.filter(r => r.date === date && r.projectId === projectId);
      return dayRecords.reduce((sum: number, r: CostRecord) => sum + r.totalCost, 0);
    });
  });
  
  const totalCost = dailyCosts.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const avgDailyCost = dates.length > 0 ? totalCost / dates.length : 0;
  const maxDailyCost = Math.max(
    ...dates.map(date =>
      dailyCosts
        .filter(r => r.date === date)
        .reduce((sum, r) => sum + (r.totalCost || 0), 0)
    )
  );
  
  const costByCategory = {
    read: dailyCosts.reduce((sum, r) => sum + (r.readCost || 0), 0),
    write: dailyCosts.reduce((sum, r) => sum + (r.writeCost || 0), 0),
    index: dailyCosts.reduce((sum, r) => sum + (r.indexCost || 0), 0),
    storage: dailyCosts.reduce((sum, r) => sum + (r.storageCost || 0), 0),
  };
  
  // 保存 JSON 汇总
  const jsonFilename = csvFilename.replace('.csv', '.json');
  const jsonFilepath = path.join(DATA_DIR, jsonFilename);
  const jsonData = {
    generatedAt: new Date().toISOString(),
    source: 'csv-processed',
    csvFile: csvFilename,
    summary: {
      totalCost: Number(totalCost.toFixed(2)),
      avgDailyCost: Number(avgDailyCost.toFixed(2)),
      maxDailyCost: Number(maxDailyCost.toFixed(2)),
      costByCategory: {
        read: Number(costByCategory.read.toFixed(2)),
        write: Number(costByCategory.write.toFixed(2)),
        index: Number(costByCategory.index.toFixed(2)),
        storage: Number(costByCategory.storage.toFixed(2)),
      },
      projectSummaries: Array.from(projectMap.values()),
    },
  };
  fs.writeFileSync(jsonFilepath, JSON.stringify(jsonData, null, 2), 'utf-8');
  
  
  
  return {
    csvFilename,
    jsonFilename,
    recordCount: dailyCosts.length,
    summary: jsonData.summary,
  };
};

// API 路由

// 📥 处理每日数据（定时任务调用）
app.post('/api/process/daily', (req, res) => {
  try {
    const { date, sourceDir = SOURCE_DIR, targetDir = DATA_DIR } = req.body as ProcessRequest;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数：date',
        hint: '请传入日期，格式：YYYY-MM-DD，例如：2026-04-16',
      });
    }
    
    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: '日期格式错误',
        hint: '请使用 YYYY-MM-DD 格式，例如：2026-04-16',
      });
    }
    
    
    
    // 构建源文件名（支持两种格式：sls-cost-YYYY-MM-DD.csv 或 sls_bill_YYYYMMDD.csv）
    const sourceFilename = `sls-cost-${date}.csv`;
    const sourceFilepath = path.join(sourceDir, sourceFilename);
    
    // 检查源文件是否存在
    if (!fs.existsSync(sourceFilepath)) {
      // 尝试备用格式：sls_bill_YYYYMMDD.csv
      const altDate = date.replace(/-/g, '');
      const altFilename = `sls_bill_${altDate}.csv`;
      const altFilepath = path.join(sourceDir, altFilename);
      
      if (fs.existsSync(altFilepath)) {
        
        return processDailyData(altFilepath, date, targetDir)
          .then(result => {
            res.json({
              success: true,
              message: '文件已处理完成',
              date,
              sourceFile: altFilename,
              outputFile: result.outputFilename,
              recordCount: result.recordCount,
              summary: result.summary,
              processedAt: new Date().toISOString(),
            });
          })
          .catch(error => {
            console.error('Error processing file:', error);
            res.status(500).json({
              success: false,
              error: '处理文件失败',
              details: error instanceof Error ? error.message : '未知错误',
            });
          });
      }
      
      return res.status(404).json({
        success: false,
        error: `源文件不存在：${sourceFilename}`,
        hint: `请确认定时任务已将 CSV 文件保存到 ${sourceDir} 目录`,
        searchedFiles: [sourceFilename, altFilename],
      });
    }
    
    // 处理 CSV 文件
    processDailyData(sourceFilepath, date, targetDir)
      .then(result => {
        res.json({
          success: true,
          message: '文件已处理完成',
          date,
          sourceFile: sourceFilename,
          outputFile: result.outputFilename,
          recordCount: result.recordCount,
          summary: result.summary,
          processedAt: new Date().toISOString(),
        });
      })
      .catch(error => {
        console.error('Error processing file:', error);
        res.status(500).json({
          success: false,
          error: '处理文件失败',
          details: error instanceof Error ? error.message : '未知错误',
        });
      });
      
  } catch (error) {
    console.error('Error in /api/process/daily:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : '未知错误',
    });
  }
});

// 处理每日数据的函数（Logstore 级别）
const processDailyData = async (
  sourceFilepath: string,
  date: string,
  targetDir: string
): Promise<{
  outputFilename: string;
  recordCount: number;
  summary: {
    totalCost: number;
    avgDailyCost: number;
    projectCount: number;
    weekComparison?: any;
    monthComparison?: any;
  };
}> => {
  
  const csvContent = fs.readFileSync(sourceFilepath, 'utf-8');
  
  // 检测文件格式
  const isStandardFormat = csvContent.includes('date,projectId,projectName');
  
  let totalCost = 0;
  let logstoreMap = new Map<string, LogstoreData>();
  let recordCount = 0;
  
  if (isStandardFormat) {
    // 标准格式：date,projectId,projectName,...
    const dailyCosts = parseCSV(csvContent);
    recordCount = dailyCosts.length;
    
    dailyCosts.forEach(record => {
      const key = `${record.projectId}::${record.projectName}`;
      if (!logstoreMap.has(key)) {
        logstoreMap.set(key, {
          projectId: record.projectId,
          projectName: record.projectName,
          logstore: record.projectName,
          totalCost: 0,
        });
      }
      const summary = logstoreMap.get(key)!;
      summary.totalCost += (record.totalCost || 0);
    });
    
    totalCost = dailyCosts.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  } else {
    // SLS 账单格式：Project, Logstore, 费用 (元) - 按 Logstore 级别聚合
    const billRecords = parseSLSBill(csvContent);
    recordCount = billRecords.length;
    
    billRecords.forEach(record => {
      // 使用 project + logstore 作为唯一 key
      const key = `${record.project}::${record.logstore}`;
      if (!logstoreMap.has(key)) {
        logstoreMap.set(key, {
          projectId: record.project,
          projectName: record.project,
          logstore: record.logstore,
          totalCost: 0,
        });
      }
      const summary = logstoreMap.get(key)!;
      summary.totalCost += record.cost;
    });
    
    totalCost = billRecords.reduce((sum, r) => sum + r.cost, 0);
  }
  
  // 加载历史数据用于对比
  
  const historicalData = loadHistoricalData(targetDir);
  
  // 判断当前日期是否为工作日
  const currentWorkdayInfo = await isWorkday(date);
  const isCurrentWorkday = currentWorkdayInfo.isWorkday;
  
  
  // 计算周对比（前 7 个同类型日期的平均）和月对比（前 30 个同类型日期的平均）
  const weekAvgResult = await getAverageCostByWorkdayType(historicalData, date, 7, isCurrentWorkday);
  const monthAvgResult = await getAverageCostByWorkdayType(historicalData, date, 30, isCurrentWorkday);
  
  let weekComparison = null;
  let monthComparison = null;
  
  if (weekAvgResult) {
    weekComparison = calculateComparison(totalCost, weekAvgResult.avgTotalCost);
    
  }
  
  if (monthAvgResult) {
    monthComparison = calculateComparison(totalCost, monthAvgResult.avgTotalCost);
    
  }
  
  // 保存 CSV 到目标目录（保持原始数据）
  const outputCsvFilename = `sls-cost-${date}.csv`;
  const outputCsvFilepath = path.join(targetDir, outputCsvFilename);
  fs.writeFileSync(outputCsvFilepath, csvContent, 'utf-8');
  
  
  // 生成并保存 JSON 汇总（Logstore 级别，过滤 10 元以下）
  const outputJsonFilename = `sls-cost-${date}.json`;
  const outputJsonFilepath = path.join(targetDir, outputJsonFilename);
  
  // 为每个 Logstore 添加对比数据（过滤 10 元以下）
  const logstoreSummariesWithComparison = Array.from(logstoreMap.values()).map((item: LogstoreData) => {
    const logstoreData: any = {
      projectId: item.projectId,
      projectName: item.projectName,
      logstore: item.logstore,
      totalCost: Number(item.totalCost.toFixed(2)),
    };
    
    // 只有费用 >= 10 元的 Logstore 才计算对比
    if (item.totalCost >= 10) {
      const key = `${item.projectId}::${item.logstore}`;
      
      // 添加 Logstore 级别的周对比（基于前 7 个同类型日期的平均）
      if (weekAvgResult?.avgLogstoreCosts?.has(key)) {
        const weekAvgCost = weekAvgResult.avgLogstoreCosts.get(key)!;
        logstoreData.weekComparison = calculateComparison(item.totalCost, weekAvgCost);
      } else {
        logstoreData.weekComparison = null;
      }
      
      // 添加 Logstore 级别的月对比（基于前 30 个同类型日期的平均）
      if (monthAvgResult?.avgLogstoreCosts?.has(key)) {
        const monthAvgCost = monthAvgResult.avgLogstoreCosts.get(key)!;
        logstoreData.monthComparison = calculateComparison(item.totalCost, monthAvgCost);
      } else {
        logstoreData.monthComparison = null;
      }
    } else {
      // 10 元以下的 Logstore，对比数据显示为 null（前端显示为 -）
      logstoreData.weekComparison = null;
      logstoreData.monthComparison = null;
    }
    
    return logstoreData;
  });
  
  // 按费用降序排序
  logstoreSummariesWithComparison.sort((a, b) => b.totalCost - a.totalCost);
  
  // 判断是否为工作日
  const workdayInfo = await isWorkday(date);
  
  const jsonData = {
    generatedAt: new Date().toISOString(),
    sourceDate: date,
    format: isStandardFormat ? 'standard' : 'sls-bill',
    isWorkday: workdayInfo.isWorkday,
    workdayReason: workdayInfo.reason,
    summary: {
      totalCost: Number(totalCost.toFixed(2)),
      avgDailyCost: Number(totalCost.toFixed(2)),
      maxDailyCost: Number(totalCost.toFixed(2)),
      weekComparison,
      monthComparison,
      projectSummaries: logstoreSummariesWithComparison,
    },
  };
  fs.writeFileSync(outputJsonFilepath, JSON.stringify(jsonData, null, 2), 'utf-8');
  
  
  return {
    outputFilename: outputCsvFilename,
    recordCount,
    summary: {
      totalCost: Number(totalCost.toFixed(2)),
      avgDailyCost: Number(totalCost.toFixed(2)),
      projectCount: logstoreMap.size,
      weekComparison,
      monthComparison,
    },
  };
};

// 📥 接收定时任务通知（处理文件）- 保留旧接口兼容
app.post('/api/webhook/process', (req, res) => {
  try {
    const { filename, date } = req.body;
    
    // 如果没有指定文件名，使用今天的日期
    const targetDate = date || dayjs().format('YYYY-MM-DD');
    const targetFilename = filename || `sls-cost-${targetDate}.csv`;
    
    
    
    // 检查文件是否存在
    const csvFilepath = path.join(DATA_DIR, targetFilename);
    if (!fs.existsSync(csvFilepath)) {
      return res.status(404).json({
        success: false,
        error: `文件不存在：${targetFilename}`,
        hint: '请确认定时任务已将 CSV 文件保存到 /opt/data/ 目录',
      });
    }
    
    // 处理 CSV 文件
    const result = processCSVFile(targetFilename);
    
    res.json({
      success: true,
      message: '文件已处理完成',
      csvFile: result.csvFilename,
      jsonFile: result.jsonFilename,
      recordCount: result.recordCount,
      summary: {
        totalCost: result.summary.totalCost,
        avgDailyCost: result.summary.avgDailyCost,
        projectCount: result.summary.projectSummaries.length,
      },
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({
      success: false,
      error: '处理文件失败',
      details: error instanceof Error ? error.message : '未知错误',
    });
  }
});

// 获取文件列表
app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => f.startsWith('sls-cost-'))
      .map(f => {
        const date = f.replace('sls-cost-', '').replace('.csv', '').replace('.json', '');
        const stats = fs.statSync(path.join(DATA_DIR, f));
        return {
          filename: f,
          date,
          type: f.endsWith('.csv') ? 'csv' : 'json',
          createdAt: stats.birthtime,
          size: stats.size,
        };
      })
      .sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return a.type.localeCompare(b.type);
      });
    
    res.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: '获取文件列表失败',
    });
  }
});

// 📊 实时查询费用数据（支持日期范围）
app.get('/api/query', async (req, res) => {
  try {
    const { startDate, endDate, project, logstore } = req.query as { 
      startDate?: string; 
      endDate?: string;
      project?: string;
      logstore?: string;
    };
    
    console.log(`📊 实时查询：${startDate || 'all'} ~ ${endDate || 'all'}`);
    
    // 读取所有 JSON 数据文件
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => f.startsWith('sls-cost-') && f.endsWith('.json'))
      .sort();
    
    const allRecords: any[] = [];
    const dailyCosts: Array<{ date: string; totalCost: number }> = [];
    
    for (const file of files) {
      const filepath = path.join(DATA_DIR, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      const data = JSON.parse(content);
      
      const date = data.sourceDate;
      if (!date) continue;
      
      // 日期范围过滤
      if (startDate && date < startDate) continue;
      if (endDate && date > endDate) continue;
      
      // 提取 Logstore 级别的数据（包含对比数据）
      let dailyTotal = 0;
      if (data.summary?.projectSummaries) {
        data.summary.projectSummaries.forEach((p: any) => {
          // 项目过滤
          if (project && p.projectId !== project) return;
          // Logstore 过滤
          if (logstore && p.logstore !== logstore) return;
          
          allRecords.push({
            date,
            projectId: p.projectId,
            projectName: p.projectName || p.projectId,
            logstore: p.logstore || '-',
            totalCost: p.totalCost,
            weekComparison: p.weekComparison || null,
            monthComparison: p.monthComparison || null,
          });
          dailyTotal += p.totalCost;
        });
      }
      
      // 添加每日费用（如果有 logstore 过滤，则是该 Logstore 的费用；否则是总费用）
      if (logstore || project) {
        // 有过滤条件时，使用过滤后的汇总
        if (dailyTotal > 0) {
          dailyCosts.push({ date, totalCost: dailyTotal });
        }
      } else {
        // 无过滤条件时，使用总费用
        dailyCosts.push({
          date,
          totalCost: data.summary?.totalCost || 0,
        });
      }
    }
    
    // 按日期排序
    dailyCosts.sort((a, b) => a.date.localeCompare(b.date));
    
    // 计算汇总
    const totalCost = dailyCosts.reduce((sum, d) => sum + d.totalCost, 0);
    const avgDailyCost = dailyCosts.length > 0 ? totalCost / dailyCosts.length : 0;
    const maxDailyCost = dailyCosts.length > 0 ? Math.max(...dailyCosts.map(d => d.totalCost)) : 0;
    
    // 按 Logstore 汇总（保留对比数据）
    const logstoreMap = new Map<string, any>();
    allRecords.forEach(r => {
      const key = `${r.projectId}::${r.logstore}`;
      if (!logstoreMap.has(key)) {
        logstoreMap.set(key, {
          projectId: r.projectId,
          projectName: r.projectName,
          logstore: r.logstore,
          totalCost: 0,
          weekComparison: r.weekComparison || null,
          monthComparison: r.monthComparison || null,
        });
      }
      const item = logstoreMap.get(key);
      item.totalCost += r.totalCost;
      // 如果是多日查询，对比数据取最新日期的（第一个遇到的）
      if (!item.weekComparison && r.weekComparison) {
        item.weekComparison = r.weekComparison;
      }
      if (!item.monthComparison && r.monthComparison) {
        item.monthComparison = r.monthComparison;
      }
    });
    
    // 获取最新日期的工作日信息
    let isWorkday: boolean | undefined = undefined;
    let workdayReason: string | undefined = undefined;
    if (dailyCosts.length > 0) {
      const latestDate = dailyCosts[dailyCosts.length - 1].date;
      const latestFile = files.find(f => f.includes(latestDate));
      if (latestFile) {
        const latestData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, latestFile), 'utf-8'));
        isWorkday = latestData.isWorkday;
        workdayReason = latestData.workdayReason;
      }
    }
    
    // 如果是单日查询，添加对比数据
    let weekComparison = null;
    let monthComparison = null;
    
    if (dailyCosts.length === 1 && dailyCosts[0].date) {
      const singleDate = dailyCosts[0].date;
      // 加载历史数据计算对比
      const historicalData = loadHistoricalData(DATA_DIR);
      const currentData = historicalData.get(singleDate);
      
      if (currentData) {
        const isCurrentWorkday = isWorkday ?? false;
        
        // 获取前 7 个同类型日期的平均
        const weekAvgResult = await getAverageCostByWorkdayType(historicalData, singleDate, 7, isCurrentWorkday);
        if (weekAvgResult) {
          weekComparison = calculateComparison(totalCost, weekAvgResult.avgTotalCost);
        }
        
        // 获取前 30 个同类型日期的平均
        const monthAvgResult = await getAverageCostByWorkdayType(historicalData, singleDate, 30, isCurrentWorkday);
        if (monthAvgResult) {
          monthComparison = calculateComparison(totalCost, monthAvgResult.avgTotalCost);
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        dailyCosts,
        logstoreSummaries: Array.from(logstoreMap.values()).sort((a, b) => b.totalCost - a.totalCost),
        totalCost: Number(totalCost.toFixed(2)),
        avgDailyCost: Number(avgDailyCost.toFixed(2)),
        maxDailyCost: Number(maxDailyCost.toFixed(2)),
        recordCount: allRecords.length,
        isWorkday,
        workdayReason,
        weekComparison,
        monthComparison,
      },
    });
  } catch (error) {
    console.error('Error querying data:', error);
    res.status(500).json({
      success: false,
      error: '查询失败',
      details: error instanceof Error ? error.message : '未知错误',
    });
  }
});

// 获取项目列表
app.get('/api/projects', (req, res) => {
  try {
    const projects = getProjects();
    res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({
      success: false,
      error: '获取项目列表失败',
    });
  }
});

// 📊 获取费用对比数据（周对比、月对比）
app.get('/api/comparison', (req, res) => {
  try {
    const { date, targetDir = DATA_DIR } = req.query as { date?: string; targetDir?: string };
    
    // 使用传入的日期或今天
    const targetDate = date || dayjs().format('YYYY-MM-DD');
    
    console.log(`📊 获取对比数据：${targetDate}`);
    
    // 加载历史数据
    const historicalData = loadHistoricalData(targetDir);
    
    // 获取当前日期的数据
    const currentData = historicalData.get(targetDate);
    
    if (!currentData) {
      return res.status(404).json({
        success: false,
        error: `未找到日期 ${targetDate} 的数据`,
        hint: '请确保该日期的费用数据已处理',
      });
    }
    
    // 获取上周同日数据
    const lastWeekData = getLastWeekData(historicalData, targetDate);
    const lastMonthData = getLastMonthData(historicalData, targetDate);
    
    // 计算对比
    let weekComparison: ComparisonData | null = null;
    let monthComparison: ComparisonData | null = null;
    
    if (lastWeekData) {
      weekComparison = calculateComparison(currentData.totalCost, lastWeekData.totalCost);
    }
    
    if (lastMonthData) {
      monthComparison = calculateComparison(currentData.totalCost, lastMonthData.totalCost);
    }
    
    res.json({
      success: true,
      date: targetDate,
      currentTotal: Number(currentData.totalCost.toFixed(2)),
      weekComparison,
      monthComparison,
      metadata: {
        lastWeekDate: lastWeekData?.date || null,
        lastMonthDate: lastMonthData?.date || null,
      },
    });
  } catch (error) {
    console.error('Error getting comparison:', error);
    res.status(500).json({
      success: false,
      error: '获取对比数据失败',
      details: error instanceof Error ? error.message : '未知错误',
    });
  }
});

// 📅 获取节假日信息（判断工作日/非工作日）
app.get('/api/holiday', async (req, res) => {
  try {
    const { date, year, month } = req.query as { date?: string; year?: string; month?: string };
    
    // 单个日期查询
    if (date) {
      const result = await isWorkday(date);
      return res.json({
        success: true,
        date,
        isWorkday: result.isWorkday,
        reason: result.reason,
        type: result.type,
      });
    }
    
    // 按年月查询
    if (year && month) {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          error: '无效的年月参数',
          hint: '请使用正确的格式：year=2026&month=4',
        });
      }
      
      // 获取该月所有日期
      const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
      const monthData: any[] = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD');
        const result = await isWorkday(currentDate);
        monthData.push({
          date: currentDate,
          isWorkday: result.isWorkday,
          reason: result.reason,
          type: result.type,
        });
      }
      
      return res.json({
        success: true,
        year: yearNum,
        month: monthNum,
        days: monthData,
        workdays: monthData.filter(d => d.isWorkday).length,
        holidays: monthData.filter(d => !d.isWorkday).length,
      });
    }
    
    // 默认返回当前月份
    const currentYear = dayjs().year();
    const currentMonth = dayjs().month() + 1;
    const result = await isWorkday(dayjs().format('YYYY-MM-DD'));
    
    res.json({
      success: true,
      today: dayjs().format('YYYY-MM-DD'),
      isWorkday: result.isWorkday,
      reason: result.reason,
      type: result.type,
      hint: '可传入 date、year&month 参数查询具体日期或月份',
    });
  } catch (error) {
    console.error('Error getting holiday info:', error);
    res.status(500).json({
      success: false,
      error: '获取节假日信息失败',
      details: error instanceof Error ? error.message : '未知错误',
    });
  }
});

// 🔄 批量重新处理指定日期范围的数据
app.post('/api/reprocess', async (req, res) => {
  try {
    const { startDate, endDate, targetDir = DATA_DIR } = req.body as { 
      startDate?: string; 
      endDate?: string;
      targetDir?: string;
    };
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数：startDate 和 endDate',
        hint: '请传入日期范围，格式：YYYY-MM-DD，例如：{"startDate": "2026-04-01", "endDate": "2026-04-20"}',
      });
    }
    
    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        error: '日期格式错误',
        hint: '请使用 YYYY-MM-DD 格式',
      });
    }
    
    console.log(`🔄 开始批量重新处理：${startDate} ~ ${endDate}`);
    
    // 生成日期范围
    const dates: string[] = [];
    let current = dayjs(startDate);
    const end = dayjs(endDate);
    
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      dates.push(current.format('YYYY-MM-DD'));
      current = current.add(1, 'day');
    }
    
    console.log(`📅 需要处理的日期数量：${dates.length}`);
    
    const results: Array<{ date: string; success: boolean; error?: string }> = [];
    let successCount = 0;
    let failCount = 0;
    
    // 逐个处理每个日期
    for (const date of dates) {
      try {
        // 构建源文件名（支持两种格式）
        // 格式 1: sls-cost-YYYY-MM-DD.csv
        const sourceFilename = `sls-cost-${date}.csv`;
        const sourceFilepath = path.join(SOURCE_DIR, sourceFilename);
        
        // 格式 2: sls_bill_YYYYMMDD.csv
        const altDate = date.replace(/-/g, '');
        const altFilename = `sls_bill_${altDate}.csv`;
        const altFilepath = path.join(SOURCE_DIR, altFilename);
        
        let foundFilepath: string | null = null;
        
        if (fs.existsSync(sourceFilepath)) {
          foundFilepath = sourceFilepath;
          console.log(`📄 ${date} 找到文件：${sourceFilename}`);
        } else if (fs.existsSync(altFilepath)) {
          foundFilepath = altFilepath;
          console.log(`📄 ${date} 找到文件：${altFilename}`);
        }
        
        // 如果源目录找不到，尝试 DATA_DIR
        if (!foundFilepath) {
          const dataDirFile = path.join(DATA_DIR, `sls-cost-${date}.csv`);
          if (fs.existsSync(dataDirFile)) {
            foundFilepath = dataDirFile;
            console.log(`📄 ${date} 从 DATA_DIR 找到文件：sls-cost-${date}.csv`);
          }
        }
        
        if (!foundFilepath) {
          failCount++;
          results.push({ date, success: false, error: '源文件不存在' });
          console.log(`❌ ${date} 跳过 - 源文件不存在`);
          continue;
        }
        
        // 处理文件
        await processDailyData(foundFilepath, date, targetDir);
        successCount++;
        results.push({ date, success: true });
        console.log(`✅ ${date} 处理成功`);
        
      } catch (error) {
        failCount++;
        results.push({ 
          date, 
          success: false, 
          error: error instanceof Error ? error.message : '未知错误' 
        });
        console.error(`❌ ${date} 处理失败:`, error);
      }
    }
    
    res.json({
      success: true,
      message: '批量重新处理完成',
      dateRange: { startDate, endDate },
      summary: {
        total: dates.length,
        success: successCount,
        failed: failCount,
      },
      results,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/reprocess:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : '未知错误',
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SLS Cost Analyzer API is running',
    timestamp: new Date().toISOString(),
    dataDir: DATA_DIR,
  });
});

// 文件监听自动处理
const processedFiles = new Set<string>();

const watchAndProcess = () => {
  console.log(`👁️ 开始监听目录：${SOURCE_DIR}`);
  
  // 确保源目录存在
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log(`⚠️  源目录不存在，创建：${SOURCE_DIR}`);
    fs.mkdirSync(SOURCE_DIR, { recursive: true });
  }
  
  // 监听源目录的文件变化
  watch(SOURCE_DIR, (eventType, filename) => {
    // 只处理 CSV 文件
    if (!filename || !filename.endsWith('.csv')) return;
    if (!filename.startsWith('sls-cost-')) return;
    
    const filepath = path.join(SOURCE_DIR, filename);
    
    // 避免重复处理
    if (processedFiles.has(filepath)) return;
    
    // 等待文件写入完成
    setTimeout(async () => {
      try {
        // 检查文件是否存在且大小稳定
        if (!fs.existsSync(filepath)) return;
        
        const stats = fs.statSync(filepath);
        if (stats.size === 0) return;
        
        console.log(`📄 检测到新文件：${filename} (${stats.size} bytes)`);
        
        // 提取日期
        const dateMatch = filename.match(/sls-cost-(\d{4}-\d{2}-\d{2})\.csv/);
        if (!dateMatch) {
          console.log(`⚠️  无法从文件名提取日期：${filename}`);
          return;
        }
        
        const date = dateMatch[1];
        console.log(`🔄 开始自动处理：${date}`);
        
        // 处理文件
        const result = await processDailyData(filepath, date, DATA_DIR);
        
        console.log(`✅ 自动处理完成：${date}`);
        console.log(`   - 记录数：${result.recordCount}`);
        console.log(`   - 总费用：¥${result.summary.totalCost.toFixed(2)}`);
        if (result.summary.weekComparison) {
          console.log(`   - 周对比：${result.summary.weekComparison.changePercent.toFixed(2)}% (${result.summary.weekComparison.trend})`);
        }
        if (result.summary.monthComparison) {
          console.log(`   - 月对比：${result.summary.monthComparison.changePercent.toFixed(2)}% (${result.summary.monthComparison.trend})`);
        }
        
        // 标记为已处理
        processedFiles.add(filepath);
        
      } catch (error) {
        console.error(`❌ 自动处理失败：${filename}`, error instanceof Error ? error.message : error);
      }
    }, 500); // 等待 500ms 确保文件写入完成
  });
  
  console.log(`✅ 文件监听已启动`);
};

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 SLS Cost Analyzer Backend running on port ${PORT}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
  console.log(`📂 Static files available at: http://localhost:${PORT}/data/`);
  console.log(`\n📝 API Endpoints:`);
  console.log(`  - GET  /api/health           - 健康检查`);
  console.log(`  - GET  /api/holiday          - 📅 获取节假日信息（判断工作日/非工作日）`);
  console.log(`  - GET  /api/projects         - 获取项目列表`);
  console.log(`  - GET  /api/files            - 获取文件列表`);
  console.log(`  - GET  /api/comparison       - 📊 获取费用对比数据（周/月）`);
  console.log(`  - GET  /api/query            - 📊 实时查询费用数据`);
  console.log(`  - POST /api/process/daily    - 📥 处理每日数据`);
  console.log(`  - POST /api/webhook/process  - 📥 接收定时任务处理通知（兼容）`);
  console.log(`  - POST /api/reprocess        - 🔄 批量重新处理指定日期范围`);
  console.log(`\n👁️  Auto-watch enabled: ${SOURCE_DIR}`);
  
  // 启动文件监听
  watchAndProcess();
});

// 全局错误处理 - 防止进程崩溃
process.on('uncaughtException', (error) => {
  console.error('❌ [FATAL] Uncaught Exception:', error.message);
  console.error(error.stack);
  // 记录错误但不退出进程
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [FATAL] Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // 记录错误但不退出进程
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('👋 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
