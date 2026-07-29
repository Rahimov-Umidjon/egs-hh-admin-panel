import { api } from "@/lib/api"
import { useMutation } from "@tanstack/react-query"

// NOTE: import yo'lini o'zingizning axios/fetch klientingizga moslang.
// useLogin.ts qayerdan api instance import qilgan bo'lsa, xuddi shu joydan oling. 

export interface RegisterLocationPayload {
  name: string
  address_line1: string
  address_line2?: string
  city: string
  region: string
  zip: string
  phone: string
  email: string
}

export interface RegisterPayload {
  company_name: string
  obo_company_name: string
  state_incorporated: string
  website: string
  business_started_at: string // "YYYY-MM-DD"

  email: string
  username: string

  tin: number | null

  password: string
  password_confirmation: string

  security_question: string
  security_answer: string

  agreed_terms: boolean

  location: RegisterLocationPayload
}

export interface RegisterResponse {
  message: string
  user?: {
    id: number
    email: string
    username: string
  }
  token?: string
}

async function registerRequest(payload: RegisterPayload) {
  const { data } = await api.post<RegisterResponse>(
    "/auth/register",
    payload
  )
  return data
}

export function useRegister() {
  return useMutation({
    mutationFn: registerRequest,
  })
}