import { useMemo, useState, type CSSProperties } from "react";

import { useAppDispatch, useAppSelector } from "@app/hooks";
import { useHomeExecTranslations } from "@shared/locale";
import { addRecent, toggleTileFavorite } from "@shared/state";
import { selectProcessCounters, selectTileFavorites } from "@shared/state/ui-selectors";
import { TileGrid, type TileProps } from "@shared/ui";
import { palette, typography } from "@shared/ui/theme";
import { ProcessMap } from "@widgets/process";

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 32
};

const sectionHeaderStyle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 700,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const sectionSubHeaderStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: palette.textSecondary
};

const panelsWrapperStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 18
};

const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  padding: 20,
  borderRadius: 20,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  boxShadow: "0 18px 36px rgba(15, 23, 42, 0.12)"
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 600
};

const listStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12
};

const listItemStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: 14,
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  textDecoration: "none",
  color: palette.textPrimary,
  transition: "transform 0.2s ease, box-shadow 0.2s ease"
};

const listItemTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: palette.textPrimary
};

const listItemMetaRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
  color: palette.textSecondary
};

const listItemDelayStyle: CSSProperties = {
  fontWeight: 600,
  color: "#f97316"
};

const listItemValueStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: palette.primary
};

const quickAccessSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12
};

const quickAccessListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  padding: 0,
  margin: 0,
  listStyle: "none"
};

const quickAccessLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 14,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  color: palette.textPrimary,
  textDecoration: "none",
  fontWeight: 600,
  cursor: "pointer"
};

const kpiTileConfigs = [
  { id: "kpi:revenue", size: "M", to: "/analytics/revenue" },
  { id: "kpi:margins", size: "M", to: "/analytics/margin" },
  { id: "kpi:overdue", size: "M", to: "/analytics/overdue" }
] as const;

const stageIds = [
  "lead",
  "proposal",
  "order",
  "design",
  "approval",
  "plan",
  "production",
  "qc",
  "delivery",
  "install",
  "act"
] as const;

const overdueConfigs = [
  { id: "overdue-101", to: "/orders/101" },
  { id: "overdue-102", to: "/orders/102" }
];

const approvalsConfigs = [
  { id: "approval-501", to: "/approvals/501" },
  { id: "approval-502", to: "/procurement/8802" }
];

const quickLinkConfigs = [
  { id: "risk-projects", to: "/projects?filter=at-risk" },
  { id: "mrp-deficit", to: "/production/mrp?filter=deficit" },
  { id: "load-schedule", to: "/production/schedule" },
  { id: "cash-gap", to: "/finance/cash-gap" },
  { id: "shop-kpi", to: "/analytics/workshops" }
];

const isStringPath = (value: unknown): value is string => typeof value === "string" && value.length > 0;

