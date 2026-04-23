# SLS 费用平台 - Web Design Guidelines

## 1. 设计原则

### 1.1 核心理念
- **简洁高效**：减少认知负担，信息层次清晰
- **数据驱动**：突出关键指标，支持快速决策
- **专业可信**：稳重的视觉风格，适合企业级应用
- **响应流畅**：60fps 动画，即时反馈

### 1.2 用户体验目标
- 3 秒内加载完成首屏
- 关键操作 ≤ 2 次点击
- 数据表格支持快速扫描
- 移动端适配（可选）

---

## 2. 色彩系统

### 2.1 主色调
```css
--primary-500: #00b894;    /* 主色 - 成功/增长 */
--primary-600: #00a383;    /* 悬停 */
--primary-700: #008f72;    /* 激活 */
--primary-100: #e6f7f2;    /* 背景 */
```

### 2.2 辅助色
```css
/* 信息 */
--info-500: #0984e3;
--info-100: #e6f3ff;

/* 警告 */
--warning-500: #fdcb6e;
--warning-100: #fff8e6;

/* 错误 */
--error-500: #e17055;
--error-100: #ffece6;

/* 中性色 */
--neutral-900: #1a1a2e;    /* 主文字 */
--neutral-700: #555555;    /* 次要文字 */
--neutral-500: #888888;    /* 提示文字 */
--neutral-300: #e8ecef;    /* 边框 */
--neutral-100: #f5f7fa;    /* 背景 */
--neutral-000: #ffffff;    /* 卡片背景 */
```

### 2.3 渐变色
```css
--gradient-success: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
--gradient-info: linear-gradient(135deg, #0984e3 0%, #74b9ff 100%);
--gradient-warning: linear-gradient(135deg, #fdcb6e 0%, #fab1a0 100%);
--gradient-dark: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
```

### 2.4 使用规范
- 主色用于：主要按钮、选中状态、关键数据
- 辅助色用于：状态标签、图表分类、提示
- 渐变色仅用于：卡片图标背景、主要按钮
- 禁止使用：高饱和度纯色大面积背景

---

## 3. 字体系统

### 3.1 字体栈
```css
/* 主字体 */
--font-primary: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;

/* 等宽字体（数字/代码） */
--font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
```

### 3.2 字号规范
| 用途 | 字号 | 字重 | 行高 |
|------|------|------|------|
| 页面标题 | 24px | 700 | 1.3 |
| 卡片标题 | 16px | 600 | 1.4 |
| 正文 | 14px | 400 | 1.5 |
| 次要文字 | 13px | 400 | 1.5 |
| 辅助文字 | 12px | 400 | 1.4 |
| 标签 | 11px | 500 | 1.3 |

### 3.3 数字显示
- 所有数据使用等宽字体
- 千位分隔符：`toLocaleString()`
- 金额保留 4 位小数
- 百分比保留 1 位小数

---

## 4. 间距系统

### 4.1 基础单位
- 基准值：`4px`
- 所有间距为 4 的倍数

### 4.2 间距等级
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### 4.3 使用规范
- 卡片内边距：`24px`
- 卡片间距：`20px`（小屏）、`32px`（大屏）
- 页面边距：`32px`
- 元素间距：同级元素使用统一间距

---

## 5. 组件规范

### 5.1 卡片（Card）
```css
border-radius: 16px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
border: none;
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* 悬停状态 */
transform: translateY(-2px);
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
```

### 5.2 按钮（Button）
```css
/* 主按钮 */
background: var(--gradient-success);
border-radius: 8px;
padding: 10px 24px;
font-weight: 600;
box-shadow: 0 4px 12px rgba(0, 184, 148, 0.3);

/* 悬停 */
transform: translateY(-1px);
box-shadow: 0 6px 16px rgba(0, 184, 148, 0.4);
```

