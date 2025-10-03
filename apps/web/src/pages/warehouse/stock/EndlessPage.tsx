import { useMemo, useState, type FormEvent, type CSSProperties } from "react";

import {
  useEndlessPolicies,
  useResetEndlessPolicy,
  useStockAvailability,
  useUpdateEndlessPolicy,
  type EndlessPolicy,
  type EndlessPolicyKind
} from "@shared/api";
import { palette, typography } from "@shared/ui/theme";

import { Badge } from "../components/Badge";
import DataTable, { type TableColumn } from "../components/DataTable";
import { FilterPanel } from "../components/FilterPanel";
import { Pagination } from "../components/Pagination";
import SlideOver from "../components/SlideOver";

const titleStyle = {
  margin: 0,
  fontSize: 28,
  fontWeight: 600,
  fontFamily: typography.fontFamily,
  color: palette.textPrimary
};

const descriptionStyle = {
  margin: 0,
  fontSize: 15,
  color: palette.textSecondary,
  lineHeight: 1.5
};

const controlStyle = {
  minWidth: 180,
  padding: "8px 12px",
  borderRadius: 12,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  color: palette.textPrimary,
  fontSize: 14
};

const labelStyle = {
  fontSize: 11,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: palette.textSoft
};

const inputGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 6
};

const buttonStyle = {
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  borderRadius: 12,
  padding: "8px 14px",
  fontSize: 13,
  cursor: "pointer",
  color: palette.textPrimary
};

const primaryButtonStyle = {
  ...buttonStyle,
  background: palette.primary,
  borderColor: palette.primary,
  color: "#ffffff"
};

const PAGE_SIZE = 8;

const getPolicyStatus = (policy: EndlessPolicy) => {
  if (policy.policy === "NONE") {
    return "empty" as const;
  }
  if (policy.policy === "MINMAX") {
    return policy.min != null && policy.max != null ? "filled" : "empty";
  }
  if (policy.policy === "ROP") {
    return policy.reorderPoint != null ? "filled" : "empty";
  }
  return "empty" as const;
};

const formatNumber = (value: number | null | undefined) =>
  value == null ? "—" : value.toLocaleString("ru-RU");

