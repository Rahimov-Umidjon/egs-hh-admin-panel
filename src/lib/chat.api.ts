import { api } from "@/lib/api"
import type {
  ChatMessage,
  ChatMessageType,
  Conversation,
  ConversationDetailResponse,
  ConversationsListResponse,
  UnreadStats,
} from "@/types"

export interface SendMessagePayload {
  type: ChatMessageType
  message?: string
  latitude?: number
  longitude?: number
  file?: File
}

export const chatApi = {
  getConversations: async (page = 1) => {
    const { data } = await api.get<ConversationsListResponse>("/chat/conversations", {
      params: { page },
    })
    return data
  },

  searchConversations: async (q: string) => {
    const { data } = await api.get<{ data: Conversation[] }>("/chat/search", { params: { q } })
    return data.data
  },

  getConversation: async (id: number, page = 1) => {
    const { data } = await api.get<ConversationDetailResponse>(`/chat/conversations/${id}`, {
      params: { page },
    })
    return data
  },

  sendMessage: async (conversationId: number, payload: SendMessagePayload) => {
    const formData = new FormData()
    formData.append("type", payload.type)
    if (payload.message !== undefined) formData.append("message", payload.message)
    if (payload.latitude !== undefined) formData.append("latitude", String(payload.latitude))
    if (payload.longitude !== undefined) formData.append("longitude", String(payload.longitude))
    if (payload.file) formData.append("file", payload.file)

    const { data } = await api.post<{ data: ChatMessage }>(
      `/chat/conversations/${conversationId}/messages`,
      formData
    )
    return data.data
  },

  updateMessage: async (messageId: number, message: string) => {
    const { data } = await api.put<{ data: ChatMessage }>(`/chat/messages/${messageId}`, null, {
      params: { message },
    })
    return data.data
  },

  deleteMessage: async (messageId: number) => {
    await api.delete(`/chat/messages/${messageId}`)
  },

  searchMessages: async (conversationId: number, q: string) => {
    const { data } = await api.get<{ data: ChatMessage[] }>(
      `/chat/conversations/${conversationId}/search`,
      { params: { q } }
    )
    return data.data
  },

  mute: (id: number) => api.post(`/chat/conversations/${id}/mute`),
  unmute: (id: number) => api.post(`/chat/conversations/${id}/unmute`),
  pin: (id: number) => api.post(`/chat/conversations/${id}/pin`),
  unpin: (id: number) => api.post(`/chat/conversations/${id}/unpin`),
  markRead: (id: number) => api.post(`/chat/conversations/${id}/read`),

  getUnreadStats: async () => {
    const { data } = await api.get<{ data: UnreadStats }>("/chat/unread-stats")
    return data.data
  },
}
