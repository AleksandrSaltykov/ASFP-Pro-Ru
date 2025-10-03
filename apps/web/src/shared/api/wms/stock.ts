import { useMemo } from "react";
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
  useQueryClient
} from "@tanstack/react-query";

import { useWmsHttpClient } from "./client"; // kept for consistency, reserved for future API wiring
import type {
  EndlessPolicy,
  EndlessPolicyKind,
  EndlessPolicyUpdatePayload,
  PaginatedResponse,
  StockAvailability,
  StockBalance,
  StockMovement,
  UUID
} from "./types";

const STOCK_NAMESPACE = ["wms", "stock"] as const;

const balancesKey = () => [...STOCK_NAMESPACE, "balances"] as const;
const availabilityKey = () => [...STOCK_NAMESPACE, "availability"] as const;
const endlessKey = () => [...STOCK_NAMESPACE, "endless"] as const;
const historyKey = () => [...STOCK_NAMESPACE, "history"] as const;

const STUB_BALANCES: StockBalance[] = [
  {
    id: "bal-1",
    itemCode: "SIGN-NEON-001",
    itemName: "Неоновая вывеска, 1.5м",
    category: "Вывески",
    warehouse: "MSK-MAIN",
    zone: "STORAGE",
    bin: "A-01",
    onHand: 56,
    uom: "шт",
    updatedAt: "2025-10-02T18:15:00+03:00"
  },
  {
    id: "bal-2",
    itemCode: "SIGN-NEON-001",
    itemName: "Неоновая вывеска, 1.5м",
    category: "Вывески",
    warehouse: "SPB-HUB",
    zone: "BUFFER",
    bin: "B-12",
    onHand: 18,
    uom: "шт",
    updatedAt: "2025-10-02T14:40:00+03:00"
  },
  {
    id: "bal-3",
    itemCode: "BANNER-PVC-005",
    itemName: "Баннер ПВХ 6х3",
    category: "Баннеры",
    warehouse: "MSK-MAIN",
    zone: "RECEIVING",
    bin: "D-03",
    onHand: 4,
    uom: "рул",
    updatedAt: "2025-10-03T08:05:00+03:00"
  },
  {
    id: "bal-4",
    itemCode: "STAND-ROLLUP-001",
    itemName: "Роллап 800х2000",
    category: "POS",
    warehouse: "MSK-MAIN",
    zone: "STAGING",
    bin: "K-07",
    onHand: 0,
    uom: "шт",
    updatedAt: "2025-10-03T07:50:00+03:00"
  },
  {
    id: "bal-5",
    itemCode: "LED-MODULE-3528",
    itemName: "LED модуль 3528",
    category: "Электрика",
    warehouse: "EKB-REGION",
    zone: "STORAGE",
    bin: "M-15",
    onHand: 240,
    uom: "шт",
    updatedAt: "2025-10-02T21:12:00+05:00"
  }
];

const STUB_AVAILABILITY: StockAvailability[] = STUB_BALANCES.map((balance, index) => {
  const reserved = [10, 6, 2, 0, 35][index] ?? 0;
  const onOrder = [4, 0, 6, 12, 0][index] ?? 0;
  const available = Math.max(balance.onHand - reserved, 0);

  return {
    id: `avail-${balance.id}`,
    itemCode: balance.itemCode,
    itemName: balance.itemName,
    category: balance.category,
    warehouse: balance.warehouse,
    onHand: balance.onHand,
    reserved,
    onOrder,
    available,
    uom: balance.uom
  } satisfies StockAvailability;
});

