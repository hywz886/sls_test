import React from 'react';
import { Card, Row, Col } from 'antd';
import type { StatCardsProps } from './types';

interface StatCardProps {
  title: string;
  value: string;
  suffix?: string;
  icon: string;
  gradient: string;
  trend?: number;
  trendSubtitle?: string;
  isTodayCard?: boolean;
  selectedDate?: string;
  workdayTag?: { text: string; color: string } | null;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix,
  icon,
  gradient,
  trend,
  trendSubtitle,
  isTodayCard,
  selectedDate,
  workdayTag,
}) => {
  // 数值颜色：大于 0 红色，小于 0 绿色
  const valueColor = trend !== undefined 
    ? (trend > 0 ? '#ef4444' : '#10b981')
    : '#1a1a2e';

  return (
    <Card
      hoverable
      style={{
        borderRadius: 14,
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
        background: '#ffffff',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        overflow: 'hidden',
      }}
      bodyStyle={{ padding: 0 }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.12)';
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
      }}
    >
      <div style={{
        padding: '16px 18px',
        minHeight: 140,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        {/* 第一行：标题 + 图标 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          minHeight: 28,
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            lineHeight: 1.4,
          }}>
            {title}
          </span>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.12)',
            flexShrink: 0,
          }}>
            {icon}
          </div>
        </div>

        {/* 第二行：大数值 */}
        <div style={{
          fontSize: 26,
          fontWeight: 700,
          color: valueColor,
          fontFamily: 'SF Mono, Monaco, Consolas, monospace',
          letterSpacing: '-0.5px',
          lineHeight: 1.2,
          transition: 'color 0.3s ease',
          marginBottom: 8,
        }}>
          {value}
          {suffix && (
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#888',
              marginLeft: 3,
            }}>
              {suffix}
            </span>
          )}
        </div>

        {/* 第三行：副标题 */}
        {trendSubtitle && (
          <div style={{
            fontSize: 11,
            fontWeight: 500,
            color: '#666',
            fontFamily: 'SF Mono, Monaco, Consolas, monospace',
            marginTop: 4,
          }}>
            {trendSubtitle}
          </div>
        )}
        
        {/* 本日费用卡片专属：底部日期和工作日标签 */}
        {isTodayCard && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 18,
            right: 18,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {selectedDate && (
              <div style={{
                fontSize: 15,
                color: '#6b7280',
                fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                fontWeight: 600,
              }}>
                {selectedDate}
              </div>
            )}
            {workdayTag && (
              <span style={{ 
                fontSize: 14, 
                padding: '4px 10px', 
                borderRadius: 4, 
                backgroundColor: workdayTag.color + '15',
                color: workdayTag.color,
                fontWeight: 600,
                display: 'inline-block'
              }}>
                {workdayTag.text}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export const StatCards: React.FC<StatCardsProps & { selectedDate?: string; isWorkday?: boolean }> = ({
  todayCost = 0,
  monthToDateCost = 0,
  dayComparison,
  weekComparison,
  monthComparison,
  selectedDate,
  isWorkday,
}) => {
  // 工作日标签
  const workdayTag = (isWorkday === true || isWorkday === false)
    ? { 
        text: isWorkday ? '📅 工作日' : '🏖️ 非工作日', 
        color: isWorkday ? '#22c55e' : '#f59e0b' 
      }
    : null;

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {/* 本月总费用 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <StatCard
          title="本月总费用"
          value={monthToDateCost.toFixed(2)}
          suffix="元"
          icon="💰"
          gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
        />
      </div>
      
      {/* 本日费用 - 带日期和工作日标签 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <StatCard
          title="本日费用"
          value={todayCost.toFixed(2)}
          suffix="元"
          icon="📅"
          gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
          isTodayCard
          selectedDate={selectedDate}
          workdayTag={workdayTag}
        />
      </div>
      
      {/* 日对比 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <StatCard
          title="日对比"
          value={dayComparison ? `${dayComparison.changePercent >= 0 ? '+' : ''}${dayComparison.changePercent.toFixed(1)}%` : 'N/A'}
          trendSubtitle={dayComparison ? `¥${dayComparison.currentDay.toFixed(2)} vs ¥${dayComparison.lastDay.toFixed(2)}` : ''}
          gradient={dayComparison?.trend === 'up'
            ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
            : dayComparison?.trend === 'down'
            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
            : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'}
          icon={dayComparison?.trend === 'up' ? '📈' : dayComparison?.trend === 'down' ? '📉' : '➡️'}
          trend={dayComparison?.changePercent}
        />
      </div>
      
      {/* 周对比 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <StatCard
          title="周对比"
          value={weekComparison ? `${weekComparison.changePercent >= 0 ? '+' : ''}${weekComparison.changePercent.toFixed(1)}%` : 'N/A'}
          trendSubtitle={weekComparison ? `¥${weekComparison.currentWeek.toFixed(2)} vs ¥${weekComparison.lastWeek.toFixed(2)}` : ''}
          gradient={weekComparison?.trend === 'up'
            ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
            : weekComparison?.trend === 'down'
            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
            : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'}
          icon={weekComparison?.trend === 'up' ? '📈' : weekComparison?.trend === 'down' ? '📉' : '➡️'}
          trend={weekComparison?.changePercent}
        />
      </div>
      
      {/* 月对比 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <StatCard
          title="月对比"
          value={monthComparison ? `${monthComparison.changePercent >= 0 ? '+' : ''}${monthComparison.changePercent.toFixed(1)}%` : 'N/A'}
          trendSubtitle={monthComparison ? `¥${monthComparison.currentMonth.toFixed(2)} vs ¥${monthComparison.lastMonth.toFixed(2)}` : ''}
          gradient={monthComparison?.trend === 'up'
            ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
            : monthComparison?.trend === 'down'
            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
            : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'}
          icon={monthComparison?.trend === 'up' ? '📈' : monthComparison?.trend === 'down' ? '📉' : '➡️'}
          trend={monthComparison?.changePercent}
        />
      </div>
    </div>
  );
};