### 5.3 表格（Table）
```css
/* 表头 */
background: #fafbfc;
font-size: 12px;
text-transform: uppercase;
letter-spacing: 0.5px;
font-weight: 600;

/* 行 */
row-hover: #f5f7fa;
cell-padding: 16px 24px;

/* 边框 */
border-radius: 12px;
overflow: hidden;
```

### 5.4 标签（Tag）
```css
border-radius: 6px;
padding: 4px 12px;
font-weight: 500;
font-size: 12px;
```

### 5.5 统计卡片（Stat Card）
```css
/* 图标容器 */
width: 56px;
height: 56px;
border-radius: 14px;
display: flex;
align-items: center;
justify-content: center;
font-size: 24px;

/* 数值 */
font-size: 32px;
font-weight: 700;
font-family: var(--font-mono);
```

---

## 6. 布局规范

### 6.1 侧边栏
```css
width: 260px;
collapsed-width: 80px;
background: var(--gradient-dark);
border-right: none;
box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
```

### 6.2 顶部导航
```css
height: 64px;
background: #ffffff;
border-bottom: 1px solid #e8ecef;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
padding: 0 32px;
```

### 6.3 内容区域
```css
background: #f5f7fa;
padding: 32px;
min-height: calc(100vh - 64px);
max-width: 1400px;
margin: 0 auto;
```

### 6.4 响应式断点
```css
/* 桌面 */
@media (min-width: 1200px) { }

/* 平板 */
@media (max-width: 1199px) { }

/* 手机 */
@media (max-width: 767px) { }
```

---

## 7. 动画规范

### 7.1 过渡曲线
```css
/* 标准 */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

/* 弹性 */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 7.2 动画时长
| 类型 | 时长 |
|------|------|
| 微交互 | 150ms |
| 组件过渡 | 300ms |
| 页面切换 | 400ms |
| 复杂动画 | 600ms |

### 7.3 关键帧动画
```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 滑入 */
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}

/* 缩放 */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

---

## 8. 可访问性

### 8.1 对比度
- 正文文字：≥ 4.5:1
- 大文字：≥ 3:1
- UI 组件：≥ 3:1

### 8.2 焦点状态
- 所有可交互元素必须有焦点样式
- 焦点环宽度：2px
- 焦点环颜色：主色或深色

### 8.3 键盘导航
- Tab 键顺序合理
- Escape 关闭弹窗
- Enter/Space 触发按钮

---

## 9. 性能规范

### 9.1 加载性能
- 首屏加载 < 3s
- 首次有意义绘制 < 1.5s
- 资源压缩：CSS/JS 使用 gzip

### 9.2 渲染性能
- 动画使用 CSS transform/opacity
- 避免布局抖动（Layout Thrashing）
- 大列表使用虚拟滚动

### 9.3 资源优化
- 图片使用 WebP 格式
- 图标使用 SVG Sprite
- 字体使用子集化

---

## 10. 文件结构

```
sls-cost-analyzer/
├── src/
│   ├── components/        # 可复用组件
│   ├── pages/            # 页面组件
│   ├── styles/           # 全局样式
│   │   ├── variables.css # CSS 变量
│   │   ├── base.css      # 基础样式
│   │   └── components.css # 组件样式
│   ├── utils/            # 工具函数
│   └── types/            # TypeScript 类型
├── public/               # 静态资源
└── DESIGN_GUIDELINES.md  # 设计规范文档
```

---

## 11. 检查清单

### 开发前
- [ ] 确认设计符合本规范
- [ ] 准备所需组件和样式
- [ ] 确认响应式需求

### 开发中
- [ ] 使用 CSS 变量而非硬编码
- [ ] 遵循间距系统
- [ ] 添加适当的过渡动画

### 开发后
- [ ] 检查色彩对比度
- [ ] 测试键盘导航
- [ ] 验证响应式布局
- [ ] 性能测试（Lighthouse）

---

*版本：1.0 | 更新日期：2026-04-22*
