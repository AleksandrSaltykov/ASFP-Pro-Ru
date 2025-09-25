import { ReactElement } from "react";

import { palette } from "./theme";

const strokeBase = palette.primary;
const strokeAccent = palette.primaryDark;
const fillAccent = palette.primary;
const fillOpacity = 0.12;

const baseProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 32 32",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
} as const;

const strokePropsBase = {
  stroke: strokeBase,
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
};

const strokePropsAccent = {
  stroke: strokeAccent,
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
};

const iconBox = (
  <svg {...baseProps}>
    <path d="M6.5 12 16 7l9.5 5-9.5 5-9.5-5Z" {...strokePropsBase} fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M6.5 12v10l9.5 5 9.5-5V12" {...strokePropsBase} />
    <path d="M16 17v10" {...strokePropsAccent} />
  </svg>
);

const iconRobotArm = (
  <svg {...baseProps}>
    <path d="M7 26h18" {...strokePropsBase} />
    <path d="M11 26v-5" {...strokePropsBase} />
    <path d="M11 21 16 16 21 21" {...strokePropsAccent} />
    <circle cx="11" cy="21" r="1.8" stroke={strokeAccent} strokeWidth="1.6" fill={fillAccent} fillOpacity={fillOpacity} />
    <circle cx="16" cy="16" r="2.4" stroke={strokeAccent} strokeWidth="1.6" fill="none" />
    <circle cx="21" cy="21" r="1.8" stroke={strokeAccent} strokeWidth="1.6" fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M21 21 24.5 17.5" {...strokePropsBase} />
    <circle cx="25" cy="17" r="1.2" stroke={strokeAccent} strokeWidth="1.6" fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M11 18v-3" {...strokePropsBase} />
  </svg>
);

const iconDocument = (
  <svg {...baseProps}>
    <path d="M12 6h8l6 6v15a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" {...strokePropsBase} />
    <path d="M20 6v6h6" {...strokePropsBase} />
    <circle cx="18" cy="22" r="3" stroke={strokeAccent} strokeWidth="1.6" fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M18 18.5v-1.2" {...strokePropsAccent} />
    <path d="M18 24.7v-1.2" {...strokePropsAccent} />
    <path d="M14.8 22h-1.3" {...strokePropsAccent} />
    <path d="M22.5 22h-1.3" {...strokePropsAccent} />
    <path d="M15.8 19.5 15 18.5" {...strokePropsAccent} />
    <path d="M20.9 19.5 20 18.5" {...strokePropsAccent} />
    <path d="M20.9 24.5 20 23.5" {...strokePropsAccent} />
    <path d="M15.8 24.5 15 23.5" {...strokePropsAccent} />
  </svg>
);

const iconTruck = (
  <svg {...baseProps}>
    <path d="M6 20v-8h13v8" {...strokePropsBase} />
    <path d="M19 16h5l3 4v4" {...strokePropsBase} />
    <path d="M6 20h21" {...strokePropsAccent} />
    <circle cx="12" cy="24" r="2.5" stroke={strokeAccent} strokeWidth="1.6" fill={fillAccent} fillOpacity={fillOpacity} />
    <circle cx="23" cy="24" r="2.5" stroke={strokeAccent} strokeWidth="1.6" fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M19 20v-4" {...strokePropsBase} />
    <path d="M24 16v-3h-5" {...strokePropsBase} />
  </svg>
);

