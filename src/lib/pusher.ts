import Pusher from "pusher-js"

import { api } from "@/lib/api"

let pusherInstance: Pusher | null = null

// Bitta umumiy Pusher ulanishi — butun ilova davomida qayta ishlatiladi.
// Avtorizatsiya uchun mavjud `api` (axios) instansiyasidan foydalanamiz, shunda
// har bir kanalga obuna bo'lishda joriy (eng yangi) auth_token avtomatik qo'shiladi —
// klient yaratilgan paytdagi eski tokenga "yopishib qolish" muammosi bo'lmaydi.
export function getPusherClient(): Pusher | null {
  const key = import.meta.env.VITE_PUSHER_APP_KEY as string | undefined
  const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER as string | undefined
  if (!key || !cluster) return null

  if (!pusherInstance) {
    pusherInstance = new Pusher(key, {
      cluster,
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          api
            .post("/broadcasting/auth", {
              socket_id: socketId,
              channel_name: channel.name,
            })
            .then((response) => callback(null, response.data))
            .catch((error) => callback(error, null))
        },
      }),
    })
  }

  return pusherInstance
}
