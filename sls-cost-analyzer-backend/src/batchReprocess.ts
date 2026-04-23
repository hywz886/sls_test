/**
 * 批量重新处理脚本 - 从指定日期开始重新处理所有数据
 * 用法：npx ts-node src/batchReprocess.ts 2026-03-01
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = '/opt/data';
const API_URL = 'http://localhost:3000/api/process/daily';

async function batchReprocess(startDate: string) {
  console.log(`🚀 开始批量重新处理，起始日期：${startDate}`);
  
  // 获取所有 CSV 文件
  const allFiles = fs.readdirSync(DATA_DIR)
    .filter(f => f.startsWith('sls-cost-') && f.endsWith('.csv'))
    .map(f => {
      const date = f.replace('sls-cost-', '').replace('.csv', '');
      return { filename: f, date };
    })
    .filter(f => f.date >= startDate)
    .sort((a, b) => a.date.localeCompare(b.date));
  
  console.log(`📁 找到 ${allFiles.length} 个文件需要处理`);
  console.log(`   从 ${allFiles[0]?.date} 到 ${allFiles[allFiles.length - 1]?.date}`);
  console.log('');
  
  const results = {
    success: 0,
    failed: 0,
    errors: [] as { date: string; error: string }[],
  };
  
  for (const { filename, date } of allFiles) {
    process.stdout.write(`⏳ 处理 ${date}... `);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          date,
        }),
      });
      
      const result = await response.json() as any;
      
      if (result.success) {
        console.log('✅');
        results.success++;
        
        // 打印对比数据摘要
        const summary = result.summary;
        if (summary?.dayComparison || summary?.weekComparison || summary?.monthComparison) {
          const day = summary.dayComparison ? `${summary.dayComparison.percentChange > 0 ? '+' : ''}${summary.dayComparison.percentChange.toFixed(2)}%` : 'N/A';
          const week = summary.weekComparison ? `${summary.weekComparison.percentChange > 0 ? '+' : ''}${summary.weekComparison.percentChange.toFixed(2)}%` : 'N/A';
          const month = summary.monthComparison ? `${summary.monthComparison.percentChange > 0 ? '+' : ''}${summary.monthComparison.percentChange.toFixed(2)}%` : 'N/A';
          console.log(`   💰 ¥${summary.totalCost.toFixed(2)} | 日：${day} | 周：${week} | 月：${month}`);
        }
      } else {
        console.log('❌ ' + (result.error || '未知错误'));
        results.failed++;
        results.errors.push({ date, error: result.error || '未知错误' });
      }
    } catch (error) {
      console.log('❌ ' + (error instanceof Error ? error.message : '请求失败'));
      results.failed++;
      results.errors.push({ date, error: error instanceof Error ? error.message : '请求失败' });
    }
    
    // 添加小延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ 成功：${results.success}`);
  console.log(`❌ 失败：${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('');
    console.log('失败详情:');
    results.errors.forEach(({ date, error }) => {
      console.log(`  - ${date}: ${error}`);
    });
  }
  
  console.log('═══════════════════════════════════════════');
}

// 获取命令行参数
const startDate = process.argv[2];

if (!startDate) {
  console.error('❌ 请提供起始日期 (格式：YYYY-MM-DD)');
  console.error('示例：npx ts-node src/batchReprocess.ts 2026-03-01');
  process.exit(1);
}

// 验证日期格式
if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
  console.error('❌ 日期格式错误，请使用 YYYY-MM-DD 格式');
  process.exit(1);
}

batchReprocess(startDate).catch(error => {
  console.error('💥 批量处理失败:', error);
  process.exit(1);
});
