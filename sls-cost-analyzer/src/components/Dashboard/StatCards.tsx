import React from 'react';
import { Card, Row, Col, Space, Typography } from 'antd';
import type { StatCardsProps } from './types';

const { Text } = Typography;

export const StatCards: React.FC<StatCardsProps> = ({
  todayCost = 0,
  monthToDateCost = 0,
  weekComparison,
  monthComparison,
}) => {
  const stats = [
    {
      title: '本月总费用',
      value: `¥${monthToDateCost.toFixed(2)}`,
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      icon: '💰',
    },
    {
      title: '本日费用',
      value: `¥${todayCost.toFixed(2)}`,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      icon: '📅',
    },
    {
      title: '周对比',
      value: weekComparison ? `${weekComparison.changePercent >= 0 ? '+' : ''}${weekComparison.changePercent.toFixed(1)}%` : 'N/A',
      subtitle: weekComparison ? `¥${weekComparison.currentWeek.toFixed(2)} vs ¥${weekComparison.lastWeek.toFixed(2)}` : '',
      color: weekComparison?.trend === 'up' ? '#ef4444' : weekComparison?.trend === 'down' ? '#10b981' : '#6b7280',
      gradient: weekComparison?.trend === 'up' 
        ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' 
        : weekComparison?.trend === 'down'
        ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
        : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
      icon: weekComparison?.trend === 'up' ? '📈' : weekComparison?.trend === 'down' ? '📉' : '➡️',
    },
    {
      title: '月对比',
      value: monthComparison ? `${monthComparison.changePercent >= 0 ? '+' : ''}${monthComparison.changePercent.toFixed(1)}%` : 'N/A',
      subtitle: monthComparison ? `¥${monthComparison.currentMonth.toFixed(2)} vs ¥${monthComparison.lastMonth.toFixed(2)}` : '',
      color: monthComparison?.trend === 'up' ? '#ef4444' : monthComparison?.trend === 'down' ? '#10b981' : '#6b7280',
      gradient: monthComparison?.trend === 'up' 
        ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' 
        : monthComparison?.trend === 'down'
        ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
        : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
      icon: monthComparison?.trend === 'up' ? '📈' : monthComparison?.trend === 'down' ? '📉' : '➡️',
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {stats.map((stat, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card>
            <Space orientation="horizontal" size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  {stat.title}
                </Text>
                <Text strong style={{ fontSize: 28, color: stat.color }}>
                  {stat.value}
                </Text>
                {stat.subtitle && (
                  <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                    {stat.subtitle}
                  </Text>
                )}
              </div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: stat.gradient,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                }}
              >
                {stat.icon}
              </div>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
};
