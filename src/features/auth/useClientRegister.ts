import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { ClientType } from "@/types"

export interface ClientRegisterPayload {
  name: string
  inn: string
  email: string
  password: string
  password_confirmation: string
  type: ClientType
  website?: string
  contact_person_name?: string
  contact_person_phone?: string
  phone_number?: string
  address?: string
}

export interface ClientRegisterResponse {
  success: boolean
  message: string
  data?: unknown
}

async function registerClientRequest(payload: ClientRegisterPayload) {
  // Client API: POST /api/client/auth/register — Client status "pending" bilan yaratiladi
  const { data } = await api.post<ClientRegisterResponse>(
    "/client/auth/register",
    payload
  )
  return data
}

export function useClientRegister() {
  return useMutation({
    mutationFn: registerClientRequest,
  })
}
