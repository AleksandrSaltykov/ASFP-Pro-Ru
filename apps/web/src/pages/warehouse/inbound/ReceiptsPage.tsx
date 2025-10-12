
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import {
  buildReceiptPayload,
  type Item,
  type CrmCustomer,
  type Receipt,
  type ReceiptDetails,
  type ReceiptLinePayload,
  type ReceiptsQueryFilters,
  type Warehouse,
  useCreateReceiptMutation,
  useCustomersQuery,
  useDeleteReceiptMutation,
  useReceiptDetailsQuery,
  useReceiptsQuery,
  useUpdateReceiptMutation,
  useItemsQuery,
  useWarehousesQuery
} from "@shared/api";
import { PageLoader } from "@shared/ui/PageLoader";
import { palette, typography } from "@shared/ui/theme";
import { iconMap } from "@shared/ui/icons";

import DataTable, { type TableColumn } from "../components/DataTable";
import FilterPanel from "../components/FilterPanel";
import SlideOver from "../components/SlideOver";
import {
  shouldUseFallback,
  normalizeSearch,
  formatDateTime
} from "../../../modules/warehouse/views/masters/utils";
import {
  fallbackReceipts,
  resolveFallbackReceiptDetails
} from "../../../modules/warehouse/views/inbound/fallbacks";
import {
  fallbackCustomers,
  fallbackItems,
  fallbackWarehouses
} from "../../../modules/warehouse/views/masters/fallbacks";
type DrawerMode = "create" | "edit";

type ReceiptLineUnitOption = {
  id: string;
  label: string;
};

type ReceiptLineFormState = {
  tempId: string;
  id?: string;
  itemId: string;
  itemName: string;
  unitId: string;
  unitOptions: ReceiptLineUnitOption[];
  quantity: string;
  unitCost: string;
  vatRate: string;
};

type ReceiptFormState = {
  code: string;
  warehouseId: string;
  supplierId: string;
  supplierName: string;
  supplierInn: string;
  currency: string;
  expectedAt: string;
  receivedAt: string;
  notes: string;
  actorId: string;
  lines: ReceiptLineFormState[];
};

const DEFAULT_LIMIT = 50;

const VAT_RATE = 0.2;

const layoutStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 16
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: typography.fontFamily,
  fontSize: 28,
  fontWeight: 600,
  color: palette.textPrimary
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap"
};

const primaryButtonStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: 14,
  border: "none",
  background: palette.primary,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer"
};

const filterLabelStyle: CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: palette.textSoft,
  fontWeight: 600
};

const inputStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  fontFamily: typography.fontFamily,
  fontSize: 14,
  color: palette.textPrimary
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%238A8FA3' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "calc(100% - 12px) 50%",
  paddingRight: 40
};

const infoStyle: CSSProperties = {
  padding: 16,
  borderRadius: 18,
  border: `1px solid ${palette.border}`,
  background: palette.layer,
  color: palette.textSecondary,
  fontSize: 14
};

const cardStyle: CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${palette.border}`,
  background: palette.layer,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 16
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16
};

const formControlStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6
};

const actionBarStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  justifyContent: "flex-end"
};

const secondaryButtonStyle: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  color: palette.textPrimary,
  cursor: "pointer"
};

const dangerButtonStyle: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: `1px solid rgba(211, 32, 41, 0.4)`,
  background: "transparent",
  color: "#d32029",
  cursor: "pointer"
};

const tableWrapperStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${palette.border}`,
  overflow: "hidden"
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse"
};

const headCellStyle: CSSProperties = {
  background: palette.surfaceMuted,
  padding: "10px 12px",
  fontSize: 12,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: palette.textSecondary,
  textAlign: "left" as const
};

const cellStyle: CSSProperties = {
  padding: "10px 12px",
  borderBottom: `1px solid ${palette.border}`
};

const tableInputStyle: CSSProperties = {
  ...inputStyle,
  width: "100%"
};

const tableNumberInputStyle: CSSProperties = {
  ...tableInputStyle,
  textAlign: "right" as const
};

const suggestionWrapperStyle: CSSProperties = {
  position: "relative"
};

const suggestionContainerStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  zIndex: 10,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: 6,
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: palette.surface,
  boxShadow: palette.shadowElevated,
  maxHeight: 200,
  overflowY: "auto"
};

const suggestionOptionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 2,
  width: "100%",
  padding: "8px 10px",
  borderRadius: 10,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  textAlign: "left",
  color: palette.textPrimary
};

