import { useMemo, type CSSProperties } from "react";

import { useOrderStepperTranslations } from "@shared/locale";
import { palette, typography } from "@shared/ui/theme";

export type Step = {
  id: string;
  title: string;
  done?: boolean;
  blocked?: boolean;
};

export type OrderStepperProps = {
  steps: Step[];
  currentStepId: string;
  onStepChange?: (stepId: string) => void;
  onRequestNext?: (currentId: string) => void;
};

const wrapperStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
  padding: 20,
  borderRadius: 24,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  boxShadow: "0 16px 32px rgba(15, 23, 42, 0.12)"
};

const railStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: 12
};

const stepBaseStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: "12px 14px",
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily,
  transition: "all 0.2s ease"
};

const stepTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600
};

const stateBadgeStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase"
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end"
};

const nextButtonStyle: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 14,
  border: "none",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  background: palette.primary,
  color: "#fff",
  transition: "opacity 0.2s ease"
};

const resolveStateColor = (state: "active" | "done" | "blocked" | "pending") => {
  switch (state) {
    case "active":
      return palette.primary;
    case "done":
      return palette.accentMuted;
    case "blocked":
      return "#f97316";
    default:
      return palette.textSecondary;
  }
};

export const OrderStepper = ({ steps, currentStepId, onStepChange, onRequestNext }: OrderStepperProps) => {
  const t = useOrderStepperTranslations();

  const currentIndex = useMemo(() => steps.findIndex((step) => step.id === currentStepId), [currentStepId, steps]);
  const currentStep = currentIndex >= 0 ? steps[currentIndex] : steps[0];

  return (
    <section style={wrapperStyle} aria-label={t("ariaLabel")}> 
      <div style={railStyle} role="list">
        {steps.map((step) => {
          const isActive = step.id === currentStepId;
          const isDone = Boolean(step.done);
          const isBlocked = Boolean(step.blocked);

          const state: "active" | "done" | "blocked" | "pending" = isActive
            ? "active"
            : isDone
              ? "done"
              : isBlocked
                ? "blocked"
                : "pending";

          const style: CSSProperties = {
            ...stepBaseStyle,
            border: `1px solid ${state === "active" ? palette.primary : state === "done" ? palette.accentMuted : palette.glassBorder}`,
            background: isActive ? palette.surface : stepBaseStyle.background,
            opacity: isBlocked && !isActive ? 0.6 : 1,
            cursor: isBlocked && !isActive ? "not-allowed" : "pointer",
            boxShadow: isActive ? "0 14px 32px rgba(99, 102, 241, 0.18)" : "0 8px 18px rgba(15, 23, 42, 0.08)"
          };

          const stateLabel =
            state === "active"
              ? t("state.active")
              : state === "done"
                ? t("state.done")
                : state === "blocked"
                  ? t("state.blocked")
                  : t("state.pending");

          return (
            <button
              key={step.id}
              type="button"
              role="listitem"
              style={style}
              onClick={() => {
                if (!isBlocked && onStepChange) {
                  onStepChange(step.id);
                }
              }}
              aria-label={step.title}
              aria-current={isActive}
              aria-disabled={isBlocked && !isActive}
            >
              <span style={{ ...stateBadgeStyle, color: resolveStateColor(state) }}>{stateLabel}</span>
              <h3 style={stepTitleStyle}>{step.title}</h3>
            </button>
          );
        })}
      </div>

      <div style={actionsStyle}>
        {currentStep ? (
          <button
            type="button"
            style={{
              ...nextButtonStyle,
              opacity: currentStep.blocked ? 0.5 : 1,
              cursor: currentStep.blocked ? "not-allowed" : nextButtonStyle.cursor
            }}
            onClick={() => currentStep && !currentStep.blocked && onRequestNext?.(currentStep.id)}
            disabled={Boolean(currentStep.blocked)}
            aria-disabled={Boolean(currentStep.blocked)}
          >
            {t("nextButton")}
          </button>
        ) : null}
      </div>
    </section>
  );
};
