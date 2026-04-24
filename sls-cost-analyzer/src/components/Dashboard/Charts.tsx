import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, Row, Col, DatePicker, Select, Typography } from 'antd';
import * as echarts from 'echarts';
import { CalendarOutlined, DatabaseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ChartsProps } from './types';
import type { LogstoreSummary } from '../../types';

const { Text } = Typography;

export const Charts: React.FC<ChartsProps> = ({ 
  data, 
  trendDateRange, 
  selectedLogstore,
  availableDates,
}) => {
  const chartRefs = {
    trend: useRef<HTMLDivElement>(null),
    project: useRef<HTMLDivElement>(null),
  };

  const chartInstances = useRef<{ trend?: echarts.ECharts; project?: echarts.ECharts }>({});
  
  // 本地状态：趋势图数据
  const [trendData, setTrendData] = React.useState<any[]>([]);
  // 本地日期范围状态（独立于其他组件）
  const [localTrendDateRange, setLocalTrendDateRange] = React.useState<[string, string] | null>(null);

  // 初始化时使用传入的 trendDateRange 或默认范围（最近 1 个月）
  useEffect(() => {
    if (trendDateRange && !localTrendDateRange) {
      // 只在首次加载时使用传入的日期范围
      setLocalTrendDateRange(trendDateRange);
    }
  }, [trendDateRange]);

  // 当日期范围或 selectedLogstore 变化时，获取对应的趋势数据
  useEffect(() => {
    if (!localTrendDateRange) return;
    
    const [startDate, endDate] = localTrendDateRange;
    const fetchTrendData = async () => {
      try {
        let url = `/api/query?startDate=${startDate}&endDate=${endDate}`;
        if (selectedLogstore && selectedLogstore !== '__all__') {
          url += `&logstore=${encodeURIComponent(selectedLogstore)}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.data?.dailyCosts) {
          const dailyCosts = result.data.dailyCosts.map((d: any) => ({
            date: d.date,
            totalCost: d.totalCost,
            projectId: selectedLogstore ? 'logstore' : 'total',
            projectName: selectedLogstore || '总费用',
          }));
          setTrendData(dailyCosts);
          console.log(`📊 获取趋势数据：${startDate} ~ ${endDate}, ${dailyCosts.length} 天`);
        }
      } catch (error) {
        console.error('获取趋势数据失败:', error);
      }
    };
    
    fetchTrendData();
  }, [localTrendDateRange, selectedLogstore]);

  useEffect(() => {
    return () => {
      chartInstances.current.trend?.dispose();
      chartInstances.current.project?.dispose();
    };
  }, []);

  const trendChartOption = useMemo(() => {
    if (trendData.length === 0) return null;

    const sortedDailyCosts = [...trendData].sort((a, b) => a.date.localeCompare(b.date));
    // 使用本地日期范围过滤
    const [startDate, endDate] = localTrendDateRange || [
      sortedDailyCosts[0]?.date,
      sortedDailyCosts[sortedDailyCosts.length - 1]?.date,
    ];
    const filteredCosts = sortedDailyCosts.filter(
      (d) => d.date >= startDate && d.date <= endDate
    );

    return {
      title: {
        text: selectedLogstore ? `Logstore 费用趋势：${selectedLogstore}` : '费用趋势',
        left: 'center',
        textStyle: { fontSize: 15, fontWeight: 600, color: '#1f2937' },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        extraCssText: 'box-shadow: 0 10px 40px rgba(0,0,0,0.1); border-radius: 12px;',
      },
      grid: { left: 50, right: 30, top: 50, bottom: 50 },
      xAxis: {
        type: 'category',
        data: filteredCosts.map((d) => d.date.substring(5)),
        axisLabel: { color: '#9ca3af', fontSize: 11, rotate: 45 },
        axisLine: { lineStyle: { color: '#f3f4f6' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '费用 (元)',
        nameTextStyle: { color: '#9ca3af', fontSize: 12 },
        axisLabel: { color: '#9ca3af', formatter: (val: number) => `¥${val}` },
        splitLine: { lineStyle: { color: '#f9fafb', type: 'solid' } },
      },
      series: [
        {
          name: '总费用',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          data: filteredCosts.map((d) => Number(d.totalCost.toFixed(2))),
          itemStyle: {
            color: '#6366f1',
            shadowColor: 'rgba(99, 102, 241, 0.4)',
            shadowBlur: 10,
          },
          lineStyle: { width: 3, shadowColor: 'rgba(99, 102, 241, 0.3)', shadowBlur: 10 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(99, 102, 241, 0.3)' },
              { offset: 1, color: 'rgba(99, 102, 241, 0.02)' },
            ]),
          },
        },
      ],
    };
  }, [trendData, localTrendDateRange, selectedLogstore]);

  const projectChartOption = useMemo(() => {
    if (!data?.logstoreSummaries) return null;

    const logstoreData = data.logstoreSummaries as LogstoreSummary[];
    const sortedLogstores = logstoreData
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);
    const maxCost = sortedLogstores[0]?.totalCost || 0;

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151', fontSize: 13 },
        extraCssText:
          'box-shadow: 0 10px 40px rgba(0,0,0,0.12); border-radius: 12px; padding: 12px 16px;',
        formatter: (params: any) => {
          const idx = params[0].dataIndex;
          const item = sortedLogstores[idx];
          const name = (item as any).logstore || item.projectName;
          const percent = maxCost > 0 ? ((item.totalCost / maxCost) * 100).toFixed(1) : 0;
          return `
            <div style="padding: 4px 0; margin-bottom: 8px; border-bottom: 1px solid #f3f4f6;">
              <div style="font-weight: 700; color: #1f2937; font-size: 14px; margin-bottom: 4px;">${name}</div>
              <div style="font-size: 12px; color: #6b7280;">Project: ${(item as any).projectId}</div>
            </div>
            <div style="display: flex; align-items: baseline; gap: 8px;">
              <span style="font-size: 18px; font-weight: 800; color: #6366f1;">¥${item.totalCost.toFixed(2)}</span>
              <span style="font-size: 12px; color: #9ca3af;">占比 ${percent}%</span>
            </div>
          `;
        },
      },
      grid: { left: 110, right: 60, top: 55, bottom: 15 },
      xAxis: {
        type: 'value',
        name: '费用 (元)',
        nameTextStyle: { color: '#9ca3af', fontSize: 11, padding: [0, 0, 8, 0] },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 10,
          formatter: (val: number) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val),
        },
        splitLine: { lineStyle: { color: '#f3f4f6', width: 1, type: 'solid' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: sortedLogstores.map((p) => (p as any).logstore || p.projectName),
        axisLabel: {
          formatter: (value: string, idx: number) => {
            const rank = idx + 1;
            let medal = '';
            if (rank === 1) medal = '🥇 ';
            else if (rank === 2) medal = '🥈 ';
            else if (rank === 3) medal = '🥉 ';
            else medal = `${rank}. `;
            return `${medal}${value}`;
          },
          color: '#4b5563',
          fontSize: 11,
          fontWeight: 500,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: sortedLogstores.map((p, i) => {
            // 现代渐变配色：每个 Logstore 不同颜色
            const gradients = [
              ['#6366f1', '#8b5cf6'], // 第 1 名：紫蓝
              ['#06b6d4', '#14b8a6'], // 第 2 名：青蓝
              ['#10b981', '#34d399'], // 第 3 名：绿青
              ['#8b5cf6', '#a78bfa'], // 第 4 名：淡紫
              ['#0ea5e9', '#38bdf8'], // 第 5 名：天蓝
              ['#14b8a6', '#5eead4'], // 第 6 名：蓝绿
              ['#84cc16', '#a3e635'], // 第 7 名：黄绿
              ['#f59e0b', '#fbbf24'], // 第 8 名：橙黄
              ['#ec4899', '#f472b6'], // 第 9 名：粉红
              ['#64748b', '#94a3b8'], // 第 10 名：灰蓝
            ];
            const barColor = gradients[i] || gradients[gradients.length - 1];

            return {
              value: p.totalCost,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: barColor[0] },
                  { offset: 1, color: barColor[1] },
                ]),
                borderRadius: [0, 6, 6, 0],
                shadowColor: barColor[0] + '60',
                shadowBlur: 10,
                shadowOffsetX: 2,
              },
              emphasis: {
                itemStyle: {
                  shadowBlur: 20,
                  shadowColor: barColor[0] + '80',
                },
              },
            };
          }),
          barWidth: 16,
          showBackground: true,
          backgroundStyle: { color: 'rgba(226, 232, 240, 0.3)', borderRadius: 8 },
          itemStyle: { borderRadius: [0, 8, 8, 0] },
        },
      ],
    };
  }, [data?.logstoreSummaries]);

  const renderCharts = useCallback(() => {
    if (!chartRefs.trend.current || !chartRefs.project.current) return;
    if (!trendChartOption || !projectChartOption) return;

    if (!chartInstances.current.trend) {
      chartInstances.current.trend = echarts.init(chartRefs.trend.current);
    }
    if (!chartInstances.current.project) {
      chartInstances.current.project = echarts.init(chartRefs.project.current);
    }

    chartInstances.current.trend.setOption(trendChartOption, true);
    chartInstances.current.project.setOption(projectChartOption, true);

    const handleResize = () => {
      chartInstances.current.trend?.resize();
      chartInstances.current.project?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [trendChartOption, projectChartOption]);

  useEffect(() => {
    const cleanup = renderCharts();
    return cleanup;
  }, [renderCharts]);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <Card 
          style={{ height: 480 }} 
          styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', gap: 16 } }}
        >
          {/* 筛选控制区 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <DatabaseOutlined style={{ fontSize: 14, color: '#8b5cf6' }} />
                <Text strong style={{ fontSize: 13 }}>Logstore</Text>
              </div>
              <Select
                placeholder="全部 Logstore"
                value={selectedLogstore === null ? undefined : selectedLogstore}
                onChange={(value) => {
                  // '所有费用' 和清空都应该传递 null，让后端不添加 logstore 参数
                  const event = new CustomEvent('updateLogstore', { 
                    detail: value === '__all__' || value === undefined ? null : value 
                  });
                  window.dispatchEvent(event);
                }}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={[
                  { label: '📊 所有费用', value: '__all__' },
                  ...(data?.logstoreSummaries || []).map((s) => ({
                    label: `${s.logstore} (${s.projectId})`,
                    value: s.logstore,
                  })),
                ]}
                style={{ width: 260 }}
                size="small"
                optionFilterProp="children"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarOutlined style={{ fontSize: 14, color: '#6366f1' }} />
                <Text strong style={{ fontSize: 13 }}>日期范围</Text>
              </div>
              <DatePicker.RangePicker
                value={localTrendDateRange ? [dayjs(localTrendDateRange[0]), dayjs(localTrendDateRange[1])] : [dayjs(trendDateRange?.[0]), dayjs(trendDateRange?.[1])]}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    const startDate = dates[0].format('YYYY-MM-DD');
                    const endDate = dates[1].format('YYYY-MM-DD');
                    // 只更新本地状态，不再触发全局事件
                    setLocalTrendDateRange([startDate, endDate]);
                  }
                }}
                disabledDate={(current) => {
                  const dateStr = current?.format('YYYY-MM-DD');
                  return !dateStr || !availableDates.includes(dateStr);
                }}
                style={{ width: 240 }}
                size="small"
              />
            </div>
          </div>

          {/* 趋势图表 */}
          <div ref={chartRefs.trend} style={{ width: '100%', height: 360 }} />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card 
          style={{ height: 480 }} 
          styles={{ body: { padding: 16 } }}
        >
          {/* 标题区（与左侧对齐） */}
          <div style={{ height: 40, marginBottom: 8 }}>
            <Text strong style={{ fontSize: 13, color: '#1f2937' }}>🏆 Top 10 Logstore</Text>
          </div>
          {/* 图表 */}
          <div ref={chartRefs.project} style={{ width: '100%', height: 360 }} />
        </Card>
      </Col>
    </Row>
  );
};
