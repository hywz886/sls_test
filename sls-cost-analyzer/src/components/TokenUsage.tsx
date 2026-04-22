import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Row, Col, Statistic } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;

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
        // 模拟数据 - 只生成 7 天
        const mockData: TokenUsage[] = [];
        const models = ['gpt-4', 'gpt-3.5-turbo'];
        
        for (let i = 0; i < 7; i++) {
          const dateStr = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
          models.forEach(model => {
            mockData.push({
              date: dateStr,
              model,
              inputTokens: Math.floor(Math.random() * 10000) + 1000,
              outputTokens: Math.floor(Math.random() * 5000) + 500,
              totalTokens: 0,
              cost: 0.01,
            });
          });
        }
        
        // 计算 totalTokens 和 cost
        mockData.forEach(d => {
          d.totalTokens = d.inputTokens + d.outputTokens;
          d.cost = parseFloat((d.inputTokens * 0.00001 + d.outputTokens * 0.00003).toFixed(4));
        });
        
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
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '模型', dataIndex: 'model', key: 'model', width: 150 },
    { title: '输入 Token', dataIndex: 'inputTokens', key: 'inputTokens', width: 120, render: (v: number) => v.toLocaleString() },
    { title: '输出 Token', dataIndex: 'outputTokens', key: 'outputTokens', width: 120, render: (v: number) => v.toLocaleString() },
    { title: '总 Token', dataIndex: 'totalTokens', key: 'totalTokens', width: 120, render: (v: number) => v.toLocaleString() },
    { title: '费用 (元)', dataIndex: 'cost', key: 'cost', width: 100, render: (v: number) => `¥${v.toFixed(4)}` },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>🎫 Token 使用统计</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="总输入 Token" value={summary.totalInput} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="总输出 Token" value={summary.totalOutput} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="总费用" value={summary.totalCost} precision={4} valueStyle={{ color: '#cf1329' }} suffix="元" />
          </Card>
        </Col>
      </Row>

      <Card title="详细数据">
        <Table
          columns={columns}
          dataSource={tokenData}
          rowKey={(record) => `${record.date}-${record.model}`}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default TokenUsage;
