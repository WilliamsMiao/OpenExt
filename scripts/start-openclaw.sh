#!/bin/bash
# start-openclaw.sh — 一键启动 OpenClaw 外贸团队所有服务

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# ---------- 环境检查 ----------
echo "🔍 检查环境变量..."

if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
  echo "   ✅ 已加载 .env 文件"
fi

if [ -z "$MINIMAX_API_KEY" ]; then
  echo "   ❌ 缺少 MINIMAX_API_KEY，请在 .env 文件中配置"
  exit 1
fi
echo "   ✅ MINIMAX_API_KEY 已就位"

# ---------- 初始化 workspace ----------
echo ""
echo "📁 初始化 workspace..."
bash "$PROJECT_ROOT/scripts/init-workspace.sh"

# ---------- 启动 Docker 服务 ----------
echo ""
echo "🐳 启动 Docker 服务（openclaw + postgres + redis + dashboard）..."
docker-compose up -d openclaw postgres redis dashboard

# ---------- 等待服务就绪 ----------
echo ""
echo "⏳ 等待 OpenClaw 启动（最多 30 秒）..."
for i in $(seq 1 30); do
  if curl -s http://localhost:18789/health > /dev/null 2>&1; then
    echo "   ✅ OpenClaw 已就绪"
    break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    echo "   ⚠️  OpenClaw 启动超时，请检查日志：docker-compose logs openclaw"
  fi
done

echo ""
echo "============================================"
echo "  🎉 OpenClaw 外贸团队启动成功！"
echo "============================================"
echo ""
echo "📌 服务访问地址："
echo "   • OpenClaw API   : http://localhost:18789"
echo "   • Web Dashboard  : http://localhost:3000/workspace"
echo ""
echo "🤖 已就位的 Agent 列表："
echo "   • coordinator    — 协调官（任务调度中枢）"
echo "   • sales_lead     — 销售主管（询盘/报价）"
echo "   • supply_lead    — 供应链主管（采购/货源）"
echo "   • ops_lead       — 运营主管（排产/物流）"
echo "   • finance_lead   — 财务主管（核算/收付款）"
echo "   • hr_trainer     — 人事培训（团队管理）"
echo ""
echo "🧪 运行协作演示："
echo "   bash scripts/demo-collaboration.sh"
echo ""
echo "📂 Workspace 路径："
echo "   $PROJECT_ROOT/workspace"
echo ""
