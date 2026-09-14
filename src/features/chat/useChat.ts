import { chatApi, type SendMessagePayload } from "@/lib/chat.api"
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const chatKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatKeys.all, "conversations"] as const,
  conversationsList: (page: number) => [...chatKeys.conversations(), "list", page] as const,
  conversationsSearch: (q: string) => [...chatKeys.conversations(), "search", q] as const,
  conversation: (id: number) => [...chatKeys.all, "conversation", id] as const,
  messageSearch: (id: number, q: string) => [...chatKeys.conversation(id), "search", q] as const,
  unreadStats: () => [...chatKeys.all, "unread-stats"] as const,
}

export function useConversations(page = 1) {
  return useQuery({
    queryKey: chatKeys.conversationsList(page),
    queryFn: () => chatApi.getConversations(page),
    placeholderData: keepPreviousData,
    refetchInterval: 15000,
  })
}

export function useConversationSearch(q: string) {
  return useQuery({
    queryKey: chatKeys.conversationsSearch(q),
    queryFn: () => chatApi.searchConversations(q),
    enabled: q.trim().length > 0,
    placeholderData: keepPreviousData,
  })
}

// Bet 1 — eng yangi xabarlar. Yuqoriga scroll qilinganda `fetchNextPage()` chaqirilib,
// keyingi (eskiroq) bet backenddan olib kelinadi va ro'yxat boshiga qo'shiladi.
export function useConversationMessages(id: number | null) {
  return useInfiniteQuery({
    queryKey: chatKeys.conversation(id ?? 0),
    queryFn: ({ pageParam }) => chatApi.getConversation(id as number, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.data.current_page < lastPage.data.last_page
        ? lastPage.data.current_page + 1
        : undefined,
    enabled: id !== null,
    // Yangi xabarlar endi Pusher (useConversationChannel) orqali real-time keladi —
    // bu faqat ulanish uzilib qolgan holatlar uchun zaxira pollash.
    refetchInterval: 20000,
  })
}

export function useMessageSearch(conversationId: number | null, q: string) {
  return useQuery({
    queryKey: chatKeys.messageSearch(conversationId ?? 0, q),
    queryFn: () => chatApi.searchMessages(conversationId as number, q),
    enabled: conversationId !== null && q.trim().length > 0,
  })
}

export function useUnreadStats() {
  return useQuery({
    queryKey: chatKeys.unreadStats(),
    queryFn: () => chatApi.getUnreadStats(),
    // Endi Pusher (useUnreadChannel, "chat.unread.updated") real-time yangilaydi —
    // bu faqat ulanish uzilib qolgan holatlar uchun zaxira pollash.
    refetchInterval: 30000,
  })
}

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => chatApi.sendMessage(conversationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversation(conversationId) })
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
    },
    onError: () => toast.error("Xabar yuborishda xatolik yuz berdi"),
  })
}

export function useUpdateMessage(conversationId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      chatApi.updateMessage(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversation(conversationId) })
    },
    onError: () => toast.error("Xabarni tahrirlashda xatolik yuz berdi"),
  })
}

export function useDeleteMessage(conversationId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => chatApi.deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversation(conversationId) })
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
    },
    onError: () => toast.error("Xabarni o'chirishda xatolik yuz berdi"),
  })
}

export function useMuteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, muted }: { id: number; muted: boolean }) =>
      muted ? chatApi.unmute(id) : chatApi.mute(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations() }),
    onError: () => toast.error("Amalni bajarishda xatolik yuz berdi"),
  })
}

export function usePinConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, pinned }: { id: number; pinned: boolean }) =>
      pinned ? chatApi.unpin(id) : chatApi.pin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations() }),
    onError: () => toast.error("Amalni bajarishda xatolik yuz berdi"),
  })
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => chatApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadStats() })
    },
  })
}
