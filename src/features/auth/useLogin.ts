import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth, type AuthUser } from "@/features/auth/AuthContext"

export interface LoginPayload {
  email: string
  password: string
}

interface LoginResponse {
  data: {
    token: string
    carrier: AuthUser
  }
}

async function login(payload: LoginPayload): Promise<LoginResponse> {
  // Laravel API: POST /api/login — { token, user } qaytaradi (Sanctum personal access token)
  const { data } = await api.post<LoginResponse>("/auth/login", payload)
  console.log(data)
  return data
}

export function useLogin() {
  const { setAuth } = useAuth()

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.data.token, data.data.carrier
      )
    },
  })
}
