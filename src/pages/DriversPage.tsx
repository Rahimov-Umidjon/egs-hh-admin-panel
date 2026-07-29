import { useDrivers } from "@/features/drivers/useDrivers"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const statusLabel: Record<string, { text: string; variant: "default" | "secondary" | "destructive" }> = {
  verified: { text: "Tasdiqlangan", variant: "default" },
  pending: { text: "Kutilmoqda", variant: "secondary" },
  rejected: { text: "Rad etilgan", variant: "destructive" },
}

export default function DriversPage() {
  const { data: drivers, isLoading, isError } = useDrivers()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Vaditellar</h2>
        <p className="text-sm text-muted-foreground">
          Laravel API (/api/drivers) orqali olingan ro'yxat
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>}
      {isError && (
        <p className="text-sm text-destructive">
          Ma'lumotni olishda xatolik yuz berdi. Backend ishga tushirilganini tekshiring.
        </p>
      )}

      {drivers && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>F.I.O</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Mashina turi</TableHead>
              <TableHead>Yo'nalish</TableHead>
              <TableHead>Holati</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.full_name}</TableCell>
                <TableCell>{d.phone}</TableCell>
                <TableCell>{d.vehicle_type}</TableCell>
                <TableCell>{d.route ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={statusLabel[d.status]?.variant ?? "secondary"}>
                    {statusLabel[d.status]?.text ?? d.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
