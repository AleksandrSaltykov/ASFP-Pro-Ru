import { FormEvent, useMemo, useState, type CSSProperties } from "react";

import {
  type Warehouse,
  type WarehousePayload,
  useCreateWarehouseMutation,
  useDeleteWarehouseMutation,
  useUpdateWarehouseMutation,
  useWarehousesQuery
} from "@shared/api";
import { PageLoader } from "@shared/ui/PageLoader";
import { palette, typography } from "@shared/ui/theme";
import { generateWarehouseCode } from "@shared/utils/identifiers";

import DataTable, { type TableColumn } from "../../components/DataTable";
import SlideOver from "../../components/SlideOver";

type WarehouseFormState = {
  code: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "archived";
  addressCity: string;
  addressStreet: string;
  addressBuilding: string;
  contactManager: string;
  contactPhone: string;
  contactEmail: string;
};

const defaultFormState: WarehouseFormState = {
  code: "",
  name: "",
  description: "",
  status: "active",
  addressCity: "",
  addressStreet: "",
  addressBuilding: "",
  contactManager: "",
  contactPhone: "",
  contactEmail: ""
};

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

const primaryButtonStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: 14,
  border: "none",
  background: palette.primary,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer"
};

const secondaryButtonStyle: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  color: palette.textPrimary,
  fontWeight: 600,
  cursor: "pointer"
};

const dangerButtonStyle: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "none",
  background: "#d32029",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer"
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18
};

const formRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16
};

const formControlStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: palette.textSoft,
  fontWeight: 600
};

const textInputStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  fontFamily: typography.fontFamily,
  fontSize: 14,
  color: palette.textPrimary
};

const textareaStyle: CSSProperties = {
  ...textInputStyle,
  minHeight: 110,
  resize: "vertical" as const
};

const selectStyle: CSSProperties = {
  ...textInputStyle,
  appearance: "none"
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap"
};

const errorStyle: CSSProperties = {
  color: "#d32029",
  fontWeight: 600
};

const tableNameCellStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4
};

const tableMetaStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textSecondary
};

const statusLabels: Record<WarehouseFormState["status"], string> = {
  active: "Активен",
  inactive: "Неактивен",
  archived: "Архив"
};

