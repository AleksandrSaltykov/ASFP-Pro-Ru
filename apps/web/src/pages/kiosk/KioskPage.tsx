import type { CSSProperties } from "react";

import { useAppDispatch } from "@app/hooks";
import { addRecent } from "@shared/state";
import { KioskShell } from "@widgets/kiosk";

const pageWrapperStyle: CSSProperties = {
  minHeight: "100vh"
};

const tiles = [
  { id: "tasks", title: "Task list", description: "Queue and assignments", hotkey: "F1", accent: "primary" as const },
  { id: "accept", title: "Accept order", description: "Confirm intake", hotkey: "F2" },
  { id: "start-pause", title: "Start / Pause", description: "Toggle production state", hotkey: "F3", accent: "warning" as const },
  { id: "complete", title: "Complete job", description: "Mark order as finished", hotkey: "F4" },
  { id: "report-defect", title: "Report defect", description: "Raise a quality issue" },
  { id: "print-label", title: "Print label", description: "Generate barcode or QR label" }
];

const KioskPage = () => {
  const dispatch = useAppDispatch();

  return (
    <div style={pageWrapperStyle}>
      <KioskShell
        tiles={tiles.map((tile) => ({
          ...tile,
          onPress: () => dispatch(addRecent("/kiosk"))
        }))}
      />
    </div>
  );
};

export default KioskPage;
