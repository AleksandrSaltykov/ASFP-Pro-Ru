import { warehouseMenu } from "@modules/warehouse/menu/warehouse.menu";
import type { WarehouseMenuNode } from "@modules/warehouse/layout/types";
import { iconMap } from "@shared/ui/icons";

export type IconName = keyof typeof iconMap;

export type ModulePermission = {
  resource: string;
  action: string;
};

export type ModuleMenuItem = {
  id: string;
  label: string;
  to: string;
  icon?: IconName;
  permissions?: ModulePermission[];
};

export type ModuleMenuSection = {
  id: string;
  label: string;
  items: ModuleMenuItem[];
};

export type ModuleDefinition = {
  id: string;
  label: string;
  icon: IconName;
  entryPath: string;
  permissions?: ModulePermission[];
  pathMatchers: string[];
  submenu?: ModuleMenuSection[];
};

export type RouteDescriptor = {
  label: string;
  icon: IconName;
};

const mapWarehouseSections = (nodes: WarehouseMenuNode[]): ModuleMenuSection[] =>
  nodes
    .map((section) => ({
      id: section.id,
      label: section.label,
      items: (section.children ?? [])
        .filter((child): child is WarehouseMenuNode & { path: string } => Boolean(child.path))
        .map((child) => ({
          id: child.id,
          label: child.label,
          to: child.path!,
          icon: "warehouse"
        }))
    }))
    .filter((section) => section.items.length > 0);