const STUB_ENDLESS_POLICIES: EndlessPolicy[] = [
  {
    id: "policy-1",
    itemCode: "SIGN-NEON-001",
    itemName: "Неоновая вывеска, 1.5м",
    warehouse: "MSK-MAIN",
    policy: "MINMAX",
    min: 40,
    max: 80,
    reorderPoint: null,
    safetyStock: 10,
    note: "Поддерживать витрины для розницы",
    available: STUB_AVAILABILITY[0].available,
    updatedAt: "2025-09-30T12:00:00+03:00"
  },
  {
    id: "policy-2",
    itemCode: "BANNER-PVC-005",
    itemName: "Баннер ПВХ 6х3",
    warehouse: "MSK-MAIN",
    policy: "ROP",
    min: null,
    max: null,
    reorderPoint: 6,
    safetyStock: 3,
    note: "Выгрузки для монтажа",
    available: STUB_AVAILABILITY[2].available,
    updatedAt: "2025-09-29T16:24:00+03:00"
  },
  {
    id: "policy-3",
    itemCode: "STAND-ROLLUP-001",
    itemName: "Роллап 800х2000",
    warehouse: "SPB-HUB",
    policy: "NONE",
    min: null,
    max: null,
    reorderPoint: null,
    safetyStock: null,
    note: "Контролируется вручную",
    available: STUB_AVAILABILITY[3].available,
    updatedAt: "2025-09-28T09:45:00+03:00"
  }
];

const STUB_HISTORY: StockMovement[] = [
  {
    id: "mov-1",
    occurredAt: "2025-10-03T08:03:00+03:00",
    type: "RECEIPT",
    itemCode: "BANNER-PVC-005",
    itemName: "Баннер ПВХ 6х3",
    fromWarehouse: "Vendor",
    toWarehouse: "MSK-MAIN",
    toZone: "RECEIVING",
    toBin: "D-03",
    quantity: 6,
    uom: "рул",
    reference: "ASN-000423",
    actor: "Котов А.",
    note: "Приемка по заказу 4587"
  },
  {
    id: "mov-2",
    occurredAt: "2025-10-02T20:15:00+03:00",
    type: "MOVE",
    itemCode: "SIGN-NEON-001",
    itemName: "Неоновая вывеска, 1.5м",
    fromWarehouse: "MSK-MAIN",
    fromZone: "STORAGE",
    fromBin: "A-01",
    toWarehouse: "MSK-MAIN",
    toZone: "STAGING",
    toBin: "K-07",
    quantity: 8,
    uom: "шт",
    reference: "TASK-PTW-107",
    actor: "Романова Н.",
    note: "Под отгрузку для проекта 9002"
  },
  {
    id: "mov-3",
    occurredAt: "2025-10-02T12:20:00+03:00",
    type: "RESERVE",
    itemCode: "SIGN-NEON-001",
    itemName: "Неоновая вывеска, 1.5м",
    fromWarehouse: "MSK-MAIN",
    quantity: 12,
    uom: "шт",
    reference: "ORDER-92015",
    actor: "Система",
    note: "Резерв под заказ клиента"
  },
  {
    id: "mov-4",
    occurredAt: "2025-10-01T18:05:00+03:00",
    type: "ADJUST",
    itemCode: "STAND-ROLLUP-001",
    itemName: "Роллап 800х2000",
    fromWarehouse: "MSK-MAIN",
    quantity: -2,
    uom: "шт",
    reference: "ADJ-20251001-1",
    actor: "Ильин С.",
    note: "Брак на приемке"
  }
];

let endlessPoliciesStore = [...STUB_ENDLESS_POLICIES];

const ensurePolicyThresholds = (policy: EndlessPolicyUpdatePayload): void => {
  if (policy.policy === "MINMAX") {
    const { min, max } = policy;
    if (min != null && max != null && max < min) {
      throw new Error("Max должно быть больше или равно Min");
    }
  }
};

const upsertPolicy = (payload: EndlessPolicyUpdatePayload): EndlessPolicy => {
  ensurePolicyThresholds(payload);
  const index = endlessPoliciesStore.findIndex((item) => item.id === payload.id);
  if (index === -1) {
    throw new Error("Политика не найдена");
  }

  const current = endlessPoliciesStore[index];
  const updated: EndlessPolicy = {
    ...current,
    policy: payload.policy,
    min: payload.policy === "MINMAX" ? payload.min ?? 0 : null,
    max: payload.policy === "MINMAX" ? payload.max ?? payload.min ?? 0 : null,
    reorderPoint: payload.policy === "ROP" ? payload.reorderPoint ?? 0 : null,
    safetyStock: payload.safetyStock ?? null,
    note: payload.note ?? undefined,
    updatedAt: new Date().toISOString()
  };

  endlessPoliciesStore = [
    ...endlessPoliciesStore.slice(0, index),
    updated,
    ...endlessPoliciesStore.slice(index + 1)
  ];

  return updated;
};

