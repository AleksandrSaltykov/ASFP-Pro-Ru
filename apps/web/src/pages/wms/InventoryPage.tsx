import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

import { palette, typography } from '@shared/ui/theme';

type WmsTabBlock = {
  title: string;
  description: string;
  items: string[];
};

type WmsTab = {
  id: string;
  title: string;
  summary: string;
  blocks: WmsTabBlock[];
};

type WmsSection = {
  id: string;
  title: string;
  description: string;
  tabs: WmsTab[];
};

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18
};

const moduleHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: 12,
  marginBottom: 10,
  borderBottom: `1px solid ${palette.glassBorder}`
};

const moduleHeadingStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10
};

const moduleBadgeStyle: CSSProperties = {
  textTransform: 'uppercase',
  fontSize: 10,
  letterSpacing: '0.14em',
  padding: '5px 10px',
  borderRadius: 14,
  backgroundColor: 'rgba(56, 189, 248, 0.16)',
  color: palette.textPrimary,
  fontFamily: typography.accentFamily,
  fontWeight: 600
};

const moduleTitleStyle: CSSProperties = {
  fontSize: 20,
  margin: 0,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily,
  letterSpacing: '-0.01em'
};

const moduleMetaStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(226, 232, 240, 0.65)',
  fontFamily: typography.accentFamily,
  letterSpacing: '0.1em',
  textTransform: 'uppercase'
};

const sectionNavStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  padding: 4,
  borderRadius: 16,
  backgroundColor: 'rgba(15, 23, 42, 0.45)',
  border: `1px solid ${palette.glassBorder}`
};

const tabNavWrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10
};

const tabNavStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6
};

const sectionButtonBase: CSSProperties = {
  padding: '7px 12px',
  borderRadius: 14,
  border: 'none',
  background: 'transparent',
  color: 'rgba(226, 232, 240, 0.7)',
  fontWeight: 500,
  fontSize: 12,
  cursor: 'pointer',
  transition: 'all 0.18s ease',
  fontFamily: typography.accentFamily
};

const tabButtonBase: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  color: 'rgba(226, 232, 240, 0.75)',
  fontWeight: 500,
  fontSize: 12,
  cursor: 'pointer',
  transition: 'all 0.18s ease',
  fontFamily: typography.accentFamily,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)'
};

const summaryCardStyle: CSSProperties = {
  backgroundColor: 'rgba(15, 23, 42, 0.46)',
  border: `1px solid ${palette.glassBorder}`,
  borderRadius: 16,
  padding: '12px 16px',
  color: 'rgba(226, 232, 240, 0.78)',
  fontSize: 12,
  lineHeight: 1.55,
  fontFamily: typography.accentFamily,
  boxShadow: '0 16px 30px rgba(2, 6, 23, 0.4)'
};

const blocksGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14
};

const blockCardStyle: CSSProperties = {
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  boxShadow: '0 22px 38px rgba(2, 6, 23, 0.42)'
};

const blockTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const blockDescriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: 'rgba(203, 213, 225, 0.8)',
  fontFamily: typography.accentFamily,
  lineHeight: 1.45
};

const blockListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  color: 'rgba(226, 232, 240, 0.82)',
  fontSize: 12,
  lineHeight: 1.45,
  fontFamily: typography.accentFamily
};

