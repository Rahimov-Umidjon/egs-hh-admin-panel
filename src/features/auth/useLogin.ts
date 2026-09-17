import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/features/auth/AuthContext"
import type { ActorType } from "@/types"

export interface LoginPayload {
  email: string
  password: string
}

interface CarrierLoginResponse {
  data: {
    token: string
    carrier: { id: number; name: string; email: string }
  }
}

interface ClientLoginResponse {
  data: {
    token: string
    client: { id: number; name: string; email: string }
  }
}

async function loginCarrier(payload: LoginPayload) {
  // Laravel API: POST /api/auth/login — { token, carrier } qaytaradi (Sanctum token)
  const { data } = await api.post<CarrierLoginResponse>("/auth/login", payload)
  return { token: data.data.token, user: data.data.carrier }
}

async function loginClient(payload: LoginPayload) {
  // Client API: POST /api/client/auth/login — { token, client } qaytaradi
  const { data } = await api.post<ClientLoginResponse>("/client/auth/login", payload)
  return { token: data.data.token, user: data.data.client }
}

export function useLogin(actorType: ActorType) {
  const { setAuth } = useAuth()

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      actorType === "client" ? loginClient(payload) : loginCarrier(payload),
    onSuccess: ({ token, user }) => {
      setAuth(token, user, actorType)
    },
  })
}
