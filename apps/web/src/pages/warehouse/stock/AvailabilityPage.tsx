import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useStockAvailability, type StockAvailability } from "@shared/api";
import { palette, typography } from "@shared/ui/theme";

import DataTable, { type TableColumn } from "../components/DataTable";
import { FilterPanel } from "../components/FilterPanel";
import { Pagination } from "../components/Pagination";

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

const toolbarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 12
};

const buttonStyle = {
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  borderRadius: 12,
  padding: "10px 16px",
  fontSize: 13,
  cursor: "pointer",
  color: palette.textPrimary
};

const metricExplanation = {
  onHand: "Физический остаток в ячейках",
  reserved: "Резерв под заказы и блокировки",
  onOrder: "Заказы поставщикам / в пути",
  available: "Доступно = OnHand - Reserved"
};

const PAGE_SIZE = 10;

export const AvailabilityPage = () => {
  const navigate = useNavigate();
  const { data: availability = [], isLoading } = useStockAvailability();

  const [warehouse, setWarehouse] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const warehouses = useMemo(() => Array.from(new Set(availability.map((row) => row.warehouse))).sort(), [availability]);
  const categories = useMemo(
    () => Array.from(new Set(availability.map((row) => row.category).filter(Boolean) as string[])).sort(),
    [availability]
  );

  const filtered = useMemo(
    () =>
      availability.filter((row) => {
        if (warehouse !== "all" && row.warehouse !== warehouse) {
          return false;
        }
        if (category !== "all" && row.category !== category) {
          return false;
        }
        if (search.trim()) {
          const needle = search.trim().toLowerCase();
          if (!row.itemName.toLowerCase().includes(needle) && !row.itemCode.toLowerCase().includes(needle)) {
            return false;
          }
        }
        return true;
      }),
    [availability, warehouse, category, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleExport = () => {
    console.info("[stock/availability] export triggered", { filters: { warehouse, category, search } });
  };

  const columns: TableColumn<StockAvailability>[] = [
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
    {
      id: "warehouse",
      label: "Warehouse",
      render: (row) => row.warehouse
    },
    {
      id: "onHand",
      label: "OnHand",
      align: "right",
      render: (row) => (
        <span title={metricExplanation.onHand}>{row.onHand.toLocaleString("ru-RU")}</span>
      )
    },
    {
      id: "reserved",
      label: "Reserved",
      align: "right",
      render: (row) => (
        <span title={metricExplanation.reserved}>{row.reserved.toLocaleString("ru-RU")}</span>
      )
    },
    {
      id: "onOrder",
      label: "OnOrder",
      align: "right",
      render: (row) => (
        <span title={metricExplanation.onOrder}>{row.onOrder.toLocaleString("ru-RU")}</span>
      )
    },
    {
      id: "available",
      label: "Available",
      align: "right",
      render: (row) => (
        <strong title={metricExplanation.available}>{row.available.toLocaleString("ru-RU")}</strong>
      )
    },
    {
      id: "actions",
      label: "Действия",
      render: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type='button'
            style={buttonStyle}
            onClick={() => navigate(`/warehouse/reserve/reservations?item=${encodeURIComponent(row.itemCode)}`)}
          >
            Резервы
          </button>
          <button
            type='button'
            style={buttonStyle}
            onClick={() => navigate(`/warehouse/stock/history?item=${encodeURIComponent(row.itemCode)}`)}
          >
            История
          </button>
        </div>
      )
    }
  ];

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={titleStyle}>Доступность</h1>
        <p style={descriptionStyle}>
          Быстрая сверка физического остатка и резервов. Значение Available рассчитывается на лету и помогает оценить
          готовность к отбору.
        </p>
      </header>

      <div style={toolbarStyle}>
        <span style={{ color: palette.textSecondary, fontSize: 13 }}>Найдено {filtered.length} позиций</span>
        <button type='button' style={buttonStyle} onClick={handleExport}>
          Экспорт CSV
        </button>
      </div>

      <FilterPanel>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
        <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
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

      <DataTable columns={columns} items={paginated} emptyMessage={isLoading ? "Загрузка..." : "Нет данных"} />

      <Pagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPrev={() => setPage((value) => Math.max(1, value - 1))}
        onNext={() => setPage((value) => Math.min(totalPages, value + 1))}
      />
    </section>
  );
};

export default AvailabilityPage;
