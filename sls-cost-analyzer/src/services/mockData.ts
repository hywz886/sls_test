import type { CostRecord, ProjectSummary, CostAnalysis } from '../types';

const API_URL = '/api';

export const fetchAvailableDates = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_URL}/files`);
    const result = await response.json();

    if (!result.success) {
      throw new Error('获取文件列表失败');
    }

    const jsonFiles = result.files
      .filter((f: any) => f.type === 'json')
      .map((f: any) => f.date)
      .filter((d: string) => d)
      .sort((a: string, b: string) => b.localeCompare(a));

    return Array.from(new Set(jsonFiles));
  } catch (error) {
    console.error('Failed to fetch available dates:', error);
    throw error;
  }
};

export const fetchCostData = async (date?: string): Promise<CostAnalysis> => {
  try {
    let url = `${API_URL}/query`;
    
    if (date) {
      url += `?startDate=${date}&endDate=${date}`;
    } else {
      url += '?all=true';
    }

    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取数据失败');
    }

    const data = result.data;

    const dailyCosts: CostRecord[] = (data.dailyCosts || []).map((d: any) => ({
      date: d.date,
      totalCost: d.totalCost,
      projectId: 'total',
      projectName: '总费用',
      readTraffic: 0,
      writeTraffic: 0,
      indexedTraffic: 0,
      storageSize: 0,
      readCost: 0,
      writeCost: 0,
      indexCost: 0,
      storageCost: 0,
    }));

    const projectMap = new Map<string, ProjectSummary>();
    (data.logstoreSummaries || []).forEach((ls: any) => {
      if (!projectMap.has(ls.projectId)) {
        projectMap.set(ls.projectId, {
          projectId: ls.projectId,
          projectName: ls.projectName || ls.projectId,
          totalCost: 0,
          logstoreCount: 0,
        });
      }
      const proj = projectMap.get(ls.projectId)!;
      proj.totalCost += ls.totalCost;
      proj.logstoreCount = (proj.logstoreCount || 0) + 1;
    });

    return {
      dailyCosts,
      projectSummaries: Array.from(projectMap.values()).sort((a, b) => b.totalCost - a.totalCost),
      logstoreSummaries: (data.logstoreSummaries || []).sort((a: any, b: any) => b.totalCost - a.totalCost),
      totalCost: data.totalCost || 0,
      avgDailyCost: data.avgDailyCost || 0,
      maxDailyCost: data.maxDailyCost || 0,
      isWorkday: data.isWorkday,
      workdayReason: data.workdayReason,
      weekComparison: data.weekComparison || null,
      monthComparison: data.monthComparison || null,
    };
  } catch (error) {
    console.error('Failed to fetch cost data:', error);
    throw error;
  }
};

export const fetchFileList = async () => {
  try {
    const response = await fetch(`${API_URL}/files`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取文件列表失败');
    }

    return result.files;
  } catch (error) {
    console.error('Failed to fetch file list:', error);
    throw error;
  }
};
