import React, { useEffect, useState } from 'react';
import { Card, Table, Spin, Alert, DatePicker, Space, Typography, Row, Col, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface TokenUsage {
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

const TokenUsage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [tokenData, setTokenData] = useState<TokenUsage[]>([]);
  const [summary, setSummary] = useState({
    totalInput: 0,
    totalOutput: 0,
    totalCost: 0,
  });

  useEffect(() => {
    fetchTokenData();
  }, [dateRange]);

  const fetchTokenData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      // TODO: 替换为实际的 API 调用
      // const response = await fetch(`/api/token-usage?startDate=${startDate}&endDate=${endDate}`);
      // const result = await response.json();
      
      // 模拟数据
      const mockData: TokenUsage[] = [];
      const models = ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'qwen-plus'];
      const currentDate = dayjs(startDate);
      
      while (currentDate.isSameOrBefore(dayjs(endDate))) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        models.forEach(model => {
          const inputTokens = Math.floor(Math.random() * 50000) + 10000;
          const outputTokens = Math.floor(Math.random() * 20000) + 5000;
          const totalTokens = inputTokens + outputTokens;
          const cost = (inputTokens * 0.00001 + outputTokens * 0.00003);
          
          mockData.push({
            date: dateStr,
            model,
            inputTokens,
            outputTokens,
            totalTokens,
            cost: parseFloat(cost.toFixed(4)),
          });
        });
        currentDate.add(1, 'day');
      }
      
      setTokenData(mockData);
      
      // 计算汇总
      const totalInput = mockData.reduce((sum, d) => sum + d.inputTokens, 0);
      const totalOutput = mockData.reduce((sum, d) => sum + d.outputTokens, 0);
      const totalCost = mockData.reduce((sum, d) => sum + d.cost, 0);
      
      setSummary({
        totalInput,
        totalOutput,
        totalCost,
      });
    } catch (error) {
      console.error('Failed to fetch token data:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a: TokenUsage, b: TokenUsage) => a.date.localeCompare(b.date),
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      width: 150,
      filters: [
        { text: 'GPT-4', value: 'gpt-4' },
        { text: 'GPT-3.5-Turbo', value: 'gpt-3.5-turbo' },
        { text: 'Claude-3', value: 'claude-3' },
        { text: 'Qwen-Plus', value: 'qwen-plus' },
      ],
      onFilter: (value: any, record: TokenUsage) => record.model === value,
    },
    {
      title: '输入 Token',
      dataIndex: 'inputTokens',
      key: 'inputTokens',
      width: 120,
      sorter: (a: TokenUsage, b: TokenUsage) => a.inputTokens - b.inputTokens,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '输出 Token',
      dataIndex: 'outputTokens',
      key: 'outputTokens',
      width: 120,
      sorter: (a: TokenUsage, b: TokenUsage) => a.outputTokens - b.outputTokens,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '总 Token',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      width: 120,
      sorter: (a: TokenUsage, b: TokenUsage) => a.totalTokens - b.totalTokens,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '费用 (元)',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      sorter: (a: TokenUsage, b: TokenUsage) => a.cost - b.cost,
      render: (value: number) => `¥${value.toFixed(4)}`,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>🎫 Token 使用统计</Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange([dates[0], dates[1]])}
            style={{ borderRadius: 8 }}
          />
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总输入 Token"
              value={summary.totalInput}
              prefix="📥"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总输出 Token"
              value={summary.totalOutput}
              prefix="📤"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总费用"
              value={summary.totalCost}
              prefix="💰"
              precision={4}
              valueStyle={{ color: '#cf1329' }}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="详细数据"
        style={{ borderRadius: 12 }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : tokenData.length === 0 ? (
          <Alert
            message="暂无数据"
            description="请选择日期范围查看 Token 使用情况"
            type="info"
            showIcon
          />
        ) : (
          <Table
            columns={columns}
            dataSource={tokenData}
            rowKey={(record) => `${record.date}-${record.model}`}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>
    </div>
  );
};

export default TokenUsage;
