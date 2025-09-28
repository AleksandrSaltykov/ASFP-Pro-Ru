import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";

import { useAppDispatch, useAppSelector } from "@app/hooks";
import {
  addRecent,
  dequeueKioskEvent,
  enqueueKioskEvent,
  type KioskQueueItem
} from "@shared/state";
import { selectKioskQueue } from "@shared/state/ui-selectors";
import { useKioskTranslations } from "@shared/locale";
import { palette, typography } from "@shared/ui/theme";
import { useThemeMode } from "@shared/ui/ThemeProvider";

type KioskTile = {
  id: string;
  title: string;
  description?: string;
  hotkey?: string;
  accent?: "primary" | "warning";
  onPress?: () => void;
};

type KioskShellProps = {
  tiles: KioskTile[];
};

const shellBaseStyle: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "1fr",
  gridTemplateRows: "1fr auto",
  padding: 32,
  fontFamily: typography.fontFamily
};

const tilesGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gridTemplateRows: "repeat(2, minmax(0, 1fr))",
  gap: 24,
  alignContent: "center"
};

const tileBaseStyle: CSSProperties = {
  borderRadius: 28,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease"
};

const tileHeaderStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8
};

const tileHotkeyStyle: CSSProperties = {
  fontSize: 13,
  letterSpacing: "0.08em"
};

const tileTitleStyle: CSSProperties = {
  fontSize: 28,
  letterSpacing: "-0.02em"
};

const tileDescriptionStyle: CSSProperties = {
  fontSize: 14,
  margin: 0
};

const scannerSectionStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 24,
  alignItems: "start"
};

const scanAreaStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  borderRadius: 24,
  padding: 24
};

const queuePanelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  borderRadius: 24,
  padding: 24
};

const statusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  fontWeight: 600
};

const statusMessageStyle: CSSProperties = {
  fontSize: 13,
  minHeight: 20
};

const queueHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline"
};

const queueTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18
};

const queueListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  fontSize: 13,
  maxHeight: 180,
  overflowY: "auto"
};

const queueItemStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "8px 0"
};

const queueItemHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const queueTimestampStyle: CSSProperties = {
  fontSize: 12
};

const queueMetaStyle: CSSProperties = {
  fontSize: 12
};

const queueBadgeStyle: CSSProperties = {
  alignSelf: "flex-start",
  fontSize: 11,
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: 999,
  letterSpacing: "0.06em"
};

const queueHintStyle: CSSProperties = {
  margin: 0,
  fontSize: 12
};

const inputStyle: CSSProperties = {
  padding: "18px 20px",
  borderRadius: 20,
  fontSize: 20,
  fontWeight: 600
};

const footerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 32,
  fontSize: 13
};

const createKioskStyles = (isDark: boolean) => {
  const primaryText = isDark ? "#f8fafc" : palette.textPrimary;
  const secondaryText = isDark ? "rgba(226, 232, 240, 0.82)" : "rgba(51, 65, 85, 0.9)";
  const mutedText = isDark ? "rgba(226, 232, 240, 0.68)" : "rgba(100, 116, 139, 0.85)";
  const shellBackground = isDark
    ? "radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.24), transparent 45%), radial-gradient(circle at 80% 0, rgba(59, 130, 246, 0.28), transparent 55%), #0f172a"
    : "radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.08), transparent 42%), radial-gradient(circle at 80% 0, rgba(99, 102, 241, 0.12), transparent 55%), #f7f9ff";
  const panelBackground = isDark ? "rgba(15, 23, 42, 0.68)" : "rgba(255, 255, 255, 0.92)";
  const panelBorder = isDark ? "rgba(148, 163, 184, 0.24)" : "rgba(148, 163, 184, 0.18)";
  const panelShadow = isDark ? "0 24px 48px rgba(15, 23, 42, 0.32)" : "0 18px 38px rgba(148, 163, 184, 0.24)";
  const warningShadow = isDark ? "0 24px 48px rgba(249, 115, 22, 0.28)" : "0 20px 40px rgba(249, 115, 22, 0.2)";
  const queueBadgeBackground = isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.12)";
  const queueBadgeText = isDark ? "#bfdbfe" : "#1d4ed8";
  const queueDivider = isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(148, 163, 184, 0.24)";
  const toggleBackground = isDark ? "rgba(15, 23, 42, 0.45)" : "rgba(37, 99, 235, 0.1)";
  const toggleBorder = isDark ? "rgba(148, 163, 184, 0.32)" : "rgba(37, 99, 235, 0.18)";
  const toggleText = isDark ? "#e2e8f0" : palette.textPrimary;
  const inputBackground = isDark ? "rgba(255, 255, 255, 0.92)" : "rgba(255, 255, 255, 0.98)";
  const inputBorder = isDark ? "rgba(148, 163, 184, 0.32)" : "rgba(148, 163, 184, 0.22)";
  const statusMessageColor = isDark ? "rgba(226, 232, 240, 0.78)" : "rgba(51, 65, 85, 0.85)";
  const scanHintColor = isDark ? "rgba(226, 232, 240, 0.75)" : "rgba(71, 85, 105, 0.85)";

  return {
    shell: {
      background: shellBackground,
      color: primaryText,
      transition: "background 0.3s ease, color 0.3s ease"
    },
    panel: {
      background: panelBackground,
      border: `1px solid ${panelBorder}` ,
      boxShadow: panelShadow
    },
    tileBase: {
      background: panelBackground,
      border: `1px solid ${panelBorder}` ,
      boxShadow: panelShadow,
      color: primaryText
    },
    tileShadow: panelShadow,
    tileWarningShadow: warningShadow,
    tileTitleColor: primaryText,
    tileDescriptionColor: secondaryText,
    tileHotkeyColor: mutedText,
    textPrimary: primaryText,
    textSecondary: secondaryText,
    textMuted: mutedText,
    statusBadgeColor: secondaryText,
    statusMessageColor,
    scanHintColor,
    queueDividerColor: `1px solid ${queueDivider}` ,
    queueBadgeBackground,
    queueBadgeText,
    queueHintColor: mutedText,
    queueEmptyColor: mutedText,
    input: {
      background: inputBackground,
      border: `1px solid ${inputBorder}` ,
      color: palette.textPrimary
    },
    footerColor: mutedText,
    toggleButton: {
      padding: "10px 14px",
      borderRadius: 14,
      border: `1px solid ${toggleBorder}` ,
      background: toggleBackground,
      color: toggleText,
      cursor: "pointer",
      transition: "all 0.2s ease"
    }
  };
};

