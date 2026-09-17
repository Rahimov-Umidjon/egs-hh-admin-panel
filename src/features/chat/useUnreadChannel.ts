import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { getPusherClient } from "@/lib/pusher"
import { chatKeys } from "@/features/chat/useChat"
import { useAuth } from "@/features/auth/AuthContext"
import type { UnreadStats } from "@/types"

interface RealtimeUnreadPayload {
  conversation: {
    id: number
    unread_count: number
    last_message: string | null
    created_at: string
  }
  total_unread: number
}

// Butun ilova bo'yicha o'qilmagan xabarlar sonini real-time kuzatadi (sidebar badge,
// chat ro'yxatidagi "O'qilmagan" filtri). AppSidebar'da chaqiriladi, chunki u har doim
// (barcha sahifalarda) mounted bo'ladi.
export function useUnreadChannel() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) return
    const pusher = getPusherClient()
    if (!pusher) return

    // Kanal nomi backendga kirilgan aktyor turiga (carrier/client) bog'liq —
    // shu sabab admin va mijoz panellari alohida kanallarga obuna bo'ladi.
    const channelName =
      user.actorType === "client" ? `private-client.${user.id}` : `private-carrier.${user.id}`
    const channel = pusher.subscribe(channelName)

    const handleUnreadUpdated = (payload: RealtimeUnreadPayload) => {
      queryClient.setQueryData<UnreadStats>(chatKeys.unreadStats(), (old) => {
        const base = old ?? { total: 0, unread_by_conversation: {} }
        const unread_by_conversation = {
          ...base.unread_by_conversation,
          [String(payload.conversation.id)]: payload.conversation.unread_count,
        }
        return { total: payload.total_unread, unread_by_conversation }
      })
    }

    channel.bind("chat.unread.updated", handleUnreadUpdated)

    // Ulanish holatini kuzatish — kanalga obuna bo'lish rad etilsa (masalan
    // "/broadcasting/auth" xatolik qaytarsa), buni brauzer konsolida ko'rish mumkin.
    channel.bind("pusher:subscription_error", (error: unknown) => {
      console.error(`Pusher: "${channelName}" kanaliga obuna bo'lishda xatolik`, error)
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(channelName)
    }
  }, [queryClient, user?.id])
}
