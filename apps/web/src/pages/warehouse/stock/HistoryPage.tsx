import { useMemo, useState } from "react";

import { useStockHistory, type StockMovement } from "@shared/api";
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
  color: palette.textSecondary
};

const controlStyle = {
  minWidth: 170,
  padding: "8px 12px",
  borderRadius: 12,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  fontSize: 14,
  color: palette.textPrimary
};

const labelStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
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
  padding: "10px 16px",
  fontSize: 13,
  cursor: "pointer",
  color: palette.textPrimary
};

const PAGE_SIZE = 12;

const formatLocation = (warehouse?: string, zone?: string, bin?: string) => {
  const pieces = [warehouse, zone, bin].filter(Boolean);
  return pieces.length ? pieces.join(" · ") : "—";
};

export const HistoryPage = () => {
  const { data: history = [], isLoading } = useStockHistory();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [warehouse, setWarehouse] = useState("all");
  const [item, setItem] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const warehouses = useMemo(() => Array.from(new Set(history.map((row) => row.toWarehouse ?? row.fromWarehouse).filter(Boolean) as string[])).sort(), [history]);
  const types = useMemo(() => Array.from(new Set(history.map((row) => row.type))).sort(), [history]);

  const filtered = useMemo(() => {
    return history.filter((row) => {
      if (warehouse !== "all" && row.toWarehouse !== warehouse && row.fromWarehouse !== warehouse) {
        return false;
      }
      if (type !== "all" && row.type !== type) {
        return false;
      }
      if (item.trim()) {
        const needle = item.trim().toLowerCase();
        if (!row.itemName.toLowerCase().includes(needle) && !row.itemCode.toLowerCase().includes(needle)) {
          return false;
        }
      }
      if (from) {
        if (new Date(row.occurredAt).getTime() < new Date(from).getTime()) {
          return false;
        }
      }
      if (to) {
        if (new Date(row.occurredAt).getTime() > new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1) {
          return false;
        }
      }
      return true;
    });
  }, [history, warehouse, type, item, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleExport = () => {
    console.info("[stock/history] export triggered", { filters: { from, to, warehouse, item, type } });
  };

  const columns: TableColumn<StockMovement>[] = [
    {
      id: "datetime",
      label: "DateTime",
      render: (row) => new Date(row.occurredAt).toLocaleString("ru-RU")
    },
    { id: "type", label: "Type", render: (row) => row.type },
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
      id: "from",
      label: "From",
      render: (row) => formatLocation(row.fromWarehouse, row.fromZone, row.fromBin)
    },
    {
      id: "to",
      label: "To",
      render: (row) => formatLocation(row.toWarehouse, row.toZone, row.toBin)
    },
    {
      id: "qty",
      label: "Qty",
      align: "right",
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.quantity.toLocaleString("ru-RU")} {row.uom}</span>
      )
    },
    {
      id: "ref",
      label: "RefDoc",
      render: (row) => (
        <button type='button' style={buttonStyle} onClick={() => alert(`Документ ${row.reference ?? "—"}`)}>
          Открыть
        </button>
      )
    },
    { id: "actor", label: "Actor", render: (row) => row.actor ?? "—" },
    { id: "note", label: "Note", render: (row) => row.note ?? "—" }
  ];

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={titleStyle}>История движений</h1>
        <p style={descriptionStyle}>
          Отслеживайте каждое перемещение: приёмки, перемещения, резервы, корректировки. Фильтры помогают быстро собрать
          отчёт по нужному складу и периоду.
        </p>
      </header>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ color: palette.textSecondary, fontSize: 13 }}>Найдено {filtered.length} записей</span>
        <button type='button' style={buttonStyle} onClick={handleExport}>
          Экспорт CSV
        </button>
      </div>

      <FilterPanel>
        <label style={inputGroupStyle}>
          <span style={labelStyle}>С даты</span>
          <input
            type='date'
            style={controlStyle}
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label style={inputGroupStyle}>
          <span style={labelStyle}>По дату</span>
          <input
            type='date'
            style={controlStyle}
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
          />
        </label>
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
        <label style={{ ...inputGroupStyle, minWidth: 220 }}>
          <span style={labelStyle}>Номенклатура</span>
          <input
            style={controlStyle}
            value={item}
            onChange={(event) => {
              setItem(event.target.value);
              setPage(1);
            }}
            placeholder='Код или наименование'
          />
        </label>
        <label style={inputGroupStyle}>
          <span style={labelStyle}>Тип операции</span>
          <select
            style={controlStyle}
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
          >
            <option value='all'>Все</option>
            {types.map((itemType) => (
              <option key={itemType} value={itemType}>
                {itemType}
              </option>
            ))}
          </select>
        </label>
      </FilterPanel>

      <DataTable
        columns={columns}
        items={paginated}
        emptyMessage={isLoading ? "Загрузка..." : "Нет записей"}
      />

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

export default HistoryPage;
