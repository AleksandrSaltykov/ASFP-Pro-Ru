import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import {
  AttributeTemplate,
  AttributeValueInput,
  CatalogNode,
  Item,
  ItemPayload,
  Warehouse,
  useAttributeTemplatesQuery,
  useCatalogNodesQuery,
  useCreateItemMutation,
  useDeleteItemMutation,
  useItemsQuery,
  useUpdateItemMutation,
  useWarehousesQuery
} from "@shared/api";
import { palette, typography } from "@shared/ui/theme";

type ItemFormMode = "create" | "edit";

type FeedbackState = {
  type: "success" | "error";
  message: string;
};

type AttributeDraftValue = {
  stringValue?: string;
  numberValue?: string;
  booleanValue?: boolean;
  jsonValue?: string;
};

type AttributeDraft = Record<string, AttributeDraftValue>;

type ItemFormProps = {
  mode: ItemFormMode;
  item: Item | null;
  templates: AttributeTemplate[];
  categories: CatalogNode[];
  units: CatalogNode[];
  warehouses: Warehouse[];
  onSubmit: (payload: ItemPayload, itemId?: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
  submitting: boolean;
  deleting: boolean;
  feedback: FeedbackState | null;
};

const feedbackPalette = {
  success: { background: "rgba(34, 197, 94, 0.16)", text: "#166534" },
  error: { background: "rgba(239, 68, 68, 0.16)", text: "#b91c1c" }
} as const;

const sectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: 16,
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: palette.layer,
  boxShadow: palette.shadowElevated
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontFamily: typography.fontFamily,
  color: palette.textPrimary
};

const listContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  maxHeight: 360,
  overflowY: "auto",
  paddingRight: 4
};

const listItemStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: "12px 14px",
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: palette.surface
};

const layoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 320px) 1fr",
  gap: 18
};

const formContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  padding: 16,
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: palette.surface
};

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textSecondary,
  textTransform: "uppercase",
  letterSpacing: "0.08em"
};

const inputStyle: CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: palette.layer,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily,
  fontSize: 14
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 90,
  resize: "vertical" as const
};

const attributesGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12
};

const attributeCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: 12,
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: palette.layer
};

const checkboxRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8
};

const actionsRowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap"
};

const primaryButtonStyle: CSSProperties = {
  padding: "8px 16px",
  borderRadius: 10,
  border: "none",
  background: palette.primary,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer"
};

const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: palette.accentMuted,
  color: palette.textPrimary
};

const dangerButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "#d64545"
};

const tagStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 8px",
  borderRadius: 10,
  backgroundColor: palette.accentSoft,
  color: palette.textSecondary,
  fontSize: 11,
  letterSpacing: "0.04em"
};

const helperTextStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textMuted,
  lineHeight: 1.4
};

const errorStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  backgroundColor: "rgba(214,69,69,0.12)",
  color: "#d64545",
  fontSize: 13
};

const feedbackContainerStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500
};

const warehousesGridStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8
};

const warehouseChipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 10,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: palette.layer
};

const emptyStateStyle: CSSProperties = {
  padding: "12px 0",
  color: palette.textMuted,
  fontSize: 13
};

