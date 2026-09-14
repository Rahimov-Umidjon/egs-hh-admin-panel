import { api } from "@/lib/api"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { ReactNode } from "react"
import type { CompanyProfile } from "@/types"

export interface AuthUser {
  id: number
  name: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (token: string, user: AuthUser) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = "auth_token"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Refreshda tokenni tekshirib, joriy foydalanuvchini serverdan olib kelish
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    const fetchMe = async () => {
      try {
        // interceptor Authorization header'ni o'zi qo'shadi
        // Backend bu yerda { data: CompanyProfile } qaytaradi (login'dagi
        // flat { id, name, email } shaklidagi AuthUser emas) — shu sababli
        // to'g'ridan-to'g'ri emas, `data.data`dan kerakli maydonlarni olamiz.
        // Aks holda `user` ob'ekt sifatida haqiqiy bo'lib qoladi-yu, lekin
        // `user.id` undefined bo'lib chiqadi va shunga bog'liq narsalar
        // (masalan Pusher kanaliga ulanish) sukut bilan ishlamay qoladi.
        const res = await api.get<{ data: CompanyProfile }>("/auth/me")
        const profile = res.data.data
        if (!cancelled) {
          setUser({ id: profile.id, name: profile.company_name, email: profile.email })
        }
      } catch {
        // 401 bo'lsa, response interceptor tokenni allaqachon tozalab,
        // /login ga yo'naltiradi — shunchaki local state'ni ham tozalaymiz
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchMe()

    return () => {
      cancelled = true
    }
  }, [])

  const setAuth = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token)
    setUser(user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/carrier-logout")
    } catch {
      // Server bilan bog'lanishda xatolik bo'lsa ham, lokal sessiyani tozalaymiz
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, setAuth, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak")
  return ctx
}