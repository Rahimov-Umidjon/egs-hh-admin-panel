import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Bell,
  BellOff,
  Check,
  Loader2,
  MapPin,
  MessageSquare,
  Mic,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Pin,
  PinOff,
  Search,
  Send,
  Square,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import {
  useConversationMessages,
  useConversations,
  useConversationSearch,
  useDeleteMessage,
  useMarkConversationRead,
  useMessageSearch,
  useMuteConversation,
  usePinConversation,
  useSendMessage,
  useUnreadStats,
  useUpdateMessage,
} from "@/features/chat/useChat"
import { useConversationChannel } from "@/features/chat/useConversationChannel"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { ChatLocationPickerDialog } from "@/components/ChatLocationPickerDialog"
import { ChatLocationPreview } from "@/components/ChatLocationPreview"
import { useAuth } from "@/features/auth/AuthContext"
import type { ChatMessage, Conversation } from "@/types"

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function formatRelativeTime(iso: string | null, locale: string) {
  if (!iso) return ""
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "hozir"
  if (diffMin < 60) return `${diffMin}m`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}s`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}k`
  return date.toLocaleDateString(locale)
}

function formatDateSeparator(iso: string, locale: string, t: (key: string) => string) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return t("chat.today")
  if (date.toDateString() === yesterday.toDateString()) return t("chat.yesterday")
  return date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
}

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function audioFileExtension(mimeType: string) {
  if (mimeType.includes("mp4")) return "m4a"
  if (mimeType.includes("ogg")) return "ogg"
  return "webm"
}

// Chat sahifasi carrier va client panellari o'rtasida umumiy — shuning uchun "mening
// xabarim"ni sender_type ("driver" bo'lmasa "biz") bilan emas, joriy foydalanuvchi
// id'siga solishtirib aniqlaymiz (tasodifiy id to'qnashuvidan himoya uchun sender_type
// tekshiruvi ham saqlab qolinadi).
function isOutgoing(message: ChatMessage, userId?: number) {
  return message.sender_type !== "driver" && message.sender_id === userId
}