export const ItemManager = () => {
  const itemsQuery = useItemsQuery();
  const templatesQuery = useAttributeTemplatesQuery("item");
  const categoriesQuery = useCatalogNodesQuery("category");
  const unitsQuery = useCatalogNodesQuery("unit");
  const warehousesQuery = useWarehousesQuery();

  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const sortedItems = useMemo(
    () => items.slice().sort((a, b) => a.name.localeCompare(b.name, "ru")),
    [items]
  );
  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const units = useMemo(() => unitsQuery.data ?? [], [unitsQuery.data]);
  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data]);

  const [mode, setMode] = useState<ItemFormMode>("create");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
  }, []);

  const showFeedback = (type: FeedbackState["type"], message: string) => {
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    setFeedback({ type, message });
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, 4000);
  };

  const createMutation = useCreateItemMutation({
    onSuccess: (data) => {
      showFeedback("success", "Карточка создана");
      setSelectedItem(data);
      setMode("edit");
    },
    onError: (error) => {
      showFeedback("error", error.message || "Не удалось сохранить карточку");
    }
  });

  const updateMutation = useUpdateItemMutation({
    onSuccess: (data) => {
      showFeedback("success", "Изменения сохранены");
      setSelectedItem(data);
      setMode("edit");
    },
    onError: (error) => {
      showFeedback("error", error.message || "Не удалось сохранить изменения");
    }
  });

  const deleteMutation = useDeleteItemMutation({
    onSuccess: () => {
      showFeedback("success", "Карточка удалена");
      setSelectedItem(null);
      setMode("create");
    },
    onError: (error) => {
      showFeedback("error", error.message || "Не удалось удалить карточку");
    }
  });

  const isLoading =
    itemsQuery.isLoading ||
    templatesQuery.isLoading ||
    categoriesQuery.isLoading ||
    unitsQuery.isLoading ||
    warehousesQuery.isLoading;

  const busy = createMutation.isPending || updateMutation.isPending;

  const handleSelectItem = (item: Item) => {
    setFeedback(null);
    setSelectedItem(item);
    setMode("edit");
  };

  const handleCreateNew = () => {
    setFeedback(null);
    setSelectedItem(null);
    setMode("create");
  };

  const handleSubmit = (payload: ItemPayload, itemId?: string) => {
    setFeedback(null);
    if (mode === "edit" && itemId) {
      updateMutation.mutate({ itemId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = () => {
    if (!selectedItem) {
      return;
    }
    if (!window.confirm(`Удалить товар «${selectedItem.name}»?`)) {
      return;
    }
    deleteMutation.mutate({ itemId: selectedItem.id });
  };

  return (
    <section style={sectionStyle}>
      <header style={headerStyle}>
        <h2 style={titleStyle}>Номенклатура</h2>
        <button type="button" style={secondaryButtonStyle} onClick={handleCreateNew} disabled={busy}>
          Новый товар
        </button>
      </header>

      <div style={layoutStyle}>
        <div style={listContainerStyle}>
          {isLoading ? (
            <div style={emptyStateStyle}>Загружаем данные…</div>
          ) : sortedItems.length === 0 ? (
            <div style={emptyStateStyle}>Пока нет товаров</div>
          ) : (
            sortedItems.map((item) => {
              const isCurrent = selectedItem?.id === item.id;
              return (
                <article
                  key={item.id}
                  style={{
                    ...listItemStyle,
                    border: isCurrent ? `1px solid ${palette.accentMuted}` : listItemStyle.border,
                    boxShadow: isCurrent ? palette.shadowElevated : listItemStyle.boxShadow,
                    backgroundColor: isCurrent ? palette.layerStrong : listItemStyle.backgroundColor,
                    cursor: "pointer"
                  }}
                  onClick={() => handleSelectItem(item)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize: 12, color: palette.textMuted }}>SKU: {item.sku}</div>
                    </div>
                    <span style={tagStyle}>{item.unit?.name ?? "ЕИ не задана"}</span>
                  </div>
                  <div style={{ fontSize: 12, color: palette.textSecondary }}>
                    {item.category?.name ? `Категория: ${item.category.name}` : "Категория не задана"}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <ItemForm
          mode={mode}
          item={selectedItem}
          templates={templates}
          categories={categories}
          units={units}
          warehouses={warehouses}
          onSubmit={handleSubmit}
          onCancel={handleCreateNew}
          onDelete={selectedItem ? handleDelete : undefined}
          submitting={busy}
          deleting={deleteMutation.isPending}
          feedback={feedback}
        />
      </div>
    </section>
  );
};

const ItemForm = ({
  mode,
  item,
  templates,
  categories,
  units,
  warehouses,
  onSubmit,
  onCancel,
  onDelete,
  submitting,
  deleting,
  feedback
}: ItemFormProps) => {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [barcode, setBarcode] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [volumeM3, setVolumeM3] = useState("");
  const [metadata, setMetadata] = useState("");
  const [warehouseIds, setWarehouseIds] = useState<string[]>([]);
  const [attributeDraft, setAttributeDraft] = useState<AttributeDraft>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setSku(item?.sku ?? "");
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
    setCategoryId(item?.categoryId ?? "");
    setUnitId(item?.unitId ?? "");
    setBarcode(item?.barcode ?? "");
    setWeightKg(item?.weightKg != null ? String(item.weightKg) : "");
    setVolumeM3(item?.volumeM3 != null ? String(item.volumeM3) : "");
    setMetadata(item?.metadata ? JSON.stringify(item.metadata, null, 2) : "");
    setWarehouseIds(item?.warehouseIds?.map((value) => value) ?? []);

    const next: AttributeDraft = {};
    templates.forEach((template) => {
      const existing = item?.attributes?.find((attr) => attr.template.id === template.id);
      next[template.id] = {
        stringValue: existing?.stringValue ?? "",
        numberValue: existing?.numberValue != null ? String(existing.numberValue) : "",
        booleanValue: template.dataType === "boolean" ? existing?.booleanValue ?? false : undefined,
        jsonValue: existing?.jsonValue ? JSON.stringify(existing.jsonValue, null, 2) : ""
      };
      if (template.dataType === "boolean" && next[template.id].booleanValue === undefined) {
        next[template.id].booleanValue = false;
      }
    });
    setAttributeDraft(next);
    setFormError(null);
  }, [item, templates, mode]);

  const toggleWarehouse = (warehouseId: string) => {
    setWarehouseIds((prev) =>
      prev.includes(warehouseId)
        ? prev.filter((value) => value !== warehouseId)
        : [...prev, warehouseId]
    );
  };

  const updateAttributeDraft = (templateId: string, value: Partial<AttributeDraftValue>) => {
    setAttributeDraft((prev) => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        ...value
      }
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const trimmedSku = sku.trim();
    const trimmedName = name.trim();

    if (!trimmedSku || !trimmedName) {
      setFormError("Укажите SKU и наименование товара.");
      return;
    }

    if (!unitId) {
      setFormError("Выберите единицу измерения.");
      return;
    }

    let metadataObject: Record<string, unknown> | undefined;
    if (metadata.trim()) {
      try {
        metadataObject = JSON.parse(metadata);
      } catch {
        setFormError('Не удалось разобрать JSON в поле "Метаданные".');
        return;
      }
    }

    const normalizeNumber = (value: string) => Number(value.replace(",", "."));

    let weightValue: number | undefined;
    if (weightKg.trim()) {
      const parsed = normalizeNumber(weightKg.trim());
      if (Number.isNaN(parsed)) {
        setFormError('Поле "Вес, кг" должно быть числом.');
        return;
      }
      weightValue = parsed;
    }

    let volumeValue: number | undefined;
    if (volumeM3.trim()) {
      const parsed = normalizeNumber(volumeM3.trim());
      if (Number.isNaN(parsed)) {
        setFormError('Поле "Объем, м³" должно быть числом.');
        return;
      }
      volumeValue = parsed;
    }

    const attributePayload: AttributeValueInput[] = [];

    for (const template of templates) {
      const draft = attributeDraft[template.id] ?? {};
      switch (template.dataType) {
        case "string": {
          const value = (draft.stringValue ?? "").trim();
          if (!value) {
            if (template.isRequired) {
              setFormError(`Поле "${template.name}" обязательно для заполнения.`);
              return;
            }
          } else {
            attributePayload.push({ templateId: template.id, stringValue: value });
          }
          break;
        }
        case "number": {
          const raw = (draft.numberValue ?? "").trim();
          if (!raw) {
            if (template.isRequired) {
              setFormError(`Заполните числовой атрибут "${template.name}".`);
              return;
            }
          } else {
            const parsed = normalizeNumber(raw);
            if (Number.isNaN(parsed)) {
              setFormError(`Атрибут "${template.name}" должен быть числом.`);
              return;
            }
            attributePayload.push({ templateId: template.id, numberValue: parsed });
          }
          break;
        }
        case "boolean": {
          attributePayload.push({
            templateId: template.id,
            booleanValue: Boolean(draft.booleanValue)
          });
          break;
        }
        case "json": {
          const raw = draft.jsonValue ?? "";
          if (!raw.trim()) {
            if (template.isRequired) {
              setFormError(`Добавьте JSON значение для атрибута "${template.name}".`);
              return;
            }
          } else {
            try {
              const parsed = JSON.parse(raw);
              attributePayload.push({ templateId: template.id, jsonValue: parsed });
            } catch {
              setFormError(`JSON атрибута "${template.name}" задан некорректно.`);
              return;
            }
          }
          break;
        }
        default:
          break;
      }
    }

    const payload: ItemPayload = {
      sku: trimmedSku,
      name: trimmedName,
      description: description.trim() || undefined,
      categoryId: categoryId || undefined,
      unitId,
      barcode: barcode.trim() || undefined,
      weightKg: weightValue,
      volumeM3: volumeValue,
      metadata: metadataObject,
      warehouseIds: warehouseIds.length ? warehouseIds : undefined,
      attributes: attributePayload.length ? attributePayload : undefined
    };

    onSubmit(payload, item?.id);
  };

  return (
    <form style={formContainerStyle} onSubmit={handleSubmit}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ ...titleStyle, fontSize: 16 }}>
          {mode === "create" ? "Новый товар" : `Редактирование: ${item?.name ?? ""}`}
        </h3>
        {onDelete ? (
          <button type="button" style={dangerButtonStyle} onClick={onDelete} disabled={deleting}>
            Удалить
          </button>
        ) : null}
      </div>

      {feedback ? (
        <div
          style={{
            ...feedbackContainerStyle,
            backgroundColor: feedbackPalette[feedback.type].background,
            color: feedbackPalette[feedback.type].text
          }}
        >
          {feedback.message}
        </div>
      ) : null}

      {formError ? <div style={errorStyle}>{formError}</div> : null}

      <label style={fieldStyle}>
        <span style={labelStyle}>SKU *</span>
        <input
          style={inputStyle}
          value={sku}
          onChange={(event) => setSku(event.target.value)}
          disabled={submitting}
          required
        />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Наименование *</span>
        <input
          style={inputStyle}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={submitting}
          required
        />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Описание</span>
        <textarea
          style={textareaStyle}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={submitting}
        />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Категория</span>
        <select
          style={inputStyle as CSSProperties}
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          disabled={submitting}
        >
          <option value="">(не выбрано)</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Единица измерения *</span>
        <select
          style={inputStyle as CSSProperties}
          value={unitId}
          onChange={(event) => setUnitId(event.target.value)}
          disabled={submitting}
          required
        >
          <option value="">(не выбрано)</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <label style={fieldStyle}>
          <span style={labelStyle}>Штрихкод</span>
          <input
            style={inputStyle}
            value={barcode}
            onChange={(event) => setBarcode(event.target.value)}
            disabled={submitting}
          />
        </label>
        <label style={fieldStyle}>
          <span style={labelStyle}>Вес, кг</span>
          <input
            style={inputStyle}
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
            disabled={submitting}
          />
        </label>
        <label style={fieldStyle}>
          <span style={labelStyle}>Объем, м³</span>
          <input
            style={inputStyle}
            value={volumeM3}
            onChange={(event) => setVolumeM3(event.target.value)}
            disabled={submitting}
          />
        </label>
      </div>

      <label style={fieldStyle}>
        <span style={labelStyle}>Метаданные (JSON)</span>
        <textarea
          style={textareaStyle}
          value={metadata}
          onChange={(event) => setMetadata(event.target.value)}
          disabled={submitting}
          placeholder={'{\n  "key": "value"\n}'}
        />
      </label>

      <div style={fieldStyle}>
        <span style={labelStyle}>Склады</span>
        <div style={warehousesGridStyle}>
          {warehouses.length === 0 ? (
            <span style={helperTextStyle}>Сначала создайте склады в соответствующем разделе.</span>
          ) : (
            warehouses.map((warehouse) => {
              const checked = warehouseIds.includes(warehouse.id);
              return (
                <label key={warehouse.id} style={warehouseChipStyle}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleWarehouse(warehouse.id)}
                    disabled={submitting}
                  />
                  <span>{warehouse.name}</span>
                </label>
              );
            })
          )}
        </div>
      </div>

      <div style={fieldStyle}>
        <span style={labelStyle}>Динамические атрибуты</span>
        <div style={attributesGridStyle}>
          {templates.length === 0 ? (
            <div style={helperTextStyle}>Атрибуты пока не настроены.</div>
          ) : (
            templates.map((template) => {
              const draft = attributeDraft[template.id] ?? {};
              return (
                <div key={template.id} style={attributeCardStyle}>
                  <div>
                    <strong>{template.name}</strong>
                    <div style={{ ...helperTextStyle, marginTop: 4 }}>
                      Тип: {template.dataType}
                      {template.isRequired ? " · обязательно" : ""}
                    </div>
                  </div>

                  {template.dataType === "string" ? (
                    <input
                      style={inputStyle}
                      value={draft.stringValue ?? ""}
                      onChange={(event) =>
                        updateAttributeDraft(template.id, { stringValue: event.target.value })
                      }
                      disabled={submitting}
                    />
                  ) : null}

                  {template.dataType === "number" ? (
                    <input
                      style={inputStyle}
                      value={draft.numberValue ?? ""}
                      onChange={(event) =>
                        updateAttributeDraft(template.id, { numberValue: event.target.value })
                      }
                      disabled={submitting}
                    />
                  ) : null}

                  {template.dataType === "boolean" ? (
                    <label style={checkboxRowStyle}>
                      <input
                        type="checkbox"
                        checked={Boolean(draft.booleanValue)}
                        onChange={(event) =>
                          updateAttributeDraft(template.id, { booleanValue: event.target.checked })
                        }
                        disabled={submitting}
                      />
                      <span style={{ fontSize: 13, color: palette.textSecondary }}>Активен</span>
                    </label>
                  ) : null}

                  {template.dataType === "json" ? (
                    <textarea
                      style={textareaStyle}
                      value={draft.jsonValue ?? ""}
                      onChange={(event) =>
                        updateAttributeDraft(template.id, { jsonValue: event.target.value })
                      }
                      disabled={submitting}
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={actionsRowStyle}>
        <button type="submit" style={primaryButtonStyle} disabled={submitting}>
          {mode === "create" ? "Создать" : "Сохранить"}
        </button>
        <button type="button" style={secondaryButtonStyle} onClick={onCancel} disabled={submitting}>
          Очистить
        </button>
      </div>
    </form>
  );
};
