/**
 * Tests for lib/parseWorkspace.ts
 *
 * Covers: parseStatusMd · parsePlanMd · parseLogMd · parseMemoryMd
 */
import { describe, it, expect } from 'vitest'
import {
  parseStatusMd,
  parsePlanMd,
  parseLogMd,
  parseMemoryMd,
  AGENT_DEFINITIONS,
} from '../lib/parseWorkspace'

// ─────────────────────────────────────────────────────────────────────────────
// parseStatusMd
// ─────────────────────────────────────────────────────────────────────────────

describe('parseStatusMd', () => {
  // ── TC-S01: Empty file ──────────────────────────────────────────────────
  it('TC-S01: 空文件 → 所有 Agent 填充 idle', () => {
    const result = parseStatusMd('')
    expect(result).toHaveLength(AGENT_DEFINITIONS.length)
    result.forEach(a => {
      expect(a.status).toBe('idle')
      expect(a.statusText).toBe('待命')
      expect(a.formatError).toBeFalsy()
    })
  })

  // ── TC-S02: Single completed agent block ────────────────────────────────
  it('TC-S02: 单个 completed 块正确解析状态和字段', () => {
    const content = `
[sales_lead] 状态：已完成
- 单价: 10.00 USD/件
- 总价: 10,000 USD
- 交期: 20天
- 毛利率: 25%
`.trim()
    const result = parseStatusMd(content)
    const sales = result.find(a => a.agentId === 'sales_lead')!
    expect(sales).toBeDefined()
    expect(sales.status).toBe('completed')
    expect(sales.fields['单价']).toBe('10.00 USD/件')
    expect(sales.fields['总价']).toBe('10,000 USD')
    expect(sales.fields['毛利率']).toBe('25%')
    expect(sales.formatError).toBeFalsy()
    // Other agents should be idle
    const ops = result.find(a => a.agentId === 'ops_lead')!
    expect(ops.status).toBe('idle')
  })

  // ── TC-S03: Multiple agent blocks ──────────────────────────────────────
  it('TC-S03: 多个 Agent 块同时解析', () => {
    const content = `
[coordinator] 状态：进行中
- 当前步骤: 分配子任务

[supply_lead] 状态：采购中
- 供应商: ABC工厂
- 报价: 8.50 USD/件
`.trim()
    const result = parseStatusMd(content)
    const coord = result.find(a => a.agentId === 'coordinator')!
    expect(coord.status).toBe('in_progress')
    expect(coord.fields['当前步骤']).toBe('分配子任务')

    const supply = result.find(a => a.agentId === 'supply_lead')!
    expect(supply.status).toBe('in_progress')  // 采购中 → in_progress
    expect(supply.fields['供应商']).toBe('ABC工厂')
  })

  // ── TC-S04: Error status ────────────────────────────────────────────────
  it('TC-S04: "异常" 关键词映射到 error 状态', () => {
    const content = `[finance_lead] 状态：异常\n- 原因: API超时`
    const result = parseStatusMd(content)
    const finance = result.find(a => a.agentId === 'finance_lead')!
    expect(finance.status).toBe('error')
  })

  // ── TC-S05: Unrecognized format → formatError flag ──────────────────────
  it('TC-S05: 无结构化块 → coordinator 标记 formatError，其余 idle', () => {
    const content = `# Status\n这是一段普通的中文状态描述，没有 [Agent] 格式的块。`
    const result = parseStatusMd(content)
    const coord = result.find(a => a.agentId === 'coordinator')!
    expect(coord.formatError).toBe(true)
    expect(coord.rawText).toContain('普通的中文状态描述')
    // Other agents still filled in as idle
    const nonCoord = result.filter(a => a.agentId !== 'coordinator')
    nonCoord.forEach(a => expect(a.status).toBe('idle'))
  })

  // ── TC-S06: Ordering matches AGENT_DEFINITIONS ──────────────────────────
  it('TC-S06: 输出顺序与 AGENT_DEFINITIONS 一致', () => {
    const content = `
[finance_lead] 状态：完成
[coordinator] 状态：完成
[sales_lead] 状态：完成
`.trim()
    const result = parseStatusMd(content)
    const ids = result.map(a => a.agentId)
    const expectedIds = AGENT_DEFINITIONS.map(d => d.agentId)
    expect(ids).toEqual(expectedIds)
  })

  // ── TC-S07: Colon variants (：vs :) ────────────────────────────────────
  it('TC-S07: 全角/半角冒号都能识别', () => {
    const contentFullWidth = `[ops_lead] 状态：进行中`
    const contentHalfWidth = `[ops_lead] 状态:进行中`
    const r1 = parseStatusMd(contentFullWidth).find(a => a.agentId === 'ops_lead')!
    const r2 = parseStatusMd(contentHalfWidth).find(a => a.agentId === 'ops_lead')!
    expect(r1.status).toBe('in_progress')
    expect(r2.status).toBe('in_progress')
  })

  // ── TC-S08: Agent id aliases ────────────────────────────────────────────
  it('TC-S08: Agent 名称包含关键词时能匹配到定义', () => {
    const content = `[HR Trainer] 状态：完成`
    const result = parseStatusMd(content)
    const hr = result.find(a => a.agentId === 'hr_trainer')!
    expect(hr).toBeDefined()
    expect(hr.status).toBe('completed')
  })

  // ── TC-S09: Fields with bold markdown syntax ────────────────────────────
  it('TC-S09: 加粗 **key**: value 格式正确提取字段', () => {
    const content = `[coordinator] 状态：已完成\n- **任务**: 询盘处理\n- **结果**: 成功`
    const result = parseStatusMd(content)
    const coord = result.find(a => a.agentId === 'coordinator')!
    expect(coord.fields['任务']).toBe('询盘处理')
    expect(coord.fields['结果']).toBe('成功')
  })

  // ── TC-S10: "完成" (without 已) maps to completed ───────────────────────
  it('TC-S10: "完成" 单词映射到 completed', () => {
    const content = `[sales_lead] 状态：完成`
    const result = parseStatusMd(content)
    const sales = result.find(a => a.agentId === 'sales_lead')!
    expect(sales.status).toBe('completed')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// parsePlanMd
// ─────────────────────────────────────────────────────────────────────────────

describe('parsePlanMd', () => {
  // ── TC-P01: Empty ───────────────────────────────────────────────────────
  it('TC-P01: 空文件 → 0 项，0%', () => {
    const result = parsePlanMd('')
    expect(result.totalCount).toBe(0)
    expect(result.percentComplete).toBe(0)
    expect(result.items).toHaveLength(0)
  })

  // ── TC-P02: Mixed completion ────────────────────────────────────────────
  it('TC-P02: 混合完成状态，百分比计算正确', () => {
    const content = `
# Plan

1. [x] 读取目标
2. [x] 拆解任务
3. [ ] 生成报价
4. [ ] 汇总结果
5. [ ] 归档记录
`.trim()
    const result = parsePlanMd(content)
    expect(result.totalCount).toBe(5)
    expect(result.completedCount).toBe(2)
    expect(result.percentComplete).toBe(40)
    expect(result.items[0].completed).toBe(true)
    expect(result.items[0].text).toBe('读取目标')
    expect(result.items[2].completed).toBe(false)
    expect(result.items[2].text).toBe('生成报价')
  })

  // ── TC-P03: All completed → 100% ───────────────────────────────────────
  it('TC-P03: 全部完成 → 100%', () => {
    const content = `1. [x] 步骤一\n2. [x] 步骤二\n3. [x] 步骤三`
    const result = parsePlanMd(content)
    expect(result.percentComplete).toBe(100)
    expect(result.completedCount).toBe(3)
  })

  // ── TC-P04: None completed → 0% ────────────────────────────────────────
  it('TC-P04: 全部未完成 → 0%', () => {
    const content = `1. [ ] 步骤一\n2. [ ] 步骤二`
    const result = parsePlanMd(content)
    expect(result.percentComplete).toBe(0)
    expect(result.completedCount).toBe(0)
  })

  // ── TC-P05: Dash list syntax ────────────────────────────────────────────
  it('TC-P05: "- [x]" 格式（非数字列表）也能识别', () => {
    const content = `- [x] 任务A\n- [ ] 任务B`
    const result = parsePlanMd(content)
    expect(result.totalCount).toBe(2)
    expect(result.items[0].completed).toBe(true)
    expect(result.items[1].completed).toBe(false)
  })

  // ── TC-P06: Rounding ───────────────────────────────────────────────────
  it('TC-P06: 百分比四舍五入为整数', () => {
    const content = `1. [x] A\n2. [ ] B\n3. [ ] C`
    const result = parsePlanMd(content)
    // 1/3 = 33.33... → rounds to 33
    expect(result.percentComplete).toBe(33)
  })

  // ── TC-P07: Raw text preserved ─────────────────────────────────────────
  it('TC-P07: rawText 完整保留原始内容', () => {
    const content = `# Plan\n1. [x] A`
    const result = parsePlanMd(content)
    expect(result.rawText).toBe(content)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// parseLogMd
// ─────────────────────────────────────────────────────────────────────────────

describe('parseLogMd', () => {
  // ── TC-L01: Empty / placeholder file ───────────────────────────────────
  it('TC-L01: 空文件 / 占位符 → 0 条日志', () => {
    expect(parseLogMd('')).toHaveLength(0)
    expect(parseLogMd('（暂无日志记录）')).toHaveLength(0)
    expect(parseLogMd('# log.md — 异常与操作日志\n\n（暂无日志记录）')).toHaveLength(0)
  })

  // ── TC-L02: Level parsing ───────────────────────────────────────────────
  it('TC-L02: 四种日志级别正确识别', () => {
    const content = [
      '[ERROR] 连接超时',
      '[WARN] 重试次数过多',
      '[INFO] Agent sales_lead 启动',
      '[DEBUG] 原始响应: {...}',
    ].join('\n')
    const logs = parseLogMd(content)
    expect(logs).toHaveLength(4)
    expect(logs[0].level).toBe('ERROR')
    expect(logs[1].level).toBe('WARN')
    expect(logs[2].level).toBe('INFO')
    expect(logs[3].level).toBe('DEBUG')
  })

  // ── TC-L03: WARNING alias → WARN ───────────────────────────────────────
  it('TC-L03: [WARNING] 别名规范化为 WARN', () => {
    const logs = parseLogMd('[WARNING] 磁盘空间不足')
    expect(logs[0].level).toBe('WARN')
  })

  // ── TC-L04: Message content preserved ──────────────────────────────────
  it('TC-L04: 日志消息内容完整保留', () => {
    const logs = parseLogMd('[ERROR] API key 无效，请检查 .env 配置')
    expect(logs[0].message).toBe('API key 无效，请检查 .env 配置')
  })

  // ── TC-L05: Unrecognized lines → UNKNOWN level ──────────────────────────
  it('TC-L05: 无法识别格式的行 → UNKNOWN 级别', () => {
    const logs = parseLogMd('这是一条没有级别前缀的日志')
    expect(logs[0].level).toBe('UNKNOWN')
    expect(logs[0].message).toBe('这是一条没有级别前缀的日志')
  })

  // ── TC-L06: Headers filtered out ───────────────────────────────────────
  it('TC-L06: Markdown 标题行被过滤', () => {
    const content = `# 日志文件\n## 今日日志\n[INFO] 系统启动`
    const logs = parseLogMd(content)
    expect(logs).toHaveLength(1)
    expect(logs[0].level).toBe('INFO')
  })

  // ── TC-L07: Case insensitive ────────────────────────────────────────────
  it('TC-L07: 级别标识大小写不敏感', () => {
    const logs = parseLogMd('[error] 小写错误\n[Error] 首字母大写')
    expect(logs[0].level).toBe('ERROR')
    expect(logs[1].level).toBe('ERROR')
  })

  // ── TC-L08: Brackets optional ──────────────────────────────────────────
  it('TC-L08: 方括号可选（无括号格式也能识别）', () => {
    const logs = parseLogMd('ERROR 无括号的错误消息')
    expect(logs[0].level).toBe('ERROR')
    expect(logs[0].message).toBe('无括号的错误消息')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// parseMemoryMd
// ─────────────────────────────────────────────────────────────────────────────

describe('parseMemoryMd', () => {
  // ── TC-M01: Empty ───────────────────────────────────────────────────────
  it('TC-M01: 空文件 → 0 条记录', () => {
    expect(parseMemoryMd('')).toHaveLength(0)
  })

  // ── TC-M02: Level-1 heading ignored ────────────────────────────────────
  it('TC-M02: # 一级标题不产生记录，只有 ## 才切分', () => {
    const content = `# MEMORY.md\n\n## 记录一\n内容A\n\n## 记录二\n内容B`
    const records = parseMemoryMd(content)
    expect(records).toHaveLength(2)
    expect(records[0].title).toBe('记录一')
    expect(records[1].title).toBe('记录二')
  })

  // ── TC-M03: Content extracted correctly ────────────────────────────────
  it('TC-M03: 节标题下的内容正确提取', () => {
    const content = `## 询盘记录\n- 产品: 收纳箱\n- 数量: 1000件`
    const records = parseMemoryMd(content)
    expect(records[0].title).toBe('询盘记录')
    expect(records[0].content).toContain('产品: 收纳箱')
    expect(records[0].content).toContain('数量: 1000件')
  })

  // ── TC-M04: Multiple sections ──────────────────────────────────────────
  it('TC-M04: 多个 ## 节正确切分，顺序保留', () => {
    const content = [
      '## 第一节',
      '内容一',
      '## 第二节',
      '内容二',
      '## 第三节',
      '内容三',
    ].join('\n')
    const records = parseMemoryMd(content)
    expect(records).toHaveLength(3)
    expect(records[0].title).toBe('第一节')
    expect(records[2].title).toBe('第三节')
  })

  // ── TC-M05: Raw text preserved ─────────────────────────────────────────
  it('TC-M05: rawText 包含原始 ## 块', () => {
    const content = `## 测试节\n测试内容`
    const records = parseMemoryMd(content)
    expect(records[0].rawText).toContain('## 测试节')
    expect(records[0].rawText).toContain('测试内容')
  })

  // ── TC-M06: Empty section body ─────────────────────────────────────────
  it('TC-M06: 空节内容不报错，content 为空字符串', () => {
    const content = `## 空节\n\n## 有内容节\n内容`
    const records = parseMemoryMd(content)
    expect(records).toHaveLength(2)
    expect(records[0].content).toBe('')
  })

  // ── TC-M07: Real MEMORY.md format ──────────────────────────────────────
  it('TC-M07: 实际 MEMORY.md 格式（协作记录 + 待跟进）', () => {
    const content = `
# MEMORY.md - 团队记忆

## 协作记录

### 2024-XX-XX - 询盘处理
- **任务**: 1000件收纳箱询盘
- **报价**: 10.00 USD/件

## 待跟进
- 等待客户确认规格
`.trim()
    const records = parseMemoryMd(content)
    expect(records).toHaveLength(2)
    expect(records[0].title).toBe('协作记录')
    expect(records[1].title).toBe('待跟进')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AGENT_DEFINITIONS invariants
// ─────────────────────────────────────────────────────────────────────────────

describe('AGENT_DEFINITIONS', () => {
  it('TC-A01: 包含全部6个预定义 Agent', () => {
    const ids = AGENT_DEFINITIONS.map(a => a.agentId)
    expect(ids).toContain('coordinator')
    expect(ids).toContain('sales_lead')
    expect(ids).toContain('supply_lead')
    expect(ids).toContain('ops_lead')
    expect(ids).toContain('finance_lead')
    expect(ids).toContain('hr_trainer')
    expect(ids).toHaveLength(6)
  })

  it('TC-A02: 每个 Agent 有 emoji、displayName、agentId', () => {
    AGENT_DEFINITIONS.forEach(a => {
      expect(a.emoji).toBeTruthy()
      expect(a.displayName).toBeTruthy()
      expect(a.agentId).toBeTruthy()
    })
  })
})