const iconAnalytics = (
  <svg {...baseProps}>
    <path d="M6 25h20" {...strokePropsBase} />
    <path d="M10 24V14" {...strokePropsBase} />
    <path d="M16 24V10" {...strokePropsBase} />
    <path d="M22 24v-7" {...strokePropsBase} />
    <path d="M7.5 17.5 12 13l4 3 4-5 4.5 5" {...strokePropsAccent} />
    <path d="M10 19h12" stroke={strokeAccent} strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const iconWorker = (
  <svg {...baseProps}>
    <circle cx="16" cy="13" r="4" stroke={strokeBase} strokeWidth="1.6" fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M12 12h8" {...strokePropsAccent} />
    <path d="M13 10v2" {...strokePropsAccent} />
    <path d="M19 10v2" {...strokePropsAccent} />
    <path d="M10 25c0-3.9 2.7-7 6-7s6 3.1 6 7" {...strokePropsBase} />
    <path d="M10 25h12" {...strokePropsBase} />
  </svg>
);

const iconBoard = (
  <svg {...baseProps}>
    <rect x="6" y="6.5" width="20" height="13" rx="2" {...strokePropsBase} />
    <path d="M9 15.5 13 11.5 16.5 15 20 11 23 15" {...strokePropsAccent} />
    <path d="M16 19.5v5" {...strokePropsAccent} />
    <path d="M12 24.5h8" {...strokePropsBase} />
  </svg>
);

const iconCog = (
  <svg {...baseProps}>
    <circle cx="16" cy="16" r="4" stroke={strokeAccent} strokeWidth="1.6" fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M16 8.5V11" {...strokePropsBase} />
    <path d="M16 21v2.5" {...strokePropsBase} />
    <path d="M9.5 16H12" {...strokePropsBase} />
    <path d="M20 16h2.5" {...strokePropsBase} />
    <path d="M11.2 11.2 12.9 12.9" {...strokePropsBase} />
    <path d="M19.1 19.1 20.8 20.8" {...strokePropsBase} />
    <path d="M20.8 11.2 19.1 12.9" {...strokePropsBase} />
    <path d="M12.9 19.1 11.2 20.8" {...strokePropsBase} />
  </svg>
);

const iconWarning = (
  <svg {...baseProps}>
    <path d="M16 6.5 26 23.5H6Z" {...strokePropsBase} fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M16 12.5v6" {...strokePropsAccent} />
    <circle cx="16" cy="21.5" r="1" fill={strokeAccent} />
  </svg>
);

const iconCalendar = (
  <svg {...baseProps}>
    <rect x="6" y="9" width="20" height="17" rx="2" {...strokePropsBase} />
    <path d="M10 6v5" {...strokePropsAccent} />
    <path d="M22 6v5" {...strokePropsAccent} />
    <path d="M6 14h20" {...strokePropsBase} />
    <path d="M12 19h4" {...strokePropsAccent} />
    <path d="M12 23h4" {...strokePropsAccent} />
    <path d="M20 19h4" {...strokePropsAccent} />
  </svg>
);

const iconCrmMonitor = (
  <svg {...baseProps}>
    <rect x="6" y="7" width="20" height="14" rx="2" {...strokePropsBase} />
    <path d="M10 24h12" {...strokePropsBase} />
    <path d="M16 21v3" {...strokePropsAccent} />
    <path d="M11.5 17h-1A1.5 1.5 0 0 1 9 15.5v-1A1.5 1.5 0 0 1 10.5 13h1" {...strokePropsAccent} />
    <path d="M13 17v-4h1.6A1.1 1.1 0 0 1 15.7 14 1.1 1.1 0 0 1 14.6 15.1H13" {...strokePropsAccent} />
    <path d="M15 15.1 16.8 17" {...strokePropsBase} />
    <path d="M18 13v4l1.6-2 1.6 2v-4" {...strokePropsAccent} />
  </svg>
);

const iconFactory = (
  <svg {...baseProps}>
    <path d="M6 24V13l5 3v-3l5 3v-3l5 3v11" {...strokePropsBase} />
    <path d="M6 24h20" {...strokePropsAccent} />
    <rect x="9" y="19" width="3" height="5" {...strokePropsAccent} fill={fillAccent} fillOpacity={fillOpacity} />
    <rect x="15" y="19" width="3" height="5" {...strokePropsBase} fill="none" />
    <rect x="21" y="19" width="3" height="5" {...strokePropsBase} fill="none" />
  </svg>
);

const iconConveyor = (
  <svg {...baseProps}>
    <path d="M7 17h18v5H7Z" {...strokePropsBase} fill={fillAccent} fillOpacity={fillOpacity} />
    <circle cx="11" cy="22" r="2" stroke={strokeAccent} strokeWidth="1.6" fill="none" />
    <circle cx="16" cy="22" r="2" stroke={strokeAccent} strokeWidth="1.6" fill="none" />
    <circle cx="21" cy="22" r="2" stroke={strokeAccent} strokeWidth="1.6" fill="none" />
    <path d="M9 17l4-6h6l4 6" {...strokePropsAccent} />
  </svg>
);

const iconWarehouse = (
  <svg {...baseProps}>
    <path d="M5.5 12 16 6l10.5 6v12H5.5Z" {...strokePropsBase} fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M11 24v-6h10v6" {...strokePropsBase} />
    <path d="M11 20h10" {...strokePropsAccent} />
  </svg>
);

const iconForklift = (
  <svg {...baseProps}>
    <path d="M7 22v-8h7l3 5h5" {...strokePropsBase} />
    <path d="M22 17v7h4" {...strokePropsBase} />
    <circle cx="11" cy="24" r="2.5" stroke={strokeAccent} strokeWidth="1.6" fill={fillAccent} fillOpacity={fillOpacity} />
    <circle cx="21" cy="24" r="2.5" stroke={strokeAccent} strokeWidth="1.6" fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M14 14v4" {...strokePropsAccent} />
  </svg>
);

const iconIot = (
  <svg {...baseProps}>
    <rect x="9" y="9" width="14" height="14" rx="2" {...strokePropsBase} />
    <path d="M16 5v4" {...strokePropsAccent} />
    <path d="M16 23v4" {...strokePropsAccent} />
    <path d="M5 16h4" {...strokePropsAccent} />
    <path d="M23 16h4" {...strokePropsAccent} />
    <path d="M12 13h8v6h-8Z" {...strokePropsBase} fill={fillAccent} fillOpacity={fillOpacity} />
  </svg>
);

const iconEnergy = (
  <svg {...baseProps}>
    <path d="M12 6v10a4 4 0 0 0 8 0V6" {...strokePropsBase} />
    <path d="M12 11h8" {...strokePropsBase} />
    <path d="M14 26l3-5h-4l3-5" {...strokePropsAccent} />
  </svg>
);

const iconShield = (
  <svg {...baseProps}>
    <path d="M16 6 24 9v8c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V9Z" {...strokePropsBase} fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M16 14v9" {...strokePropsAccent} />
  </svg>
);

const iconSync = (
  <svg {...baseProps}>
    <path d="M10 20a6 6 0 0 0 9.5 2.2" {...strokePropsBase} />
    <path d="M9 20h3v3" {...strokePropsAccent} />
    <path d="M22 12a6 6 0 0 0-9.5-2.2" {...strokePropsBase} />
    <path d="M23 12h-3V9" {...strokePropsAccent} />
  </svg>
);

const iconAlert = (
  <svg {...baseProps}>
    <circle cx="16" cy="16" r="9" stroke={strokeBase} strokeWidth="1.6" fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M16 11v6" {...strokePropsAccent} />
    <circle cx="16" cy="21" r="1" fill={strokeAccent} />
  </svg>
);

const iconFlow = (
  <svg {...baseProps}>
    <path d="M10 20c2.5-2 4-4.5 6-8 2 3.5 3.5 6 6 8" {...strokePropsAccent} />
    <path d="M10 23c2.5-2 4-3 6-3s3.5 1 6 3" {...strokePropsBase} />
  </svg>
);

const iconSchedule = (
  <svg {...baseProps}>
    <rect x="7" y="9" width="18" height="17" rx="2" {...strokePropsBase} />
    <path d="M11 6v5" {...strokePropsAccent} />
    <path d="M21 6v5" {...strokePropsAccent} />
    <path d="M7 14h18" {...strokePropsBase} />
    <path d="M11 18h2" {...strokePropsAccent} />
    <path d="M15 18h2" {...strokePropsAccent} />
    <path d="M19 18h2" {...strokePropsAccent} />
    <path d="M11 22h2" {...strokePropsBase} />
    <path d="M15 22h2" {...strokePropsBase} />
    <path d="M19 22h2" {...strokePropsBase} />
  </svg>
);

const iconClock = (
  <svg {...baseProps}>
    <circle cx="16" cy="16" r="9" stroke={strokeBase} strokeWidth="1.6" fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M16 10v6l4 3" {...strokePropsAccent} />
  </svg>
);

const iconBarcode = (
  <svg {...baseProps}>
    <path d="M8 10v12" {...strokePropsBase} />
    <path d="M12 8v16" {...strokePropsAccent} />
    <path d="M16 10v12" {...strokePropsBase} />
    <path d="M20 8v16" {...strokePropsAccent} />
    <path d="M24 10v12" {...strokePropsBase} />
  </svg>
);

const iconUser = (
  <svg {...baseProps}>
    <circle cx="16" cy="13" r="5" stroke={strokeAccent} strokeWidth="1.6" fill={fillAccent} fillOpacity={fillOpacity} />
    <path d="M9 26c0-4.4 3.1-8 7-8s7 3.6 7 8" {...strokePropsBase} />
  </svg>
);

export const iconMap: Record<string, ReactElement> = {
  box: iconBox,
  package: iconBox,
  robotArm: iconRobotArm,
  automation: iconRobotArm,
  document: iconDocument,
  documentCog: iconDocument,
  truck: iconTruck,
  logistics: iconTruck,
  analytics: iconAnalytics,
  overview: iconBoard,
  board: iconBoard,
  worker: iconWorker,
  gear: iconCog,
  system: iconCog,
  warning: iconWarning,
  calendar: iconCalendar,
  schedule: iconSchedule,
  crmMonitor: iconCrmMonitor,
  crm: iconCrmMonitor,
  factory: iconFactory,
  conveyor: iconConveyor,
  warehouse: iconWarehouse,
  wms: iconWarehouse,
  forklift: iconForklift,
  iot: iconIot,
  energy: iconEnergy,
  shield: iconShield,
  security: iconShield,
  sync: iconSync,
  refresh: iconSync,
  alert: iconAlert,
  flow: iconFlow,
  files: iconDocument,
  clock: iconClock,
  barcode: iconBarcode,
  user: iconUser
};





