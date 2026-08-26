import { AxiosError } from "axios"

interface LaravelErrorBody {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

/**
 * Backend (Laravel) dan kelgan xatolikni foydalanuvchiga ko'rsatsa bo'ladigan
 * bitta aniq matnga aylantiradi. Validatsiya xatoliklari bo'lsa, birinchi
 * maydon xabarini qaytaradi, aks holda umumiy "message" ni ishlatadi.
 */
export function getErrorMessage(error: unknown, fallback = "Xatolik yuz berdi"): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as LaravelErrorBody | undefined

    if (data?.errors && typeof data.errors === "object") {
      const firstFieldErrors = Object.values(data.errors)[0]
      if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
        return firstFieldErrors[0]
      }
    }

    if (data?.message) return data.message

    if (error.code === "ERR_NETWORK") {
      return "Serverga ulanib bo'lmadi. Internet aloqasini tekshiring"
    }

    if (error.response?.status === 401) return "Sessiya muddati tugagan. Qayta kiring"
    if (error.response?.status === 403) return "Bu amal uchun ruxsatingiz yo'q"
    if (error.response?.status === 404) return "Ma'lumot topilmadi"
    if (error.response?.status && error.response.status >= 500) {
      return "Serverda xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring"
    }

    if (error.message) return error.message
  }

  if (error instanceof Error) return error.message

  return fallback
}

/**
 * Har bir maydon uchun alohida xatolik xabarlarini forma inputlariga
 * bog'lash uchun qaytaradi: { plate_number: "...", vin: "..." }
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof AxiosError) {
    const data = error.response?.data as LaravelErrorBody | undefined
    if (data?.errors && typeof data.errors === "object") {
      const out: Record<string, string> = {}
      for (const [field, messages] of Object.entries(data.errors)) {
        if (Array.isArray(messages) && messages.length > 0) out[field] = messages[0]
      }
      return out
    }
  }
  return {}
}