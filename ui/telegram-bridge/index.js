// OpenClaw Telegram Bridge
// 将 Telegram 指令代理到 OpenClaw Sessions API，并将 Agent 回复推送回 Telegram
'use strict'

import 'dotenv/config'
import TelegramBot from 'node-telegram-bot-api'
import fetch from 'node-fetch'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const OPENCLAW_API = process.env.OPENCLAW_API || 'http://localhost:18789'

if (!BOT_TOKEN) {
  console.error('❌ 缺少 TELEGRAM_BOT_TOKEN 环境变量')
  console.error('   请在 .env 文件中设置：TELEGRAM_BOT_TOKEN=your_token')
  process.exit(1)
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true })
console.log('🤖 Telegram Bridge 启动成功，等待指令...')

// ---------- 工具函数 ----------

/** 调用 OpenClaw Sessions API */
async function callAgent(agentId, message, sessionId) {
  const res = await fetch(`${OPENCLAW_API}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, message, session_id: sessionId }),
  })
  if (!res.ok) {
    throw new Error(`OpenClaw API 错误：${res.status} ${res.statusText}`)
  }
  return res.json()
}

/** 解析指令，返回 { agentId, message } */
function parseCommand(text) {
  // /ask <消息>                → 发送给 coordinator
  // /sales <消息>              → 发送给 sales_lead
  // /supply <消息>             → 发送给 supply_lead
  // /ops <消息>                → 发送给 ops_lead
  // /finance <消息>            → 发送给 finance_lead
  // /hr <消息>                 → 发送给 hr_trainer
  // 其他消息                   → 默认发送给 coordinator

  const cmdMap = {
    '/ask':     'coordinator',
    '/sales':   'sales_lead',
    '/supply':  'supply_lead',
    '/ops':     'ops_lead',
    '/finance': 'finance_lead',
    '/hr':      'hr_trainer',
  }

  for (const [cmd, agentId] of Object.entries(cmdMap)) {
    if (text.startsWith(cmd + ' ') || text === cmd) {
      return { agentId, message: text.slice(cmd.length).trim() || '你好' }
    }
  }

  // 默认路由到 coordinator
  return { agentId: 'coordinator', message: text }
}

// ---------- 指令处理 ----------

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, [
    '🦀 *OpenClaw 外贸团队已就绪*',
    '',
    '可用指令：',
    '`/ask <消息>` — 发送给协调官（默认）',
    '`/sales <消息>` — 发送给销售主管',
    '`/supply <消息>` — 发送给供应链主管',
    '`/ops <消息>` — 发送给运营主管',
    '`/finance <消息>` — 发送给财务主管',
    '`/hr <消息>` — 发送给人事培训专员',
    '`/status` — 查看当前任务状态',
    '',
    '示例：',
    '`/ask 客户询盘：1000件收纳箱，预算10000美元，交期20天`',
  ].join('\n'), { parse_mode: 'Markdown' })
})

bot.onText(/\/status/, async (msg) => {
  try {
    const res = await fetch(`${OPENCLAW_API}/agents`, { method: 'GET' })
    const agents = await res.json()
    const lines = ['📊 *当前 Agent 状态*\n']
    for (const agent of agents) {
      lines.push(`• *${agent.id}*：${agent.status || '待命'}`)
    }
    bot.sendMessage(msg.chat.id, lines.join('\n'), { parse_mode: 'Markdown' })
  } catch {
    bot.sendMessage(msg.chat.id, '⚠️ 无法获取状态，请检查 OpenClaw 服务是否运行')
  }
})

// 处理所有文本消息（非指令 or 各类指令）
bot.on('message', async (msg) => {
  if (!msg.text) return
  // /start 和 /status 已单独处理
  if (msg.text === '/start' || msg.text === '/status') return

  const chatId = msg.chat.id
  const sessionId = `tg-${chatId}-${Date.now()}`
  const { agentId, message } = parseCommand(msg.text)

  if (!message) {
    bot.sendMessage(chatId, '⚠️ 请在指令后输入具体内容，例如：`/ask 帮我处理询盘`', { parse_mode: 'Markdown' })
    return
  }

  // 发送"处理中"提示
  const loadingMsg = await bot.sendMessage(chatId, `⏳ 正在转发给 *${agentId}*，请稍候...`, { parse_mode: 'Markdown' })

  try {
    const response = await callAgent(agentId, message, sessionId)

    // 提取 Agent 回复内容
    const reply = response?.reply || response?.message || JSON.stringify(response, null, 2)

    // 删除"处理中"消息
    bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {})

    // 推送 Agent 回复
    bot.sendMessage(chatId, [
      `🤖 *${agentId}* 回复：`,
      '',
      reply,
    ].join('\n'), { parse_mode: 'Markdown' })

  } catch (err) {
    bot.editMessageText(`❌ 调用失败：${err.message}`, {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
    })
  }
})

// ---------- 错误处理 ----------
bot.on('polling_error', (err) => {
  console.error('Telegram polling 错误：', err.message)
})

process.on('unhandledRejection', (err) => {
  console.error('未处理的 Promise 错误：', err)
})
