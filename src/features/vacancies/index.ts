import { vacanciesApi } from "@/lib/vacancies.api"
import type { VacancyListParams, VacancyPayload, VacancyStatus } from "@/types"
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner" // sonner o'rniga shadcn "use-toast" ishlatsangiz shu importni almashtiring


export const vacancyKeys = {
  all: ["vacancies"] as const,
  lists: () => [...vacancyKeys.all, "list"] as const,
  list: (params: VacancyListParams) => [...vacancyKeys.lists(), params] as const,
  infiniteList: (params: Omit<VacancyListParams, "page">) =>
    [...vacancyKeys.lists(), "infinite", params] as const,
  details: () => [...vacancyKeys.all, "detail"] as const,
  detail: (id: number) => [...vacancyKeys.details(), id] as const,
}

export function useVacancies(params: VacancyListParams) {
  return useQuery({
    queryKey: vacancyKeys.list(params),
    queryFn: () => vacanciesApi.getAll(params),
    placeholderData: keepPreviousData, // pagination'da eski ma'lumot ekranda qolib turadi
  })
}

// Card ko'rinishida pastga tushganda avtomatik keyingi sahifani yuklash uchun
export function useInfiniteVacancies(params: Omit<VacancyListParams, "page">) {
  return useInfiniteQuery({
    queryKey: vacancyKeys.infiniteList(params),
    queryFn: ({ pageParam }) =>
      vacanciesApi.getAll({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.last_page
        ? lastPage.pagination.current_page + 1
        : undefined,
  })
}

export function useVacancy(id: number | null) {
  return useQuery({
    queryKey: vacancyKeys.detail(id ?? 0),
    queryFn: () => vacanciesApi.getOne(id as number),
    enabled: id !== null,
  })
}

export function useCreateVacancy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: VacancyPayload) => vacanciesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacancyKeys.lists() })
      toast.success("Vakansiya muvaffaqiyatli yaratildi")
    },
    onError: () => {
      toast.error("Vakansiya yaratishda xatolik yuz berdi")
    },
  })
}

export function useUpdateVacancy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: VacancyPayload }) =>
      vacanciesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: vacancyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vacancyKeys.detail(variables.id) })
      toast.success("Vakansiya yangilandi")
    },
    onError: () => {
      toast.error("Vakansiyani yangilashda xatolik yuz berdi")
    },
  })
}

export function useDeleteVacancy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => vacanciesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacancyKeys.lists() })
      toast.success("Vakansiya o'chirildi")
    },
    onError: () => {
      toast.error("Vakansiyani o'chirishda xatolik yuz berdi")
    },
  })
}




export function useUpdateVacancyStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: VacancyStatus }) =>
      vacanciesApi.updateStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: vacancyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vacancyKeys.detail(variables.id) })
      toast.success("Status yangilandi")
    },
    onError: () => {
      toast.error("Statusni yangilashda xatolik yuz berdi")
    },
  })
}