export const moduleDefinitions: ModuleDefinition[] = [
  {
    id: "crm",
    label: "CRM",
    icon: "crm",
    entryPath: "/sales",
    permissions: [{ resource: "crm.deal", action: "read" }],
    pathMatchers: ["/sales", "/crm", "/orders"],
    submenu: [
      {
        id: "crm-core",
        label: "Рабочие места",
        items: [
          { id: "crm-launch", label: "Старт CRM", to: "/sales", icon: "crm" },
          { id: "crm-deals", label: "Сделки", to: "/crm/deals", icon: "crm" }
        ]
      }
    ]
  },
  {
    id: "projects",
    label: "Проекты",
    icon: "board",
    entryPath: "/tasks-projects",
    pathMatchers: ["/tasks-projects"],
    submenu: [
      {
        id: "projects-core",
        label: "Рабочие места",
        items: [{ id: "projects-main", label: "Проекты", to: "/tasks-projects", icon: "board" }]
      }
    ]
  },
  {
    id: "production",
    label: "Производство",
    icon: "factory",
    entryPath: "/production",
    pathMatchers: ["/production"],
    submenu: [
      {
        id: "production-core",
        label: "Рабочие места",
        items: [{ id: "production-main", label: "Производство", to: "/production", icon: "factory" }]
      }
    ]
  },
  {
    id: "warehouse",
    label: "Склад",
    icon: "warehouse",
    entryPath: "/warehouse/stock/balances",
    permissions: [{ resource: "wms.stock", action: "read" }],
    pathMatchers: ["/warehouse"],
    submenu: mapWarehouseSections(warehouseMenu)
  },
  {
    id: "logistics",
    label: "Логистика",
    icon: "truck",
    entryPath: "/logistics",
    pathMatchers: ["/logistics"],
    submenu: [
      {
        id: "logistics-core",
        label: "Рабочие места",
        items: [{ id: "logistics-main", label: "Логистика", to: "/logistics", icon: "truck" }]
      }
    ]
  },
  {
    id: "kiosk",
    label: "Киоск",
    icon: "barcode",
    entryPath: "/kiosk",
    pathMatchers: ["/kiosk"],
    submenu: [
      {
        id: "kiosk-core",
        label: "Рабочие места",
        items: [{ id: "kiosk-main", label: "Киоск", to: "/kiosk", icon: "barcode" }]
      }
    ]
  },
  {
    id: "services",
    label: "Сервисы",
    icon: "gear",
    entryPath: "/services",
    pathMatchers: ["/services"],
    submenu: [
      {
        id: "services-core",
        label: "Рабочие места",
        items: [{ id: "services-main", label: "Сервисы", to: "/services", icon: "gear" }]
      }
    ]
  },
  {
    id: "messenger",
    label: "Мессенджер",
    icon: "flow",
    entryPath: "/messenger",
    pathMatchers: ["/messenger"],
    submenu: [
      {
        id: "messenger-core",
        label: "Рабочие места",
        items: [{ id: "messenger-main", label: "Мессенджер", to: "/messenger", icon: "flow" }]
      }
    ]
  },
  {
    id: "files",
    label: "Файлы",
    icon: "files",
    entryPath: "/files",
    pathMatchers: ["/files"],
    submenu: [
      {
        id: "files-core",
        label: "Рабочие места",
        items: [{ id: "files-main", label: "Файлы", to: "/files", icon: "files" }]
      }
    ]
  },
  {
    id: "directories",
    label: "Справочники",
    icon: "files",
    entryPath: "/directories",
    pathMatchers: ["/directories"],
    submenu: [
      {
        id: "directories-core",
        label: "Рабочие места",
        items: [{ id: "directories-main", label: "Справочники", to: "/directories", icon: "files" }]
      }
    ]
  },
  {
    id: "hr",
    label: "Оргструктура",
    icon: "board",
    entryPath: "/hr/org-structure",
    pathMatchers: ["/hr"],
    submenu: [
      {
        id: "hr-core",
        label: "Рабочие места",
        items: [{ id: "hr-main", label: "Оргструктура", to: "/hr/org-structure", icon: "board" }]
      }
    ]
  },
  {
    id: "settings",
    label: "Настройки",
    icon: "gear",
    entryPath: "/settings",
    pathMatchers: ["/settings"],
    submenu: [
      {
        id: "settings-core",
        label: "Рабочие места",
        items: [{ id: "settings-main", label: "Настройки", to: "/settings", icon: "gear" }]
      }
    ]
  },
  {
    id: "audit",
    label: "Журнал аудита",
    icon: "shield",
    entryPath: "/admin/audit",
    permissions: [{ resource: "core.audit", action: "read" }],
    pathMatchers: ["/admin/audit"],
    submenu: [
      {
        id: "audit-core",
        label: "Администрирование",
        items: [{ id: "audit-main", label: "Журнал аудита", to: "/admin/audit", icon: "shield" }]
      }
    ]
  },
  {
    id: "orgUnits",
    label: "Оргструктура (админ)",
    icon: "board",
    entryPath: "/admin/org-units",
    permissions: [{ resource: "core.org_unit", action: "read" }],
    pathMatchers: ["/admin/org-units"],
    submenu: [
      {
        id: "orgunits-core",
        label: "Администрирование",
        items: [{ id: "orgunits-main", label: "Оргструктура", to: "/admin/org-units", icon: "board" }]
      }
    ]
  },
  {
    id: "apiTokens",
    label: "API токены",
    icon: "gear",
    entryPath: "/admin/api-tokens",
    permissions: [{ resource: "core.api_token", action: "read" }],
    pathMatchers: ["/admin/api-tokens"],
    submenu: [
      {
        id: "apitokens-core",
        label: "Администрирование",
        items: [{ id: "apitokens-main", label: "API токены", to: "/admin/api-tokens", icon: "gear" }]
      }
    ]
  }
];

const baseRouteDictionary: Record<string, RouteDescriptor> = {
  "/": { label: "Главная", icon: "overview" },
  "/home-exec": { label: "Главная", icon: "overview" },
  "/orders/demo": { label: "Демо-заказ", icon: "package" }
};

export const routeDictionary: Record<string, RouteDescriptor> = moduleDefinitions.reduce(
  (acc, module) => {
    acc[module.entryPath] = { label: module.label, icon: module.icon };
    module.submenu?.forEach((section) => {
      section.items.forEach((item) => {
        acc[item.to] = { label: item.label, icon: item.icon ?? module.icon };
      });
    });
    return acc;
  },
  { ...baseRouteDictionary }
);

const matchesPath = (pathname: string, matcher: string) => {
  if (matcher === "/") {
    return pathname === "/";
  }
  if (pathname === matcher) {
    return true;
  }
  return pathname.startsWith(`${matcher}/`);
};

export const resolveModuleByPath = (pathname: string): ModuleDefinition | undefined =>
  moduleDefinitions.find((module) => module.pathMatchers.some((matcher) => matchesPath(pathname, matcher)));
