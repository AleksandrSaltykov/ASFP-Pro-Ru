import { useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  useStockAvailability,
  useStockBalances,
  type StockBalance
} from "@shared/api";
import { palette, typography } from "@shared/ui/theme";

import DataTable, { type TableColumn } from "../components/DataTable";
import SlideOver from "../components/SlideOver";
import { Badge } from "../components/Badge";
import { FilterPanel } from "../components/FilterPanel";
import { Pagination } from "../components/Pagination";

const sectionHeaderStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 8
};

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

const toolbarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 12
};

const exportButtonStyle = {
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  borderRadius: 12,
  padding: "10px 16px",
  fontSize: 13,
  cursor: "pointer",
  color: palette.textPrimary
};

const inputBlockStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 6
};

const labelStyle = {
  fontSize: 11,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: palette.textSoft
};

const controlStyle = {
  minWidth: 160,
  padding: "8px 12px",
  borderRadius: 12,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily,
  fontSize: 14
};

const checkboxRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  color: palette.textSecondary
};

const PAGE_SIZE = 10;

const toOptions = (items: StockBalance[], extractor: (row: StockBalance) => string | undefined) => {
  const set = new Set<string>();
  for (const row of items) {
    const value = extractor(row);
    if (value) {
      set.add(value);
    }
  }
  return Array.from(set).sort();
};

export const BalancesPage = () => {
  const navigate = useNavigate();
  const { data: balances = [], isLoading } = useStockBalances();
  const { data: availability = [] } = useStockAvailability();

  const [warehouse, setWarehouse] = useState("all");
  const [zone, setZone] = useState("all");
  const [bin, setBin] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [onlyZero, setOnlyZero] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StockBalance | null>(null);

  const filtered = useMemo(() => {
    return balances.filter((row) => {
      if (warehouse !== "all" && row.warehouse !== warehouse) {
        return false;
      }
      if (zone !== "all" && row.zone !== zone) {
        return false;
      }
      if (bin !== "all" && row.bin !== bin) {
        return false;
      }
      if (category !== "all" && row.category !== category) {
        return false;
      }
      if (onlyZero && row.onHand > 0) {
        return false;
      }
      if (search.trim()) {
        const needle = search.trim().toLowerCase();
        if (!row.itemName.toLowerCase().includes(needle) && !row.itemCode.toLowerCase().includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [balances, warehouse, zone, bin, category, onlyZero, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const warehouses = toOptions(balances, (row) => row.warehouse);
  const zones = toOptions(balances.filter((row) => (warehouse === "all" ? true : row.warehouse === warehouse)), (row) => row.zone);
  const bins = toOptions(
    balances.filter((row) => (warehouse === "all" ? true : row.warehouse === warehouse)),
    (row) => row.bin
  );
  const categories = toOptions(balances, (row) => row.category);

  const handleExport = () => {
    console.info("[stock/balances] export triggered", { filters: { warehouse, zone, bin, category, search, onlyZero } });
    // TODO: Replace with стандартный экспорт, когда появится общий модуль выгрузок
  };

  const columns: TableColumn<StockBalance>[] = [
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
      render: (row) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span>{row.warehouse}</span>
          <span style={{ color: palette.textSecondary, fontSize: 12 }}>
            {row.zone ?? "—"} · {row.bin ?? "—"}
          </span>
        </div>
      )
    },
    {
      id: "onHand",
      label: "OnHand",
      align: "right",
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.onHand.toLocaleString("ru-RU")} {row.uom}</span>
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
          <button
            type='button'
            style={exportButtonStyle}
            onClick={() => setSelected(row)}
          >
            Карточка
          </button>
          <button
            type='button'
            style={exportButtonStyle}
            onClick={() => navigate(`/warehouse/stock/history?item=${encodeURIComponent(row.itemCode)}`)}
          >
            История
          </button>
        </div>
      )
    }
  ];

  const handleSelectChange = (setter: (value: string) => void) => (event: ChangeEvent<HTMLSelectElement>) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <header style={sectionHeaderStyle}>
        <h1 style={titleStyle}>Остатки</h1>
        <p style={descriptionStyle}>
          Контроль фактического наличия по складам, зонам и ячейкам. Используйте фильтры для уточнения выборки и
          переходите к истории движений для анализа.
        </p>
      </header>

      <div style={toolbarStyle}>
        <span style={{ color: palette.textSecondary, fontSize: 13 }}>
          Найдено {filtered.length} позиций
        </span>
        <button type='button' style={exportButtonStyle} onClick={handleExport}>
          Экспорт CSV
        </button>
      </div>

      <FilterPanel>
        <label style={inputBlockStyle}>
          <span style={labelStyle}>Склад</span>
          <select style={controlStyle} value={warehouse} onChange={handleSelectChange(setWarehouse)}>
            <option value='all'>Все</option>
            {warehouses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label style={inputBlockStyle}>
          <span style={labelStyle}>Зона</span>
          <select style={controlStyle} value={zone} onChange={handleSelectChange(setZone)}>
            <option value='all'>Все</option>
            {zones.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label style={inputBlockStyle}>
          <span style={labelStyle}>Ячейка</span>
          <select style={controlStyle} value={bin} onChange={handleSelectChange(setBin)}>
            <option value='all'>Все</option>
            {bins.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label style={inputBlockStyle}>
          <span style={labelStyle}>Категория</span>
          <select style={controlStyle} value={category} onChange={handleSelectChange(setCategory)}>
            <option value='all'>Все</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label style={{ ...inputBlockStyle, minWidth: 220 }}>
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
        <label style={checkboxRowStyle}>
          <input
            type='checkbox'
            checked={onlyZero}
            onChange={(event) => {
              setOnlyZero(event.target.checked);
              setPage(1);
            }}
          />
          Только ≤0
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
      {selected ? (
        <SlideOver title='Карточка номенклатуры' onClose={() => setSelected(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 20 }}>{selected.itemName}</h3>
            <p style={{ margin: 0, color: palette.textSecondary }}>
              Код: <strong>{selected.itemCode}</strong>
            </p>
            <p style={{ margin: 0, color: palette.textSecondary }}>
              Склад: {selected.warehouse} · {selected.zone ?? '-'} · {selected.bin ?? '-'}
            </p>
            <p style={{ margin: 0, color: palette.textSecondary }}>
              Категория: {selected.category ?? '-'}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Badge>OnHand {selected.onHand.toLocaleString('ru-RU')} {selected.uom}</Badge>
              {(() => {
                const record = availability.find((item) => item.itemCode === selected.itemCode && item.warehouse === selected.warehouse);
                if (!record) {
                  return null;
                }
                const isCritical = record.available <= record.reserved;
                return (
                  <Badge theme={isCritical ? 'warning' : 'default'}>
                    Available {record.available.toLocaleString('ru-RU')} {record.uom}
                  </Badge>
                );
              })()}
            </div>
            <p style={{ margin: 0, color: palette.textSecondary, fontSize: 13 }}>
              Обновлено: {new Date(selected.updatedAt).toLocaleString('ru-RU')}
            </p>
          </div>
        </SlideOver>
      ) : null}
    </section>
  );
};

export default BalancesPage;
