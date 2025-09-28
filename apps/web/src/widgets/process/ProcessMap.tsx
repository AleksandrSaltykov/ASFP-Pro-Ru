import type { CSSProperties } from 'react';

import { palette, typography } from '@shared/ui/theme';

export type ProcessStage = {
  id: string;
  title: string;
  count: number;
  sla?: string;
  isBottleneck?: boolean;
};

export type ProcessMapProps = {
  stages: ProcessStage[];
  activeStageId?: string;
  onSelectStage?: (stageId: string) => void;
};

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12
};

const trackStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: 12,
  overflowX: 'auto',
  paddingBottom: 8,
  scrollbarWidth: 'thin'
};

const stageBaseStyle: CSSProperties = {
  position: 'relative',
  minWidth: 140,
  borderRadius: 18,
  padding: '14px 18px',
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  color: palette.textPrimary,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  boxShadow: '0 14px 28px rgba(15, 23, 42, 0.12)',
  fontFamily: typography.fontFamily
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.2
};

const countStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: '-0.02em'
};

const metaStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textSecondary,
  display: 'flex',
  alignItems: 'center',
  gap: 8
};

const bottleneckBadgeStyle: CSSProperties = {
  position: 'absolute',
  top: 10,
  right: 12,
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 600,
  background: palette.glowSecondary,
  color: '#fff',
  letterSpacing: '0.08em'
};

export const ProcessMap = ({ stages, activeStageId, onSelectStage }: ProcessMapProps) => {
  if (stages.length === 0) {
    return null;
  }

  const maxCount = Math.max(...stages.map((stage) => stage.count));

  return (
    <section style={containerStyle} aria-label="Карта операционных стадий">
      <div style={trackStyle} role="list">
        {stages.map((stage) => {
          const isActive = stage.id === activeStageId;
          const isBottleneck = stage.isBottleneck ?? (maxCount > 0 && stage.count === maxCount);

          const style: CSSProperties = {
            ...stageBaseStyle,
            border: `1px solid ${isActive ? palette.primary : palette.glassBorder}`,
            transform: isActive ? 'translateY(-2px)' : stageBaseStyle.transform,
            boxShadow: isActive ? '0 20px 34px rgba(37, 99, 235, 0.25)' : stageBaseStyle.boxShadow,
            background: isActive ? palette.layer : palette.surface
          };

          return (
            <button
              key={stage.id}
              type="button"
              role="listitem"
              onClick={() => onSelectStage?.(stage.id)}
              style={style}
              aria-pressed={isActive}
              data-stage-id={stage.id}
              data-testid={`process-stage-${stage.id}`}
            >
              {isBottleneck ? <span style={bottleneckBadgeStyle}>Узкое место</span> : null}
              <h3 style={titleStyle}>{stage.title}</h3>
              <span style={countStyle}>{stage.count}</span>
              <span style={metaStyle}>
                {stage.sla ? <span>SLА: {stage.sla}</span> : <span>SLА: не задано</span>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
