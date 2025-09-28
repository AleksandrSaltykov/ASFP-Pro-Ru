import type { CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";

import { CatalogManager } from "./components/CatalogManager";
import { ItemManager } from "./components/ItemManager";
import { palette, typography } from "@shared/ui/theme";

type DirectoriesView = "catalogs" | "items";

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
  padding: 24
};

const headerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontFamily: typography.fontFamily,
  color: palette.textPrimary
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.5,
  color: palette.textSecondary
};

const controlsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16
};

const viewToggleStyle: CSSProperties = {
  display: "inline-flex",
  borderRadius: 16,
  padding: 4,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: palette.layer,
  gap: 6
};

const viewToggleButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: typography.accentFamily,
  backgroundColor: "transparent",
  color: palette.textSecondary,
  transition: "all 0.2s ease"
};

const activeToggleButtonStyle: CSSProperties = {
  background: palette.accentSoft,
  color: palette.textPrimary,
  boxShadow: palette.shadowElevated
};

const catalogsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 18
};

const hintStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: palette.textMuted
};

const DirectoriesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view");
  const view: DirectoriesView = viewParam === "items" ? "items" : "catalogs";

  const setView = (next: DirectoriesView) => {
    if (view === next) {
      return;
    }
    setSearchParams({ view: next });
  };

  return (
    <section style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Справочники ASFP-Pro</h1>
        <p style={subtitleStyle}>
          Управляйте классификаторами и карточками номенклатуры. Все изменения автоматически доступны в WMS,
          CRM и аналитике.
        </p>
      </header>

      <div style={controlsStyle}>
        <div style={viewToggleStyle}>
          <button
            type="button"
            onClick={() => setView("catalogs")}
            style={{
              ...viewToggleButtonStyle,
              ...(view === "catalogs" ? activeToggleButtonStyle : null)
            }}
          >
            Каталоги
          </button>
          <button
            type="button"
            onClick={() => setView("items")}
            style={{
              ...viewToggleButtonStyle,
              ...(view === "items" ? activeToggleButtonStyle : null)
            }}
          >
            Номенклатура
          </button>
        </div>
        <p style={hintStyle}>
          Используйте быстрые ссылки в боковом меню для перехода к нужному разделу.
        </p>
      </div>

      {view === "catalogs" ? (
        <div style={catalogsGridStyle}>
          <CatalogManager
            catalogType="category"
            title="Категории товаров"
            description="Иерархия товарных групп для маршрутизации, отчетности и правил обработки."
          />
          <CatalogManager
            catalogType="unit"
            title="Единицы измерения"
            description="Базовые единицы и коэффициенты пересчёта для складских и производственных операций."
          />
        </div>
      ) : (
        <ItemManager />
      )}
    </section>
  );
};

export default DirectoriesPage;
