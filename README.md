# 🦀 OpenClaw 外贸多 Agent 协作平台

基于 **OpenClaw** 框架搭建的外贸团队自动化协作系统。六个 AI Agent 分工协作，通过共享 Workspace 文件传递信息，完成从客户询盘到报价、供应链评估、排产、财务核算的全链路处理，并通过 Web Dashboard 实时可视化整个协作过程。

---

## 目录

- [系统架构](#系统架构)
- [环境要求](#环境要求)
- [快速启动](#快速启动)
- [目录结构](#目录结构)
- [Agent 说明](#agent-说明)
- [Workspace 文件规范](#workspace-文件规范)
- [Dashboard 使用指南](#dashboard-使用指南)
- [API 接口文档](#api-接口文档)
- [配置说明](#配置说明)
- [开发与测试](#开发与测试)
- [常见问题](#常见问题)

---

## 系统架构

```
┌──────────────────────────────────────────────────────────┐
│                    Web Dashboard :3000                    │
│   SystemStatusBar · WorkflowGraph · AgentCards           │
│   TaskInput · PlanViewer · LogViewer · MemoryTimeline    │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTP / 15s 轮询
┌─────────────────────▼────────────────────────────────────┐
│              Next.js API Routes                          │
│   /api/workspace  /api/system  /api/task                 │
└──────┬──────────────────────────────────┬───────────────┘
       │ 读取 / 写入                        │ HTTP
┌──────▼──────────┐               ┌────────▼───────────────┐
│  workspace/     │               │  OpenClaw Runtime :18789│
│  goal.md        │◄──────────────│  6 个 AI Agent          │
│  status.md      │  read/write   │  MiniMax LLM 模型        │
│  plan.md        │               └────────────────────────┘
│  log.md         │
│  MEMORY.md      │
└─────────────────┘
       ▲
       │ 持久化
┌──────┴──────────┐
│  PostgreSQL      │  ←  会话状态
│  Redis           │  ←  消息队列
└─────────────────┘
```

**协作流程**：用户向 Coordinator 提交询盘任务 → Coordinator 读取 goal.md，拆解任务并通过 `sessions_send` 分发给各子 Agent → 各 Agent 各司其职，将结果写入 status.md → Coordinator 汇总后更新 MEMORY.md → Dashboard 实时反映全程状态。

---

## 环境要求

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| Docker | 24.0+ | 容器运行时 |
| Docker Compose | 2.20+ | 多服务编排 |
| MiniMax API Key | — | 驱动 LLM，在 [minimax.chat](https://www.minimax.chat) 申请 |

无需本地安装 Node.js / Python，所有服务均在容器内运行。

---

## 快速启动

### 第一步：克隆并配置环境变量

```bash
git clone <repo-url>
cd OpenExt

# 复制环境变量模板
cp .env.example .env

# 编辑 .env，填入你的 MiniMax API Key
# MINIMAX_API_KEY=your_key_here
```

### 第二步：一键启动

```bash
bash scripts/start-openclaw.sh
```

脚本会自动完成：
1. 检查环境变量
2. 初始化 workspace 文件
3. 启动 Docker 服务（openclaw + postgres + redis + dashboard）
4. 等待服务健康检查通过

### 第三步：访问 Dashboard

打开浏览器访问：**http://localhost:3000**

### 第四步（可选）：运行协作演示

```bash
bash scripts/demo-collaboration.sh
```

演示场景：`1000 件收纳箱询盘，预算 10k USD，交期 20 天`，触发完整协作链路。

### 手动启动各组件

```bash
# 仅启动核心服务（不含 Dashboard）
docker compose up -d openclaw postgres redis

# 启动全部服务（含 Dashboard）
docker compose up -d

# 启用 Telegram 接入（需配置 TELEGRAM_BOT_TOKEN）
docker compose --profile telegram up -d

# 查看日志
docker compose logs -f openclaw
docker compose logs -f dashboard

# 停止所有服务
docker compose down
```

---

## 目录结构

```
OpenExt/
├── .env                     # 环境变量（不提交 git）
├── .env.example             # 环境变量模板
├── openclaw.json            # OpenClaw 主配置文件
├── docker-compose.yml       # Docker 多服务编排
│
├── agents/                  # Agent 人设配置
│   ├── coordinator/
│   │   └── identity.md      # Coordinator 角色定义
│   ├── sales_lead/
│   │   └── identity.md
│   ├── supply_lead/
│   │   └── identity.md
│   ├── ops_lead/
│   │   └── identity.md
│   ├── finance_lead/
│   │   └── identity.md
│   └── hr_trainer/
│       └── identity.md
│
├── workspace/               # Agent 共享工作区（核心）
│   ├── goal.md              # 当前任务目标
│   ├── status.md            # 各 Agent 实时状态
│   ├── plan.md              # 任务执行计划
│   ├── log.md               # 异常与操作日志
│   └── MEMORY.md            # 团队长期记忆
│
├── scripts/
│   ├── init-workspace.sh    # 初始化 workspace
│   ├── start-openclaw.sh    # 一键启动脚本
│   └── demo-collaboration.sh # 协作演示脚本
│
└── ui/
    ├── dashboard/           # Next.js 可视化 Dashboard
    │   ├── app/
    │   │   ├── api/
    │   │   │   ├── workspace/route.ts  # 读取 workspace 文件
    │   │   │   ├── system/route.ts     # 系统健康状态
    │   │   │   └── task/route.ts       # 提交任务
    │   │   └── workspace/page.tsx
    │   ├── components/      # 所有 UI 组件
    │   ├── lib/
    │   │   └── parseWorkspace.ts  # Markdown 解析逻辑
    │   └── types/
    │       └── dashboard.ts       # TypeScript 类型定义
    └── telegram-bridge/     # Telegram Bot 接入（可选）
```

---

## Agent 说明

系统共有 6 个 Agent，均由 Coordinator 调度协作。

### 🎯 Coordinator（协调官）
- **职责**：任务接收与拆解、Agent 调度、进度追踪、结果汇总
- **工作流程**：
  1. 读取 `goal.md` 明确用户需求
  2. 制定执行计划写入 `plan.md`
  3. 通过 `sessions_send` 依次调用子 Agent
  4. 收集各 Agent 输出汇总到 `status.md`
  5. 更新 `MEMORY.md` 沉淀知识
- **模型**：`minimax-m2.1`
- **可用工具**：`sessions_send`、`read_file`、`write_file`、`list_files`、`get_session_status`

### 💼 Sales Lead（销售主管）
- **职责**：处理客户询盘，生成初步报价单
- **输出**：报价（含单价、总价、付款条件、交期）写入 `status.md`
- **模型**：`minimax-m2.5-highspeed`（高速模型，快速响应询盘）

### 🔗 Supply Lead（供应链主管）
- **职责**：评估货源可行性，确认供应商与采购价
- **输出**：供应商报价、最低采购量、备货周期写入 `status.md`

### ⚙️ Ops Lead（运营主管）
- **职责**：排产计划评估，安排物流方案
- **输出**：生产排期、出货方式、物流时效写入 `status.md`

### 💰 Finance Lead（财务主管）
- **职责**：利润核算、收付款管理、财务风险预警
- **输出**：毛利率、净利润、财务建议写入 `status.md`

### 👥 HR Trainer（人事培训专员）
- **职责**：团队管理支持、培训材料整理、知识沉淀
- **输出**：培训记录、人员状态更新 `MEMORY.md`

---

## Workspace 文件规范

Workspace 是所有 Agent 协作的核心载体，所有通信通过读写这 5 个 Markdown 文件完成。

### `goal.md` — 任务目标

由用户或 Dashboard 写入，Coordinator 读取后开始工作。

```markdown
# Goal - 客户询盘

## 任务信息
- **提交时间**: 2026/3/23 09:00:00
- **状态**: 待处理

## 任务内容

1000件收纳箱，预算10,000 USD，交期20天，客户来自美国。
```

### `status.md` — 实时状态

各 Agent 执行完毕后写入自己的状态块，Dashboard 依据此文件渲染 AgentCard。

**标准格式**（Agent 必须遵守）：

```markdown
[agent_id] 状态：已完成
- 字段名: 字段值
- 单价: 9.50 USD/件
- 总价: 9,500 USD
- 交期: 18天
- 毛利率: 22%

[另一个agent_id] 状态：进行中
- 当前步骤: 联系供应商
```

> **状态关键词**：`已完成` / `完成` → 绿色；`进行中` / `采购中` / `排产中` → 蓝色；`异常` / `失败` → 红色；其他 → 灰色待命

### `plan.md` — 执行计划

由 Coordinator 制定，使用 Markdown checklist 格式，Dashboard 自动解析并显示进度百分比。

```markdown
# Plan - 任务计划

1. [x] 读取任务目标 (goal.md)
2. [x] 拆解子任务，制定分工
3. [ ] 生成报价单 → 调用 sales_lead
4. [ ] 确认货源可行性 → 调用 supply_lead
5. [ ] 评估排产计划 → 调用 ops_lead
6. [ ] 核算利润 → 调用 finance_lead
7. [ ] 汇总结果，更新 MEMORY.md
```

### `log.md` — 异常日志

记录运行过程中的异常、警告和关键操作，Dashboard 按级别分色展示。

```markdown
# log.md — 异常与操作日志

[INFO] 2026-03-23 09:01:00 Coordinator 已接收任务 DEMO-001
[WARN] 2026-03-23 09:02:30 supply_lead 供应商报价超出预算上限
[ERROR] 2026-03-23 09:05:00 ops_lead 排产系统连接超时，已重试
```

### `MEMORY.md` — 团队长期记忆

跨任务的知识沉淀，以 `##` 标题分节，Dashboard 渲染为时间线卡片。

```markdown
# MEMORY.md — 团队长期记忆

## 团队成员

| Agent ID    | 角色       |
|-------------|------------|
| coordinator | 协调官     |
| sales_lead  | 销售主管   |
...

## 2026-03-23 - 收纳箱询盘

- 最终报价: 9.50 USD/件，总价 9,500 USD
- 交期: 18 天
- 客户反馈: 待确认
```

---

## Dashboard 使用指南

访问 **http://localhost:3000** 打开 Dashboard。

### 顶部状态栏

```
🦀 OpenClaw  ● Live  活跃会话: 2  Token: 15.3k  [↻ 刷新] [自动 15s]
```

- **● Live** — OpenClaw 服务在线（绿色）；Degraded 降级（黄色）；Down 离线（红色）
- **活跃会话** — 近 10 分钟内有 token 消耗的 Agent 数量
- **Token** — 所有 Agent 本轮累计 token 用量

### 提交任务

点击「📝 向 Coordinator 提交新任务」展开输入框，输入任务描述后点击「提交任务」（或按 `Ctrl+Enter`）。

提交后系统会：
1. 将任务内容写入 `workspace/goal.md`
2. 清空 `status.md` 和 `plan.md`，等待 Agent 填入
3. Dashboard 在 15 秒内自动刷新显示最新状态

### 工作流图

以拓扑图形式展示 Coordinator + 5 个子 Agent 的当前状态：

- `○` 灰色 — 待命
- `◐` 蓝色 — 进行中
- `●` 绿色 — 已完成
- `✗` 红色 — 异常

### Agent 输出卡片

每个 Agent 一张卡，包含：
- 状态徽章（已完成 / 进行中 / 异常 / 待命）
- 结构化字段（从 status.md 解析，如单价、总价、交期）
- Token 用量进度条（接入 OpenClaw API 后显示）

### 底部标签页

| 标签 | 内容 |
|------|------|
| 📋 Plan 进度 | 进度条 + checklist，显示各步骤完成情况 |
| 🚨 日志 | 按 ERROR / WARN / INFO / DEBUG 分色，支持级别过滤 |
| 🧠 记忆时间线 | MEMORY.md 各节以时间线卡片展示 |
| 📊 原始文件 | 查看 5 个 workspace 文件的原始 Markdown 内容 |

---

## API 接口文档

Dashboard 提供三个 Next.js API Route，由 Docker 内部使用，也可直接调用调试。

### `GET /api/workspace`

读取所有 workspace 文件，返回原始内容和结构化解析数据。

**响应示例**：
```json
{
  "files": {
    "goal.md": { "content": "...", "mtime": "2026-03-23T09:00:00Z" },
    "status.md": { "content": "...", "mtime": "2026-03-23T09:05:00Z" }
  },
  "parsed": {
    "agents": [
      {
        "agentId": "sales_lead",
        "displayName": "Sales Lead",
        "emoji": "💼",
        "status": "completed",
        "statusText": "已完成",
        "fields": { "单价": "9.50 USD/件", "总价": "9,500 USD" },
        "formatError": false
      }
    ],
    "plan": {
      "items": [{ "text": "读取任务目标", "completed": true }],
      "completedCount": 2,
      "totalCount": 7,
      "percentComplete": 29
    },
    "logs": [{ "level": "INFO", "message": "Coordinator 已接收任务" }],
    "memory": [{ "title": "团队成员", "content": "..." }]
  }
}
```

### `GET /api/system`

检测 OpenClaw 服务健康状态，获取 Agent token 使用情况。

**响应示例**：
```json
{
  "health": {
    "ok": true,
    "status": "live",
    "activeSessions": 2
  },
  "agents": [
    {
      "id": "coordinator",
      "model": "minimax-m2.1",
      "inputTokens": 5200,
      "outputTokens": 1800,
      "percentUsed": 12.5,
      "lastActiveMinutesAgo": 3
    }
  ]
}
```

### `POST /api/task`

提交新任务（写入 goal.md，清空 status.md / plan.md）。

**请求体**：
```json
{ "task": "1000件收纳箱询盘，预算10,000 USD，交期20天" }
```

**成功响应**：
```json
{ "ok": true, "message": "任务已提交", "timestamp": "2026-03-23T09:00:00.000Z" }
```

**错误响应**（workspace 只读时）：
```json
{
  "error": "Workspace 目录为只读，请移除 docker-compose.yml 中 workspace 卷的 `:ro` 标志后重建容器"
}
```

---

## 配置说明

### `.env` 环境变量

```bash
# 必填：MiniMax API Key
MINIMAX_API_KEY=your_minimax_api_key_here

# 可选：PostgreSQL 密码（默认 openclaw_pass）
POSTGRES_PASSWORD=openclaw_pass

# 可选：Telegram Bot Token（启用 --profile telegram 时需要）
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

### `openclaw.json` 主配置

| 字段 | 说明 |
|------|------|
| `workspace` | Workspace 目录路径，默认 `./workspace` |
| `llm.provider` | LLM 提供商，当前为 `minimax` |
| `agents[].model` | 每个 Agent 使用的模型（coordinator 用 m2.1，sales_lead 用 m2.5-highspeed） |
| `agents[].tools` | Agent 可调用的工具列表 |
| `server.port` | OpenClaw API 监听端口，默认 18789 |

### 切换 Agent 模型

编辑 `openclaw.json`，修改对应 Agent 的 `model` 字段：

```json
{
  "id": "sales_lead",
  "model": "minimax-m2.5-highspeed"
}
```

可用模型（MiniMax）：
- `minimax-m2.1` — 通用，性价比高
- `minimax-m2.5-highspeed` — 高速，适合实时响应

---

## 开发与测试

### 运行单元测试

测试覆盖 `lib/parseWorkspace.ts` 中的全部解析逻辑（34 个用例）。

```bash
cd ui/dashboard

# 安装依赖（仅首次）
npm install

# 运行测试
npx vitest run

# 监听模式（开发时）
npx vitest
```

**测试覆盖范围**：

| 模块 | 用例数 | 覆盖点 |
|------|--------|--------|
| `parseStatusMd` | 10 | Agent 块解析、状态映射、字段提取、formatError、排序 |
| `parsePlanMd` | 7 | Checklist 识别、百分比计算、多种语法格式 |
| `parseLogMd` | 8 | 四级别识别、大小写、WARNING 别名、无格式行 |
| `parseMemoryMd` | 7 | `##` 节切分、内容提取、空节处理 |
| `AGENT_DEFINITIONS` | 2 | 数量完整性、字段非空 |

### 本地开发 Dashboard

```bash
cd ui/dashboard
npm install
npm run dev    # 访问 http://localhost:3000
```

> Dashboard 开发时默认从 `../../workspace` 读取文件（相对路径），无需启动 Docker。

### 重新构建 Dashboard 镜像

修改 Dashboard 代码后：

```bash
docker compose up -d --build dashboard
```

### 手动写入测试状态

可直接编辑 workspace 文件测试 Dashboard 解析效果：

```bash
# 写入一个 sales_lead 完成状态
cat > workspace/status.md << 'EOF'
# Status

[sales_lead] 状态：已完成
- 单价: 9.50 USD/件
- 总价: 9,500 USD
- 交期: 18天
- 毛利率: 22%

[supply_lead] 状态：进行中
- 当前步骤: 联系供应商报价
EOF
```

Dashboard 在 15 秒内自动刷新，或点击「↻ 刷新」立即更新。

---

## 常见问题

**Q: Dashboard 显示 `● Down`，无法连接到 OpenClaw？**

检查 openclaw 容器是否正常运行：
```bash
docker compose logs openclaw
docker compose ps
```

如果容器未启动，重新执行：`docker compose up -d openclaw postgres redis`

---

**Q: 提交任务时报错"Workspace 目录为只读"？**

确认 `docker-compose.yml` 中 dashboard 服务的 workspace 挂载没有 `:ro` 标志：
```yaml
volumes:
  - ./workspace:/app/workspace    # ✅ 正确
  # - ./workspace:/app/workspace:ro  # ❌ 只读，无法写入
```

修改后执行：`docker compose up -d --build dashboard`

---

**Q: Agent 执行后 Dashboard 没有更新？**

1. 检查 `workspace/status.md` 是否有内容
2. 确认 Agent 写入的格式是否符合 `[agent_id] 状态：xxx` 规范
3. 点击顶栏「↻ 刷新」手动刷新；Dashboard 默认每 15 秒自动轮询

---

**Q: 如何新增一个 Agent？**

1. 在 `agents/` 下新建目录，创建 `identity.md`
2. 在 `openclaw.json` 的 `agents` 数组中添加配置
3. 在 `ui/dashboard/lib/parseWorkspace.ts` 的 `AGENT_DEFINITIONS` 数组中追加定义（加入 `agentId`、`displayName`、`emoji`）
4. 重启 openclaw 服务：`docker compose restart openclaw`

---

**Q: 如何查看 Agent 调用日志？**

```bash
# 实时追踪 openclaw 日志
docker compose logs -f openclaw

# 查看 Dashboard 日志
docker compose logs -f dashboard
```

运行时异常也会由 Agent 写入 `workspace/log.md`，在 Dashboard「🚨 日志」标签中可见。

---

**Q: Telegram 接入如何配置？**

1. 在 `.env` 中填入 `TELEGRAM_BOT_TOKEN`
2. 启动时加上 telegram profile：
   ```bash
   docker compose --profile telegram up -d
   ```

---

## 服务端口速查

| 服务 | 端口 | 说明 |
|------|------|------|
| Dashboard | 3000 | Web 可视化界面 |
| OpenClaw API | 18789 | Agent 调用入口 |
| PostgreSQL | 5432 | 仅内部网络可访问 |
| Redis | 6379 | 仅内部网络可访问 |
