import { applicationsApi } from "@/lib/applications.api"
import type { ApplicationListParams, ApplicationStatus } from "@/types"
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

export const applicationKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationKeys.all, "list"] as const,
  list: (params: ApplicationListParams) => [...applicationKeys.lists(), params] as const,
  infiniteList: (params: Omit<ApplicationListParams, "page">) =>
    [...applicationKeys.lists(), "infinite", params] as const,
  details: () => [...applicationKeys.all, "detail"] as const,
  detail: (id: number) => [...applicationKeys.details(), id] as const,
}

export function useApplications(params: ApplicationListParams) {
  return useQuery({
    queryKey: applicationKeys.list(params),
    queryFn: () => applicationsApi.getAll(params),
    placeholderData: keepPreviousData,
  })
}

export function useInfiniteApplications(params: Omit<ApplicationListParams, "page">) {
  return useInfiniteQuery({
    queryKey: applicationKeys.infiniteList(params),
    queryFn: ({ pageParam }) =>
      applicationsApi.getAll({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.last_page
        ? lastPage.pagination.current_page + 1
        : undefined,
  })
}

export function useApplication(id: number | null) {
  return useQuery({
    queryKey: applicationKeys.detail(id ?? 0),
    queryFn: () => applicationsApi.getOne(id as number),
    enabled: id !== null,
  })
}

export function useChangeApplicationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
      rejection_reason,
    }: {
      id: number
      status: Extract<ApplicationStatus, "invited" | "rejected">
      rejection_reason?: string
    }) => applicationsApi.changeStatus(id, { status, rejection_reason }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.id) })
      toast.success(
        variables.status === "invited" ? "Nomzod taklif qilindi" : "Ariza rad etildi"
      )
    },
    onError: () => {
      toast.error("Statusni yangilashda xatolik yuz berdi")
    },
  })
}