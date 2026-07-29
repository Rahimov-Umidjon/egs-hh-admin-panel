import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

const stats = [
  { label: "Faol yuklar", value: "128" },
  { label: "Faol vaditellar", value: "342" },
  { label: "Kutilayotgan verifikatsiya", value: "17" },
  { label: "Bugungi reyslar", value: "54" },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Bosh sahifa</h2>
        <p className="text-sm text-muted-foreground">
          Tizimning umumiy holati bo'yicha qisqacha ma'lumot
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl">{s.value}</CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </div>
  )
}
