import { useMemo, useState, type CSSProperties } from "react";

import { useAppDispatch, useAppSelector } from "@app/hooks";
import { addRecent, toggleTileFavorite } from "@shared/state";
import { selectTileFavorites } from "@shared/state/ui-selectors";
import { TileGrid } from "@shared/ui";
import { palette } from "@shared/ui/theme";
import { ListAsCards, type FilterChip, type KanbanColumn, type ListCardItem } from "@widgets/lists";

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 28
};

const sectionIntroStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontSize: 32,
  fontWeight: 700,
  color: palette.textPrimary
};

const subheadingStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  color: palette.textSecondary
};

const tileDefinitions = [
  {
    id: "tile:create-quote",
    title: "Создать КП",
    note: "Шаблон с автозаполнением",
    icon: "document" as const,
    size: "M" as const,
    to: "/sales/quotes/new"
  },
  {
    id: "tile:create-order",
    title: "Создать заказ",
    note: "Заявка сразу в производство",
    icon: "package" as const,
    size: "M" as const,
    to: "/orders/new"
  },
  {
    id: "tile:leads-today",
    title: "Лиды сегодня",
    value: 12,
    note: "+4 к вчера",
    icon: "crm" as const,
    size: "M" as const,
    to: "/crm/deals?view=today"
  },
  {
    id: "tile:orders-progress",
    title: "Заказы в работе",
    value: 27,
    note: "Средний цикл: 9 дн.",
    icon: "factory" as const,
    size: "M" as const,
    to: "/orders?status=in-progress"
  },
  {
    id: "tile:price-calculator",
    title: "Калькулятор цены",
    note: "Рассчитать смету",
    icon: "gear" as const,
    size: "M" as const,
    to: "/tools/price-calculator"
  },
  {
    id: "tile:overdue",
    title: "Просрочки",
    value: 5,
    note: "На сумму 1.2 млн ₽",
    icon: "alert" as const,
    size: "M" as const,
    to: "/orders?filter=overdue"
  },
  {
    id: "tile:approvals",
    title: "Согласования",
    value: 8,
    note: "2 ждут клиента",
    icon: "documentCog" as const,
    size: "M" as const,
    to: "/approvals"
  },
  {
    id: "tile:price-lists",
    title: "Прайс-листы",
    note: "Каталог типовых цен",
    icon: "files" as const,
    size: "M" as const,
    to: "/catalogs/price-lists"
  }
];

const filters: FilterChip[] = [
  { id: "today", label: "Сегодня" },
  { id: "week", label: "Неделя" },
  { id: "favorites", label: "Избранные" }
];

const kanbanColumns: KanbanColumn[] = [
  { id: "lead", label: "Лиды" },
  { id: "proposal", label: "КП" },
  { id: "negotiation", label: "Переговоры" },
  { id: "production", label: "В производстве" },
  { id: "won", label: "Закрыты" }
];

const pipeline: ListCardItem[] = [
  {
    id: "deal-101",
    title: "Реклама в ТЦ \"Каскад\"",
    customer: "ООО \"Спектр\"",
    value: "2.4 млн ₽",
    deadline: "до 12 окт",
    status: "proposal",
    owner: "Анна Соколова",
    tags: ["наружная", "сетевые"],
    actions: [
      { label: "Открыть", to: "/crm/deals/101" },
      { label: "Согласование", to: "/approvals/101" }
    ]
  },
  {
    id: "deal-102",
    title: "Табло для стадиона",
    customer: "МУП \"Арена\"",
    value: "5.1 млн ₽",
    deadline: "до 28 окт",
    status: "negotiation",
    owner: "Игорь Петелин",
    tags: ["LED", "монтаж"],
    actions: [{ label: "Карта контакта", to: "/crm/deals/102" }]
  },
  {
    id: "deal-103",
    title: "Витрины для \"Молния\"",
    customer: "Сеть \"Молния\"",
    value: "1.2 млн ₽",
    deadline: "до 04 окт",
    status: "lead",
    owner: "Марина Орлова",
    tags: ["POS", "срочно"],
    actions: [{ label: "Назначить звонок" }]
  },
  {
    id: "deal-104",
    title: "Антенны для трассы",
    customer: "ГК \"Мосты\"",
    value: "3.6 млн ₽",
    deadline: "до 19 окт",
    status: "production",
    owner: "Антон Егоров",
    tags: ["дисплеи", "stretch"],
    actions: [{ label: "Перейти в заказ", to: "/orders/4501" }]
  },
  {
    id: "deal-105",
    title: "Навигация для аэропорта",
    customer: "АО \"Аэро Лайт\"",
    value: "7.8 млн ₽",
    deadline: "до 02 ноя",
    status: "won",
    owner: "Сергей Никитин",
    tags: ["навигация", "крупный"],
    actions: [{ label: "Выставить счёт" }]
  }
];

const filterPipeline = (items: ListCardItem[], filterId: string) => {
  switch (filterId) {
    case "favorites":
      return items.filter((item) => item.tags?.includes("срочно") || item.status === "negotiation");
    case "week":
      return items.filter((item) => item.status !== "won");
    default:
      return items;
  }
};

const SalesLaunchpadPage = () => {
  const dispatch = useAppDispatch();
  const favoriteTiles = useAppSelector(selectTileFavorites);
  const [activeFilter, setActiveFilter] = useState<string>(filters[0]?.id ?? "today");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const tiles = useMemo(
    () =>
      tileDefinitions.map((tile) => ({
        ...tile,
        onClick: () => {
          if (tile.to) {
            dispatch(addRecent(tile.to));
          }
        }
      })),
    [dispatch]
  );

  const filteredPipeline = useMemo(
    () => filterPipeline(pipeline, activeFilter),
    [activeFilter]
  );

  return (
    <section style={pageStyle}>
      <div style={sectionIntroStyle}>
        <h1 style={headingStyle}>Продажи сегодня</h1>
        <p style={subheadingStyle}>Все действия для менеджеров и руководителей в один клик</p>
      </div>

      <TileGrid
        title="Быстрые действия"
        description="Создавайте КП, заказы и проверяйте статусы"
        tiles={tiles}
        favoriteIds={favoriteTiles}
        onToggleFavorite={(id) => dispatch(toggleTileFavorite(id))}
        columns={4}
      />

      <ListAsCards
        title="Пайплайн сделок"
        description="Следите за воронкой и узкими местами"
        filters={filters}
        activeFilterId={activeFilter}
        onFilterChange={setActiveFilter}
        items={filteredPipeline}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        kanbanColumns={kanbanColumns}
      />
    </section>
  );
};

export default SalesLaunchpadPage;
