import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

import { gradients, palette, typography } from '@shared/ui/theme';

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
  backgroundColor: palette.accentSoft,
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
  color: palette.textSoft,
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
  backgroundColor: palette.layer,
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
  color: palette.textSoft,
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
  backgroundColor: palette.layer,
  color: palette.textSoft,
  fontWeight: 500,
  fontSize: 12,
  cursor: 'pointer',
  transition: 'all 0.18s ease',
  fontFamily: typography.accentFamily,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)'
};

const summaryCardStyle: CSSProperties = {
  backgroundColor: palette.layerStrong,
  border: `1px solid ${palette.glassBorder}`,
  borderRadius: 16,
  padding: '12px 16px',
  color: palette.textSoft,
  fontSize: 12,
  lineHeight: 1.55,
  fontFamily: typography.accentFamily,
  boxShadow: palette.shadowElevated
};

const blocksGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14
};

const blockCardStyle: CSSProperties = {
  backgroundColor: palette.layer,
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  boxShadow: palette.shadowElevated
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
  color: palette.textMuted,
  fontFamily: typography.accentFamily,
  lineHeight: 1.45
};

const blockListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  color: palette.textSoft,
  fontSize: 12,
  lineHeight: 1.45,
  fontFamily: typography.accentFamily
};

const wmsSections: WmsSection[] = [
  {
    id: 'overview',
    title: 'Обзор',
    description: 'Единая панель здоровья склада: KPI, загрузка ресурсов, узкие места.',
    tabs: [
      {
        id: 'kpi',
        title: 'KPI и дашборды',
        summary:
          'Виджеты контроля оборачиваемости, SLA, просрочек и инцидентов. Данные консолидируются из WMS, ERP, CRM.',
        blocks: [
          {
            title: 'Ключевые показатели',
            description: 'Шаблоны для руководителя склада и директора по производству.',
            items: [
              'Оборачиваемость и оборачиваемость по группам ABC/XYZ',
              'Заполненность зон, работа антискладов и буферов',
              'Скорость обработки заказов e-commerce и B2B',
              'Динамика просроченных операций и незавершенных заданий'
            ]
          },
          {
            title: 'Монитор работ',
            description: 'Онлайн-просмотр прогресса приёмки, отгрузки, пополнений и инвентаризации.',
            items: [
              'Live-статусы смен и бригад',
              'Контроль SLA по воротам и ячейкам консолидации',
              'Телеметрия мобильных терминалов и голосового отбора',
              'Алерты по отклонениям и незапланированным простоям'
            ]
          },
          {
            title: 'Событийная лента',
            description: 'Единый поток событий по складу, цехам и поставкам.',
            items: [
              'Push-уведомления и чат-боты для оперативного реагирования',
              'Фильтрация по типу операции, приоритету и инициатору',
              'Быстрые действия: назначить ответственного, открыть карточку заказа'
            ]
          }
        ]
      },
      {
        id: 'analytics',
        title: 'Аналитика',
        summary:
          'Глубокий анализ спроса, логистики и производственных потоков. Подготовка данных для BI и прогнозирования.',
        blocks: [
          {
            title: 'Срезы и витрины',
            description: 'Наборы данных для финансов, логистики, коммерции и производства.',
            items: [
              'Сравнение каналов сбыта и цехов',
              'Факторный анализ себестоимости складских операций',
              'Аналитика возвратов, брака и рекламаций',
              'Варианты экспорта в PowerBI, Superset, Metabase'
            ]
          },
          {
            title: 'Прогнозирование',
            description: 'Поддержка ML-моделей для планирования запасов, персонала и транспорта.',
            items: [
              'Прогноз спроса по SKU, локациям и сменам',
              'Оптимизация запасов на buffer stock и safety stock',
              'Сценарии “что если” для расширения площадей/штата',
              'Планирование бюджета и KPI мотивации персонала'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'master-data',
    title: 'Справочники',
    description: 'Нормативно-справочная информация: склады, номенклатура, единицы измерения, упаковка.',
    tabs: [
      {
        id: 'warehouses',
        title: 'Склады и ячейки',
        summary:
          'Многоскладовость, топология зон, ячеек, буферов, стеллажей. Настройка типов хранения и температурных режимов.',
        blocks: [
          {
            title: 'Структура',
            description: 'Библиотека площадок, цеховых складов, экспедиции, удалённых РЦ.',
            items: [
              'Зональные схемы, уровни и стеллажные адреса',
              'Сопряжение с 3D-моделью и системой пожарной безопасности',
              'Настройка статусов ячеек (подбор, приемка, карантин)',
              'Паспорта зон с указанием оборудования и ограничений'
            ]
          },
          {
            title: 'Топология и slotting',
            description: 'Параметры slotting, ABC/XYZ размещение, карты подсказок.',
            items: [
              'Типы ячеек: паллетные, полочные, гравитационные',
              'Приоритеты доступа для персонала и техники',
              'Лимиты веса и габаритов, температурные диапазоны',
              'Связь с WCS, роботами и линиями сортировки'
            ]
          }
        ]
      },
      {
        id: 'items',
        title: 'Номенклатура и ЕИ',
        summary: 'Нормативы по SKU: карточки товара, единицы измерения, комплекты, серии, сроки годности.',
        blocks: [
          {
            title: 'Карточки товаров',
            description: 'Поддержка связей “сырьё → полуфабрикат → готовая продукция”.',
            items: [
              'Единицы измерения и коэффициенты пересчёта',
              'Партионный учёт, серийные номера, срок годности',
              'Параметры качества и допустимые отклонения',
              'Фото, чертежи, техкарты, инструкции по обращению'
            ]
          },
          {
            title: 'Комплекты и упаковка',
            description: 'Спецификации упаковки, тарные листы, транспортные места.',
            items: [
              'BOM/рецептуры для комплектов и наборов',
              'Справочник упаковок, паллет, возвратной тары',
              'Правила маркировки (Честный ЗНАК, EAC, EAN)',
              'Контроль негативных остатков и резервов на комплектацию'
            ]
          }
        ]
      },
      {
        id: 'equipment',
        title: 'Техника и инфраструктура',
        summary: 'Учёт погрузочной техники, конвейеров, АСУТП, WCS и сменных батарей.',
        blocks: [
          {
            title: 'Регистр оборудования',
            description: 'Карточки погрузчиков, AGV, шаттлов, конвейерных линий.',
            items: [
              'Паспортные данные, графики ТО и ремонтов',
              'Привязка к зонам и участкам склада',
              'Мониторинг ресурса батарей и расходников',
              'Инциденты, блокировки, планирование замен'
            ]
          },
          {
            title: 'Интеграция с WCS',
            description: 'Маршрутизация задач на автоматизированные линии.',
            items: [
              'API-интерфейсы для сортировочных машин',
              'Резервирование слотов и приоритетов',
              'Хранение документации и инструкций',
              'Алгоритмы fallback при отказах техники'
            ]
          }
        ]
      },
      {
        id: 'personnel',
        title: 'Персонал и роли',
        summary: 'Штат, компетенции, карточки сотрудников, аттестации, доступы в WMS и смежные системы.',
        blocks: [
          {
            title: 'Матрица компетенций',
            description: 'Права доступа и допуски к операциям и оборудованию.',
            items: [
              'Профили сотрудников и бригад',
              'Планировщик смен с учётом квалификаций',
              'Журнал инструктажей и медосмотров',
              'KPI и мотивационные схемы по ролям'
            ]
          },
          {
            title: 'Безопасность',
            description: 'Контроль СИЗ, допусков, обучений и ограничений.',
            items: [
              'Ведение протоколов техники безопасности',
              'Интеграция с системами контроля доступа',
              'Мониторинг нарушений и расследования',
              'Связь с кадровым и охранным контурами'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'operations',
    title: 'Операции склада',
    description: 'Полный цикл: приёмка, размещение, пополнение, отбор, отгрузка, возвраты, cross-docking.',
    tabs: [
      {
        id: 'inbound',
        title: 'Приёмка',
        summary: 'ASN, план-график машин, тонировка в ожидании, кросс-док, контроль качества при входе.',
        blocks: [
          {
            title: 'Планирование ворот',
            description: 'Тайм-слоты, приоритеты перевозчиков, интерфейс с транспортными системами.',
            items: [
              'Автогенерация расписаний по заявкам поставщиков',
              'Контроль очередей на площадке и внутри склада',
              'Привязка задач бригад к воротам и зонам',
              'Электронные накладные, доверенности, фотофиксация'
            ]
          },
          {
            title: 'Размещение',
            description: 'Автонавигация по правилам FEFO/ FIFO/LEFO, контроль температуры и карантина.',
            items: [
              'RF/Voice задания, подсказки по маршрутам',
              'Поддержка паллетных этикеток SSCC, QR, RFID',
              'Статусы “проверка”, “карантин”, “ожидание анализа”',
              'Автопредложение альтернативных ячеек при нехватке места'
            ]
          },
          {
            title: 'Несоответствия',
            description: 'Разбор пересортов, брака, недостач и излишков.',
            items: [
              'Карточка рекламации с фото/видео',
              'Маршрутизация претензий поставщику/производству',
              'Протокол отбора образцов для лаборатории',
              'Регистрация утилизации или возврата'
            ]
          }
        ]
      },
      {
        id: 'outbound',
        title: 'Отбор и отгрузка',
        summary: 'Волновой, кластерный, batch- и piece-пикинг, проверка, упаковка, экспедиция.',
        blocks: [
          {
            title: 'Подбор',
            description: 'Pick-to-light, put-to-wall, мультиканальные отборы.',
            items: [
              'Задачи по приоритетам клиентов/каналов',
              'Контроль сборки комплектов и наборов',
              'Оптимизация маршрутов внутри склада',
              'Авторазбиение заказов на волны, multi-pick'
            ]
          },
          {
            title: 'Контроль и упаковка',
            description: 'Весовой контроль, сканирование, фотоподтверждение, печать документов.',
            items: [
              'Интеграция с весами, сканерами, автоматами упаковки',
              'Печать УПД, ТТН, пломбировочных листов',
              'Контроль возвратной тары и сериализации',
              'Электронная подпись водителя и экспедитора'
            ]
          },
          {
            title: 'Экспедиция',
            description: 'Консолидация, очереди машин, рейсовые перечни, контроль пломб.',
            items: [
              'Панель загрузки автомобилей и контейнеров',
              'Проверка пломб и фото фиксация загрузки',
              'Интерфейс с ТМС и внешними перевозчиками',
              'Контроль маршрутов и оповещение клиентов'
            ]
          }
        ]
      },
      {
        id: 'internal',
        title: 'Внутренние движения',
        summary: 'Пополнения, переразмещения, инвентаризация, возвраты в производство и списания.',
        blocks: [
          {
            title: 'Пополнение и slotting',
            description: 'Автопополнение подборочных ячеек, перекладка, транзитные буферы.',
            items: [
              'Триггеры min/max, динамическое пополнение',
              'Учет доступности экипировки и техники',
              'Трекинг статусов “в пути”, “ожидает размещения”',
              'Инструкции для работы с опасными грузами'
            ]
          },
          {
            title: 'Возвраты и reverse',
            description: 'Обработка клиентских возвратов, списание брака, переработка.',
            items: [
              'Классификация возвратов (good/bad stock)',
              'Решения: повторная реализация, ремонт, утилизация',
              'Документы на списание, перемещение, переработку',
              'Сценарии reverse logistics и cross-док возвратов'
            ]
          },
          {
            title: 'Инвентаризация',
            description: 'Циклические пересчёты, внезапные проверки, сплошные кампании.',
            items: [
              'Планирование по классу ABC, зонам, ответственным',
              'Мобильные задания, QR/штрих-коды, голосовой подсчет',
              'Автосоздание корректировок и согласование через BPM',
              'Журнал расхождений с анализом причин'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'planning',
    title: 'Планирование и слоттинг',
    description: 'Резервы, прогнозы, управление сменами и мощностями, синхронизация с производством и закупками.',
    tabs: [
      {
        id: 'inventory-planning',
        title: 'Запасы и резервы',
        summary: 'Стратегии запасов, страховые уровни, резервирование под заказы и производственные задания.',
        blocks: [
          {
            title: 'Параметрика запасов',
            description: 'Правила FEFO/LEFO, сезонность, минимальные партии.',
            items: [
              'Автогенерация заявок поставщикам и производству',
              'Учет статусов блокировки (карантин, ожидание анализа)',
              'Настройка резервов по клиентам/каналам',
              'Интеграция с MRP и планом продаж/производства'
            ]
          },
          {
            title: 'Резервирование',
            description: 'Быстрый контроль резервов, причины, сроки, авторы.',
            items: [
              'Механизмы частичного/полного снятия резервов',
              'Приоритеты между каналами и филиалами',
              'Лог расхождений и конфликтов резервов',
              'Автоподтверждение по правилам SLA'
            ]
          }
        ]
      },
      {
        id: 'labor',
        title: 'Персонал и смены',
        summary: 'Планирование смен, LMP (labor management), управление KPI и бонусами.',
        blocks: [
          {
            title: 'План смен',
            description: 'Автоподбор персонала под волны, оповещения, замещения.',
            items: [
              'Расчет трудоемкости по заданиям',
              'Учет компетенций и разрешений',
              'Подключение подрядчиков и аутсорса',
              'Сопоставление план/факт по нормам времени'
            ]
          },
          {
            title: 'Управление производительностью',
            description: 'Монитор KPI сотрудников, бонусные схемы, рейтинг.',
            items: [
              'Нормирование операций по типам задач',
              'Подсчет премий и штрафов',
              'Интерфейс для team-лидов и HR',
              'Интеграция с зарплатными системами'
            ]
          }
        ]
      },
      {
        id: 'slotting',
        title: 'Слоттинг и layout',
        summary: 'Оптимизация размещения, моделирование layout, симуляция потоков материалов.',
        blocks: [
          {
            title: 'Анализ ABC/XYZ',
            description: 'Автопредложения по переупорядочиванию ячеек.',
            items: [
              'Имитационное моделирование потоков',
              'Предложения по переносу sku между зонами',
              'Учет ограничений высоты, веса, ABC-стратегии',
              'Отчет по экономии шагов и оптимизации маршрутов'
            ]
          },
          {
            title: 'Layout и проекты',
            description: 'Архив игр в layout, проекты расширения, капекс.',
            items: [
              'Версионность планировок склада',
              'Расчет стоимости модификаций',
              'Учет внедрения нового оборудования',
              'Интеграция с BIM/AutoCAD и подрядчиками'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'production',
    title: 'Производство',
    description: 'Интеграция с MES, управление буферами, учет WIP и материалов на маршруте.',
    tabs: [
      {
        id: 'issue-return',
        title: 'Выдача и возврат',
        summary: 'Планирование лимитно-заборных карт, выдача сырья в цех, возврат остатков и брака.',
        blocks: [
          {
            title: 'Выдача в производство',
            description: 'Связь с маршрутными листами, нарядами, Kanban-картами.',
            items: [
              'Резервирование сырья под сменные задания',
              'Контроль сроков и температур при выдаче',
              'Автоматическая фиксация фактического потребления',
              'Поддержка обратных связей от MES/SCADA'
            ]
          },
          {
            title: 'Возвраты и переработка',
            description: 'Учет возвратов, пересортицы, рекламаций из цехов.',
            items: [
              'Регистр отклонений и анализа причин',
              'Распределение возврата по категориям (good/bad)',
              'Протоколы утилизации, переработки, ремонта',
              'Интеграция с управлением качеством'
            ]
          }
        ]
      },
      {
        id: 'wip',
        title: 'Буфер WIP',
        summary: 'Контроль межоперационных запасов, балансировка буферов, синхронизация с линиями.',
        blocks: [
          {
            title: 'Баланс буферов',
            description: 'Графики загрузки, контроль минимальных и максимальных уровней.',
            items: [
              'Отслеживание полуфабрикатов по партиям',
              'Обмен статусами с линиями розлива/сборки',
              'Сигналы Kanban и replenishment-алгоритмы',
              'Отчет по задержкам и узким местам'
            ]
          },
          {
            title: 'Поддержка конвейеров',
            description: 'Синхронизация с WCS, роботами, линиями подачи.',
            items: [
              'Слоты питания линий и расписание обслуживания',
              'Приоритеты операций “горячих” заказов',
              'Интеграция с системой управления энергией',
              'Контроль блокировок и остановок конвейеров'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'procurement',
    title: 'Закупки и поставщики',
    description: 'Карточки поставщиков, договоры, SLA, логистика доставки и складские услуги.',
    tabs: [
      {
        id: 'suppliers',
        title: 'Карточки поставщиков',
        summary: 'Единый справочник поставщиков с рейтингами, зонами ответственности, SLA.',
        blocks: [
          {
            title: 'Профили',
            description: 'Реквизиты, контактные лица, матрица категорий, зоны обслуживания.',
            items: [
              'Категории надежности и KPI',
              'Архив аудитов и инспекций',
              'Документы, сертификаты, лицензии',
              'История коммуникаций и договоров'
            ]
          },
          {
            title: 'План поставок',
            description: 'Графики поставок, EDI-интерфейсы, управление мощностями.',
            items: [
              'ASN, уведомления, подтверждения',
              'Планирование загрузки ворот и маршрутов',
              'Контроль отклонений и штрафных санкций',
              'Взаимодействие через портал поставщика'
            ]
          }
        ]
      },
      {
        id: 'contracts',
        title: 'Договоры и финансы',
        summary: 'Условия поставок, цены, валюты, кредитные линии, взаиморасчеты.',
        blocks: [
          {
            title: 'Коммерческие условия',
            description: 'Каталоги цен, скидки, бонусы, cross-docking услуги.',
            items: [
              'Лимиты поставок и графики отгрузок',
              'Поддержка мультивалюты и индексаций',
              'Калькулятор стоимости логистических услуг',
              'Условия оплаты и кредитные линии'
            ]
          },
          {
            title: 'Расчеты',
            description: 'Финансовые сверки, удержания, автоматическое формирование платежей.',
            items: [
              'Интеграция с бухгалтерией и банками',
              'Платежный календарь и контроль задолженности',
              'Сверка актов и закрывающих документов',
              'Аналитика эффективности контрагентов'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'quality',
    title: 'Качество и безопасность',
    description: 'Контроль качества, сертификация, маркировка, прослеживаемость, промышленная безопасность.',
    tabs: [
      {
        id: 'qa',
        title: 'Контроль качества',
        summary: 'Инспекции, лабораторные анализы, протоколы, корректирующие действия.',
        blocks: [
          {
            title: 'Карты контроля',
            description: 'Регламенты и чек-листы по видам продукции.',
            items: [
              'Планирование выборочных инспекций',
              'Регистрация результатов и отклонений',
              'Запуск CAPA и управление корректирующими действиями',
              'Интеграция с LIMS и лабораторией'
            ]
          },
          {
            title: 'Сертификация и маркировка',
            description: 'Сроки и статусы сертификатов, поддержка Честного ЗНАКа и других систем.',
            items: [
              'Генерация, агрегация и печать кодов маркировки',
              'Прослеживаемость партий от поставщика до клиента',
              'Отчётность в государственные системы',
              'Контроль ограничений по странам и регионам'
            ]
          }
        ]
      },
      {
        id: 'hse',
        title: 'Промбезопасность',
        summary: 'Управление охраной труда, промышленной и пожарной безопасностью на складе.',
        blocks: [
          {
            title: 'Инциденты и риски',
            description: 'Регистр инцидентов, расследования, предписания.',
            items: [
              'Журнал инструктажей и допусков',
              'Контроль использования СИЗ',
              'Графики проверок и аудитов',
              'Интеграция с системами видеонаблюдения и СКУД'
            ]
          },
          {
            title: 'Планы эвакуации и ПБ',
            description: 'Документы по пожарной безопасности, оповещения, тренировки.',
            items: [
              'Хранение планов, инструкций, маршрутов',
              'Планирование тренировок и контроль присутствия',
              'Интеграция с системами сигнализации',
              'Отчеты по выполнению мероприятий'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'logistics',
    title: 'Логистика и транспорт',
    description: 'Взаимодействие с ТМС, курьерами, 3PL, управление доставками и последней милей.',
    tabs: [
      {
        id: 'shipping',
        title: 'Экспедиция и отгрузки',
        summary: 'План рейсов, контроль пломб, документы, слоты ворот.',
        blocks: [
          {
            title: 'Управление рейсами',
            description: 'Планирование маршрутов, очередей и расписаний.',
            items: [
              'Бронь ворот и контроль прибытия транспорта',
              'Формирование рейсов и листов комплектовки',
              'Мониторинг пломб, состояний, термо-режима',
              'Сбор обратной тары и документов'
            ]
          },
          {
            title: 'Last mile',
            description: 'Управление курьерской доставкой, ПВЗ, самовывозом.',
            items: [
              'Интеграция с курьерскими службами и агрегаторами',
              'Трекинг статусов и SLA по точкам',
              'SMS/e-mail уведомления клиентов',
              'Аналитика отказов и повторных доставок'
            ]
          }
        ]
      },
      {
        id: '3pl',
        title: '3PL и аутсорс',
        summary: 'Контур взаимодействия с внешними операторами и складами.',
        blocks: [
          {
            title: 'Внешние склады',
            description: 'Синхронизация запасов, статусов, документов.',
            items: [
              'EDI, API, портал для 3PL',
              'Сверка остатков и транзакций',
              'Контроль SLA и KPI подрядчиков',
              'Биллинг услуг хранения и обработки'
            ]
          },
          {
            title: 'Транспортные партнеры',
            description: 'Взаимодействие с перевозчиками, фрахт, тарифы.',
            items: [
              'Калькулятор тарифов и допуслуг',
              'Контроль страховых полисов и документов',
              'Журнал инцидентов и претензий',
              'Отчеты по эффективности маршрутов'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'finance',
    title: 'Финансы и себестоимость',
    description: 'Учет затрат, мотивации, тарификации, калькуляция складских услуг и ТМЦ.',
    tabs: [
      {
        id: 'costing',
        title: 'Себестоимость операций',
        summary: 'Расчет затрат на хранение, обработку, транспортировку, услуги 3PL.',
        blocks: [
          {
            title: 'Тарифные модели',
            description: 'Фиксированная, динамическая, смешанная тарификация.',
            items: [
              'Расчет ставок по операциям и зонам',
              'Учёт затрат на энергию, аренду, персонал',
              'Калькулятор сервисов для внешних клиентов',
              'Сравнение план/факт по затратам'
            ]
          },
          {
            title: 'Аналитика рентабельности',
            description: 'Показатели SKU, клиентов, каналов сбыта.',
            items: [
              'Margin по SKU и сегментам',
              'ABC/XYZ с учетом маржинальности',
              'Отчеты для финдиректора и контроллинга',
              'Интеграция с ERP и бюджетированием'
            ]
          }
        ]
      },
      {
        id: 'motivation',
        title: 'KPI и мотивация',
        summary: 'Расчет бонусов, штрафов, показателей эффективности персонала и подрядчиков.',
        blocks: [
          {
            title: 'KPI сотрудников',
            description: 'Поддержка KPI по времени, качеству, безопасности.',
            items: [
              'Разделение KPI по ролям и зонам',
              'Автоматическое начисление бонусов',
              'Системы рейтингов и геймификации',
              'Экспорт в HR и зарплатные системы'
            ]
          },
          {
            title: 'Подрядчики и 3PL',
            description: 'Контроль KPI внешних исполнителей и курьеров.',
            items: [
              'Учет SLA по контрактам',
              'Штрафы и бонусы за качество сервиса',
              'Отчеты для юридической и финансовой служб',
              'Интеграция с порталом подрядчиков'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'control',
    title: 'Контроль и настройки',
    description: 'Инвентаризация, отчётность, интеграции, автоматизация, управление правами.',
    tabs: [
      {
        id: 'inventory-audit',
        title: 'Инвентаризация',
        summary: 'Комплекс сценариев: годовая, выборочная, сплошная, непрерывная (cycle count).',
        blocks: [
          {
            title: 'Сценарии',
            description: 'Планирование кампаний, автоматизация подсчётов и согласований.',
            items: [
              'Шаблоны инвентаризаций по зонам и классам',
              'RF/Voice задания, фиксирование фото',
              'Автосоздание корректировок с маршрутами согласования',
              'Отчёты по расхождениям и анализ причин'
            ]
          },
          {
            title: 'Документы и акты',
            description: 'Формирование документов, экспорт в ERP и учетные системы.',
            items: [
              'Генерация МХ-3, ТОРГ-2, внутренних актов',
              'Интеграция с бухгалтерией и налоговым учетом',
              'История согласований и версия документа',
              'Контроль исполнения корректирующих действий'
            ]
          }
        ]
      },
      {
        id: 'reports',
        title: 'Отчётность и BI',
        summary: 'Стандартные отчеты, конструктор витрин, API для аналитиков.',
        blocks: [
          {
            title: 'Стандартные отчеты',
            description: 'Готовые шаблоны и регламентированные формы.',
            items: [
              'Оборотно-сальдовая ведомость',
              'Отчеты по качеству, возвратам, рекламациям',
              'Формы для логистики и коммерции',
              'Пакет управленческой отчётности для менеджмента'
            ]
          },
          {
            title: 'Конструктор',
            description: 'Гибкий куб данных, фильтры, выгрузки, API.',
            items: [
              'Designer отчетов для power users',
              'Планировщик рассылок и дашбордов',
              'REST/GraphQL API для внешних систем',
              'Аудит доступа к данным и маскирование'
            ]
          }
        ]
      },
      {
        id: 'settings',
        title: 'Параметры и интеграции',
        summary: 'Управление конфигурацией, правами доступа, автоматизацией и интеграциями.',
        blocks: [
          {
            title: 'Параметры WMS',
            description: 'Стратегии отбора, размещения, упаковки, расписания задач.',
            items: [
              'Глобальные настройки SLA и таймаутов',
              'Конструктор бизнес-процессов и уведомлений',
              'Управление версиями настроек и тестовыми стендами',
              'Инструменты A/B тестирования процессов'
            ]
          },
          {
            title: 'Интеграции и автоматизация',
            description: 'Настройка API, вебхуков, роботов, IoT-датчиков.',
            items: [
              'Список подключенных систем (ERP, CRM, TMS, MES, LIMS)',
              'Монитор вебхуков и очередей сообщений',
              'Настройка RPA-сценариев и скриптов',
              'Журналы ошибок и система оповещений DevOps'
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
                  background: isActive ? gradients.glassHighlight : 'transparent',
                  color: isActive ? palette.textPrimary : palette.textSoft,
                  boxShadow: isActive ? palette.shadowElevated : 'none',
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
                    backgroundColor: isActive ? palette.accentSoft : tabButtonBase.backgroundColor,
                    border: isActive ? `1px solid ${palette.accentMuted}` : tabButtonBase.border,
                    color: isActive ? palette.textPrimary : tabButtonBase.color,
                    boxShadow: isActive ? palette.shadowElevated : 'none',
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
