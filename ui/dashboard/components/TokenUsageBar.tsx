interface TokenUsageBarProps {
  inputTokens: number
  outputTokens: number
  percentUsed: number
}

export function TokenUsageBar({ inputTokens, outputTokens, percentUsed }: TokenUsageBarProps) {
  const pct = Math.min(100, Math.max(0, percentUsed))
  const barColor =
    pct > 80 ? 'bg-red-500' :
    pct > 60 ? 'bg-yellow-500' :
    'bg-emerald-500'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>
          In: {inputTokens.toLocaleString()} / Out: {outputTokens.toLocaleString()}
        </span>
        <span>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