export const EndlessPage = () => {
  const { data: policies = [] } = useEndlessPolicies();
  const { data: availability = [] } = useStockAvailability();

  const updateMutation = useUpdateEndlessPolicy();
  const resetMutation = useResetEndlessPolicy();

  const [warehouse, setWarehouse] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<EndlessPolicy | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availabilityIndex = useMemo(() => {
    const map = new Map<string, { category?: string; available: number }>();
    for (const row of availability) {
      map.set(row.itemCode, { category: row.category, available: row.available });
    }
    return map;
  }, [availability]);

  const enrichedPolicies = useMemo(() => {
    return policies.map((policy) => {
      const enrichment = availabilityIndex.get(policy.itemCode);
      return {
        ...policy,
        category: enrichment?.category,
        available: enrichment?.available ?? policy.available
      };
    });
  }, [policies, availabilityIndex]);

  const warehouses = useMemo(
    () => Array.from(new Set(enrichedPolicies.map((policy) => policy.warehouse))).sort(),
    [enrichedPolicies]
  );
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          enrichedPolicies
            .map((policy) => policy.category)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [enrichedPolicies]
  );

  const filtered = useMemo(() => {
    return enrichedPolicies.filter((policy) => {
      const policyStatus = getPolicyStatus(policy);
      if (warehouse !== "all" && policy.warehouse !== warehouse) {
        return false;
      }
      if (category !== "all" && policy.category !== category) {
        return false;
      }
      if (status !== "all" && policyStatus !== status) {
        return false;
      }
      if (search.trim()) {
        const needle = search.trim().toLowerCase();
        if (!policy.itemName.toLowerCase().includes(needle) && !policy.itemCode.toLowerCase().includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [enrichedPolicies, warehouse, category, status, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleExport = () => {
    console.info("[stock/endless] export triggered", { filters: { warehouse, category, status, search } });
  };

  const handleReset = (id: string) => {
    resetMutation.mutate(id, {
      onError: (mutationError) => {
        setError(mutationError.message);
      }
    });
  };

  const criticalRowStyle = {
    background: palette.accentMuted,
    boxShadow: `0 0 0 1px ${palette.primary} inset`
  } as const;

  const columns: TableColumn<EndlessPolicy & { category?: string }> [] = [
    {
      id: "item",
      label: "Item",
      render: (row) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <strong>{row.itemName}</strong>
          <span style={{ color: palette.textSecondary, fontSize: 12 }}>{row.itemCode}</span>
        </div>
      )
    },
    { id: "warehouse", label: "Warehouse", render: (row) => row.warehouse },
    { id: "policy", label: "Policy", render: (row) => row.policy },
    { id: "min", label: "Min", align: "right", render: (row) => formatNumber(row.min ?? null) },
    { id: "max", label: "Max", align: "right", render: (row) => formatNumber(row.max ?? null) },
    { id: "rop", label: "ROP", align: "right", render: (row) => formatNumber(row.reorderPoint ?? null) },
    {
      id: "safety",
      label: "SafetyStock",
      align: "right",
      render: (row) => formatNumber(row.safetyStock ?? null)
    },
    {
      id: "available",
      label: "Available",
      align: "right",
      render: (row) => (
        <Badge theme={row.available <= (row.policy === "MINMAX" ? (row.min ?? 0) : row.reorderPoint ?? 0) ? "warning" : "default"}>
          {row.available.toLocaleString("ru-RU")}
        </Badge>
      )
    },
    {
      id: "updated",
      label: "UpdatedAt",
      render: (row) => new Date(row.updatedAt).toLocaleString("ru-RU")
    },
    {
      id: "actions",
      label: "Действия",
      render: (row) => (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type='button' style={buttonStyle} onClick={() => openEditor(row)}>
            Редактировать
          </button>
          <button type='button' style={buttonStyle} onClick={() => handleReset(row.id)}>
            Сбросить
          </button>
        </div>
      )
    }
  ];

  const getRowStyle = (row: EndlessPolicy & { category?: string }): CSSProperties | undefined => {
    const limit = row.policy === "MINMAX" ? row.min ?? 0 : row.reorderPoint ?? 0;
    if (row.policy !== "NONE" && row.available <= limit && limit > 0) {
      return criticalRowStyle;
    }
    return undefined;
  };

  const editingAvailability = editing ? availabilityIndex.get(editing.itemCode) : undefined;

  const closeEditor = () => {
    setEditing(null);
    setFormState(null);
    setError(null);
  };

  const [formState, setFormState] = useState<{
    policy: EndlessPolicyKind;
    warehouse: string;
    min?: number | null;
    max?: number | null;
    reorderPoint?: number | null;
    safetyStock?: number | null;
    note?: string;
  } | null>(null);

  const openEditor = (policy: EndlessPolicy) => {
    setError(null);
    setEditing(policy);
    setFormState({
      policy: policy.policy,
      warehouse: policy.warehouse,
      min: policy.min ?? null,
      max: policy.max ?? null,
      reorderPoint: policy.reorderPoint ?? null,
      safetyStock: policy.safetyStock ?? null,
      note: policy.note
    });
  };

    const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing || !formState) {
      return;
    }

    const payload = {
      id: editing.id,
      warehouse: formState.warehouse,
      policy: formState.policy,
      min: formState.policy === "MINMAX" ? Math.max(Number(formState.min ?? 0), 0) : null,
      max: formState.policy === "MINMAX" ? Math.max(Number(formState.max ?? 0), 0) : null,
      reorderPoint: formState.policy === "ROP" ? Math.max(Number(formState.reorderPoint ?? 0), 0) : null,
      safetyStock: formState.safetyStock != null ? Math.max(Number(formState.safetyStock), 0) : null,
      note: formState.note ?? null
    };

    if (payload.policy === "MINMAX" && payload.max != null && payload.min != null && payload.max < payload.min) {
      setError("Max должно быть ≥ Min");
      return;
    }

    updateMutation.mutate(payload, {
      onSuccess: () => {
        setEditing(null);
        setFormState(null);
        setError(null);
      },
      onError: (mutationError) => {
        setError(mutationError.message);
      }
    });
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={titleStyle}>Нескончаемые остатки</h1>
        <p style={descriptionStyle}>
          Настройте поддержание запасов для критичных позиций. Политика действует только в выбранном складе и не
          запускает автоматические закупки — это справочная информация для операционных команд.
        </p>
      </header>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ color: palette.textSecondary, fontSize: 13 }}>Найдено {filtered.length} политик</span>
        <button type='button' style={buttonStyle} onClick={handleExport}>
          Экспорт CSV
        </button>
      </div>

      <FilterPanel>
        <label style={inputGroupStyle}>
          <span style={labelStyle}>Склад</span>
          <select
            style={controlStyle}
            value={warehouse}
            onChange={(event) => {
              setWarehouse(event.target.value);
              setPage(1);
            }}
          >
            <option value='all'>Все</option>
            {warehouses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label style={inputGroupStyle}>
          <span style={labelStyle}>Категория</span>
          <select
            style={controlStyle}
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value='all'>Все</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label style={inputGroupStyle}>
          <span style={labelStyle}>Статус заполнения</span>
          <select
            style={controlStyle}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value='all'>Все</option>
            <option value='filled'>Заполнено</option>
            <option value='empty'>Не заполнено</option>
          </select>
        </label>
        <label style={{ ...inputGroupStyle, minWidth: 240 }}>
          <span style={labelStyle}>Номенклатура</span>
          <input
            style={controlStyle}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder='Код или наименование'
          />
        </label>
      </FilterPanel>

      <DataTable
        columns={columns}
        items={paginated}
        emptyMessage='Нет настроенных политик'
        getRowStyle={getRowStyle}
      />

      <Pagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPrev={() => setPage((value) => Math.max(1, value - 1))}
        onNext={() => setPage((value) => Math.min(totalPages, value + 1))}
      />

      {editing && formState ? (
        <SlideOver title='Параметры нескончаемого запаса' onClose={closeEditor}>
          <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSubmit}>
            <p style={{ margin: 0, fontSize: 14, color: palette.textSecondary }}>
              {editing.itemName} ({editing.itemCode})
            </p>
            <label style={inputGroupStyle}>
              <span style={labelStyle}>Склад</span>
              <select
                style={controlStyle}
                value={formState.warehouse}
                onChange={(event) => setFormState((prev) => ({ ...(prev ?? formState), warehouse: event.target.value }))}
              >
                {warehouses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label style={inputGroupStyle}>
              <span style={labelStyle}>Политика</span>
              <select
                style={controlStyle}
                value={formState.policy}
                onChange={(event) => {
                  const value = event.target.value as EndlessPolicyKind;
                  setFormState((prev) => ({
                    ...(prev ?? formState),
                    policy: value,
                    min: value === "MINMAX" ? prev?.min ?? 0 : null,
                    max: value === "MINMAX" ? prev?.max ?? prev?.min ?? 0 : null,
                    reorderPoint: value === "ROP" ? prev?.reorderPoint ?? 0 : null
                  }));
                }}
              >
                <option value='MINMAX'>MINMAX</option>
                <option value='ROP'>ROP</option>
                <option value='NONE'>NONE</option>
              </select>
            </label>
            {formState.policy === "MINMAX" ? (
              <div style={{ display: "flex", gap: 12 }}>
                <label style={inputGroupStyle}>
                  <span style={labelStyle}>Min</span>
                  <input
                    style={controlStyle}
                    type='number'
                    min={0}
                    value={formState.min ?? 0}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...(prev ?? formState), min: Number(event.target.value) }))
                    }
                  />
                </label>
                <label style={inputGroupStyle}>
                  <span style={labelStyle}>Max</span>
                  <input
                    style={controlStyle}
                    type='number'
                    min={0}
                    value={formState.max ?? 0}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...(prev ?? formState), max: Number(event.target.value) }))
                    }
                  />
                </label>
              </div>
            ) : null}
            {formState.policy === "ROP" ? (
              <label style={inputGroupStyle}>
                <span style={labelStyle}>Reorder Point</span>
                <input
                  style={controlStyle}
                  type='number'
                  min={0}
                  value={formState.reorderPoint ?? 0}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...(prev ?? formState), reorderPoint: Number(event.target.value) }))
                  }
                />
              </label>
            ) : null}
            <label style={inputGroupStyle}>
              <span style={labelStyle}>Safety Stock</span>
              <input
                style={controlStyle}
                type='number'
                min={0}
                value={formState.safetyStock ?? 0}
                onChange={(event) =>
                  setFormState((prev) => ({ ...(prev ?? formState), safetyStock: Number(event.target.value) }))
                }
              />
            </label>
            <label style={inputGroupStyle}>
              <span style={labelStyle}>Заметка</span>
              <textarea
                style={{ ...controlStyle, minHeight: 90 }}
                value={formState.note ?? ""}
                onChange={(event) =>
                  setFormState((prev) => ({ ...(prev ?? formState), note: event.target.value }))
                }
              />
            </label>
            <p style={{ margin: 0, fontSize: 13, color: palette.textSecondary }}>
              Текущая доступность: {editingAvailability?.available ?? editing.available} {editingAvailability ? "шт" : ""}
            </p>
            {error ? (
              <div style={{ color: "#c62828", fontSize: 13 }}>{error}</div>
            ) : null}
            <div style={{ display: "flex", gap: 12 }}>
              <button type='submit' style={primaryButtonStyle}>
                Сохранить
              </button>
              <button type='button' style={buttonStyle} onClick={closeEditor}>
                Отмена
              </button>
            </div>
          </form>
        </SlideOver>
      ) : null}
    </section>
  );
};

export default EndlessPage;
