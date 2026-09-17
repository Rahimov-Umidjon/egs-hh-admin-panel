import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Backend rasm manzillarini ba'zan noto'g'ri host (masalan "localhost") bilan
// qaytaradi, aslida API boshqa manzilda ishlaydi (VITE_API_URL). Shu holatda
// rasm manzilini haqiqiy API hosti bilan almashtiramiz, aks holda o'zgartirmasdan
// qaytaramiz.
export function fixAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const apiUrl = new URL(import.meta.env.VITE_API_URL ?? "http://localhost:8000/api")
    const parsed = new URL(url)

    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      parsed.protocol = apiUrl.protocol
      parsed.host = apiUrl.host
      return parsed.toString()
    }

    return url
  } catch {
    return url
  }
}