const EVENT_PROCESS_DELAY_MS = 600;

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

type ScanPayload = { code?: string; offline?: boolean };
type StatusPayload = { action?: string; offline?: boolean };

export const KioskShell = ({ tiles }: KioskShellProps) => {
  const dispatch = useAppDispatch();
  const queue = useAppSelector(selectKioskQueue);
  const { theme } = useThemeMode();
  const isDark = theme === "dark";
  const styles = useMemo(() => createKioskStyles(isDark), [isDark]);

  const t = useKioskTranslations();
  const initialOnline =
    typeof navigator === "undefined" || typeof navigator.onLine !== "boolean" ? true : navigator.onLine;

  const [scanValue, setScanValue] = useState("");
  const [isOnline, setIsOnline] = useState(initialOnline);
  const [statusMessage, setStatusMessage] = useState(() =>
    initialOnline ? t("statusIdleOnline") : t("statusIdleOffline")
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleOnline = () => {
      setIsOnline(true);
      setStatusMessage(t("statusWentOnline"));
      console.info("[telemetry] kiosk_network_change", { to: "online", source: "listener" });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatusMessage(t("statusWentOffline"));
      console.info("[telemetry] kiosk_network_change", { to: "offline", source: "listener" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [t]);

  useEffect(() => {
    if (!isOnline || queue.length === 0) {
      return () => undefined;
    }

    timerRef.current = window.setTimeout(() => {
      const event = queue[0] as KioskQueueItem | undefined;
      if (!event) {
        return;
      }

      console.info("[telemetry] kiosk_event_processed", {
        eventId: event.id,
        type: event.type,
        offline: Boolean((event.payload as ScanPayload | StatusPayload).offline),
        createdAt: event.createdAt
      });

      if (event.type === "scan") {
        const code = String((event.payload as ScanPayload).code ?? "");
        setStatusMessage(t("statusProcessedScan", { code: code || "-" }));
      } else {
        const action = String((event.payload as StatusPayload).action ?? event.id);
        setStatusMessage(t("statusProcessedStatus", { action }));
      }

      dispatch(dequeueKioskEvent());
    }, EVENT_PROCESS_DELAY_MS);

    return () => {
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [dispatch, isOnline, queue, t]);

  const handleToggleNetwork = () => {
    const next = !isOnline;
    setIsOnline(next);
    setStatusMessage(next ? t("statusToggleOnline") : t("statusToggleOffline"));
    console.info("[telemetry] kiosk_network_change", { to: next ? "online" : "offline", source: "toggle" });
  };

  const handleScan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = scanValue.trim();
    if (!code) {
      return;
    }

    console.info("[telemetry] kiosk_scan", { role: "operator", code, offline: !isOnline });
    dispatch(
      enqueueKioskEvent({
        type: "scan",
        payload: { code, offline: !isOnline }
      })
    );
    dispatch(addRecent("/kiosk"));
    setStatusMessage(
      isOnline ? t("statusQueuedScanOnline", { code }) : t("statusQueuedScanOffline", { code })
    );
    setScanValue("");
    inputRef.current?.focus();
  };

  const handleTilePress = (tile: KioskTile) => {
    console.info("[telemetry] tile_click", { role: "operator", tileId: tile.id, offline: !isOnline });

    dispatch(
      enqueueKioskEvent({
        type: "status",
        payload: { action: tile.id, offline: !isOnline }
      })
    );

    setStatusMessage(
      isOnline
        ? t("statusQueuedActionOnline", { action: tile.title })
        : t("statusQueuedActionOffline", { action: tile.title })
    );

    tile.onPress?.();
  };

  const renderTile = (tile: KioskTile) => {
    const accentColor = tile.accent === "warning" ? "#f97316" : palette.primary;

    return (
      <button
        key={tile.id}
        type="button"
        style={{
          ...tileBaseStyle,
          ...styles.tileBase,
          border: `1px solid ${accentColor}` ,
          boxShadow: tile.accent === "warning" ? styles.tileWarningShadow : styles.tileShadow
        }}
        onClick={() => handleTilePress(tile)}
        aria-label={tile.title}
        data-tile-id={tile.id}
      >
        <div style={tileHeaderStyle}>
          <span style={{ ...tileHotkeyStyle, color: accentColor || styles.tileHotkeyColor }}>{tile.hotkey ?? " "}</span>
          <strong style={{ ...tileTitleStyle, color: styles.tileTitleColor }}>{tile.title}</strong>
        </div>
        {tile.description ? <p style={{ ...tileDescriptionStyle, color: styles.tileDescriptionColor }}>{tile.description}</p> : null}
      </button>
    );
  };

  const queuePreview = useMemo(() => queue.slice(0, 5), [queue]);

  return (
    <div style={{ ...shellBaseStyle, ...styles.shell }} role="application" aria-label={t("scanSectionTitle")}>
      <div style={tilesGridStyle}>{tiles.map(renderTile)}</div>

      <div style={scannerSectionStyle}>
        <form aria-label={t("scanFormLabel")} onSubmit={handleScan} style={{ ...scanAreaStyle, ...styles.panel }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <h2 style={{ margin: 0, fontSize: 22 }}>{t("scanSectionTitle")}</h2>
              <span style={{ fontSize: 14, color: styles.scanHintColor }}>
                {t("scanSectionHint")}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleNetwork}
              style={styles.toggleButton}
            >
              {isOnline ? t("toggleOffline") : t("toggleOnline")}
            </button>
          </div>

          <input
            ref={inputRef}
            value={scanValue}
            onChange={(event) => setScanValue(event.target.value)}
            style={{ ...inputStyle, ...styles.input }}
            placeholder={t("scanInputPlaceholder")}
            aria-label={t("scanInputAriaLabel")}
          />

          <div style={{ ...statusBadgeStyle, color: styles.statusBadgeColor }} aria-live="polite">
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: isOnline ? "#34d399" : "#f97316",
                display: "inline-block"
              }}
              aria-hidden="true"
            />
            {isOnline ? t("statusBadgeOnline") : t("statusBadgeOffline")}
          </div>

          <div style={{ ...statusMessageStyle, color: styles.statusMessageColor }} aria-live="polite">
            {statusMessage}
          </div>
        </form>

        <aside style={{ ...queuePanelStyle, ...styles.panel }} aria-label={t("queueAriaLabel")}>
          <div style={queueHeaderStyle}>
            <h3 style={queueTitleStyle}>{t("queueTitle")}</h3>
            <span data-testid="kiosk-queue-size">{queue.length}</span>
          </div>
          <div style={queueListStyle} role="list">
            {queuePreview.length === 0 ? (
              <span style={{ color: styles.queueEmptyColor }}>{t("queueEmpty")}</span>
            ) : (
              queuePreview.map((item) => {
                const payload = item.payload as ScanPayload | StatusPayload;
                const offline = Boolean(payload.offline);
                const meta =
                  item.type === "scan"
                    ? String((payload as ScanPayload).code ?? "")
                    : String((payload as StatusPayload).action ?? "");

                return (
                  <div key={item.id} style={{ ...queueItemStyle, borderBottom: styles.queueDividerColor }} role="listitem" data-event-type={item.type}>
                    <div style={queueItemHeaderStyle}>
                      <strong>{item.type === "scan" ? t("queueItemScan") : t("queueItemAction")}</strong>
                      <span style={{ ...queueTimestampStyle, color: styles.textMuted }}>{formatTimestamp(item.createdAt)}</span>
                    </div>
                    {meta ? <span style={{ ...queueMetaStyle, color: styles.textSecondary }}>{meta}</span> : null}
                    {offline ? <span style={{ ...queueBadgeStyle, background: styles.queueBadgeBackground, color: styles.queueBadgeText }}>{t("queueOfflineBadge")}</span> : null}
                  </div>
                );
              })
            )}
          </div>
          <p style={{ ...queueHintStyle, color: styles.queueHintColor }}>{t("queueHint")}</p>
        </aside>
      </div>

      <footer style={{ ...footerStyle, color: styles.footerColor }}>
        <span>{t("footerShortcuts")}</span>
        <span>{t("footerQueueNotice")}</span>
      </footer>
    </div>
  );
};
