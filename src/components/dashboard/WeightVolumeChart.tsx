import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export interface WeightVolumeDatum {
  key: string
  label: string
  weight: number
  volume: number
}

interface WeightVolumeChartProps {
  data: WeightVolumeDatum[]
  formatWeight: (value: number) => string
  formatVolume: (value: number) => string
}

function truncateLabel(value: string) {
  return value.length > 12 ? `${value.slice(0, 11)}…` : value
}

export function WeightVolumeChart({ data, formatWeight, formatVolume }: WeightVolumeChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} className="stroke-border/60" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={0}
          tick={{ fontSize: 10 }}
          tickFormatter={truncateLabel}
        />
        <YAxis
          yAxisId="weight"
          tickLine={false}
          axisLine={false}
          width={48}
          tick={{ fontSize: 9 }}
          tickFormatter={formatWeight}
        />
        <YAxis
          yAxisId="volume"
          orientation="right"
          tickLine={false}
          axisLine={false}
          width={48}
          tick={{ fontSize: 9 }}
          tickFormatter={formatVolume}
        />
        <Tooltip
          formatter={(value, name) =>
            name === "weight" ? formatWeight(Number(value)) : formatVolume(Number(value))
          }
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
        <Bar yAxisId="weight" dataKey="weight" name="weight" radius={[3, 3, 0, 0]} className="fill-blue-500" maxBarSize={26} />
        <Bar yAxisId="volume" dataKey="volume" name="volume" radius={[3, 3, 0, 0]} className="fill-violet-500" maxBarSize={26} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
