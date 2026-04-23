import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Table, Typography, Space, DatePicker, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DataTableProps } from './types';
import type { LogstoreSummary } from '../../types';
import dayjs from 'dayjs';

const { Text } = Typography;

const columns: ColumnsType<any> = [
  {
    title: 'Logstore',
    dataIndex: 'logstore',
    key: 'logstore',
    fixed: 'left' as const,
    width: 220,
    render: (text: string, record: any) => (
      <Space orientation="vertical" size={0}>
        <Text strong style={{ fontSize: 14, color: '#1f2937' }}>
          {text}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {record.projectId}
        </Text>
      </Space>
    ),
  },
  {
    title: '费用 (元)',
    dataIndex: 'totalCost',
    key: 'totalCost',
    width: 160,
    sorter: (a: any, b: any) => a.totalCost - b.totalCost,
    render: (val: number) => (
      <Text strong style={{ color: '#6366f1', fontFamily: 'monospace', fontSize: 15 }}>
        ¥{(val || 0).toFixed(2)}
      </Text>
    ),
  },
  {
    title: '日对比',
    dataIndex: 'dayComparison',
    key: 'dayComparison',
    width: 160,
    render: (val: any) => {
      if (!val) return <Text type="secondary">-</Text>;
      const color = val.trend === 'up' ? '#ef4444' : val.trend === 'down' ? '#22c55e' : '#6b7280';
      const arrow = val.trend === 'up' ? '↑' : val.trend === 'down' ? '↓' : '→';
      return (
        <Text strong style={{ color }}>
          {arrow} {val.changePercent > 0 ? '+' : ''}
          {val.changePercent.toFixed(1)}%
        </Text>
      );
    },
  },
  {
    title: '周对比',
    dataIndex: 'weekComparison',
    key: 'weekComparison',
    width: 160,
    render: (val: any) => {
      if (!val) return <Text type="secondary">-</Text>;
      const color = val.trend === 'up' ? '#ef4444' : val.trend === 'down' ? '#22c55e' : '#6b7280';
      const arrow = val.trend === 'up' ? '↑' : val.trend === 'down' ? '↓' : '→';
      return (
        <Text strong style={{ color }}>
          {arrow} {val.changePercent > 0 ? '+' : ''}
          {val.changePercent.toFixed(1)}%
        </Text>
      );
    },
  },
  {
    title: '月对比',
    dataIndex: 'monthComparison',
    key: 'monthComparison',
    width: 160,
    render: (val: any) => {
      if (!val) return <Text type="secondary">-</Text>;
      const color = val.trend === 'up' ? '#ef4444' : val.trend === 'down' ? '#22c55e' : '#6b7280';
      const arrow = val.trend === 'up' ? '↑' : val.trend === 'down' ? '↓' : '→';
      return (
        <Text strong style={{ color }}>
          {arrow} {val.changePercent > 0 ? '+' : ''}
          {val.changePercent.toFixed(1)}%
        </Text>
      );
    },
  },
];

export const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  loading,
  availableDates = [],
  selectedDate,
  onDateChange,
}) => {
  const [logstoreFilter, setLogstoreFilter] = useState<string>('');

  const tableData = useMemo(() => {
    if (!data?.logstoreSummaries) {
      return [];
    }
    let filtered = data.logstoreSummaries.map((summary: LogstoreSummary) => ({
      ...summary,
      key: `${summary.projectId}-${summary.logstore}`,
    }));
    
    // 应用 logstore 筛选
    if (logstoreFilter) {
      filtered = filtered.filter((item: any) => 
        item.logstore.toLowerCase().includes(logstoreFilter.toLowerCase()) ||
        item.projectId.toLowerCase().includes(logstoreFilter.toLowerCase())
      );
    }
    
    return filtered;
  }, [data?.logstoreSummaries, logstoreFilter]);

  // 工作日标识
  const isWorkday = data?.isWorkday;
  const workdayReason = data?.workdayReason;
  const workdayTag = (isWorkday === true || isWorkday === false)
    ? { 
        text: isWorkday ? '📅 工作日' : '🏖️ 非工作日', 
        color: isWorkday ? '#22c55e' : '#f59e0b' 
      }
    : null;

  return (
    <Row>
      <Col xs={24}>
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, fontWeight: 600, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>每日费用明细</span>
              <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 400 }}>({tableData.length} 条记录)</span>
              <Input
                placeholder="🔍 搜索 Logstore 或 Project"
                value={logstoreFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setLogstoreFilter(value);
                }}
                allowClear
                size="small"
                style={{ width: 220, marginLeft: 12 }}
                prefix="🔍"
              />
              {workdayTag && (
                <span style={{ 
                  fontSize: 12, 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  backgroundColor: workdayTag.color + '15',
                  color: workdayTag.color,
                  fontWeight: 500,
                  whiteSpace: 'nowrap'
                }}>
                  {workdayTag.text}
                  {workdayReason && workdayReason !== '周末' && ` - ${workdayReason}`}
                </span>
              )}
            </div>
          }
          extra={
            <DatePicker
              value={selectedDate ? dayjs(selectedDate) : null}
              onChange={(date) => {
                if (date && onDateChange) {
                  onDateChange(date.format('YYYY-MM-DD'));
                }
              }}
              disabledDate={(current) => {
                const dateStr = current?.format('YYYY-MM-DD');
                return !dateStr || !availableDates.includes(dateStr);
              }}
              size="small"
              style={{ width: 150 }}
            />
          }
          styles={{ body: { padding: 16 } }}
        >
          <Table
            columns={columns}
            dataSource={tableData}
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: 1200 }}
            size="middle"
            locale={{ emptyText: '暂无数据' }}
          />
        </Card>
      </Col>
    </Row>
  );
};