const formatAddress = (warehouse: Warehouse) => {
  const parts = [
    warehouse.address?.city,
    warehouse.address?.street,
    warehouse.address?.building
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
};

const formatContact = (warehouse: Warehouse) => {
  const info = [
    warehouse.contact?.manager,
    warehouse.contact?.phone,
    warehouse.contact?.email
  ].filter(Boolean);
  return info.length ? info.join(" · ") : "—";
};

const toOptional = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

export const WarehousesPage = () => {
  const warehousesQuery = useWarehousesQuery();
  const createMutation = useCreateWarehouseMutation();
  const updateMutation = useUpdateWarehouseMutation();
  const deleteMutation = useDeleteWarehouseMutation();

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(null);
  const [formState, setFormState] = useState<WarehouseFormState>(defaultFormState);
  const [formError, setFormError] = useState<string | null>(null);

  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data]);

  const columns: TableColumn<Warehouse>[] = [
    {
      id: "name",
      label: "Название",
      render: (warehouse) => (
        <div style={tableNameCellStyle}>
          <strong>{warehouse.name}</strong>
          {warehouse.description ? <span style={tableMetaStyle}>{warehouse.description}</span> : null}
        </div>
      )
    },
    {
      id: "status",
      label: "Статус",
      width: 120,
      render: (warehouse) => {
        const status = warehouse.status ?? "active";
        const label = statusLabels[status as WarehouseFormState["status"]];
        return label ?? status.toUpperCase();
      }
    },
    {
      id: "address",
      label: "Адрес",
      render: (warehouse) => formatAddress(warehouse)
    },
    {
      id: "contact",
      label: "Контакты",
      render: (warehouse) => formatContact(warehouse)
    },
    {
      id: "actions",
      label: "Действия",
      width: 140,
      render: (warehouse) => (
        <button
          type="button"
          style={{ ...secondaryButtonStyle, padding: "8px 14px", whiteSpace: "nowrap" }}
          onClick={() => openEditDrawer(warehouse)}
        >
          Изменить
        </button>
      )
    }
  ];

  const openCreateDrawer = () => {
    setMode("create");
    setCurrentWarehouse(null);
    setFormError(null);
    setFormState({
      ...defaultFormState,
      code: generateWarehouseCode()
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (warehouse: Warehouse) => {
    setMode("edit");
    setCurrentWarehouse(warehouse);
    setFormError(null);
    setFormState({
      code: warehouse.code ?? "",
      name: warehouse.name ?? "",
      description: warehouse.description ?? "",
      status: (warehouse.status as WarehouseFormState["status"]) ?? "active",
      addressCity: warehouse.address?.city ?? "",
      addressStreet: warehouse.address?.street ?? "",
      addressBuilding: warehouse.address?.building ?? "",
      contactManager: warehouse.contact?.manager ?? "",
      contactPhone: warehouse.contact?.phone ?? "",
      contactEmail: warehouse.contact?.email ?? ""
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setFormError(null);
    setCurrentWarehouse(null);
    setFormState(defaultFormState);
  };

  const handleFieldChange = (field: keyof WarehouseFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const code = formState.code.trim();
    const name = formState.name.trim();
    if (!code || !name) {
      setFormError("Укажите код и название склада");
      return;
    }

    const address = {
      city: toOptional(formState.addressCity),
      street: toOptional(formState.addressStreet),
      building: toOptional(formState.addressBuilding)
    };
    const hasAddress = Object.values(address).some(Boolean);

    const contact = {
      manager: toOptional(formState.contactManager),
      phone: toOptional(formState.contactPhone),
      email: toOptional(formState.contactEmail)
    };
    const hasContact = Object.values(contact).some(Boolean);

    const payload: WarehousePayload = {
      code,
      name,
      description: toOptional(formState.description),
      status: formState.status,
      address: hasAddress ? address : undefined,
      contact: hasContact ? contact : undefined
    };

    try {
      if (mode === "create") {
        await createMutation.mutateAsync(payload);
      } else if (currentWarehouse) {
        await updateMutation.mutateAsync({ warehouseId: currentWarehouse.id, payload });
      }
      await warehousesQuery.refetch();
      closeDrawer();
    } catch (error) {
      setFormError((error as Error).message ?? "Не удалось сохранить изменения");
    }
  };

  const handleDelete = async () => {
    if (!currentWarehouse) {
      return;
    }
    if (!window.confirm("Удалить склад?")) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(currentWarehouse.id);
      await warehousesQuery.refetch();
      closeDrawer();
    } catch (error) {
      setFormError((error as Error).message ?? "Не удалось удалить склад");
    }
  };

  if (warehousesQuery.isLoading) {
    return <PageLoader />;
  }

  if (warehousesQuery.isError) {
    return (
      <section style={{ ...layoutStyle, padding: 24 }}>
        Не удалось загрузить склады: {(warehousesQuery.error as Error).message}
      </section>
    );
  }

  return (
    <section style={layoutStyle}>
      <header style={headerStyle}>
        <h2 style={headingStyle}>Склады</h2>
        <button type="button" style={primaryButtonStyle} onClick={openCreateDrawer}>
          Новый склад
        </button>
      </header>

      <DataTable columns={columns} items={warehouses} emptyMessage="Склады не найдены" />

      {isDrawerOpen ? (
        <SlideOver title={mode === "create" ? "Новый склад" : `Редактирование: ${currentWarehouse?.name ?? ""}`} onClose={closeDrawer}>
          <form style={formStyle} onSubmit={handleSubmit}>
            <div style={formRowStyle}>
              <label style={formControlStyle}>
                <span style={labelStyle}>Код</span>
                <input
                  style={textInputStyle}
                  value={formState.code}
                  onChange={(event) => handleFieldChange("code", event.target.value)}
                  required
                  disabled
                />
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Название</span>
                <input
                  style={textInputStyle}
                  value={formState.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  required
                />
              </label>
            </div>

            <label style={formControlStyle}>
              <span style={labelStyle}>Описание</span>
              <textarea
                style={textareaStyle}
                value={formState.description}
                onChange={(event) => handleFieldChange("description", event.target.value)}
              />
            </label>

            <div style={formRowStyle}>
              <label style={formControlStyle}>
                <span style={labelStyle}>Статус</span>
                <select
                  style={selectStyle}
                  value={formState.status}
                  onChange={(event) => handleFieldChange("status", event.target.value as WarehouseFormState["status"])}
                >
                  <option value="active">Активен</option>
                  <option value="inactive">Неактивен</option>
                  <option value="archived">Архив</option>
                </select>
              </label>
            </div>

            <div style={formRowStyle}>
              <label style={formControlStyle}>
                <span style={labelStyle}>Город</span>
                <input
                  style={textInputStyle}
                  value={formState.addressCity}
                  onChange={(event) => handleFieldChange("addressCity", event.target.value)}
                />
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Улица</span>
                <input
                  style={textInputStyle}
                  value={formState.addressStreet}
                  onChange={(event) => handleFieldChange("addressStreet", event.target.value)}
                />
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Дом</span>
                <input
                  style={textInputStyle}
                  value={formState.addressBuilding}
                  onChange={(event) => handleFieldChange("addressBuilding", event.target.value)}
                />
              </label>
            </div>

            <div style={formRowStyle}>
              <label style={formControlStyle}>
                <span style={labelStyle}>Контактное лицо</span>
                <input
                  style={textInputStyle}
                  value={formState.contactManager}
                  onChange={(event) => handleFieldChange("contactManager", event.target.value)}
                />
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Телефон</span>
                <input
                  style={textInputStyle}
                  value={formState.contactPhone}
                  onChange={(event) => handleFieldChange("contactPhone", event.target.value)}
                />
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Email</span>
                <input
                  style={textInputStyle}
                  value={formState.contactEmail}
                  onChange={(event) => handleFieldChange("contactEmail", event.target.value)}
                />
              </label>
            </div>

            {formError ? <div style={errorStyle}>{formError}</div> : null}

            <div style={buttonRowStyle}>
              <button
                type="submit"
                style={primaryButtonStyle}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {mode === "create"
                  ? createMutation.isPending
                    ? "Сохранение…"
                    : "Создать"
                  : updateMutation.isPending
                  ? "Сохранение…"
                  : "Сохранить"}
              </button>
              <button type="button" style={secondaryButtonStyle} onClick={closeDrawer}>
                Отмена
              </button>
              {mode === "edit" ? (
                <button
                  type="button"
                  style={dangerButtonStyle}
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Удаление…" : "Удалить"}
                </button>
              ) : null}
            </div>
          </form>
        </SlideOver>
      ) : null}
    </section>
  );
};

export default WarehousesPage;
