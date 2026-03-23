#!/bin/bash
# demo-collaboration.sh — 演示完整协作链路
# 场景：客户询 1000 件收纳箱，预算 10k USD，交期 20 天

set -e

OPENCLAW_API="${OPENCLAW_API:-http://localhost:18789}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKSPACE="$PROJECT_ROOT/workspace"

echo "========================================"
echo "  📦 OpenClaw 外贸团队协作演示"
echo "========================================"
echo ""
echo "📋 场景：客户询价"
echo "   产品：收纳箱"
echo "   数量：1000 件"
echo "   预算：10,000 USD"
echo "   交期：20 天"
echo ""

# ---------- 更新 goal.md ----------
echo "📝 写入任务目标到 goal.md..."
cat > "$WORKSPACE/goal.md" << 'EOF'
# goal.md — 当前任务目标

## 活跃任务

**任务编号**：DEMO-001
**创建时间**：$(date '+%Y-%m-%d %H:%M:%S')
**状态**：进行中

## 客户需求

- 产品：收纳箱
- 数量：1,000 件
- 预算：10,000 USD（单件上限 $10）
- 交期：20 天（含生产+物流）
- 客户：Demo Customer（美国）

## 目标

完成完整询盘响应：报价 → 货源确认 → 排产评估 → 利润核算
EOF

echo "   ✅ goal.md 已更新"
echo ""

# ---------- 调用 Coordinator ----------
echo "🤖 调用 Coordinator Agent 启动协作链路..."
RESPONSE=$(curl -s -X POST "$OPENCLAW_API/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "coordinator",
    "message": "客户询盘：收纳箱 1000 件，预算 10000 USD，交期 20 天，客户来自美国。请拆解任务并调用相关 Agent 完成报价、货源确认、排产评估和利润核算，结果汇总到 status.md。",
    "session_id": "demo-001"
  }')

echo "   📨 Coordinator 响应："
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# ---------- 等待协作完成 ----------
echo "⏳ 等待 Agent 协作链路执行（15 秒）..."
sleep 15

# ---------- 展示 workspace 更新结果 ----------
echo ""
echo "========================================"
echo "  📂 workspace 文件更新结果"
echo "========================================"

for file in goal.md plan.md status.md log.md MEMORY.md; do
  echo ""
  echo "--- $file ---"
  if [ -f "$WORKSPACE/$file" ]; then
    cat "$WORKSPACE/$file"
  else
    echo "（文件不存在）"
  fi
done

echo ""
echo "========================================"
echo "  ✅ 演示完成！"
echo "========================================"
echo ""
echo "💡 查看实时可视化："
echo "   http://localhost:3000/workspace"
echo ""