const wmsSections: WmsSection[] = [
  {
    id: 'overview',
    title: 'Обзор',
    description: 'Пульс склада и быстрый контроль SLA.',
    tabs: [
      {
        id: 'kpi',
        title: 'KPI и статус',
        summary:
          'Главный экран показывает оборачиваемость, заполненность зон, SLA по приемке/отгрузке и критические оповещения.',
        blocks: [
          {
            title: 'Показатели',
            description: 'Виджеты по ABC/XYZ, Aging, скорости обработки заказов и загрузке смен.',
            items: [
              'Оборачиваемость по категориям и клиентам',
              'Заполненность зон и горячие ячейки',
              'Контроль SLA приемки и отгрузки',
              'Очередь инцидентов и отложенных операций'
            ]
          },
          {
            title: 'Мониторинг смен',
            description: 'Поддержка RF-терминалов и голосового отбора с фактическим прогрессом.',
            items: [
              'Активные бригады и персональные KPI',
              'Сравнение план/факт по заданиям',
              'Алерты по переработкам и простоям'
            ]
          },
          {
            title: 'Лента событий',
            description: 'Хронология приемок, перемещений, блокировок и претензий.',
            items: [
              'Push-уведомления о срочных задачах',
              'Объединение событий из WMS, ERP и МойСклад',
              'Быстрые действия: назначить исполнителя, открыть заказ'
            ]
          }
        ]
      },
      {
        id: 'analytics',
        title: 'Аналитика',
        summary:
          'Глубокая аналитика по товарным категориям, клиентам и каналам. Готово для выгрузки в BI и метрики Lean.',
        blocks: [
          {
            title: 'Каналы сбыта',
            description: 'Сравнение e-commerce, производства, офлайн-заказов.',
            items: [
              'Фильтры по юрлицам, складам, клиентам',
              'ABC/XYZ пересечения, профили спроса',
              'Отчеты по стоимости хранения и простоя'
            ]
          },
          {
            title: 'Прогнозы',
            description: 'Поддержка ML-моделей для планирования закупок и производства.',
            items: [
              'Прогноз потребления по рецептурам',
              'Форкаст пиковых нагрузок',
              'Сценарии "что если" по SLA и персоналу'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'operations',
    title: 'Операции',
    description: 'Процессы приемки, отгрузки и перемещений.',
    tabs: [
      {
        id: 'inbound',
        title: 'Приёмка',
        summary:
          'Работа с ASN, паллетными ярлыками и кросс-докингом. Контроль качества и несоответствий.',
        blocks: [
          {
            title: 'Планирование',
            description: 'Очереди машин, слоты ворот, автоназначение бригад.',
            items: [
              'Импорт ASN из EDI и ERP',
              'Проверка лимитов по зонам буферов',
              'Гибкие SLA по типам поставок'
            ]
          },
          {
            title: 'Размещение',
            description: 'Правила FEFO/FIFO, скоростная приемка и фотофиксация.',
            items: [
              'Задания по RF-терминалам с маршрутами',
              'Контроль температурных зон и карантина',
              'Авторазмещение по типам тары и весу'
            ]
          },
          {
            title: 'Несоответствия',
            description: 'Претензии, возвраты, пересорты.',
            items: [
              'Оформление актов по шаблонам',
              'Интеграция с рекламациями поставщикам',
              'Фотопривязка и электронная подпись'
            ]
          }
        ]
      },
      {
        id: 'outbound',
        title: 'Отгрузка',
        summary: 'Комплектация, проверка, упаковка и экспедиция.',
        blocks: [
          {
            title: 'Подбор',
            description: 'Волновой подбор, кластеризация заказов, зона “pick-to-pack”.',
            items: [
              'Маршрутизация по ячейкам с учетом приоритетов',
              'Автоподбор упаковки и расходников',
              'Двойной контроль и фотоподтверждение'
            ]
          },
          {
            title: 'Проверка и упаковка',
            description: 'Сканирование, взвешивание, нанесение этикеток.',
            items: [
              'Интеграция с весовым оборудованием',
              'Печать ТТН, УПД, пломбировочных листов',
              'Учет возвратной тары и паллет'
            ]
          },
          {
            title: 'Экспедиция',
            description: 'Слоты, очереди машин, экспедирование, контроль отгрузки.',
            items: [
              'Тайм-слоты ворот и уведомления перевозчиков',
              'Контроль пломб и фото загрузки',
              'Интеграция с ТМС для отслеживания рейсов'
            ]
          }
        ]
      },
      {
        id: 'moves',
        title: 'Перемещения',
        summary: 'Внутрискладские и межскладские трансферы, пополнения зон, выдача в производство.',
        blocks: [
          {
            title: 'Внутренние',
            description: 'Перемещения между зонами, слотирование, пополнение ячеек под заказы.',
            items: [
              'Динамическое пополнение по триггерам',
              'Разнесение по зонам консолидации',
              'Контроль статусов “путь”, “ожидание”'
            ]
          },
          {
            title: 'Межскладские',
            description: 'Трансферы между площадками и юрлицами.',
            items: [
              'Перекладывания с учетом инвентаризации',
              'Пересортица и переоценка при перемещении',
              'Документы М-11, ТОРГ-13 и кастомные'
            ]
          },
          {
            title: 'Производство',
            description: 'Выдача материалов, возврат остатков, учёт полуфабрикатов.',
            items: [
              'MRP-планы по сменам',
              'Лимитно-заборные карты и рецептуры',
              'Учёт возврата и утилизации брака'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'planning',
    title: 'Планирование',
    description: 'Прогнозы, задачи и ресурсы.',
    tabs: [
      {
        id: 'inventory',
        title: 'Запасы',
        summary:
          'Планирование уровней запасов, резервирование под заказы и расчет потребностей закупок.',
        blocks: [
          {
            title: 'Параметры',
            description: 'Safety stock, min/max по SKU, сезонность.',
            items: [
              'Автогенерация заявок поставщикам',
              'Параметры FEFO/LEFO и приоритетов отбора',
              'Сценарии страховых запасов'
            ]
          },
          {
            title: 'Резервы',
            description: 'Блокировки под продажи и производство.',
            items: [
              'Ручные и автоматические резервы',
              'Условия разблокировки и просрочки',
              'Связь с CRM, WMS и MES'
            ]
          }
        ]
      },
      {
        id: 'tasks',
        title: 'Задачи',
        summary: 'Назначение, балансировка и контроль выполнения заданий бригад.',
        blocks: [
          {
            title: 'Планирование смен',
            description: 'Графики, расстановка по зонам, потребность в персонале.',
            items: [
              'Сменные задания “pick/pack/putaway”',
              'Оценка трудоемкости и Auto-Labor Management',
              'Учет компетенций и допусков'
            ]
          },
          {
            title: 'Контроль',
            description: 'Статусы выполнения, алармы, перераспределение.',
            items: [
              'Live-доска прогресса',
              'Переадресация задач при отклонениях',
              'Интеграция с корпоративным мессенджером'
            ]
          }
        ]
      },
      {
        id: 'production',
        title: 'Производство',
        summary: 'Связь с MES и цехами: выдача, возврат, контроль рецептур.',
        blocks: [
          {
            title: 'Выдача материалов',
            description: 'Планово-предупредительная выдача по маршрутам цехов.',
            items: [
              'MRP II / MRP Lite сценарии',
              'Подбор комплектов и полуфабрикатов',
              'Контроль отклонений и замены сырья'
            ]
          },
          {
            title: 'Возвраты и остатки',
            description: 'Переоценка, утилизация, возврат на центральный склад.',
            items: [
              'Регистрация брака и переработки',
              'Учёт возврата тары и расходников',
              'Связь с план-факт производством'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'suppliers',
    title: 'Поставщики',
    description: 'Карточки партнёров, договоры и качество поставок.',
    tabs: [
      {
        id: 'profiles',
        title: 'Карточки поставщиков',
        summary: 'Полная карточка партнёра с контактами, SLA и категорией надежности.',
        blocks: [
          {
            title: 'Данные',
            description: 'Реквизиты, контактные лица, зоны ответственности.',
            items: [
              'Категории A/B/C и рейтинг надежности',
              'История взаимодействий и коммуникаций',
              'Контроль лицензий и сертификатов'
            ]
          },
          {
            title: 'Календарь',
            description: 'Графики поставок, резервирование слотов, планирование аудитов.',
            items: [
              'Плановые проверки и переаттестации',
              'Сегментация по типам продукции',
              'Согласование мощностей поставщика'
            ]
          }
        ]
      },
      {
        id: 'contracts',
        title: 'Договоры и счета',
        summary: 'Коммерческие условия, кредитные линии и история оплат.',
        blocks: [
          {
            title: 'Финансовые условия',
            description: 'Лимиты, скидки, SLA по оплате и штрафы.',
            items: [
              'Управление договорами, допсоглашениями',
              'Учёт предоплаты и отсрочки',
              'Привязка счетов и актов в разрезе поставок'
            ]
          },
          {
            title: 'Расчеты',
            description: 'Контроль задолженности и автоматизация сверок.',
            items: [
              'Интеграция с бухгалтерией и банками',
              'Автоматическое формирование платежек',
              'История взаиморасчетов и претензий'
            ]
          }
        ]
      },
      {
        id: 'quality',
        title: 'Поставки и претензии',
        summary: 'Слежение за качеством, несоответствиями и рекламациями.',
        blocks: [
          {
            title: 'Контроль качества',
            description: 'Инспекции, выборочный контроль, лабораторные результаты.',
            items: [
              'Протоколы приемки, фотофиксация',
              'Сертификаты и срок их действия',
              'История несоответствий и исправлений'
            ]
          },
          {
            title: 'Претензии',
            description: 'Регистрация, маршрутизация и закрытие претензий.',
            items: [
              'SLA по ответу и компенсациям',
              'Эскалации и контроль исполнения',
              'Отчеты по успешности поставщика'
            ]
          }
        ]
      },
      {
        id: 'edi',
        title: 'EDI и интеграции',
        summary: 'Мониторинг обмена документами и статусов поставок.',
        blocks: [
          {
            title: 'EDI-статусы',
            description: 'Мониторинг заказов, ASN, уведомлений о приемке.',
            items: [
              'Журналы ошибок и переотправка',
              'Гибкое управление форматом документов',
              'Контроль SLA по подтверждениям'
            ]
          },
          {
            title: 'Порталы и API',
            description: 'Личный кабинет поставщика, набор REST/GraphQL API.',
            items: [
              'Согласование графиков и мощностей',
              'Портал претензий и отчетов',
              'SFTP, ЭДО, вебхуки для событий'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'control',
    title: 'Контроль и настройки',
    description: 'Инвентаризация, отчеты, справочники и управление параметрами.',
    tabs: [
      {
        id: 'inventory-audit',
        title: 'Инвентаризация',
        summary: 'Полный набор сценариев: годовая, циклическая, выборочная.',
        blocks: [
          {
            title: 'Сценарии',
            description: 'Годовые кампании, локальные проверки, пересчет по зонам.',
            items: [
              'Циклический подсчет по классам ABC/XYZ',
              'Инвентаризация по серийным номерам и партиям',
              'Авты закрытия и обработка отклонений'
            ]
          },
          {
            title: 'Корректировки',
            description: 'Автоматическое формирование документов и маршрутизация на утверждение.',
            items: [
              'Процедуры согласования',
              'Привязка фото и комментариев',
              'Связь с бухгалтерией и управленческим учетом'
            ]
          }
        ]
      },
      {
        id: 'reports',
        title: 'Отчётность',
        summary: 'Готовые отчеты и конструктор для аналитиков.',
        blocks: [
          {
            title: 'Стандартные отчеты',
            description: 'Оборотно-сальдовая, Aging, KPI персонала.',
            items: [
              'Оборот и оборачиваемость по складам',
              'Списания, недостачи, перерасход',
              'Производительность смен и сотрудников'
            ]
          },
          {
            title: 'Конструктор',
            description: 'Гибкая выгрузка в Excel, BI, API.',
            items: [
              'Сохраненные шаблоны и расписания',
              'Интеграция с Superset/Metabase',
              'Поддержка ролей и ограничений данных'
            ]
          }
        ]
      },
      {
        id: 'directories',
        title: 'Справочники и параметры',
        summary: 'Структура склада, оборудование, роли и интеграции.',
        blocks: [
          {
            title: 'Структура',
            description: 'Склады, зоны, ячейки, оборудование.',
            items: [
              'Геометрия, грузоподъемность, температурные режимы',
              'Шаблоны этикеток и RFID меток',
              'Гибкое управление топологией склада'
            ]
          },
          {
            title: 'Параметры и интеграции',
            description: 'Роли, доступы, настройки API, мобильные устройства.',
            items: [
              'Стратегии отбора и размещения',
              'Настройки уведомлений и рабочих процессов',
              'Интеграция с ERP, CRM, ТМС, Честный ЗНАК'
            ]
          }
        ]
      }
    ]
  }
];

const InventoryPage = () => {
  const [activeSectionId, setActiveSectionId] = useState(wmsSections[0].id);
  const [activeTabId, setActiveTabId] = useState(wmsSections[0].tabs[0].id);

  useEffect(() => {
    const section = wmsSections.find((item) => item.id === activeSectionId);
    if (section) {
      setActiveTabId(section.tabs[0].id);
    }
  }, [activeSectionId]);

  const activeSection = wmsSections.find((section) => section.id === activeSectionId) ?? wmsSections[0];
  const activeTab = activeSection.tabs.find((tab) => tab.id === activeTabId) ?? activeSection.tabs[0];

  return (
    <section style={sectionStyle}>
      <header style={moduleHeaderStyle}>
        <div style={moduleHeadingStyle}>
          <span style={moduleBadgeStyle}>Модуль WMS</span>
          <h1 style={moduleTitleStyle}>Структура склада</h1>
        </div>
        <span style={moduleMetaStyle}>{activeSection.title}</span>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={sectionNavStyle}>
          {wmsSections.map((section) => {
            const isActive = section.id === activeSectionId;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                style={{
                  ...sectionButtonBase,
                  background: isActive ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.45) 0%, rgba(99, 102, 241, 0.5) 100%)' : 'transparent',
                  color: isActive ? palette.textPrimary : 'rgba(226, 232, 240, 0.7)',
                  boxShadow: isActive ? '0 16px 28px rgba(56, 189, 248, 0.3)' : 'none',
                  transform: isActive ? 'translateY(-1px)' : 'translateY(0)'
                }}
              >
                {section.title}
              </button>
            );
          })}
        </div>

        <div style={tabNavWrapperStyle}>
          <div style={tabNavStyle}>
            {activeSection.tabs.map((tab) => {
              const isActive = tab.id === activeTab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  style={{
                    ...tabButtonBase,
                    backgroundColor: isActive ? 'rgba(56, 189, 248, 0.18)' : tabButtonBase.backgroundColor,
                    border: isActive
                      ? '1px solid rgba(255, 255, 255, 0.26)'
                      : tabButtonBase.border,
                    color: isActive ? palette.textPrimary : tabButtonBase.color,
                    boxShadow: isActive ? '0 14px 26px rgba(56, 189, 248, 0.28)' : '0 10px 22px rgba(2, 6, 23, 0.32)',
                    transform: isActive ? 'translateY(-1px)' : 'translateY(0)'
                  }}
                >
                  {tab.title}
                </button>
              );
            })}
          </div>

          <div style={summaryCardStyle}>{activeTab.summary}</div>
        </div>
      </div>

      <div style={blocksGridStyle}>
        {activeTab.blocks.map((block) => (
          <article key={block.title} style={blockCardStyle}>
            <h3 style={blockTitleStyle}>{block.title}</h3>
            <p style={blockDescriptionStyle}>{block.description}</p>
            <ul style={blockListStyle}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
};

export default InventoryPage;
