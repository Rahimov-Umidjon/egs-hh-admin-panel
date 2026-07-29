import axios from "axios"

// Laravel backend API manzili — .env faylida VITE_API_URL orqali sozlanadi
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  withCredentials: true, // Laravel Sanctum cookie-based auth uchun
  headers: {
    Accept: "application/json",
  },
})

// Token-based auth ishlatilsa (Sanctum SPA token), har bir so'rovga qo'shib yuborish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 kelsa — login sahifasiga yo'naltirish
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)
