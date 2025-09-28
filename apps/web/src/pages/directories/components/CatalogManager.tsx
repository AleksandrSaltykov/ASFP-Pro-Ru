import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import {
  CatalogNode,
  CatalogNodePayload,
  useCatalogNodesQuery,
  useCreateCatalogNodeMutation,
  useDeleteCatalogNodeMutation,
  useUpdateCatalogNodeMutation
} from "@shared/api";
import { palette, typography } from "@shared/ui/theme";

type FormMode = "create" | "edit";

type CatalogManagerProps = {
  catalogType: string;
  title: string;
  description?: string;
};

type CatalogFormState = {
  code: string;
  name: string;
  description: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
  metadata: string;
};

type FeedbackState = {
  type: "success" | "error";
  message: string;
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
  flexDirection: "column",
  gap: 6
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontFamily: typography.fontFamily,
  color: palette.textPrimary
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: palette.textSecondary,
  fontSize: 13,
  lineHeight: 1.5
};

const contentGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 320px) 1fr",
  gap: 18
};

const listStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  maxHeight: 320,
  overflowY: "auto",
  paddingRight: 4
};

const listItemStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "10px 12px",
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: palette.surface
};

const listItemHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8
};

const badgeStyle: CSSProperties = {
  padding: "2px 6px",
  borderRadius: 8,
  backgroundColor: palette.accentSoft,
  color: palette.textSecondary,
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.08em"
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
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
  minHeight: 80,
  resize: "vertical" as const
};

const checkboxRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: 10
};