const suggestionEmptyStyle: CSSProperties = {
  padding: "8px 10px",
  fontSize: 12,
  color: palette.textSecondary
};

const amountCellStyle: CSSProperties = {
  ...cellStyle,
  width: 140,
  textAlign: "right" as const,
  fontWeight: 600
};

const vatCellStyle: CSSProperties = {
  ...cellStyle,
  width: 140,
  textAlign: "right" as const
};

const addLineButtonStyle: CSSProperties = {
  width: "100%",
  padding: 12,
  border: "none",
  background: "transparent",
  color: palette.primary,
  fontWeight: 600,
  cursor: "pointer"
};

const errorStyle: CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: `1px solid rgba(211, 32, 41, 0.4)`,
  background: "rgba(211, 32, 41, 0.08)",
  color: "#d32029",
  fontSize: 14
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 100,
  resize: "vertical" as const
};

const summaryStyle: CSSProperties = {
  display: "flex",
  gap: 16,
  justifyContent: "flex-end",
  flexWrap: "wrap",
  color: palette.textSecondary,
  fontSize: 14
};

const summaryValueStyle: CSSProperties = {
  fontWeight: 600,
  color: palette.textPrimary
};

const pad = (value: number) => value.toString().padStart(2, "0");


const toDateTimeInputValue = (iso?: string | null) => {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const generateTempId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createEmptyLine = (): ReceiptLineFormState => ({
  tempId: generateTempId(),
  id: undefined,
  itemId: "",
  itemName: "",
  unitId: "",
  unitOptions: [],
  quantity: "",
  unitCost: "",
  vatRate: String(Math.round(VAT_RATE * 100))
});

const buildUnitOptions = (
  item: Item | undefined,
  previous?: Pick<ReceiptLineFormState, "unitId" | "unitOptions">
): ReceiptLineUnitOption[] => {
  const options: ReceiptLineUnitOption[] = [];

  const addOption = (id?: string | null, label?: string | null) => {
    if (!id) {
      return;
    }
    if (!options.some((option) => option.id === id)) {
      options.push({
        id,
        label: (label?.trim() || id) as string
      });
    }
  };

  if (item) {
    addOption(
      item.unitId ?? undefined,
      item.unit?.name ?? item.unit?.code ?? null
    );
    addOption(
      item.alternativeUnitId ?? undefined,
      item.alternativeUnit?.name ?? item.alternativeUnit?.code ?? null
    );
  }

  if (!options.length && previous?.unitId) {
    const fallbackLabel =
      previous.unitOptions.find((option) => option.id === previous.unitId)?.label ?? previous.unitId;
    addOption(previous.unitId, fallbackLabel);
  }

  return options;
};
const buildInitialFormState = (): ReceiptFormState => ({
  code: "",
  warehouseId: "",
  supplierId: "",
  supplierName: "",
  supplierInn: "",
  currency: "RUB",
  expectedAt: "",
  receivedAt: "",
  notes: "",
  actorId: "",
  lines: [createEmptyLine()]
});

const mapReceiptDetailsToFormState = (details: ReceiptDetails): ReceiptFormState => ({
  code: details.code ?? "",
  warehouseId: details.warehouseId ?? "",
  supplierId: details.supplierId ?? "",
  supplierName: details.supplierName ?? "",
  supplierInn: details.supplierInn ?? "",
  currency: "RUB",
  expectedAt: toDateTimeInputValue(details.expectedAt),
  receivedAt: toDateTimeInputValue(details.receivedAt),
  notes: details.notes ?? "",
  actorId: "",
  lines:
    details.lines?.length
      ? details.lines.map((line) => {
          const unitOptions = buildUnitOptions(undefined, {
            unitId: line.unitId ?? "",
            unitOptions:
              line.unitId && (line.unitCode ?? "").trim()
                ? [
                    {
                      id: line.unitId,
                      label: line.unitCode ?? line.unitId
                    }
                  ]
                : []
          });
          return {
            tempId: line.id ?? generateTempId(),
            id: line.id ?? undefined,
            itemId: line.itemId ?? "",
            itemName: line.itemName ?? "",
            unitId: unitOptions[0]?.id ?? "",
            unitOptions,
            quantity: line.quantity?.toString() ?? "",
            unitCost: line.unitCost?.toString() ?? "",
            vatRate: line.vatRate?.toString() ?? String(Math.round(VAT_RATE * 100))
          };
        })
      : [createEmptyLine()]
});
const ReceiptsPage = () => {
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ReceiptFormState>(buildInitialFormState);
  const [formError, setFormError] = useState<string | null>(null);

  const warehousesQuery = useWarehousesQuery();
  const useWarehousesFallback = shouldUseFallback(warehousesQuery.error);
  const warehouses: Warehouse[] = useWarehousesFallback
    ? fallbackWarehouses
    : warehousesQuery.data ?? [];

  const suppliersQuery = useCustomersQuery({ limit: 200 });
  const useSuppliersFallback = shouldUseFallback(suppliersQuery.error);
  const suppliers: CrmCustomer[] = useSuppliersFallback
    ? fallbackCustomers
    : suppliersQuery.data ?? [];
  const supplierLookup = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier])),
    [suppliers]
  );

  const itemsQuery = useItemsQuery();
  const useItemsFallback = shouldUseFallback(itemsQuery.error);
  const items: Item[] = useItemsFallback ? fallbackItems : itemsQuery.data ?? [];

  const normalizedSearch = useMemo(() => normalizeSearch(search), [search]);

  const filters = useMemo<ReceiptsQueryFilters | undefined>(() => {
    const payload: ReceiptsQueryFilters = {};
    if (warehouseFilter) {
      payload.warehouseId = warehouseFilter;
    }
    if (normalizedSearch) {
      payload.search = normalizedSearch;
    }
    if (limit) {
      payload.limit = limit;
    }
    return Object.keys(payload).length ? payload : undefined;
  }, [warehouseFilter, normalizedSearch, limit]);

  const receiptsQuery = useReceiptsQuery(filters);
  const useFallback = shouldUseFallback(receiptsQuery.error);
  const receipts = useMemo(
    () => (useFallback ? fallbackReceipts : receiptsQuery.data ?? []),
    [useFallback, receiptsQuery.data]
  );

  const createMutation = useCreateReceiptMutation(filters);
  const updateMutation = useUpdateReceiptMutation(filters);
  const deleteMutation = useDeleteReceiptMutation(filters);

  const detailsQuery = useReceiptDetailsQuery(selectedReceiptId ?? "", {
    enabled: drawerOpen && drawerMode === "edit" && Boolean(selectedReceiptId)
  });

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    if (drawerMode === "create") {
      setFormState(buildInitialFormState());
      setFormError(null);
      return;
    }

    if (detailsQuery.data) {
      setFormState(mapReceiptDetailsToFormState(detailsQuery.data));
      setFormError(null);
      return;
    }

    if (shouldUseFallback(detailsQuery.error) && selectedReceiptId) {
      const fallbackDetails = resolveFallbackReceiptDetails(selectedReceiptId);
      if (fallbackDetails) {
        setFormState(mapReceiptDetailsToFormState(fallbackDetails));
        setFormError(null);
      }
    }
  }, [drawerOpen, drawerMode, detailsQuery.data, detailsQuery.error, selectedReceiptId]);

  const handleCreateClick = useCallback(() => {
    setDrawerMode("create");
    setSelectedReceipt(null);
    setSelectedReceiptId(null);
    setFormState(buildInitialFormState());
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const handleEditClick = useCallback((receipt: Receipt) => {
    setDrawerMode("edit");
    setSelectedReceipt(receipt);
    setSelectedReceiptId(receipt.id);
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedReceipt(null);
    setSelectedReceiptId(null);
    setFormState(buildInitialFormState());
    setFormError(null);
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof ReceiptFormState) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormState((prev) => ({ ...prev, [field]: event.target.value }));
      },
    []
  );

  const handleWarehouseSelect = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setFormState((prev) => ({ ...prev, warehouseId: event.target.value }));
    },
    []
  );

  const handleSupplierSelect = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const supplierId = event.target.value;
      const supplier = supplierLookup.get(supplierId);
      setFormState((prev) => ({
        ...prev,
        supplierId,
        supplierName: supplier?.name ?? "",
        supplierInn: supplier?.inn ?? ""
      }));
    },
    [supplierLookup]
  );


  const findItemSuggestions = useCallback(
    (query: string) => {
      const normalizedQuery = normalizeSearch(query);
      if (!normalizedQuery) {
        return items.slice(0, 8);
      }
      return items
        .filter((item) => {
          const name = normalizeSearch(item.name);
          const sku = normalizeSearch(item.sku ?? "");
          return name.includes(normalizedQuery) || sku.includes(normalizedQuery);
        })
        .slice(0, 8);
    },
    [items]
  );

  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const suggestionCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelSuggestionsClose = useCallback(() => {
    if (suggestionCloseTimeout.current) {
      clearTimeout(suggestionCloseTimeout.current);
      suggestionCloseTimeout.current = null;
    }
  }, []);

  const openSuggestions = useCallback(
    (lineId: string) => {
      cancelSuggestionsClose();
      setActiveLineId(lineId);
    },
    [cancelSuggestionsClose]
  );

  const scheduleSuggestionsClose = useCallback(() => {
    cancelSuggestionsClose();
    suggestionCloseTimeout.current = setTimeout(() => {
      setActiveLineId(null);
      suggestionCloseTimeout.current = null;
    }, 150);
  }, [cancelSuggestionsClose]);

  useEffect(
    () => () => {
      if (suggestionCloseTimeout.current) {
        clearTimeout(suggestionCloseTimeout.current);
        suggestionCloseTimeout.current = null;
      }
    },
    []
  );

  const handleItemSelect = useCallback(
    (lineId: string, item: Item) => {
      setFormState((prev) => ({
        ...prev,
        lines: prev.lines.map((line) => {
          if (line.tempId !== lineId) {
            return line;
          }
          const unitOptions = buildUnitOptions(item, line);
          const nextUnitId =
            line.unitId && unitOptions.some((option) => option.id === line.unitId)
              ? line.unitId
              : unitOptions[0]?.id ?? "";

          return {
            ...line,
            itemId: item.id,
            itemName: item.name,
            unitId: nextUnitId,
            unitOptions,
            vatRate: (Math.round(VAT_RATE * 100)).toString()
          };
        })
      }));
      cancelSuggestionsClose();
      setActiveLineId(null);
    },
    [cancelSuggestionsClose]
  );

  useEffect(() => {
    if (!items.length) {
      return;
    }
    setFormState((prev) => {
      let changed = false;
      const nextLines = prev.lines.map((line) => {
        const item = items.find((value) => value.id === line.itemId);
        if (!item) {
          return line;
        }
        const unitOptions = buildUnitOptions(item, line);
        const nextUnitId =
          line.unitId && unitOptions.some((option) => option.id === line.unitId)
            ? line.unitId
            : unitOptions[0]?.id ?? "";
        const sameUnitId = line.unitId === nextUnitId;
        const sameOptions =
          line.unitOptions.length === unitOptions.length &&
          line.unitOptions.every((option, index) => {
            const candidate = unitOptions[index];
            return candidate && option.id === candidate.id && option.label === candidate.label;
          });
        if (sameUnitId && sameOptions) {
          return line;
        }
        changed = true;
        return {
          ...line,
          unitId: nextUnitId,
          unitOptions,
          vatRate: (Math.round(VAT_RATE * 100)).toString()
        };
      });
      return changed ? { ...prev, lines: nextLines } : prev;
    });
  }, [items]);

  const warehouseOptions = useMemo(
    () => {
      const options = warehouses.map((warehouse) => ({
        value: warehouse.id,
        label: warehouse.name || warehouse.code || warehouse.id
      }));
      if (
        formState.warehouseId &&
        !options.some((option) => option.value === formState.warehouseId)
      ) {
        options.push({
          value: formState.warehouseId,
          label: formState.warehouseId
        });
      }
      return options;
    },
    [warehouses, formState.warehouseId]
  );

  const supplierOptions = useMemo(
    () => {
      const options = suppliers.map((supplier) => ({
        value: supplier.id,
        label: supplier.name,
        inn: supplier.inn ?? undefined
      }));
      if (formState.supplierId && !options.some((option) => option.value === formState.supplierId)) {
        options.push({
          value: formState.supplierId,
          label: formState.supplierName || formState.supplierId,
          inn: formState.supplierInn || undefined
        });
      }
      return options;
    },
    [suppliers, formState.supplierId, formState.supplierName, formState.supplierInn]
  );

  const isItemsLoading = itemsQuery.isLoading && !items.length;
  const isWarehousesLoading = warehousesQuery.isLoading && !warehouses.length;
  const isSuppliersLoading = suppliersQuery.isLoading && !suppliers.length;

  const handleLineChange = useCallback(
    (lineId: string, field: keyof ReceiptLineFormState) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        setFormState((prev) => ({
          ...prev,
          lines: prev.lines.map((line) =>
            line.tempId === lineId ? { ...line, [field]: event.target.value } : line
          )
        }));
      },
    []
  );

  const handleItemNameInput = useCallback(
    (lineId: string) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setFormState((prev) => ({
          ...prev,
          lines: prev.lines.map((line) =>
            line.tempId === lineId
              ? {
                  ...line,
                  itemName: value,
                  itemId: value === line.itemName ? line.itemId : "",
                  unitId: value === line.itemName ? line.unitId : "",
                  unitOptions: value === line.itemName ? line.unitOptions : []
                }
              : line
          )
        }));
        openSuggestions(lineId);
      },
    [openSuggestions]
  );

  const handleUnitChange = useCallback(
    (lineId: string) =>
      (event: ChangeEvent<HTMLSelectElement>) => {
        const { value } = event.target;
        setFormState((prev) => ({
          ...prev,
          lines: prev.lines.map((line) =>
            line.tempId === lineId
              ? {
                  ...line,
                  unitId: value
                }
              : line
          )
        }));
      },
    []
  );

  const handleAddLine = useCallback(() => {
    setFormState((prev) => ({ ...prev, lines: [...prev.lines, createEmptyLine()] }));
  }, []);

  const handleRemoveLine = useCallback((lineId: string) => {
    setFormState((prev) => {
      const nextLines = prev.lines.filter((line) => line.tempId !== lineId);
      return { ...prev, lines: nextLines.length ? nextLines : [createEmptyLine()] };
    });
  }, []);
  const linesSummary = useMemo(() => {
    return formState.lines.reduce(
      (acc, line) => {
        const qty = Number(line.quantity);
        const price = Number(line.unitCost);

        if (Number.isFinite(qty)) {
          acc.quantity += qty;
        }
        if (Number.isFinite(qty) && Number.isFinite(price)) {
          const amount = qty * price;
          acc.amount += amount;
          acc.vat += amount * (VAT_RATE / (1 + VAT_RATE));
        }
        return acc;
      },
      { quantity: 0, amount: 0, vat: 0 }
    );
  }, [formState.lines]);

  const buildLinesPayload = useCallback(
    (): { payload: ReceiptLinePayload[]; error?: string } | { payload: null; error: string } => {
      const prepared: ReceiptLinePayload[] = [];

      for (const line of formState.lines) {
        if (!line.itemId.trim()) {
          return { payload: null, error: "Выберите товар для каждой строки" };
        }

        const unitId = line.unitId.trim();
        if (!unitId) {
          return { payload: null, error: "Укажите единицу измерения" };
        }

        const quantity = Number(line.quantity);
        const unitCost = Number(line.unitCost);

        if (!Number.isFinite(quantity) || quantity <= 0) {
          return { payload: null, error: "Количество должно быть положительным числом" };
        }

        if (!Number.isFinite(unitCost) || unitCost < 0) {
          return { payload: null, error: "Цена должна быть корректным числом" };
        }

        prepared.push({
          id: line.id,
          itemId: line.itemId,
          unitId,
          quantity,
          unitCost,
          vatRate: Math.round(VAT_RATE * 100)
        });
      }

      return { payload: prepared };
    },
    [formState.lines]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!formState.warehouseId.trim()) {
      setFormError("Укажите склад");
      return;
    }

    if (!formState.supplierId.trim()) {
      setFormError("Выберите поставщика");
      return;
    }

    const linesPayload = buildLinesPayload();
    if (!linesPayload.payload) {
      setFormError(linesPayload.error ?? "Строки документа заполнены некорректно");
      return;
    }

    const payload = buildReceiptPayload({
      code: formState.code || undefined,
      warehouseId: formState.warehouseId,
      supplierId: formState.supplierId ? formState.supplierId : undefined,
      supplierName: formState.supplierName,
      currency: "RUB",
      expectedAt: formState.expectedAt ? new Date(formState.expectedAt).toISOString() : undefined,
      receivedAt: formState.receivedAt ? new Date(formState.receivedAt).toISOString() : undefined,
      notes: formState.notes || undefined,
      actorId: formState.actorId || undefined,
      lines: linesPayload.payload
    });

    try {
      if (drawerMode === "create") {
        await createMutation.mutateAsync({ payload });
      } else if (selectedReceiptId) {
        await updateMutation.mutateAsync({ receiptId: selectedReceiptId, payload });
      }
      closeDrawer();
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Не удалось сохранить приёмку";
      setFormError(message);
    }
  };

  const handleDelete = async () => {
    if (!selectedReceiptId) {
      return;
    }

    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm("Удалить приёмку без возможности восстановления?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        receiptId: selectedReceiptId,
        actorId: formState.actorId || undefined
      });
      closeDrawer();
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Не удалось удалить приёмку";
      setFormError(message);
    }
  };
  const columns = useMemo<TableColumn<Receipt>[]>(
    () => [
      {
        id: "document",
        label: "Документ",
        render: (receipt) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, color: palette.textPrimary }}>{receipt.code}</span>
          </div>
        )
      },
      {
        id: "supplier",
        label: "Поставщик",
        render: (receipt) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>{receipt.supplierName}</span>
            {receipt.supplierInn ? (
              <span style={{ color: palette.textSecondary, fontSize: 12 }}>ИНН {receipt.supplierInn}</span>
            ) : null}
          </div>
        )
      },
      {
        id: "warehouse",
        label: "Склад",
        render: (receipt) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>{receipt.warehouseName ?? receipt.warehouseId}</span>
            <span style={{ color: palette.textSecondary, fontSize: 12 }}>
              План: {receipt.expectedAt ? formatDateTime(receipt.expectedAt) : "не указано"}
            </span>
          </div>
        )
      },
      {
        id: "amount",
        label: "Сумма",
        render: (receipt) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "right" }}>
            <span>
              {receipt.totalAmount.toLocaleString("ru-RU", {
                style: "currency",
                currency: receipt.currency ?? "RUB"
              })}
            </span>
            <span style={{ color: palette.textSecondary, fontSize: 12 }}>
              НДС 20%: {receipt.totalVat.toLocaleString("ru-RU", {
                style: "currency",
                currency: receipt.currency ?? "RUB"
              })}
            </span>
          </div>
        )
      },
      {
        id: "lines",
        label: "Позиций",
        width: 100,
        align: "right",
        render: (receipt) => <span>{receipt.linesCount}</span>
      },
      {
        id: "updatedAt",
        label: "Обновлено",
        width: 200,
        render: (receipt) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>{formatDateTime(receipt.updatedAt)}</span>
            {receipt.receivedAt ? (
              <span style={{ color: palette.textSecondary, fontSize: 12 }}>
                Принято: {formatDateTime(receipt.receivedAt)}
              </span>
            ) : null}
          </div>
        )
      },
      {
        id: "actions",
        label: "",
        width: 64,
        align: "right",
        render: (receipt) => (
          <button
            type="button"
            style={{ border: "none", background: "transparent", color: palette.primary, cursor: "pointer" }}
            onClick={() => handleEditClick(receipt)}
            aria-label={`Открыть ${receipt.code}`}
          >
            {iconMap.gear}
          </button>
        )
      }
    ],
    [handleEditClick]
  );

  const isLoading = receiptsQuery.isLoading && !useFallback;
  const hasError = receiptsQuery.isError && !useFallback;
  const drawerTitle =
    drawerMode === "create" ? "Новая приёмка" : `Редактирование ${selectedReceipt?.code ?? ""}`;
  return (
    <section style={layoutStyle}>
      <header style={headerStyle}>
        <h1 style={headingStyle}>Приёмка товаров</h1>
        <div style={headerActionsStyle}>
          <button type="button" style={primaryButtonStyle} onClick={handleCreateClick}>
            Создать приёмку
          </button>
        </div>
      </header>

      <FilterPanel>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 200 }}>
          <span style={filterLabelStyle}>Поиск</span>
          <input
            style={inputStyle}
            type="search"
            placeholder="Код, поставщик, склад..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 200 }}>
          <span style={filterLabelStyle}>Склад</span>
          <input
            style={inputStyle}
            value={warehouseFilter}
            onChange={(event) => setWarehouseFilter(event.target.value)}
            placeholder="UUID склада"
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 140 }}>
          <span style={filterLabelStyle}>Ограничение</span>
          <select
            style={selectStyle}
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
          >
            {[20, 50, 100, 200].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </FilterPanel>

      <div style={infoStyle}>
        {useFallback ? "Сервис недоступен, показаны резервные данные." : `Найдено приёмок: ${receipts.length}`}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : hasError ? (
        <div style={infoStyle}>
          Не удалось загрузить приёмки: {(receiptsQuery.error as Error).message}
        </div>
      ) : (
        <DataTable columns={columns} items={receipts} emptyMessage="Приёмки не найдены" />
      )}

      {drawerOpen ? (
        <SlideOver title={drawerTitle} onClose={closeDrawer}>
          <form style={{ display: "flex", flexDirection: "column", gap: 20 }} onSubmit={handleSubmit}>
            <div style={cardStyle}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: palette.textPrimary }}>
                Реквизиты документа
              </h3>

                            <div style={gridStyle}>
        <label style={formControlStyle}>
                  <span style={filterLabelStyle}>Номер</span>
                  <input
                    style={inputStyle}
                    value={formState.code}
                    readOnly
                    placeholder="Присваивается автоматически"
                    aria-readonly="true"
                  />
                </label>
        <label style={formControlStyle}>
                  <span style={filterLabelStyle}>Склад *</span>
                  <select
                    style={selectStyle}
                    value={formState.warehouseId}
                    onChange={handleWarehouseSelect}
                    required
                    disabled={isWarehousesLoading}
                  >
                    <option value="" disabled>
                      {isWarehousesLoading ? "Загрузка..." : "Выберите склад"}
                    </option>
                    {warehouseOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
        <label style={formControlStyle}>
                  <span style={filterLabelStyle}>Поставщик *</span>
                  <select
                    style={selectStyle}
                    value={formState.supplierId}
                    onChange={handleSupplierSelect}
                    required
                    disabled={isSuppliersLoading}
                  >
                    <option value="" disabled>
                      {isSuppliersLoading ? "Загрузка..." : "Выберите поставщика"}
                    </option>
                    {supplierOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={gridStyle}>
        <label style={formControlStyle}>
                  <span style={filterLabelStyle}>Плановая дата</span>
                  <input
                    type="datetime-local"
                    style={inputStyle}
                    value={formState.expectedAt}
                    onChange={handleFieldChange("expectedAt")}
                  />
                </label>
        <label style={formControlStyle}>
                  <span style={filterLabelStyle}>Дата приёмки</span>
                  <input
                    type="datetime-local"
                    style={inputStyle}
                    value={formState.receivedAt}
                    onChange={handleFieldChange("receivedAt")}
                  />
                </label>
        <label style={formControlStyle}>
                  <span style={filterLabelStyle}>Валюта</span>
                  <input
                    style={inputStyle}
                    value={formState.currency || "RUB"}
                    readOnly
                    aria-readonly="true"
                  />
                </label>
        <label style={formControlStyle}>
                  <span style={filterLabelStyle}>Ответственный</span>
                  <input
                    style={inputStyle}
                    value={formState.actorId}
                    onChange={handleFieldChange("actorId")}
                    placeholder="UUID ответственного"
                  />
                </label>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: palette.textPrimary }}>
                Позиции
              </h3>
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={{ ...headCellStyle, width: 40 }}>№</th>
                      <th style={headCellStyle}>Товар</th>
                      <th style={{ ...headCellStyle, width: 140 }}>Ед. изм.</th>
                      <th style={{ ...headCellStyle, width: 120, textAlign: "right" }}>Кол-во</th>
                      <th style={{ ...headCellStyle, width: 120, textAlign: "right" }}>Цена (RUB)</th>
                      <th style={{ ...headCellStyle, width: 140, textAlign: "right" }}>Сумма</th>
                      <th style={{ ...headCellStyle, width: 140, textAlign: "right" }}>НДС 20%</th>
                      <th style={{ ...headCellStyle, width: 48 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {formState.lines.map((line, index) => {
                      const quantity = Number(line.quantity);
                      const price = Number(line.unitCost);
                      const amount =
                        Number.isFinite(quantity) && Number.isFinite(price) ? quantity * price : 0;
                      const vatAmount = amount * (VAT_RATE / (1 + VAT_RATE));
                      const isActive = activeLineId === line.tempId;
                      const suggestionList =
                        isActive && !isItemsLoading ? findItemSuggestions(line.itemName) : [];
                      const showSuggestions =
                        isActive && (isItemsLoading || suggestionList.length > 0);
                      const unitOptions = line.unitOptions;
                      const unitSelectDisabled = unitOptions.length === 0;

                      return (
                        <tr key={line.tempId}>
                          <td style={{ ...cellStyle, textAlign: "center" }}>{index + 1}</td>
                          <td style={cellStyle}>
                            <div style={suggestionWrapperStyle}>
                              <input
                                style={tableInputStyle}
                                value={line.itemName}
                                onChange={handleItemNameInput(line.tempId)}
                                onFocus={() => openSuggestions(line.tempId)}
                                onBlur={scheduleSuggestionsClose}
                                placeholder="Начните вводить название товара"
                                autoComplete="off"
                              />
                              {showSuggestions ? (
                                <div
                                  style={suggestionContainerStyle}
                                  onMouseEnter={cancelSuggestionsClose}
                                  onMouseLeave={scheduleSuggestionsClose}
                                >
                                  {isItemsLoading ? (
                                    <span style={suggestionEmptyStyle}>Загрузка...</span>
                                  ) : suggestionList.length ? (
                                    suggestionList.map((item) => (
                                      <button
                                        key={item.id}
                                        type="button"
                                        style={suggestionOptionStyle}
                                        onMouseDown={(event) => {
                                          event.preventDefault();
                                          handleItemSelect(line.tempId, item);
                                        }}
                                      >
                                        <span>{item.name}</span>
                                      </button>
                                    ))
                                  ) : (
                                    <span style={suggestionEmptyStyle}>Ничего не найдено</span>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td style={{ ...cellStyle, width: 140 }}>
                            <select
                              style={selectStyle}
                              value={line.unitId}
                              onChange={handleUnitChange(line.tempId)}
                              required
                              disabled={unitSelectDisabled}
                            >
                              <option value="" disabled>
                                {unitSelectDisabled ? "Выберите товар" : "Выберите единицу"}
                              </option>
                              {unitOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ ...cellStyle, width: 120 }}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              style={tableNumberInputStyle}
                              value={line.quantity}
                              onChange={handleLineChange(line.tempId, "quantity")}
                              required
                            />
                          </td>
                          <td style={{ ...cellStyle, width: 120 }}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              style={tableNumberInputStyle}
                              value={line.unitCost}
                              onChange={handleLineChange(line.tempId, "unitCost")}
                              required
                            />
                          </td>
                          <td style={amountCellStyle}>
                            {amount.toLocaleString("ru-RU", {
                              style: "currency",
                              currency: "RUB"
                            })}
                          </td>
                          <td style={vatCellStyle}>
                            {vatAmount.toLocaleString("ru-RU", {
                              style: "currency",
                              currency: "RUB"
                            })}
                          </td>
                          <td style={{ ...cellStyle, textAlign: "center" }}>
                            <button
                              type="button"
                              style={{ border: "none", background: "transparent", color: palette.textSecondary, cursor: "pointer" }}
                              onClick={() => handleRemoveLine(line.tempId)}
                              disabled={formState.lines.length === 1}
                              aria-label="Удалить строку"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td colSpan={8} style={{ ...cellStyle, textAlign: "center" }}>
                        <button type="button" style={addLineButtonStyle} onClick={handleAddLine}>
                          + Добавить строку
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={summaryStyle}>
                <span>
                  Количество: <span style={summaryValueStyle}>{linesSummary.quantity.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}</span>
                </span>
                <span>
                  Сумма: <span style={summaryValueStyle}>{linesSummary.amount.toLocaleString("ru-RU", { style: "currency", currency: "RUB" })}</span>
                </span>
                <span>
                  НДС 20%: <span style={summaryValueStyle}>{linesSummary.vat.toLocaleString("ru-RU", { style: "currency", currency: "RUB" })}</span>
                </span>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: palette.textPrimary }}>
                Комментарий
              </h3>
              <textarea
                style={textareaStyle}
                value={formState.notes}
                onChange={handleFieldChange("notes")}
                placeholder="Дополнительные инструкции или примечания"
              />
            </div>

            {formError ? <div style={errorStyle}>{formError}</div> : null}

            <div style={actionBarStyle}>
              {drawerMode === "edit" ? (
                <button
                  type="button"
                  style={dangerButtonStyle}
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Удаляем..." : "Удалить"}
                </button>
              ) : null}
              <button type="button" style={secondaryButtonStyle} onClick={closeDrawer}>
                Отмена
              </button>
              <button
                type="submit"
                style={primaryButtonStyle}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {drawerMode === "create"
                  ? createMutation.isPending
                    ? "Создаём..."
                    : "Создать"
                  : updateMutation.isPending
                  ? "Сохраняем..."
                  : "Сохранить"}
              </button>
            </div>
          </form>
        </SlideOver>
      ) : null}
    </section>
  );
};

export default ReceiptsPage;

























