const resetPolicy = (id: UUID): EndlessPolicy => {
  const index = endlessPoliciesStore.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("Политика не найдена");
  }
  const initial = STUB_ENDLESS_POLICIES.find((item) => item.id === id);
  const fallback = initial ?? {
    ...endlessPoliciesStore[index],
    policy: "NONE" as EndlessPolicyKind,
    min: null,
    max: null,
    reorderPoint: null,
    safetyStock: null,
    note: undefined
  };

  endlessPoliciesStore = [
    ...endlessPoliciesStore.slice(0, index),
    fallback,
    ...endlessPoliciesStore.slice(index + 1)
  ];

  return fallback;
};

const buildQuery = <TData>(
  key: readonly unknown[],
  loader: () => Promise<PaginatedResponse<TData>>,
  options?: Omit<UseQueryOptions<PaginatedResponse<TData>, Error, TData[]>, "queryKey" | "queryFn">
) => ({
  queryKey: key,
  queryFn: loader,
  select: (response: PaginatedResponse<TData>) => response.items,
  ...(options ?? {})
}) satisfies UseQueryOptions<PaginatedResponse<TData>, Error, TData[]>;

export const useStockBalances = (
  options?: Omit<UseQueryOptions<PaginatedResponse<StockBalance>, Error, StockBalance[]>, "queryKey" | "queryFn">
) => {
  useWmsHttpClient();
  const queryConfig = useMemo(
    () =>
      buildQuery(
        balancesKey(),
        () => Promise.resolve({ items: STUB_BALANCES }),
        options
      ),
    [options]
  );

  return useQuery(queryConfig);
};

export const useStockAvailability = (
  options?: Omit<UseQueryOptions<PaginatedResponse<StockAvailability>, Error, StockAvailability[]>, "queryKey" | "queryFn">
) => {
  useWmsHttpClient();
  const queryConfig = useMemo(
    () =>
      buildQuery(
        availabilityKey(),
        () => Promise.resolve({ items: STUB_AVAILABILITY }),
        options
      ),
    [options]
  );

  return useQuery(queryConfig);
};

export const useEndlessPolicies = (
  options?: Omit<UseQueryOptions<PaginatedResponse<EndlessPolicy>, Error, EndlessPolicy[]>, "queryKey" | "queryFn">
) => {
  useWmsHttpClient();
  const queryConfig = useMemo(
    () =>
      buildQuery(
        endlessKey(),
        () => Promise.resolve({ items: endlessPoliciesStore }),
        options
      ),
    [options]
  );

  return useQuery(queryConfig);
};

export const useUpdateEndlessPolicy = (
  options?: UseMutationOptions<EndlessPolicy, Error, EndlessPolicyUpdatePayload>
) => {
  const queryClient = useQueryClient();
  useWmsHttpClient();

  return useMutation({
    mutationFn: async (payload) => Promise.resolve(upsertPolicy(payload)),
    onSuccess: (updated, variables, context) => {
      queryClient.setQueryData<PaginatedResponse<EndlessPolicy>>(endlessKey(), {
        items: endlessPoliciesStore
      });
      options?.onSuccess?.(updated, variables, context);
    },
    ...options
  });
};

export const useResetEndlessPolicy = (
  options?: UseMutationOptions<EndlessPolicy, Error, UUID>
) => {
  const queryClient = useQueryClient();
  useWmsHttpClient();

  return useMutation({
    mutationFn: async (id) => Promise.resolve(resetPolicy(id)),
    onSuccess: (updated, variables, context) => {
      queryClient.setQueryData<PaginatedResponse<EndlessPolicy>>(endlessKey(), {
        items: endlessPoliciesStore
      });
      options?.onSuccess?.(updated, variables, context);
    },
    ...options
  });
};

export const useStockHistory = (
  options?: Omit<UseQueryOptions<PaginatedResponse<StockMovement>, Error, StockMovement[]>, "queryKey" | "queryFn">
) => {
  useWmsHttpClient();
  const queryConfig = useMemo(
    () =>
      buildQuery(
        historyKey(),
        () => Promise.resolve({ items: STUB_HISTORY }),
        options
      ),
    [options]
  );

  return useQuery(queryConfig);
};
