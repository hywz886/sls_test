import { ConfigProvider, Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import Dashboard from './components/Dashboard';
import TokenUsage from './components/TokenUsage';
import './App.css';
import { useState } from 'react';

const { Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
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

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', width: '100vw', margin: 0, padding: 0 }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          style={{
            background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
            borderRight: '1px solid rgba(99, 102, 241, 0.2)',
            boxShadow: '4px 0 24px rgba(99, 102, 241, 0.15)',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000,
            overflow: 'auto',
          }}
          theme="dark"
          width={256}
        >
          <div style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
            padding: '0 16px',
          }}>
            {!collapsed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 36, 
                  height: 36, 
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}>🚀</div>
                <span style={{ 
                  fontSize: 16, 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #fff 0%, #e0e7ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>SLS 费用平台</span>
              </div>
            ) : (
              <div style={{ fontSize: 20 }}>🚀</div>
            )}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={({ key }) => setSelectedKey(key)}
            items={menuItems}
            style={{
              background: 'transparent',
              borderRight: 'none',
              marginTop: 16,
            }}
          />
        </Sider>
        <Layout style={{ 
          marginLeft: collapsed ? 80 : 256,
          transition: 'margin-left 0.2s ease',
          background: 'transparent',
        }}>
          <Content
            style={{
              margin: 0,
              padding: 24,
              minHeight: '100vh',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f1f5f9 100%)',
              overflow: 'auto',
            }}
          >
            {selectedKey === 'log-analysis' && <Dashboard />}
            {selectedKey === 'token-usage' && <TokenUsage />}
            {selectedKey === 'buckets' && (
              <div style={{ fontSize: 18, color: '#666' }}>📁 存储桶页面 - 开发中</div>
            )}
            {selectedKey === 'settings' && (
              <div style={{ fontSize: 18, color: '#666' }}>⚙️ 设置页面 - 开发中</div>
            )}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
