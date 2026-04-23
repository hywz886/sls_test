import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Row, Col, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import '../styles/variables.css';

const { Title, Text } = Typography;

interface TokenUsage {
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

const TokenUsage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState<TokenUsage[]>([]);
  const [summary, setSummary] = useState({
    totalInput: 0,
    totalOutput: 0,
    totalCost: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const mockData: TokenUsage[] = [];
        const models = [
          { name: 'GPT-4', color: 'blue' },
          { name: 'GPT-3.5-Turbo', color: 'green' },
          { name: 'Claude-3', color: 'purple' },
          { name: 'Qwen-Plus', color: 'orange' },
        ];
        
        for (let i = 6; i >= 0; i--) {
          const dateStr = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
          models.forEach(model => {
            const inputTokens = Math.floor(Math.random() * 50000) + 10000;
            const outputTokens = Math.floor(Math.random() * 20000) + 5000;
            mockData.push({
              date: dateStr,
              model: model.name,
              inputTokens,
              outputTokens,
              totalTokens: inputTokens + outputTokens,
              cost: parseFloat((inputTokens * 0.00001 + outputTokens * 0.00003).toFixed(4)),
            });
          });
        }
        
        setTokenData(mockData);
        setSummary({
          totalInput: mockData.reduce((sum, d) => sum + d.inputTokens, 0),
          totalOutput: mockData.reduce((sum, d) => sum + d.outputTokens, 0),
          totalCost: mockData.reduce((sum, d) => sum + d.cost, 0),
        });
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (date: string) => (
        <Text className="font-semibold" style={{ color: 'var(--neutral-900)' }}>{date}</Text>
      ),
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      width: 150,
      render: (model: string) => {
        const colorMap: Record<string, string> = {
          'GPT-4': 'blue',
          'GPT-3.5-Turbo': 'green',
          'Claude-3': 'purple',
          'Qwen-Plus': 'orange',
        };
        return <Tag color={colorMap[model] || 'default'}>{model}</Tag>;
      },
    },
    {
      title: '📥 输入 Token',
      dataIndex: 'inputTokens',
      key: 'inputTokens',
      width: 130,
      sorter: (a: TokenUsage, b: TokenUsage) => a.inputTokens - b.inputTokens,
      render: (value: number) => (
        <Text className="mono" style={{ color: 'var(--primary-500)' }}>
          {value.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '📤 输出 Token',
      dataIndex: 'outputTokens',
      key: 'outputTokens',
      width: 130,
      sorter: (a: TokenUsage, b: TokenUsage) => a.outputTokens - b.outputTokens,
      render: (value: number) => (
        <Text className="mono" style={{ color: 'var(--info-500)' }}>
          {value.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '总计',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      width: 120,
      sorter: (a: TokenUsage, b: TokenUsage) => a.totalTokens - b.totalTokens,
      render: (value: number) => (
        <Text strong className="mono">
          {value.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '费用',
      dataIndex: 'cost',
      key: 'cost',
      width: 110,
      sorter: (a: TokenUsage, b: TokenUsage) => a.cost - b.cost,
      render: (value: number) => (
        <Text strong className="mono" style={{ color: 'var(--error-500)' }}>
          ¥{value.toFixed(4)}
        </Text>
      ),
    },
  ];

  const StatCard = ({ title, value, suffix, icon, gradient, trend }: any) => {
    const trendColor = trend > 0 ? 'var(--error-500)' : 'var(--primary-500)';
    const TrendIcon = trend > 0 ? ArrowUpOutlined : ArrowDownOutlined;
    
    return (
      <Card className="stat-card" bodyStyle={{ padding: 0 }}>
        <div className="stat-card-body">
          <div className="stat-card-content">
            <div className="stat-card-info">
              <Text className="stat-card-title">{title}</Text>
              <div className="stat-card-value">
                {typeof value === 'number' ? value.toLocaleString() : value}
                {suffix && <span className="stat-card-suffix">{suffix}</span>}
              </div>
              {trend !== undefined && (
                <div className="stat-card-trend">
                  <TrendIcon style={{ color: trendColor, fontSize: 12 }} />
                  <Text style={{ fontSize: 12, color: trendColor }}>
                    {Math.abs(trend).toFixed(1)}% vs 上周
                  </Text>
                </div>
              )}
            </div>
            <div 
              className="stat-card-icon"
              style={{ background: gradient }}
            >
              {icon}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--neutral-900)' }}>
          🎫 Token 使用统计
        </Title>
        <Text style={{ color: 'var(--neutral-500)', marginTop: 8, display: 'block' }}>
          追踪各模型 Token 消耗情况，优化成本结构
        </Text>
      </div>

      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8}>
          <StatCard
            title="总输入 Token"
            value={summary.totalInput}
            icon="📥"
            gradient="linear-gradient(135deg, #00b894 0%, #00cec9 100%)"
            trend={12.5}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="总输出 Token"
            value={summary.totalOutput}
            icon="📤"
            gradient="linear-gradient(135deg, #0984e3 0%, #74b9ff 100%)"
            trend={-5.2}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="总费用"
            value={summary.totalCost.toFixed(4)}
            suffix="元"
            icon="💰"
            gradient="linear-gradient(135deg, #e17055 0%, #fab1a0 100%)"
            trend={8.3}
          />
        </Col>
      </Row>

      <Card
        className="table-container"
        title={
          <div className="card-title">
            <span>📊</span>
            <span>详细数据</span>
          </div>
        }
        headStyle={{ borderBottom: '2px solid var(--neutral-200)', padding: '20px 24px' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={tokenData}
          rowKey={(record) => `${record.date}-${record.model}`}
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条记录`,
            style: { padding: '16px 24px' },
          }}
          scroll={{ x: 900 }}
          size="middle"
          components={{
            header: {
              cell: (props: any) => <th {...props} className="table-header-cell" />,
            },
            body: {
              cell: (props: any) => <td {...props} className="table-cell" />,
            },
          }}
        />
      </Card>
    </div>
  );
};

export default TokenUsage;