export default function ChatPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language || "uz"
  const { user } = useAuth()

  const [tab, setTab] = useState<"all" | "unread">("all")
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 350)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [messageSearchOpen, setMessageSearchOpen] = useState(false)
  const [messageSearchQuery, setMessageSearchQuery] = useState("")
  const debouncedMessageSearch = useDebouncedValue(messageSearchQuery, 350)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null)

  const [composerText, setComposerText] = useState("")
  const [composerFile, setComposerFile] = useState<File | null>(null)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const recorder = useAudioRecorder()

  const isSearchingConversations = debouncedSearch.trim().length > 0
  const conversationsQuery = useConversations(1)
  const conversationSearchQuery = useConversationSearch(debouncedSearch)
  const unreadStatsQuery = useUnreadStats()

  const conversations: Conversation[] = isSearchingConversations
    ? conversationSearchQuery.data ?? []
    : conversationsQuery.data?.data ?? []

  const unreadByConversation = unreadStatsQuery.data?.unread_by_conversation ?? {}

  const filteredConversations = useMemo(() => {
    const list =
      tab === "unread"
        ? conversations.filter((c) => (unreadByConversation[String(c.id)] ?? 0) > 0)
        : conversations
    return [...list].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned))
  }, [conversations, tab, unreadByConversation])

  const isLoadingList = isSearchingConversations
    ? conversationSearchQuery.isLoading
    : conversationsQuery.isLoading

  const conversationQuery = useConversationMessages(selectedId)
  const conversation = conversationQuery.data?.pages[0]?.conversation
  const messages = useMemo(() => {
    // pages[0] — eng yangi bet, oxirgi bet — eng eski. Har bir betning ichida backend
    // eskidan-yangiga qaytaradi, shuning uchun faqat betlar ro'yxatini (eng eskisi
    // birinchi bo'lishi uchun) teskari qilib, ularni ketma-ket birlashtiramiz.
    const pages = conversationQuery.data?.pages ?? []
    return [...pages].reverse().flatMap((page) => page.data.data)
  }, [conversationQuery.data])

  useConversationChannel(selectedId)

  const messageSearch = useMessageSearch(selectedId, debouncedMessageSearch)

  const sendMessage = useSendMessage(selectedId ?? 0)
  const updateMessage = useUpdateMessage(selectedId ?? 0)
  const deleteMessage = useDeleteMessage(selectedId ?? 0)
  const muteConversation = useMuteConversation()
  const pinConversation = usePinConversation()
  const markRead = useMarkConversationRead()

  useEffect(() => {
    if (!selectedId) return
    if ((unreadByConversation[String(selectedId)] ?? 0) > 0) {
      markRead.mutate(selectedId)
    }
    setMessageSearchOpen(false)
    setMessageSearchQuery("")
    setEditingId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // Faqat suhbat almashganda yoki OXIRGI (eng yangi) xabar o'zgarganda pastga suramiz —
  // yuqoriga scroll qilib eski xabarlar yuklanganda (pagination) bu ishga tushmasligi kerak,
  // aks holda foydalanuvchi doim pastga otilib ketardi.
  const latestMessageId = messages[messages.length - 1]?.id ?? null
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" })
  }, [latestMessageId, selectedId])

  // Xabarlar ro'yxati yuqorisiga scroll qilinganda eskiroq betni yuklab olamiz.
  const prevScrollHeightRef = useRef<number | null>(null)
  const handleMessagesScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    if (el.scrollTop > 80) return
    if (!conversationQuery.hasNextPage || conversationQuery.isFetchingNextPage) return
    prevScrollHeightRef.current = el.scrollHeight
    conversationQuery.fetchNextPage()
  }

  // Eski bet yuklanib ro'yxat boshiga qo'shilgach, scroll pozitsiyasini saqlab qolamiz —
  // aks holda yangi tepaga qo'shilgan kontent tufayli ko'rinish pastga "sakrab" ketadi.
  useLayoutEffect(() => {
    const el = messagesContainerRef.current
    if (!el || prevScrollHeightRef.current === null) return
    el.scrollTop = el.scrollHeight - prevScrollHeightRef.current + el.scrollTop
    prevScrollHeightRef.current = null
  }, [messages])

  const handleSelectFile = (file: File | null) => {
    setComposerFile(file)
  }

  const handleSend = async () => {
    if (!selectedId) return
    const text = composerText.trim()
    if (!text && !composerFile) return

    try {
      if (composerFile) {
        await sendMessage.mutateAsync({ type: "image", message: text || undefined, file: composerFile })
      } else {
        await sendMessage.mutateAsync({ type: "text", message: text })
      }
      setComposerText("")
      setComposerFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch {
      // xatolik toast orqali ko'rsatiladi
    }
  }

  const handleSendLocation = async (lat: number, lng: number) => {
    if (!selectedId) return
    try {
      await sendMessage.mutateAsync({ type: "location", latitude: lat, longitude: lng })
      setLocationDialogOpen(false)
    } catch {
      // xatolik toast orqali ko'rsatiladi
    }
  }

  const handleStartRecording = async () => {
    try {
      await recorder.start()
    } catch {
      toast.error(t("chat.mic.permissionDenied"))
    }
  }

  const handleStopAndSendRecording = async () => {
    const blob = await recorder.stop()
    if (!selectedId || !blob) return
    const file = new File([blob], `voice.${audioFileExtension(blob.type)}`, { type: blob.type })
    try {
      await sendMessage.mutateAsync({ type: "audio", file })
    } catch {
      // xatolik toast orqali ko'rsatiladi
    }
  }

  const startEdit = (message: ChatMessage) => {
    setEditingId(message.id)
    setEditingText(message.message ?? "")
  }

  const saveEdit = async () => {
    if (!editingId) return
    const text = editingText.trim()
    if (!text) return
    await updateMessage.mutateAsync({ id: editingId, message: text })
    setEditingId(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteMessage.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  let lastDateKey = ""

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4">
      {/* Chap panel — suhbatlar ro'yxati */}
      <div className="flex w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-white">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold tracking-tight">{t("chat.title")}</h2>
          {(unreadStatsQuery.data?.total ?? 0) > 0 && (
            <Badge className="rounded-full bg-primary px-2 text-primary-foreground">
              {unreadStatsQuery.data?.total}
            </Badge>
          )}
        </div>

        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("chat.searchPlaceholder")}
              className="pl-9"
            />
          </div>
        </div>

        <div className="border-b px-3 pt-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "unread")}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">
                {t("chat.tabs.all")}
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1">
                {t("chat.tabs.unread")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingList && (
            <div className="space-y-3 p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          )}

          {!isLoadingList && filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center text-muted-foreground">
              <MessageSquare className="size-8 opacity-40" />
              <p className="text-sm font-medium text-foreground">{t("chat.empty.title")}</p>
              <p className="text-xs">{t("chat.empty.description")}</p>
            </div>
          )}

          {!isLoadingList &&
            filteredConversations.map((item) => {
              const unread = unreadByConversation[String(item.id)] ?? 0
              const isActive = item.id === selectedId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "group/item flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/60",
                    isActive && "bg-muted"
                  )}
                >
                  <Avatar size="lg">
                    {item.avatar && <AvatarImage src={item.avatar} alt={item.name} />}
                    <AvatarFallback>
                      {item.type === "group" ? <Users className="size-4" /> : initials(item.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      {item.is_pinned && <Pin className="size-3 shrink-0 text-muted-foreground" />}
                      {item.is_muted && <BellOff className="size-3 shrink-0 text-muted-foreground" />}
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(item.last_message_at, locale)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {item.last_message ?? t("chat.noMessages")}
                      </p>
                      {unread > 0 && (
                        <span className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
        </div>
      </div>

      {/* O'ng panel — suhbat */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border bg-white">
        {!selectedId && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <MessageSquare className="size-10 opacity-40" />
            <p className="font-medium text-foreground">{t("chat.selectConversation.title")}</p>
            <p className="text-sm">{t("chat.selectConversation.description")}</p>
          </div>
        )}

        {selectedId && (
          <>
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Avatar size="lg">
                {conversation?.avatar && <AvatarImage src={conversation.avatar} alt={conversation.name} />}
                <AvatarFallback>
                  {conversation?.type === "group" ? (
                    <Users className="size-4" />
                  ) : (
                    initials(conversation?.name ?? "?")
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{conversation?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {conversation?.type === "group" ? t("chat.type.group") : t("chat.type.private")}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => setMessageSearchOpen((v) => !v)}
              >
                <Search className="size-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="cursor-pointer text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {conversations.find((c) => c.id === selectedId) && (
                    <>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          const conv = conversations.find((c) => c.id === selectedId)!
                          muteConversation.mutate({ id: selectedId, muted: conv.is_muted })
                        }}
                      >
                        {conversations.find((c) => c.id === selectedId)?.is_muted ? (
                          <>
                            <Bell className="mr-2 size-4" />
                            {t("chat.menu.unmute")}
                          </>
                        ) : (
                          <>
                            <BellOff className="mr-2 size-4" />
                            {t("chat.menu.mute")}
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          const conv = conversations.find((c) => c.id === selectedId)!
                          pinConversation.mutate({ id: selectedId, pinned: conv.is_pinned })
                        }}
                      >
                        {conversations.find((c) => c.id === selectedId)?.is_pinned ? (
                          <>
                            <PinOff className="mr-2 size-4" />
                            {t("chat.menu.unpin")}
                          </>
                        ) : (
                          <>
                            <Pin className="mr-2 size-4" />
                            {t("chat.menu.pin")}
                          </>
                        )}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {messageSearchOpen && (
              <div className="border-b bg-muted/40 p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    placeholder={t("chat.searchPanel.placeholder")}
                    className="bg-white pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMessageSearchOpen(false)
                      setMessageSearchQuery("")
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {debouncedMessageSearch.trim().length > 0 && (
                  <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                    {messageSearch.isLoading && (
                      <p className="px-2 py-1 text-xs text-muted-foreground">…</p>
                    )}
                    {!messageSearch.isLoading && (messageSearch.data ?? []).length === 0 && (
                      <p className="px-2 py-1 text-xs text-muted-foreground">
                        {t("chat.searchPanel.noResults")}
                      </p>
                    )}
                    {(messageSearch.data ?? []).map((m) => (
                      <div key={m.id} className="rounded-lg bg-white px-3 py-2 text-xs">
                        <p className="truncate text-foreground">{m.message ?? m.type}</p>
                        <p className="text-muted-foreground">{formatTime(m.created_at, locale)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto px-4 py-4"
            >
              {conversationQuery.isLoading && (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!conversationQuery.isLoading && messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {t("chat.noMessages")}
                </div>
              )}

              {conversationQuery.isFetchingNextPage && (
                <div className="flex justify-center py-2">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}

              <div className="space-y-1">
                {messages.map((message) => {
                  const dateKey = new Date(message.created_at).toDateString()
                  const showSeparator = dateKey !== lastDateKey
                  lastDateKey = dateKey
                  const mine = isOutgoing(message, user?.id)
                  const isEditing = editingId === message.id
                  const deleted = Boolean(message.deleted_at)

                  return (
                    <div key={message.id}>
                      {showSeparator && (
                        <div className="my-4 flex justify-center">
                          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                            {formatDateSeparator(message.created_at, locale, t)}
                          </span>
                        </div>
                      )}

                      <div className={cn("group flex", mine ? "justify-end" : "justify-start")}>
                        <div className={cn("flex max-w-[70%] items-end gap-1.5", mine && "flex-row-reverse")}>
                          {mine && !deleted && !isEditing && (
                            <div className="mb-1 hidden shrink-0 items-center gap-0.5 group-hover:flex">
                              {message.type === "text" && (
                                <button
                                  type="button"
                                  onClick={() => startEdit(message)}
                                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(message)}
                                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          )}

                          <div>
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 rounded-2xl border bg-white p-1.5 pl-3">
                                <Input
                                  autoFocus
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit()
                                    if (e.key === "Escape") setEditingId(null)
                                  }}
                                  className="h-8 border-0 shadow-none focus-visible:ring-0"
                                />
                                <Button
                                  size="icon"
                                  className="size-7 shrink-0 cursor-pointer"
                                  onClick={saveEdit}
                                  disabled={updateMessage.isPending}
                                >
                                  <Check className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 shrink-0 cursor-pointer"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="size-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  "rounded-2xl px-3.5 py-2 text-sm",
                                  mine
                                    ? "rounded-br-sm bg-primary text-primary-foreground"
                                    : "rounded-bl-sm bg-muted text-foreground",
                                  deleted && "italic opacity-60"
                                )}
                              >
                                {deleted ? (
                                  <p>{t("chat.message.deleted")}</p>
                                ) : (
                                  <>
                                    {message.type === "text" && (
                                      <p className="whitespace-pre-wrap break-words">{message.message}</p>
                                    )}
                                    {message.type === "image" && message.file_url && (
                                      <a href={message.file_url} target="_blank" rel="noreferrer">
                                        <img
                                          src={message.file_url}
                                          alt=""
                                          className="max-h-64 max-w-full rounded-lg object-cover"
                                        />
                                      </a>
                                    )}
                                    {message.type === "audio" && message.audio_url && (
                                      <audio controls src={message.audio_url} className="h-10 max-w-[240px]" />
                                    )}
                                    {message.type === "location" && message.latitude && message.longitude && (
                                      <ChatLocationPreview
                                        lat={Number(message.latitude)}
                                        lng={Number(message.longitude)}
                                        mine={mine}
                                        label={t("chat.message.openMap")}
                                      />
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                            <div
                              className={cn(
                                "mt-1 flex items-center gap-1 text-[11px] text-muted-foreground",
                                mine ? "justify-end" : "justify-start"
                              )}
                            >
                              {message.sender?.fio && conversation?.type === "group" && !mine && (
                                <span className="font-medium">{message.sender.fio}</span>
                              )}
                              <span>{formatTime(message.created_at, locale)}</span>
                              {message.edited_at && !deleted && <span>· {t("chat.message.edited")}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t p-3">
              {composerFile && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs">
                  <span className="truncate">{composerFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setComposerFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}
              {recorder.status === "recording" ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={recorder.cancel}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <div className="flex flex-1 items-center gap-2 rounded-full bg-muted px-4 py-2">
                    <span className="size-2 shrink-0 animate-pulse rounded-full bg-destructive" />
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {formatDuration(recorder.durationMs)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    className="shrink-0 cursor-pointer rounded-xl"
                    onClick={handleStopAndSendRecording}
                    disabled={sendMessage.isPending}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Square className="size-3.5" />
                    )}
                  </Button>
                </div>
              ) : (
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSelectFile(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() => setLocationDialogOpen(true)}
                    title={t("chat.composer.location")}
                  >
                    <MapPin className="size-4" />
                  </Button>
                  <Input
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder={t("chat.composer.placeholder")}
                    className="flex-1 rounded-full"
                  />
                  {composerText.trim() || composerFile ? (
                    <Button
                      type="submit"
                      size="icon"
                      className="shrink-0 cursor-pointer rounded-xl"
                      disabled={sendMessage.isPending}
                    >
                      {sendMessage.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="icon"
                      className="shrink-0 cursor-pointer rounded-xl"
                      onClick={handleStartRecording}
                      title={t("chat.composer.recordAudio")}
                    >
                      <Mic className="size-4" />
                    </Button>
                  )}
                </form>
              )}
            </div>
          </>
        )}
      </div>

      <ChatLocationPickerDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        onConfirm={handleSendLocation}
        isSubmitting={sendMessage.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("chat.deleteDialog.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("chat.deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMessage.isPending}>
              {t("chat.deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
