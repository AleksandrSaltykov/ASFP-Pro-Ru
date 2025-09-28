import { Suspense, useMemo, useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";

import { useAppDispatch } from "@app/hooks";
import { useOrderDetailsTranslations } from "@shared/locale";
import { addRecent } from "@shared/state";
import { TileGrid, type TileProps } from "@shared/ui";
import { palette, typography } from "@shared/ui/theme";
import { OrderStepper, type Step } from "@widgets/stepper";

const layoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 320px",
  gap: 20
};

const sectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24
};

const tabsHeaderStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12
};

const tabButtonStyle: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  cursor: "pointer",
  fontWeight: 600,
  fontFamily: typography.accentFamily
};

const activeTabStyle: CSSProperties = {
  background: palette.primary,
  color: "#fff",
  borderColor: palette.primary
};

const tabBodyStyle: CSSProperties = {
  minHeight: 180,
  padding: 20,
  borderRadius: 20,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  boxShadow: "0 14px 28px rgba(15, 23, 42, 0.12)"
};

const checklistPanelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
  padding: 20,
  borderRadius: 20,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  boxShadow: "0 14px 24px rgba(15, 23, 42, 0.1)"
};

const checklistItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14
};

const insightsStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  fontSize: 13
};

const quickLinksStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8
};

const stepIds = [
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

type OrderTab = "summary" | "bom" | "route" | "materials" | "files" | "install" | "finance" | "chat";

const tabIds: OrderTab[] = ["summary", "bom", "route", "materials", "files", "install", "finance", "chat"];

const metricTileConfigs: Array<Pick<TileProps, "id" | "size">> = [
  { id: "metric.order-value", size: "M" },
  { id: "metric.deadline", size: "M" },
  { id: "metric.responsible", size: "M" }
];

const checklistIds = ["spec-approved", "prepayment", "tech-task"] as const;

const insightIds = ["insight.1", "insight.2", "insight.3"] as const;

const quickActionConfigs = [
  { id: "print-label" },
  { id: "reserve-stock" }
];

const tabContentMap: Record<OrderTab, string> = {
  summary: "tabContent.summary",
  bom: "tabContent.bom",
  route: "tabContent.route",
  materials: "tabContent.materials",
  files: "tabContent.files",
  install: "tabContent.install",
  finance: "tabContent.finance",
  chat: "tabContent.chat"
};

export type ChecklistItem = {
  id: string;
  label: string;
};

export type OrderDetailsPageProps = {
  initialTab?: OrderTab;
};

export const OrderDetailsPage = ({ initialTab = "summary" }: OrderDetailsPageProps) => {
  const dispatch = useAppDispatch();
  const { id = "demo" } = useParams();
  const t = useOrderDetailsTranslations();

  type TranslationKey = Parameters<typeof t>[0];

  const steps: Step[] = useMemo(
    () =>
      stepIds.map((stepId) => ({
        id: stepId,
        title: t(`step.${stepId}` as TranslationKey),
        done: stepId === "lead" || stepId === "proposal",
        blocked: stepId === "order" ? true : undefined
      })),
    [t]
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(() =>
    steps.findIndex((step) => step.done && !step.blocked) || 0
  );
  const [tab, setTab] = useState<OrderTab>(initialTab);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  const currentStep = steps[currentStepIndex] ?? steps[0];
  const allChecklistDone = checklistIds.every((itemId) => checklistState[itemId]);

  const metricTiles = useMemo(
    () =>
      metricTileConfigs.map((tile) => ({
        ...tile,
        title: t(`${tile.id}.title` as TranslationKey),
        value: t(`${tile.id}.value` as TranslationKey),
        note: t(`${tile.id}.note` as TranslationKey)
      })),
    [t]
  );

  const tabs = useMemo(
    () =>
      tabIds.map((tabId) => ({
        id: tabId,
        label: t(`tab.${tabId}` as TranslationKey)
      })),
    [t]
  );

  const checklist: ChecklistItem[] = useMemo(
    () =>
      checklistIds.map((itemId) => ({
        id: itemId,
        label: t(`checklist.${itemId}` as TranslationKey)
      })),
    [t]
  );

  const insights = useMemo(() => insightIds.map((key) => t(key as TranslationKey)), [t]);

  const quickActions = useMemo(
    () =>
      quickActionConfigs.map((action) => ({
        ...action,
        title: t(`quickAction.${action.id}.title` as TranslationKey),
        note: t(`quickAction.${action.id}.note` as TranslationKey)
      })),
    [t]
  );

  const handleChecklistToggle = (itemId: string) => {
    setChecklistState((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleNext = () => {
    if (!currentStep) {
      return;
    }
    if (!allChecklistDone) {
      alert(t("alert.checklistIncomplete"));
      return;
    }

    const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
    if (nextIndex !== currentStepIndex) {
      console.info("[telemetry] step_next", {
        role: "exec",
        route: "/orders/:id",
        orderId: id,
        from: currentStep.id,
        to: steps[nextIndex].id
      });
      setCurrentStepIndex(nextIndex);
    }
  };

  const handleStepChange = (stepId: string) => {
    const index = steps.findIndex((step) => step.id === stepId);
    if (index >= 0 && index <= currentStepIndex + 1) {
      setCurrentStepIndex(index);
    }
  };

  const handleTabChange = (nextTab: OrderTab) => {
    setTab(nextTab);
    dispatch(addRecent(`/orders/${id}?tab=${nextTab}`));
  };

  return (
    <div style={sectionStyle}>
      <OrderStepper
        steps={steps}
        currentStepId={currentStep?.id ?? steps[0].id}
        onStepChange={handleStepChange}
        onRequestNext={handleNext}
      />

      <TileGrid tiles={metricTiles} columns={3} />

      <div style={layoutStyle}>
        <section style={sectionStyle}>
          <header style={tabsHeaderStyle}>
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                style={{
                  ...tabButtonStyle,
                  ...(tab === item.id ? activeTabStyle : null)
                }}
                onClick={() => handleTabChange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </header>

          <div style={tabBodyStyle}>
            <Suspense fallback={<p>{t("suspense.loading")}</p>}>
              <p>{t(tabContentMap[tab] as TranslationKey)}</p>
            </Suspense>
          </div>
        </section>

        <aside style={checklistPanelStyle}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{t("tab.summary")}</h3>
            <p style={{ fontSize: 13, color: palette.textSecondary }}>{t("tabContent.summary")}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {checklist.map((item) => (
              <label key={item.id} style={checklistItemStyle}>
                <input
                  type="checkbox"
                  checked={Boolean(checklistState[item.id])}
                  onChange={() => handleChecklistToggle(item.id)}
                />
                {item.label}
              </label>
            ))}
          </div>

          <div>
            <h4 style={{ margin: 0, fontSize: 15 }}>{t("tab.finance")}</h4>
            <div style={insightsStyle}>
              {insights.map((text, index) => (
                <span key={index}>• {text}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ margin: "12px 0 6px", fontSize: 15 }}>{t("quickAccess.title" as TranslationKey)}</h4>
            <div style={quickLinksStyle}>
              {quickActions.map((action) => (
                <div key={action.id} style={{ fontSize: 13 }}>
                  <strong>{action.title}</strong>
                  <span style={{ display: "block", color: palette.textSecondary }}>{action.note}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
