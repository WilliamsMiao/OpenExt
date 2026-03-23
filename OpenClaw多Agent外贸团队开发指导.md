# OpenClaw多Agent外贸团队开发

你是专业开发者，需严格遵循以下提示，高效、精准完成OpenClaw多Agent外贸团队项目开发，全程100%贴合OpenClaw原生规范，不冗余、不偏离，确保2小时内落地可运行，所有输出物符合标准。

## 一、开发前置要求（必遵循）

- 开发模式：高效落地，不做多余设计，聚焦核心功能，优先保证可运行性；

- 核心原则：100% OpenClaw原生开发，不自定义runtime、不发明轮子，最小化自定义内容；

- 项目基准：严格对照“OpenClaw多Agent外贸团队开发方案（精简版）”的项目结构、架构设计、开发阶段要求，不遗漏任何核心环节；

- 协作核心：以workspace为核心载体，确保所有Agent协作轨迹可在workspace文件（MEMORY.md、goal.md等）中体现，保证透明度。

## 二、分模块开发具体提示（按优先级推进）

### 模块1：基础设施搭建（优先完成）

1. 配置openclaw.json（核心配置文件）
        

    - 指定workspace路径为“./workspace”；

    - 完整配置6个Agent（coordinator、hr_trainer、sales_lead、supply_lead、ops_lead、finance_lead）；

    - 每个Agent需明确配置：identity路径（对应agents目录下的identity.md）、可调用工具（参考方案要求，如coordinator需包含sessions_send、read_file、write_file等）、模型（coordinator用minimax-m2.1，sales_lead用minimax-m2.5-highspeed）；

    - 默认LLM配置为minimax，api_key引用环境变量“${MINIMAX_API_KEY}”；

    - 配置格式规范，无语法错误，可直接被OpenClaw官方镜像识别。

2. 配置docker-compose.yml
        

    - 使用OpenClaw官方镜像“openclaw/runtime:latest-arm64”；

    - 暴露端口18789（OpenClaw API端口）；

    - 挂载当前目录为/workspace（即项目根目录映射到容器内OpenClaw workspace）；

    - 配置环境变量：OPENCLAW_HOME=/workspace、MINIMAX_API_KEY=${MINIMAX_API_KEY}；

    - 包含postgres、redis服务（基础配置即可，保证OpenClaw正常运行）；

    - 格式符合yaml规范，可直接通过docker-compose up启动。

3. 编写init-workspace.sh脚本
        

    - 脚本可直接执行，初始化workspace目录下5个核心MD文件（MEMORY.md、goal.md、plan.md、status.md、log.md）；

    - MEMORY.md中写入基础团队信息（当前Agent列表、协作规则）；

    - goal.md初始内容为“暂无活跃目标”，其他文件初始化空内容即可；

    - 脚本添加执行权限，无语法错误。

### 模块2：Agent人设配置与协作Demo

1. 编写6个Agent的identity.md（agents目录下对应文件夹内）
        

    - 每个Agent的人设简洁明确，聚焦核心职责，不冗余、不越权；

    - Coordinator：明确“读goal.md→拆任务→sessions_send调用Agent→汇总status.md→更新MEMORY.md”的协作流程；

    - Sales Lead：聚焦询盘接收、报价生成、写入status.md，明确不负责采购、生产等非本职工作；

    - HR_Trainer、Supply Lead、Ops Lead、Finance Lead：按方案中职责撰写，明确核心操作和协作方式；

    - 语言简洁，符合AI Agent人设规范，可直接被OpenClaw识别调用。

2. 编写demo-collaboration.sh脚本
        

    - 模拟客户询盘场景（如“客户询 1000 件收纳箱，预算 10k USD，交期 20 天”）；

    - 通过curl命令POST请求调用Coordinator Agent（地址http://localhost:18789/sessions）；

    - 脚本执行后，可触发完整协作链路（Coordinator拆任务→调用Sales Lead→更新status.md等workspace文件）；

    - 脚本无语法错误，执行后可直观看到workspace文件的更新痕迹。

### 模块3：用户界面开发

1. Web Dashboard（ui/dashboard目录）
        

    - 实现workspace下5个核心MD文件的实时可视化展示；

    - 支持Markdown渲染、文件diff高亮（显示Agent操作痕迹）、手动刷新功能；

    - 访问路径为http://localhost:3000/workspace，界面简洁，聚焦文件展示，无需多余美化；

    - 代码可直接运行，依赖项明确，可配合OpenClaw服务正常访问。

2. Telegram桥接（ui/telegram-bridge目录）


    - 实现Telegram指令与OpenClaw sessions的代理功能；

    - 用户通过Telegram向@coordinator_bot发送指令（如“处理订单 #123”），可转化为POST请求调用对应Agent；

    - 支持实时将Agent的协作回复、状态更新推送至Telegram，确保用户可远程下达指令、查看进度。

3. 完善启动引导（scripts/start-openclaw.sh）
        

    - 脚本执行后，输出清晰的启动成功提示，包含：Workspace访问路径、Telegram机器人地址、测试脚本路径；

    - 明确提示当前已就位的Agent列表，方便用户快速验证；

    - 脚本可一键启动所有服务（OpenClaw、DB、Redis、Web Dashboard）。

## 三、输出物要求

1. 完整可运行的openclaw.json配置文件（无语法错误，配置齐全）；

2. 6个Agent对应的identity.md文件（agents目录下，职责明确、符合规范）；

3. 完整可运行的docker-compose.yml配置文件（可直接启动所有服务）；

4. Web Dashboard完整代码（ui/dashboard目录，可正常访问、实时展示）；

5. Telegram桥接完整代码（ui/telegram-bridge目录，可正常代理指令、推送消息）；

6. 3个脚本文件（start-openclaw.sh、init-workspace.sh、demo-collaboration.sh），均可直接执行；

## 四、关键约束与验证要求

- 运行验证：启动所有服务后，执行demo-collaboration.sh，需能看到完整协作链路，workspace文件实时更新；

- 规范验证：所有文件路径、命名、配置均严格遵循方案中的项目结构，不随意修改；

- coding要求：不做冗余设计、不写无用代码，聚焦“可运行、可验证、贴合需求”，高效落地。



严格按上述提示执行，完成所有开发任务和输出物，确保项目可正常运行，符合OpenClaw原生规范和用户需求，不遗漏任何核心环节。
> （注：文档部分内容可能由 AI 生成）