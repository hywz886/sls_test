import { ConfigProvider, Layout, Menu, Typography, DatePicker } from 'antd';
import type { MenuProps } from 'antd';
import Dashboard from './components/Dashboard';
import TokenUsage from './components/TokenUsage';
import './styles/base.css';
import './styles/components.css';
import { useState } from 'react';
import React from 'react';
import dayjs from 'dayjs';

const { Sider, Content } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
): MenuItem {
  return {
    key,
    icon,
    label,
  } as MenuItem;
}

const menuItems: MenuItem[] = [
  getItem('📊 日志分析', 'log-analysis'),
  getItem('🎫 Token 使用', 'token-usage'),
  getItem('📁 存储桶', 'buckets'),
  getItem('⚙️ 设置', 'settings'),
];

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>('log-analysis');
  const [renderKey, setRenderKey] = useState<string>('log-analysis');
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const availableDatesRef = React.useRef<string[]>([]);

  // 监听 Dashboard 传来的可用日期列表
  React.useEffect(() => {
    const handleAvailableDatesUpdate = (event: CustomEvent<string[]>) => {
      const dates = event.detail;
      if (dates && dates.length > 0) {
        const sortedDates = dates.sort((a, b) => b.localeCompare(a));
        availableDatesRef.current = sortedDates;
        // 设置默认选中最新日期（有数据的最新日期）
        if (sortedDates.length > 0) {
          setSelectedDate(sortedDates[0]);
        }
      }
    };

    window.addEventListener('updateAvailableDates', handleAvailableDatesUpdate as EventListener);
    return () => window.removeEventListener('updateAvailableDates', handleAvailableDatesUpdate as EventListener);
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00b894',
          borderRadius: 8,
          fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          colorBgContainer: '#ffffff',
          colorBorderSecondary: '#e8ecef',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', width: '100vw', margin: 0, padding: 0, background: '#f5f7fa' }}>
        <Sider
          className="sider"
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          style={{
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000,
            overflow: 'auto',
          }}
          theme="dark"
          width={260}
        >
          <div className="sider-header">
            {!collapsed ? (
              <div className="sider-brand">
                <div className="sider-brand-icon">📊</div>
                <div>
                  <div className="sider-brand-title">SLS 费用平台</div>
                  <Text className="sider-brand-subtitle">成本分析与优化</Text>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 22 }}>📊</div>
            )}
          </div>
          
          <div style={{ padding: '20px 12px' }}>
            <Text className="sider-menu-label">主菜单</Text>
          </div>
          
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={({ key }) => {
              setSelectedKey(key);
              setRenderKey(key);
            }}
            items={menuItems}
            style={{
              background: 'transparent',
              borderRight: 'none',
              fontSize: 14,
            }}
          />
          
          <div className="sider-tip">
            <Text className="sider-tip-title">💡 提示</Text>
            <Text className="sider-tip-text">数据每小时自动更新</Text>
          </div>
        </Sider>
        
        <Layout style={{ 
          marginLeft: collapsed ? 80 : 260,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'transparent',
          minHeight: '100vh',
        }}>
          <div className="header">
            <div className="header-title">
              {selectedKey === 'log-analysis' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span>📊 日志分析</span>
                  <DatePicker
                    value={dayjs(selectedDate)}
                    onChange={(date) => {
                      if (date) {
                        const dateStr = date.format('YYYY-MM-DD');
                        setSelectedDate(dateStr);
                        window.dispatchEvent(new CustomEvent('updateGlobalDate', { 
                          detail: dateStr 
                        }));
                      }
                    }}
                    disabledDate={(current) => {
                      if (!current || availableDatesRef.current.length === 0) return true;
                      const dateStr = current.format('YYYY-MM-DD');
                      return !availableDatesRef.current.includes(dateStr);
                    }}
                    size="small"
                    style={{ width: 140 }}
                  />
                </div>
              )}
              {selectedKey === 'token-usage' && '🎫 Token 使用统计'}
              {selectedKey === 'buckets' && '📁 存储桶管理'}
              {selectedKey === 'settings' && '⚙️ 系统设置'}
            </div>
          </div>
          
          <Content className="content">
            <div className="content-inner">
              {renderKey === 'log-analysis' && <Dashboard key="dashboard" initialDate={selectedDate} />}
              {renderKey === 'token-usage' && <TokenUsage key="token" />}
              {renderKey === 'buckets' && (
                <div key="buckets" className="empty">
                  <div className="empty-icon">📁</div>
                  <div className="empty-title">存储桶管理</div>
                  <Text className="empty-description">页面开发中，敬请期待</Text>
                </div>
              )}
              {renderKey === 'settings' && (
                <div key="settings" className="empty">
                  <div className="empty-icon">⚙️</div>
                  <div className="empty-title">系统设置</div>
                  <Text className="empty-description">页面开发中，敬请期待</Text>
                </div>
              )}
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