const primaryButtonStyle: CSSProperties = {
  padding: "8px 14px",
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

const emptyStateStyle: CSSProperties = {
  padding: "12px 0",
  color: palette.textMuted,
  fontSize: 13
};

const initialFormState: CatalogFormState = {
  code: "",
  name: "",
  description: "",
  parentId: "",
  sortOrder: "",
  isActive: true,
  metadata: ""
};

export const CatalogManager = ({ catalogType, title, description }: CatalogManagerProps) => {
  const nodesQuery = useCatalogNodesQuery(catalogType);
  const nodes = useMemo(() => nodesQuery.data ?? [], [nodesQuery.data]);
  const nodeLookup = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const [mode, setMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CatalogFormState>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
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

  const resetForm = () => {
    setMode("create");
    setEditingId(null);
    setFormState(initialFormState);
    setFormError(null);
  };

  const createMutation = useCreateCatalogNodeMutation({
    onSuccess: () => {
      showFeedback("success", "Запись добавлена");
      resetForm();
    },
    onError: (error) => {
      showFeedback("error", error.message || "Не удалось создать запись");
    }
  });

  const updateMutation = useUpdateCatalogNodeMutation({
    onSuccess: () => {
      showFeedback("success", "Изменения сохранены");
      resetForm();
    },
    onError: (error) => {
      showFeedback("error", error.message || "Не удалось сохранить изменения");
    }
  });

  const deleteMutation = useDeleteCatalogNodeMutation({
    onSuccess: () => {
      showFeedback("success", "Запись удалена");
      if (editingId) {
        resetForm();
      }
    },
    onError: (error) => {
      showFeedback("error", error.message || "Не удалось удалить запись");
    }
  });

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    nodesQuery.isFetching;

  const handleSelect = (node: CatalogNode) => {
    setFeedback(null);
    setMode("edit");
    setEditingId(node.id);
    setFormState({
      code: node.code,
      name: node.name,
      description: node.description ?? "",
      parentId: node.parentId ?? "",
      sortOrder: node.sortOrder !== undefined ? String(node.sortOrder) : "",
      isActive: node.isActive,
      metadata: node.metadata ? JSON.stringify(node.metadata, null, 2) : ""
    });
    setFormError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFeedback(null);

    const trimmedCode = formState.code.trim();
    const trimmedName = formState.name.trim();

    if (!trimmedCode || !trimmedName) {
      setFormError("Укажите код и наименование.");
      return;
    }

    let metadataObject: Record<string, unknown> | undefined;
    if (formState.metadata.trim()) {
      try {
        metadataObject = JSON.parse(formState.metadata);
      } catch {
        setFormError('Не удалось разобрать JSON в поле "Метаданные".');
        return;
      }
    }

    let sortOrderValue: number | undefined;
    if (formState.sortOrder.trim()) {
      const parsed = Number(formState.sortOrder.trim());
      if (Number.isNaN(parsed)) {
        setFormError('Поле "Порядок" должно быть числом.');
        return;
      }
      sortOrderValue = parsed;
    }

    const payload: CatalogNodePayload = {
      code: trimmedCode,
      name: trimmedName,
      description: formState.description.trim() || undefined,
      sortOrder: sortOrderValue,
      isActive: formState.isActive,
      metadata: metadataObject
    };

    if (formState.parentId) {
      payload.parentId = formState.parentId;
    }

    if (mode === "edit" && editingId) {
      updateMutation.mutate({ catalogType, nodeId: editingId, payload });
    } else {
      createMutation.mutate({ catalogType, payload });
    }
  };

  const handleDelete = (node: CatalogNode) => {
    if (!window.confirm(`Удалить узел «${node.name}»?`)) {
      return;
    }
    deleteMutation.mutate({ catalogType, nodeId: node.id });
  };

  return (
    <section style={sectionStyle}>
      <header style={headerStyle}>
        <h2 style={titleStyle}>{title}</h2>
        {description ? <p style={descriptionStyle}>{description}</p> : null}
      </header>

      <div style={contentGridStyle}>
        <div style={listStyle}>
          {nodes.length === 0 ? (
            <div style={emptyStateStyle}>Пока нет записей</div>
          ) : (
            nodes.map((node) => {
              const parent = node.parentId ? nodeLookup.get(node.parentId) : undefined;
              const isActive = node.isActive;
              return (
                <article key={node.id} style={listItemStyle}>
                  <div style={listItemHeaderStyle}>
                    <div>
                      <strong>{node.name}</strong>
                      <div style={{ fontSize: 12, color: palette.textMuted }}>Код: {node.code}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelect(node)}
                      style={{ ...secondaryButtonStyle, padding: "4px 10px", fontSize: 12 }}
                    >
                      Редактировать
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                    {parent ? (
                      <span>
                        Родитель: <strong>{parent.name}</strong>
                      </span>
                    ) : null}
                    <span>
                      Статус: <span style={badgeStyle}>{isActive ? "Активен" : "Выключен"}</span>
                    </span>
                    {node.sortOrder !== undefined ? <span>Порядок: {node.sortOrder}</span> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(node)}
                    style={{ ...dangerButtonStyle, padding: "6px 10px", fontSize: 12 }}
                    disabled={deleteMutation.isPending}
                  >
                    Удалить
                  </button>
                </article>
              );
            })
          )}
        </div>

        <form style={formStyle} onSubmit={handleSubmit}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ ...titleStyle, fontSize: 16 }}>
              {mode === "create" ? "Добавление записи" : "Редактирование записи"}
            </h3>
            {mode === "edit" ? (
              <button type="button" style={secondaryButtonStyle} onClick={resetForm} disabled={busy}>
                Новая запись
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
            <span style={labelStyle}>Код *</span>
            <input
              style={inputStyle}
              value={formState.code}
              onChange={(event) => setFormState((prev) => ({ ...prev, code: event.target.value }))}
              disabled={busy}
              required
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Наименование *</span>
            <input
              style={inputStyle}
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              disabled={busy}
              required
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Описание</span>
            <textarea
              style={textareaStyle}
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              disabled={busy}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Родитель</span>
            <select
              style={inputStyle as CSSProperties}
              value={formState.parentId}
              onChange={(event) => setFormState((prev) => ({ ...prev, parentId: event.target.value }))}
              disabled={busy}
            >
              <option value="">(без родителя)</option>
              {nodes
                .filter((node) => node.id !== editingId)
                .map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name}
                  </option>
                ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Порядок</span>
            <input
              style={inputStyle}
              type="number"
              value={formState.sortOrder}
              onChange={(event) => setFormState((prev) => ({ ...prev, sortOrder: event.target.value }))}
              disabled={busy}
            />
          </label>

          <label style={checkboxRowStyle}>
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={(event) => setFormState((prev) => ({ ...prev, isActive: event.target.checked }))}
              disabled={busy}
            />
            <span style={{ fontSize: 13, color: palette.textSecondary }}>Активный</span>
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Метаданные (JSON)</span>
            <textarea
              style={textareaStyle}
              value={formState.metadata}
              placeholder={'{\n  "key": "value"\n}'}
              onChange={(event) => setFormState((prev) => ({ ...prev, metadata: event.target.value }))}
              disabled={busy}
            />
          </label>

          <div style={actionsStyle}>
            <button type="submit" style={primaryButtonStyle} disabled={busy}>
              {mode === "create" ? "Создать" : "Сохранить"}
            </button>
            <button type="button" style={secondaryButtonStyle} onClick={resetForm} disabled={busy}>
              Очистить
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
