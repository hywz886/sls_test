import React from 'react';
import { Card, Space, DatePicker, Select, Typography } from 'antd';
import { DollarOutlined, DatabaseOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ControlBarProps } from './types';

const { Text } = Typography;

export const ControlBar: React.FC<ControlBarProps> = ({
  availableDates,
  selectedDate,
  totalCost,
  logstoreSummaries,
  onDateChange,
  onLogstoreChange,
}) => {
  return (
    <Card style={{ padding: 16, marginBottom: 0 }}>
      <Space wrap size="large" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space wrap size="middle">
          <Space>
            <CalendarOutlined style={{ fontSize: 16, color: '#6366f1' }} />
            <Text strong>日期:</Text>
            <DatePicker
              value={dayjs(selectedDate)}
              onChange={(_, dateString) => {
                if (dateString && availableDates.includes(dateString)) {
                  onDateChange(dateString);
                }
              }}
              disabledDate={(current) => {
                const dateStr = current?.format('YYYY-MM-DD');
                return !dateStr || !availableDates.includes(dateStr);
              }}
              style={{ width: 160 }}
            />
          </Space>

          {logstoreSummaries && logstoreSummaries.length > 0 && (
            <Space>
              <DatabaseOutlined style={{ fontSize: 16, color: '#8b5cf6' }} />
              <Text strong>Logstore:</Text>
              <Select
                placeholder="筛选 Logstore"
                onChange={(value) => onLogstoreChange(value || null)}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={logstoreSummaries.map((s) => ({
                  label: s.logstore,
                  value: s.logstore,
                }))}
                style={{ width: 280 }}
              />
            </Space>
          )}
        </Space>

        <Space>
          <DollarOutlined style={{ fontSize: 20, color: '#10b981' }} />
          <Text type="secondary">总费用:</Text>
          <Text strong style={{ fontSize: 20, color: '#10b981' }}>
            ¥{totalCost?.toFixed(2)}
          </Text>
        </Space>
      </Space>
    </Card>
  );
};
