#!/bin/bash

# 测试 SLS Cost Analyzer 对比功能

BASE_URL="http://localhost:3000/api"

echo "🧪 Testing SLS Cost Analyzer Comparison Feature"
echo "================================================"
echo ""

# 1. 健康检查
echo "1️⃣  健康检查..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

# 2. 获取文件列表
echo "2️⃣  获取文件列表..."
curl -s "$BASE_URL/files" | jq '.files[:5]'
echo ""

# 3. 获取对比数据（今天）
echo "3️⃣  获取今天的费用对比..."
curl -s "$BASE_URL/comparison" | jq '.'
echo ""

# 4. 获取对比数据（指定日期）
echo "4️⃣  获取指定日期的费用对比..."
curl -s "$BASE_URL/comparison?date=2026-04-17" | jq '.'
echo ""

echo "✅ 测试完成!"
