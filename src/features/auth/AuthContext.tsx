import { api } from "@/lib/api"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { ReactNode } from "react"
import type { ActorType, ClientProfile, CompanyProfile } from "@/types"

export interface AuthUser {
  id: number
  name: string
  email: string
  actorType: ActorType
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (token: string, user: Omit<AuthUser, "actorType">, actorType: ActorType) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = "auth_token"
const ACTOR_TYPE_KEY = "actor_type"

// Carrier va Client — ikkalasi ham bitta bearer token bilan ishlaydi, lekin
// alohida backend endpoint tagida (/auth/me vs /client/auth/me). Bir vaqtning
// o'zida faqat bitta aktyor turi bilan kirilgan bo'ladi, shu sababli bitta
// token kalitidan foydalanib, aktyor turini alohida saqlaymiz.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Refreshda tokenni tekshirib, joriy foydalanuvchini serverdan olib kelish
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const actorType = localStorage.getItem(ACTOR_TYPE_KEY) as ActorType | null

    if (!token || !actorType) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    const fetchMe = async () => {
      try {
        // interceptor Authorization header'ni o'zi qo'shadi
        if (actorType === "client") {
          const res = await api.get<{ data: ClientProfile }>("/client/auth/me")
          const profile = res.data.data
          if (!cancelled) {
            setUser({ id: profile.id, name: profile.name, email: profile.email, actorType })
          }
          return
        }

        // Backend bu yerda { data: CompanyProfile } qaytaradi (login'dagi
        // flat { id, name, email } shaklidagi AuthUser emas) — shu sababli
        // to'g'ridan-to'g'ri emas, `data.data`dan kerakli maydonlarni olamiz.
        const res = await api.get<{ data: CompanyProfile }>("/auth/me")
        const profile = res.data.data
        if (!cancelled) {
          setUser({ id: profile.id, name: profile.company_name, email: profile.email, actorType })
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

  const setAuth = useCallback(
    (token: string, user: Omit<AuthUser, "actorType">, actorType: ActorType) => {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(ACTOR_TYPE_KEY, actorType)
      setUser({ ...user, actorType })
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      if (user?.actorType === "client") {
        await api.post("/client/auth/logout")
      } else {
        await api.post("/auth/carrier-logout")
      }
    } catch {
      // Server bilan bog'lanishda xatolik bo'lsa ham, lokal sessiyani tozalaymiz
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(ACTOR_TYPE_KEY)
      setUser(null)
    }
  }, [user])

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