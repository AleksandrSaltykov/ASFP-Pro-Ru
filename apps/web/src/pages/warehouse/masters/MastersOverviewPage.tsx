import { useMemo, type CSSProperties } from "react";
import {
  type CrmCustomer,
  type Item,
  type Warehouse,
  useCustomersQuery,
  useItemsQuery,
  useWarehousesQuery
} from "@shared/api";
import { PageLoader } from "@shared/ui/PageLoader";
import { palette, typography } from "@shared/ui/theme";

import { fallbackCustomers, fallbackItems, fallbackWarehouses } from "../../../modules/warehouse/views/masters/fallbacks";
import { shouldUseFallback } from "../../../modules/warehouse/views/masters/utils";

const layoutStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24
};

const headerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: typography.fontFamily,
  fontSize: 30,
  fontWeight: 600,
  color: palette.textPrimary
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: typography.accentFamily,
  fontSize: 14,
  color: palette.textSecondary
};

const cardsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 18
};

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: 20,
  borderRadius: 18,
  border: `1px solid ${palette.border}`,
  background: palette.layer,
  boxShadow: palette.shadowElevated
};

const cardLabelStyle: CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: palette.textSecondary,
  fontWeight: 600
};

const cardValueStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: palette.textPrimary
};

const cardMetaStyle: CSSProperties = {
  fontSize: 13,
  color: palette.textSecondary,
  lineHeight: 1.4
};

const twoColumnLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 24,
  alignItems: "start"
};

const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  borderRadius: 20,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  boxShadow: palette.shadowElevated,
  padding: 24
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: palette.textPrimary
};

const updatesListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  margin: 0,
  padding: 0,
  listStyle: "none"
};

const updateRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "120px 1fr 150px",
  gap: 12,
  alignItems: "baseline"
};

const updateTypeStyle: CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: palette.textSecondary,
  fontWeight: 600
};

const updateNameStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: palette.textPrimary,
  lineHeight: 1.4
};

const updateDateStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textSecondary,
  justifySelf: "end"
};

const statusGridStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const statusLabelStyle: CSSProperties = {
  fontSize: 14,
  color: palette.textPrimary,
  fontWeight: 600
};

const statusBadgeBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const
};

