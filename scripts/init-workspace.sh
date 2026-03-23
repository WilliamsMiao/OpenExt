#!/bin/bash
# init-workspace.sh — 初始化 OpenClaw workspace 核心 MD 文件

set -e

WORKSPACE_DIR="$(cd "$(dirname "$0")/.." && pwd)/workspace"

echo "🚀 初始化 OpenClaw workspace..."
mkdir -p "$WORKSPACE_DIR"

# ---------- MEMORY.md ----------
cat > "$WORKSPACE_DIR/MEMORY.md" << 'EOF'
# MEMORY.md — 团队长期记忆

## 团队成员

| Agent ID       | 角色           | 核心职责                         |
|----------------|----------------|----------------------------------|
| coordinator    | 协调官         | 任务拆解、Agent调度、状态汇总     |
| sales_lead     | 销售主管       | 询盘处理、报价生成、订单跟进     |
| supply_lead    | 供应链主管     | 货源评估、采购计划、供应商管理   |
| ops_lead       | 运营主管       | 排产计划、物流安排、出货跟进     |
| finance_lead   | 财务主管       | 利润核算、收付款管理、财务预警   |
| hr_trainer     | 人事培训专员   | 人员管理、培训支持、知识沉淀     |

## 协作规则

1. 所有任务由 Coordinator 统一接收并拆解；
2. 各 Agent 完成子任务后，必须更新 `status.md`；
3. 异常情况统一写入 `log.md`，并通知 Coordinator；
4. 任务完成后，Coordinator 更新本文件（MEMORY.md）进行知识沉淀。

## 历史任务记录

（暂无历史任务）

## 财务汇总

（暂无数据）
EOF

# ---------- goal.md ----------
cat > "$WORKSPACE_DIR/goal.md" << 'EOF'
# goal.md — 当前任务目标

暂无活跃目标

---
> 由 Coordinator 在接收新任务时更新本文件。
EOF

# ---------- plan.md ----------
cat > "$WORKSPACE_DIR/plan.md" << 'EOF'
# plan.md — 任务执行计划

（等待 Coordinator 写入计划）
EOF

# ---------- status.md ----------
cat > "$WORKSPACE_DIR/status.md" << 'EOF'
# status.md — 实时任务状态

（等待各 Agent 写入执行状态）
EOF

# ---------- log.md ----------
cat > "$WORKSPACE_DIR/log.md" << 'EOF'
# log.md — 异常与操作日志

（暂无日志记录）
EOF

echo "✅ workspace 初始化完成，已创建以下文件："
ls -1 "$WORKSPACE_DIR"
