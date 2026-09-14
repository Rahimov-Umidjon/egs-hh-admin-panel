import { useEffect } from "react"
import type { InfiniteData } from "@tanstack/react-query"
import { useQueryClient } from "@tanstack/react-query"

import { getPusherClient } from "@/lib/pusher"
import { chatKeys } from "@/features/chat/useChat"
import { useAuth } from "@/features/auth/AuthContext"
import type { ChatMessage, ChatMessageType, ConversationDetailResponse } from "@/types"

type ConversationCache = InfiniteData<ConversationDetailResponse, number>

interface RealtimeMessagePayload {
  id: number
  message: string | null
  type: ChatMessageType
  sender_id: number
  sender_type: string
  sender_name?: string | null
  created_at: string
  file_url: string | null
  audio_url: string | null
  latitude: string | number | null
  longitude: string | number | null
}

interface RealtimeMessageUpdatedPayload {
  id: number
  message?: string | null
  edited_at?: string | null
}

interface RealtimeMessageDeletedPayload {
  id: number
}

function toChatMessage(payload: RealtimeMessagePayload, conversationId: number): ChatMessage {
  return {
    id: payload.id,
    conversation_id: conversationId,
    reply_to_id: null,
    sender_id: payload.sender_id,
    sender_type: payload.sender_type,
    message: payload.message,
    type: payload.type,
    file_path: null,
    audio_path: null,
    latitude: payload.latitude !== null ? String(payload.latitude) : null,
    longitude: payload.longitude !== null ? String(payload.longitude) : null,
    edited_at: null,
    deleted_at: null,
    created_at: payload.created_at,
    updated_at: payload.created_at,
    file_url: payload.file_url,
    audio_url: payload.audio_url,
    sender: { id: payload.sender_id, fio: payload.sender_name ?? null },
  }
}

// Ochiq suhbatni Pusher orqali real-time kuzatadi: yangi/tahrirlangan/o'chirilgan
// xabarlarni to'g'ridan-to'g'ri React Query keshiga yozadi — qayta GET so'ramasdan.
export function useConversationChannel(conversationId: number | null) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!conversationId) return
    const pusher = getPusherClient()
    if (!pusher) return

    const channelName = `private-support.${conversationId}`
    const channel = pusher.subscribe(channelName)
    const queryKey = chatKeys.conversation(conversationId)

    const patchMessage = (
      updater: (message: ChatMessage) => ChatMessage,
      targetId: number
    ) => {
      queryClient.setQueryData<ConversationCache>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              data: page.data.data.map((m) => (m.id === targetId ? updater(m) : m)),
            },
          })),
        }
      })
    }

    const handleMessageSent = (payload: RealtimeMessagePayload) => {
      // Backend hozircha o'z yuboruvchisini (toOthers) chiqarib tashlamagani sababli,
      // o'zimiz yuborgan xabarni real-time orqali ikkinchi marta qo'shib yubormaslik
      // uchun filtrlaymiz. sender_type tekshiruvi tasodifiy id to'qnashuvidan himoya qiladi.
      if (payload.sender_type !== "driver" && payload.sender_id === user?.id) return

      const message = toChatMessage(payload, conversationId)

      queryClient.setQueryData<ConversationCache>(queryKey, (old) => {
        if (!old) return old
        const alreadyExists = old.pages.some((page) =>
          page.data.data.some((m) => m.id === message.id)
        )
        if (alreadyExists) return old

        const [firstPage, ...restPages] = old.pages
        if (!firstPage) return old

        const updatedFirstPage: ConversationDetailResponse = {
          ...firstPage,
          data: {
            ...firstPage.data,
            data: [...firstPage.data.data, message],
            total: firstPage.data.total + 1,
          },
        }
        return { ...old, pages: [updatedFirstPage, ...restPages] }
      })
    }

    const handleMessageUpdated = (payload: RealtimeMessageUpdatedPayload) => {
      patchMessage(
        (m) => ({
          ...m,
          message: payload.message ?? m.message,
          edited_at: payload.edited_at ?? new Date().toISOString(),
        }),
        payload.id
      )
    }

    const handleMessageDeleted = (payload: RealtimeMessageDeletedPayload) => {
      patchMessage((m) => ({ ...m, deleted_at: new Date().toISOString() }), payload.id)
    }

    channel.bind("support.message.sent", handleMessageSent)
    channel.bind("MessageUpdated", handleMessageUpdated)
    channel.bind("MessageDeleted", handleMessageDeleted)

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(channelName)
    }
  }, [conversationId, queryClient, user?.id])
}
