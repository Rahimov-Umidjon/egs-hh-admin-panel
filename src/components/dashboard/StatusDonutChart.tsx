import { Cell, Pie, PieChart, Tooltip } from "recharts"

export interface DonutSegment {
  key: string
  label: string
  value: number
  fillClass: string
}

interface StatusDonutChartProps {
  segments: DonutSegment[]
  size?: number
  centerLabel?: string
}

export function StatusDonutChart({ segments, size = 176, centerLabel }: StatusDonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const data = total > 0 ? segments.filter((s) => s.value > 0) : []

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={size / 2 - 24}
          outerRadius={size / 2}
          startAngle={90}
          endAngle={-270}
          stroke="none"
          isAnimationActive={false}
        >
          {data.map((entry) => (
            <Cell key={entry.key} className={entry.fillClass} />
          ))}
        </Pie>
        {total > 0 && (
          <Tooltip
            formatter={(value, name) => [value, name]}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
        )}
      </PieChart>
      {centerLabel && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold">{total}</span>
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
        </div>
      )}
    </div>
  )
}
