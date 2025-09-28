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

const shellStyle: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "1fr",
  gridTemplateRows: "1fr auto",
  background:
    "radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.12), transparent 45%), radial-gradient(circle at 80% 0, rgba(59, 130, 246, 0.18), transparent 55%), #0f172a",
  padding: 32,
  color: "#fff",
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
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  boxShadow: "0 24px 48px rgba(15, 23, 42, 0.32)",
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
  letterSpacing: "0.08em",
  color: "rgba(148, 163, 184, 0.9)"
};

const tileTitleStyle: CSSProperties = {
  fontSize: 28,
  letterSpacing: "-0.02em"
};

const tileDescriptionStyle: CSSProperties = {
  fontSize: 14,
  color: "rgba(226, 232, 240, 0.78)",
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
  background: "rgba(15, 23, 42, 0.68)",
  borderRadius: 24,
  border: "1px solid rgba(148, 163, 184, 0.24)",
  padding: 24
};

const queuePanelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  background: "rgba(15, 23, 42, 0.68)",
  borderRadius: 24,
  border: "1px solid rgba(148, 163, 184, 0.24)",
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
  color: "rgba(226, 232, 240, 0.75)",
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
  padding: "8px 0",
  borderBottom: "1px solid rgba(148, 163, 184, 0.16)"
};

const queueItemHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const queueTimestampStyle: CSSProperties = {
  fontSize: 12,
  opacity: 0.7
};

const queueMetaStyle: CSSProperties = {
  fontSize: 12,
  color: "rgba(226, 232, 240, 0.82)"
};

const queueBadgeStyle: CSSProperties = {
  alignSelf: "flex-start",
  fontSize: 11,
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: 999,
  background: "rgba(59, 130, 246, 0.2)",
  color: "#bfdbfe",
  letterSpacing: "0.06em"
};

const queueHintStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "rgba(226, 232, 240, 0.65)"
};

const inputStyle: CSSProperties = {
  padding: "18px 20px",
  borderRadius: 20,
  border: "1px solid rgba(148, 163, 184, 0.32)",
  background: "rgba(255, 255, 255, 0.92)",
  fontSize: 20,
  fontWeight: 600,
  color: palette.textPrimary
};

const footerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 32,
  fontSize: 13,
  color: "rgba(226, 232, 240, 0.7)"
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
          border: "1px solid " + accentColor,
          boxShadow:
            tile.accent === "warning"
              ? "0 24px 48px rgba(249, 115, 22, 0.28)"
              : tileBaseStyle.boxShadow
        }}
        onClick={() => handleTilePress(tile)}
        aria-label={tile.title}
        data-tile-id={tile.id}
      >
        <div style={tileHeaderStyle}>
          <span style={{ ...tileHotkeyStyle, color: accentColor }}>{tile.hotkey ?? " "}</span>
          <strong style={tileTitleStyle}>{tile.title}</strong>
        </div>
        {tile.description ? <p style={tileDescriptionStyle}>{tile.description}</p> : null}
      </button>
    );
  };

  const queuePreview = useMemo(() => queue.slice(0, 5), [queue]);

  return (
    <div style={shellStyle} role="application" aria-label={t("scanSectionTitle")}>
      <div style={tilesGridStyle}>{tiles.map(renderTile)}</div>

      <div style={scannerSectionStyle}>
        <form aria-label={t("scanFormLabel")} onSubmit={handleScan} style={scanAreaStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <h2 style={{ margin: 0, fontSize: 22 }}>{t("scanSectionTitle")}</h2>
              <span style={{ fontSize: 14, color: "rgba(226, 232, 240, 0.75)" }}>
                {t("scanSectionHint")}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleNetwork}
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                border: "1px solid rgba(148, 163, 184, 0.32)",
                background: "rgba(15, 23, 42, 0.45)",
                color: "#e2e8f0",
                cursor: "pointer"
              }}
            >
              {isOnline ? t("toggleOffline") : t("toggleOnline")}
            </button>
          </div>

          <input
            ref={inputRef}
            value={scanValue}
            onChange={(event) => setScanValue(event.target.value)}
            style={inputStyle}
            placeholder={t("scanInputPlaceholder")}
            aria-label={t("scanInputAriaLabel")}
          />

          <div style={statusBadgeStyle} aria-live="polite">
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

          <div style={statusMessageStyle} aria-live="polite">
            {statusMessage}
          </div>
        </form>

        <aside style={queuePanelStyle} aria-label={t("queueAriaLabel")}>
          <div style={queueHeaderStyle}>
            <h3 style={queueTitleStyle}>{t("queueTitle")}</h3>
            <span data-testid="kiosk-queue-size">{queue.length}</span>
          </div>
          <div style={queueListStyle} role="list">
            {queuePreview.length === 0 ? (
              <span>{t("queueEmpty")}</span>
            ) : (
              queuePreview.map((item) => {
                const payload = item.payload as ScanPayload | StatusPayload;
                const offline = Boolean(payload.offline);
                const meta =
                  item.type === "scan"
                    ? String((payload as ScanPayload).code ?? "")
                    : String((payload as StatusPayload).action ?? "");

                return (
                  <div key={item.id} style={queueItemStyle} role="listitem" data-event-type={item.type}>
                    <div style={queueItemHeaderStyle}>
                      <strong>{item.type === "scan" ? t("queueItemScan") : t("queueItemAction")}</strong>
                      <span style={queueTimestampStyle}>{formatTimestamp(item.createdAt)}</span>
                    </div>
                    {meta ? <span style={queueMetaStyle}>{meta}</span> : null}
                    {offline ? <span style={queueBadgeStyle}>{t("queueOfflineBadge")}</span> : null}
                  </div>
                );
              })
            )}
          </div>
          <p style={queueHintStyle}>{t("queueHint")}</p>
        </aside>
      </div>

      <footer style={footerStyle}>
        <span>{t("footerShortcuts")}</span>
        <span>{t("footerQueueNotice")}</span>
      </footer>
    </div>
  );
};
