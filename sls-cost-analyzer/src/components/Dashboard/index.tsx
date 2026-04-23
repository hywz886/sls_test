import React, { useEffect, useState, useCallback } from 'react';
import { fetchCostData, fetchAvailableDates } from '../../services/mockData';
import type { CostAnalysis } from '../../types';
import { StatCards } from './StatCards';
import { Charts } from './Charts';
import { DataTable } from './DataTable';
import dayjs from 'dayjs';

interface DashboardProps {
  initialDate?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ initialDate }) => {
  const [data, setData] = useState<CostAnalysis | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || dayjs().format('YYYY-MM-DD'));
  const [trendDateRange, setTrendDateRange] = useState<[string, string] | null>(null);
  const [selectedLogstore, setSelectedLogstore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // 新卡片数据
  const [todayCost, setTodayCost] = useState<number>(0);
  const [monthToDateCost, setMonthToDateCost] = useState<number>(0);
  const [dayComparison, setDayComparison] = useState<{ currentDay: number; lastDay: number; changePercent: number; trend: 'up' | 'down' | 'stable' } | undefined>(undefined);
  const [weekComparison, setWeekComparison] = useState<{ currentWeek: number; lastWeek: number; changePercent: number; trend: 'up' | 'down' | 'stable' } | undefined>(undefined);
  const [monthComparison, setMonthComparison] = useState<{ currentMonth: number; lastMonth: number; changePercent: number; trend: 'up' | 'down' | 'stable' } | undefined>(undefined);

  const loadData = useCallback(async (date: string, keepTrendData = false) => {
    try {
      setLoading(true);
      const costData = await fetchCostData(date);

      if (keepTrendData && data?.dailyCosts) {
        costData.dailyCosts = data.dailyCosts;
      }

      setData(costData);
      
      // 计算新卡片数据
      calculateCardData(costData, availableDates);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [data?.dailyCosts, availableDates]);
  
  // 计算卡片数据（使用后端 API 返回的对比数据）
  const calculateCardData = useCallback(async (costData: CostAnalysis | null, dates: string[]) => {
    if (!costData || dates.length === 0) return;
    
    const latestDate = dates[0]; // 最新日期
    const today = dayjs(latestDate);
    
    // 1. 本日费用
    setTodayCost(costData.totalCost || 0);
    
    // 2. 本月总费用（从本月 1 号到今天）
    const monthStart = today.startOf('month').format('YYYY-MM-DD');
    const monthEnd = today.format('YYYY-MM-DD');
    
    try {
      const monthResponse = await fetch(`/api/query?startDate=${monthStart}&endDate=${monthEnd}`);
      const monthResult = await monthResponse.json();
      
      if (monthResult.success && monthResult.data) {
        const monthTotal = monthResult.data.dailyCosts?.reduce((sum: number, d: any) => sum + d.totalCost, 0) || 0;
        setMonthToDateCost(monthTotal);
        
        // 3. 日对比 - 直接使用后端 API 返回的数据
        // 后端已经根据工作日/非工作日类型计算了对比数据
        if (costData.dayComparison) {
          setDayComparison({
            currentDay: costData.totalCost || 0,
            lastDay: costData.dayComparison.lastPeriodTotal || 0,
            changePercent: costData.dayComparison.changePercent || 0,
            trend: costData.dayComparison.trend || 'stable'
          });
        }
        
        // 4. 周对比
        if (costData.weekComparison) {
          setWeekComparison({
            currentWeek: costData.totalCost || 0,
            lastWeek: costData.weekComparison.lastPeriodTotal || 0,
            changePercent: costData.weekComparison.changePercent || 0,
            trend: costData.weekComparison.trend || 'stable'
          });
        }
        
        // 5. 月对比
        if (costData.monthComparison) {
          setMonthComparison({
            currentMonth: costData.totalCost || 0,
            lastMonth: costData.monthComparison.lastPeriodTotal || 0,
            changePercent: costData.monthComparison.changePercent || 0,
            trend: costData.monthComparison.trend || 'stable'
          });
        }
        
        console.log('📊 对比数据:', {
          weekComparison: costData.weekComparison,
          monthComparison: costData.monthComparison,
          isWorkday: costData.isWorkday,
          workdayReason: costData.workdayReason
        });
      }
    } catch (error) {
      console.error('Failed to calculate card data:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const dates = await fetchAvailableDates();
        setAvailableDates(dates);
        // 通知 App 组件可用日期列表
        window.dispatchEvent(new CustomEvent('updateAvailableDates', { 
          detail: dates 
        }));

        const allDataResponse = await fetch('/api/query?all=true');
        const allDataResult = await allDataResponse.json();
        const allDailyCosts = (allDataResult.data?.dailyCosts || []).map((d: any) => ({
          date: d.date,
          totalCost: d.totalCost,
          projectId: 'total',
          projectName: '总费用',
        }));

        if (dates.length > 0) {
          const latestDate = dates[0];
          setSelectedDate(latestDate);

          const sortedDates = [...dates].sort((a, b) => a.localeCompare(b));
          const oneMonthAgo = dayjs(latestDate).subtract(30, 'day').format('YYYY-MM-DD');
          const startDate = sortedDates.find((d) => d >= oneMonthAgo) || sortedDates[0];
          
          // 设置趋势图日期范围（一个月前到最新）
          const initialDateRange: [string, string] = [startDate, latestDate];
          setTrendDateRange(initialDateRange);

          // 获取最新日期的单日数据（包含对比数据）
          const singleDayResponse = await fetch(`/api/query?startDate=${latestDate}&endDate=${latestDate}`);
          const singleDayResult = await singleDayResponse.json();
          
          const costData = await fetchCostData(latestDate);
          costData.dailyCosts = allDailyCosts;
          
          // 使用单日查询返回的对比数据
          if (singleDayResult.success && singleDayResult.data) {
            costData.weekComparison = singleDayResult.data.weekComparison;
            costData.monthComparison = singleDayResult.data.monthComparison;
            costData.isWorkday = singleDayResult.data.isWorkday;
            costData.workdayReason = singleDayResult.data.workdayReason;
          }

          setData(costData);
          setInitialized(true);
          
          // 初始化时计算卡片数据
          calculateCardData(costData, dates);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!initialized || !selectedDate || !availableDates.includes(selectedDate)) return;
    loadData(selectedDate, true);
  }, [selectedDate, loadData, availableDates, initialized]);

  // 监听全局日期更新事件（来自 Header 的日期选择器）
  useEffect(() => {
    const handleGlobalDateUpdate = (event: CustomEvent<string>) => {
      const newDate = event.detail;
      if (newDate && availableDates.includes(newDate)) {
        setSelectedDate(newDate);
      }
    };

    window.addEventListener('updateGlobalDate', handleGlobalDateUpdate as EventListener);
    return () => window.removeEventListener('updateGlobalDate', handleGlobalDateUpdate as EventListener);
  }, [availableDates]);

  // 监听日期范围更新事件
  useEffect(() => {
    const handleDateRangeUpdate = (event: CustomEvent<[string, string]>) => {
      const [startDate, endDate] = event.detail;
      setTrendDateRange([startDate, endDate]);
      
      // 根据当前选择的 Logstore 重新获取数据
      if (selectedLogstore && selectedLogstore !== '__all__') {
        fetchLogstoreTrend(startDate, endDate, selectedLogstore);
      } else {
        fetchTotalCostTrend(startDate, endDate);
      }
    };

    const fetchLogstoreTrend = async (startDate: string, endDate: string, logstore: string) => {
      try {
        const response = await fetch(
          `/api/query?startDate=${startDate}&endDate=${endDate}&logstore=${encodeURIComponent(logstore)}`
        );
        const result = await response.json();

        if (result.success && result.data) {
          setData((prevData) => {
            if (!prevData) return null;
            return {
              ...prevData,
              dailyCosts: result.data.dailyCosts.map((d: any) => ({
                date: d.date,
                totalCost: d.totalCost,
                projectId: 'logstore',
                projectName: logstore,
              })),
            };
          });
        }
      } catch (error) {
        console.error('Failed to fetch logstore trend:', error);
      }
    };

    const fetchTotalCostTrend = async (startDate: string, endDate: string) => {
      try {
        const response = await fetch(
          `/api/query?startDate=${startDate}&endDate=${endDate}`
        );
        const result = await response.json();

        if (result.success && result.data) {
          setData((prevData) => {
            if (!prevData) return null;
            return {
              ...prevData,
              dailyCosts: result.data.dailyCosts.map((d: any) => ({
                date: d.date,
                totalCost: d.totalCost,
                projectId: 'total',
                projectName: '总费用',
              })),
            };
          });
        }
      } catch (error) {
        console.error('Failed to fetch total cost trend:', error);
      }
    };

    window.addEventListener('updateTrendDateRange', handleDateRangeUpdate as EventListener);
    return () => window.removeEventListener('updateTrendDateRange', handleDateRangeUpdate as EventListener);
  }, [selectedLogstore]);

  // 监听 Logstore 更新事件
  useEffect(() => {
    const handleLogstoreUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent<string | null>;
      const newLogstore = customEvent.detail;
      // 更新选中的 Logstore 状态
      setSelectedLogstore(newLogstore === '__all__' ? null : newLogstore);
      const [startDate, endDate] = trendDateRange || [];
      
      if (!startDate || !endDate) {
        console.warn('⚠️ trendDateRange is not set yet');
        return;
      }
      
      try {
        if (newLogstore && newLogstore !== '__all__') {
          // 选择了具体 Logstore
          console.log('📊 Fetching logstore trend:', newLogstore);
          const response = await fetch(
            `/api/query?startDate=${startDate}&endDate=${endDate}&logstore=${encodeURIComponent(newLogstore)}`
          );
          const result = await response.json();
          console.log('📊 Logstore result:', result.success, result.data?.dailyCosts?.length);
          
          if (result.success && result.data) {
            setData((prevData) => {
              if (!prevData) return null;
              return {
                ...prevData,
                dailyCosts: result.data.dailyCosts.map((d: any) => ({
                  date: d.date,
                  totalCost: d.totalCost,
                  projectId: 'logstore',
                  projectName: newLogstore,
                })),
              };
            });
          }
        } else {
          // 选择"所有费用"（包括 null 或 '__all__'）
          console.log('📊 Fetching total cost trend');
          const response = await fetch(
            `/api/query?startDate=${startDate}&endDate=${endDate}`
          );
          const result = await response.json();
          console.log('📊 Total cost result:', result.success, result.data?.dailyCosts?.length);
          
          if (result.success && result.data) {
            setData((prevData) => {
              if (!prevData) return null;
              return {
                ...prevData,
                dailyCosts: result.data.dailyCosts.map((d: any) => ({
                  date: d.date,
                  totalCost: d.totalCost,
                  projectId: 'total',
                  projectName: '总费用',
                })),
              };
            });
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch trend:', error);
      }
    };

    window.addEventListener('updateLogstore', handleLogstoreUpdate);
    return () => window.removeEventListener('updateLogstore', handleLogstoreUpdate);
  }, [selectedLogstore, trendDateRange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <StatCards
        todayCost={todayCost}
        monthToDateCost={monthToDateCost}
        dayComparison={dayComparison}
        weekComparison={weekComparison}
        monthComparison={monthComparison}
        selectedDate={selectedDate}
        isWorkday={data?.isWorkday}
      />

      <Charts 
        data={data} 
        trendDateRange={trendDateRange} 
        selectedLogstore={selectedLogstore}
        availableDates={availableDates}
        selectedDate={selectedDate}
      />

      <DataTable 
        data={data} 
        loading={loading}
        availableDates={availableDates}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
    </div>
  );
};

export default Dashboard;