const formatDateTime = (value: string | undefined) => {
  if (!value) {
    return "—";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleString("ru-RU");
};

const MastersOverviewPage = () => {
  const itemsQuery = useItemsQuery();
  const warehousesQuery = useWarehousesQuery();
  const customersQuery = useCustomersQuery({ limit: 200 });

  const useItemsFallback = shouldUseFallback(itemsQuery.error);
  const useWarehousesFallback = shouldUseFallback(warehousesQuery.error);
  const useCustomersFallback = shouldUseFallback(customersQuery.error);

  const items: Item[] = useMemo(() => {
    if (itemsQuery.data) {
      return itemsQuery.data;
    }
    if (useItemsFallback) {
      return fallbackItems;
    }
    return [];
  }, [itemsQuery.data, useItemsFallback]);

  const warehouses: Warehouse[] = useMemo(() => {
    if (warehousesQuery.data) {
      return warehousesQuery.data;
    }
    if (useWarehousesFallback) {
      return fallbackWarehouses;
    }
    return [];
  }, [warehousesQuery.data, useWarehousesFallback]);

  const suppliers: CrmCustomer[] = useMemo(() => {
    if (customersQuery.data) {
      return customersQuery.data;
    }
    if (useCustomersFallback) {
      return fallbackCustomers;
    }
    return [];
  }, [customersQuery.data, useCustomersFallback]);

  const itemsWithoutCategory = useMemo(
    () => items.filter((item) => !item.category?.id).length,
    [items]
  );

  const itemsWithoutUnit = useMemo(
    () => items.filter((item) => !item.unit?.id).length,
    [items]
  );

  const activeWarehouses = useMemo(
    () => warehouses.filter((warehouse) => (warehouse.status ?? "active") !== "archived").length,
    [warehouses]
  );

  const warehousesWithoutAddress = useMemo(
    () =>
      warehouses.filter((warehouse) => {
        const address = warehouse.address;
        return !(address?.city || address?.street || address?.building);
      }).length,
    [warehouses]
  );

  const suppliersWithoutContacts = useMemo(
    () =>
      suppliers.filter((supplier) => {
        if (supplier.contacts?.length) {
          return false;
        }
        return !(supplier.phone || supplier.email);
      }).length,
    [suppliers]
  );

  const recentUpdates = useMemo(() => {
    const entries: { type: string; name: string; updatedAt: string | undefined }[] = [];
    items.forEach((item) =>
      entries.push({
        type: "Номенклатура",
        name: item.name,
        updatedAt: item.updatedAt ?? item.createdAt
      })
    );
    warehouses.forEach((warehouse) =>
      entries.push({
        type: "Склад",
        name: warehouse.name,
        updatedAt: warehouse.updatedAt ?? warehouse.createdAt
      })
    );
    suppliers.forEach((supplier) =>
      entries.push({
        type: "Поставщик",
        name: supplier.name,
        updatedAt: supplier.updatedAt ?? supplier.createdAt
      })
    );
    return entries
      .filter((entry) => entry.updatedAt)
      .sort((a, b) => Date.parse(b.updatedAt ?? "") - Date.parse(a.updatedAt ?? ""))
      .slice(0, 6);
  }, [items, warehouses, suppliers]);

  const loading = itemsQuery.isLoading || warehousesQuery.isLoading || customersQuery.isLoading;

  const statusRows = [
    {
      label: "CRM (поставщики)",
      status: customersQuery.isError ? "offline" : "online",
      message: customersQuery.isError ? customersQuery.error?.message ?? "Ошибка запроса" : "API отвечает"
    },
    {
      label: "WMS (склады)",
      status: warehousesQuery.isError ? "offline" : "online",
      message: warehousesQuery.isError ? warehousesQuery.error?.message ?? "Ошибка запроса" : "Данные загружены"
    },
    {
      label: "Каталог (номенклатура)",
      status: itemsQuery.isError ? "offline" : "online",
      message: itemsQuery.isError ? itemsQuery.error?.message ?? "Ошибка запроса" : "Данные загружены"
    }
  ];

  if (loading && !items.length && !warehouses.length && !suppliers.length) {
    return <PageLoader />;
  }

  return (
    <section style={layoutStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Справочники склада</h1>
        <p style={subtitleStyle}>Актуальное состояние ключевых справочников: номенклатура, склады и поставщики.</p>
      </header>

      <div style={cardsGridStyle}>
        <div style={cardStyle}>
          <span style={cardLabelStyle}>Номенклатура</span>
          <span style={cardValueStyle}>{items.length}</span>
          <span style={cardMetaStyle}>
            {itemsWithoutCategory} без категории · {itemsWithoutUnit} без единицы измерения
          </span>
        </div>
        <div style={cardStyle}>
          <span style={cardLabelStyle}>Склады</span>
          <span style={cardValueStyle}>{warehouses.length}</span>
          <span style={cardMetaStyle}>
            {activeWarehouses} активных · {warehousesWithoutAddress} без адреса
          </span>
        </div>
        <div style={cardStyle}>
          <span style={cardLabelStyle}>Поставщики</span>
          <span style={cardValueStyle}>{suppliers.length}</span>
          <span style={cardMetaStyle}>{suppliersWithoutContacts} без контактов</span>
        </div>
      </div>

      <div style={twoColumnLayoutStyle}>
        <div style={panelStyle}>
          <h2 style={panelTitleStyle}>Недавно обновлено</h2>
          {recentUpdates.length === 0 ? (
            <span style={{ color: palette.textSecondary, fontSize: 14 }}>Изменений пока нет.</span>
          ) : (
            <ul style={updatesListStyle}>
              {recentUpdates.map((entry, index) => (
                <li key={`${entry.type}-${entry.name}-${index}`} style={updateRowStyle}>
                  <span style={updateTypeStyle}>{entry.type}</span>
                  <span style={updateNameStyle}>{entry.name}</span>
                  <span style={updateDateStyle}>{formatDateTime(entry.updatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={panelStyle}>
          <h2 style={panelTitleStyle}>Статус источников данных</h2>
          <div style={statusGridStyle}>
            {statusRows.map((row) => {
              const badgeStyle: CSSProperties = {
                ...statusBadgeBase,
                background: row.status === "online" ? "rgba(24, 164, 93, 0.15)" : "rgba(211, 32, 41, 0.15)",
                color: row.status === "online" ? "#17894f" : "#aa1f24"
              };
              return (
                <div key={row.label} style={statusRowStyle}>
                  <span style={statusLabelStyle}>{row.label}</span>
                  <span style={badgeStyle}>{row.status === "online" ? "online" : "offline"}</span>
                </div>
              );
            })}
          </div>
          <span style={{ fontSize: 12, color: palette.textSecondary, lineHeight: 1.5 }}>
            Если статус offline — проверьте доступность соответствующего сервиса и обновите страницу.
          </span>
        </div>
      </div>
    </section>
  );
};

export default MastersOverviewPage;