const HomeExecPage = () => {
  const dispatch = useAppDispatch();
  const favoriteTiles = useAppSelector(selectTileFavorites);
  const counters = useAppSelector(selectProcessCounters);
  const [activeStage, setActiveStage] = useState<string | undefined>();
  const t = useHomeExecTranslations();

  type TranslationKey = Parameters<typeof t>[0];

  const tiles = useMemo(
    () =>
      kpiTileConfigs.map((tile) => {
        const path = tile.to;
        return {
          id: tile.id,
          size: tile.size,
          to: path,
          title: t(`kpiTile.${tile.id}.title` as TranslationKey),
          value: t(`kpiTile.${tile.id}.value` as TranslationKey),
          note: t(`kpiTile.${tile.id}.note` as TranslationKey),
          onClick:
            isStringPath(path)
              ? () => {
                  dispatch(addRecent(path));
                }
              : undefined
        } satisfies TileProps;
      }),
    [dispatch, t]
  );

  const stages = useMemo(
    () =>
      stageIds.map((id) => ({
        id,
        title: t(`stage.${id}.title` as TranslationKey),
        sla: t(`stage.${id}.sla` as TranslationKey),
        count: counters[id] ?? 0
      })),
    [counters, t]
  );

  const overdueItems = useMemo(
    () =>
      overdueConfigs.map((item) => ({
        ...item,
        title: t(`overdue.${item.id}.title` as TranslationKey),
        owner: t(`overdue.${item.id}.owner` as TranslationKey),
        delay: t(`overdue.${item.id}.delay` as TranslationKey),
        value: t(`overdue.${item.id}.value` as TranslationKey)
      })),
    [t]
  );

  const approvalsItems = useMemo(
    () =>
      approvalsConfigs.map((item) => ({
        ...item,
        title: t(`approval.${item.id}.title` as TranslationKey),
        owner: t(`approval.${item.id}.owner` as TranslationKey),
        delay: t(`approval.${item.id}.delay` as TranslationKey),
        value: t(`approval.${item.id}.value` as TranslationKey)
      })),
    [t]
  );

  const quickLinks = useMemo(
    () =>
      quickLinkConfigs.map((link) => ({
        ...link,
        label: t(`quickLink.${link.id}` as TranslationKey)
      })),
    [t]
  );

  const handleSelectStage = (stageId: string) => {
    setActiveStage(stageId);
    dispatch(addRecent(`/sales?stage=${stageId}`));
  };

  const handleToggleFavorite = (id: string) => {
    dispatch(toggleTileFavorite(id));
  };

  const handleNavigate = (to: string) => {
    dispatch(addRecent(to));
  };

  return (
    <section style={pageStyle}>
      <header>
        <h1 style={sectionHeaderStyle}>{t("title")}</h1>
        <p style={sectionSubHeaderStyle}>{t("subtitle")}</p>
      </header>

      <TileGrid
        tiles={tiles}
        title={t("kpi.title")}
        description={t("kpi.description")}
        columns={4}
        favoriteIds={favoriteTiles}
        onToggleFavorite={handleToggleFavorite}
      />

      <section>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={sectionHeaderStyle}>{t("process.title")}</h2>
          <p style={sectionSubHeaderStyle}>{t("process.subtitle")}</p>
        </header>
        <ProcessMap stages={stages} activeStageId={activeStage} onSelectStage={handleSelectStage} />
      </section>

      <section style={panelsWrapperStyle}>
        <div style={panelStyle}>
          <h3 style={panelTitleStyle}>{t("overdue.title")}</h3>
          <div style={listStyle}>
            {overdueItems.map((item) => (
              <a
                key={item.id}
                href={item.to}
                style={listItemStyle}
                onClick={() => handleNavigate(item.to)}
              >
                <span style={listItemTitleStyle}>{item.title}</span>
                <span style={listItemMetaRowStyle}>
                  <span>{item.owner}</span>
                  <span style={listItemDelayStyle}>{item.delay}</span>
                </span>
                <span style={listItemValueStyle}>{item.value}</span>
              </a>
            ))}
          </div>
        </div>

        <div style={panelStyle}>
          <h3 style={panelTitleStyle}>{t("approvals.title")}</h3>
          <div style={listStyle}>
            {approvalsItems.map((item) => (
              <a
                key={item.id}
                href={item.to}
                style={listItemStyle}
                onClick={() => handleNavigate(item.to)}
              >
                <span style={listItemTitleStyle}>{item.title}</span>
                <span style={listItemMetaRowStyle}>
                  <span>{item.owner}</span>
                  <span style={{ ...listItemDelayStyle, color: palette.textSecondary }}>{item.delay}</span>
                </span>
                <span style={listItemValueStyle}>{item.value}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section style={quickAccessSectionStyle}>
        <h3 style={panelTitleStyle}>{t("quickAccess.title")}</h3>
        <ul style={quickAccessListStyle}>
          {quickLinks.map((link) => (
            <li key={link.id}>
              <button type="button" style={quickAccessLinkStyle} onClick={() => handleNavigate(link.to)}>
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
};

export default HomeExecPage;
