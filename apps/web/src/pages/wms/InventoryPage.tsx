import { useMemo, useState, type CSSProperties } from 'react';

import { PageLoader } from '@shared/ui/PageLoader';
import { palette, typography } from '@shared/ui/theme';

import {
  InventoryProgressView,
  InventoryTaskView,
  JournalItemView,
  JournalSummaryView,
  OperationStatView,
  OverviewAlert,
  OverviewFlow,
  OverviewShift,
  OverviewTaskGroup,
  ScanShortcutView,
  StockRowView,
  SummaryCard,
  SupplierCardView,
  SupplierContractView,
  SupplierInvoiceView,
  useInventoryDashboardData
} from './useInventoryDashboardData';

export type SectionId =
  | 'overview'
  | 'operations'
  | 'stock'
  | 'suppliers'
  | 'inventory'
  | 'journal'
  | 'settings';

type OperationFormField = {
  label: string;
  placeholder: string;
};

type OperationFormDefinition = {
  id: string;
  title: string;
  fields: OperationFormField[];
  primaryAction: string;
  secondaryAction: string;
};

type OperationGuideDefinition = {
  id: string;
  title: string;
  steps: string[];
};

type OverviewSectionProps = {
  summaryCards: SummaryCard[];
  quickActions: string[];
  shift: OverviewShift;
  flows: OverviewFlow[];
  alerts: OverviewAlert[];
  taskGroups: OverviewTaskGroup[];
};

type OperationsSectionProps = {
  forms: OperationFormDefinition[];
  stats: OperationStatView[];
  guides: OperationGuideDefinition[];
};

type StockSectionProps = {
  rows: StockRowView[];
  highlights: OverviewAlert[];
};

type SuppliersSectionProps = {
  cards: SupplierCardView[];
  invoices: SupplierInvoiceView[];
  contracts: SupplierContractView[];
};

type InventorySectionProps = {
  tasks: InventoryTaskView[];
  progress: InventoryProgressView[];
  shortcuts: ScanShortcutView[];
};

type JournalSectionProps = {
  summary: JournalSummaryView[];
  items: JournalItemView[];
};

type SettingsGroup = {
  title: string;
  description: string;
  actions: string[];
};

type SettingsSectionProps = {
  groups: SettingsGroup[];
};

const quickActions = [
  'Сканировать штрихкод',
  'Открыть монитор потоков',
  'Назначить смену',
  'Создать операцию',
  'Загрузить документы'
];

const operationGuides: OperationGuideDefinition[] = [
  {
    id: 'guide-inbound',
    title: 'Чек-лист приемки',
    steps: [
      'Сверить документы и план прибытия',
      'Сканировать палеты и ячейки буфера',
      'Зафиксировать фото при несоответствиях'
    ]
  },
  {
    id: 'guide-outbound',
    title: 'Чек-лист отгрузки',
    steps: [
      'Проверить сборку по списку SKU',
      'Получить подпись контролера качества',
      'Закрыть заказ и отправить уведомление клиенту'
    ]
  },
  {
    id: 'guide-move',
    title: 'Стандарт перемещения',
    steps: [
      'Подтвердить свободную ячейку назначения',
      'Проверить габариты и допустимый вес',
      'Сканировать по факту размещения'
    ]
  }
];

const settingsGroups: SettingsGroup[] = [
  {
    title: 'Склады и зоны',
    description: 'Карточки складов, структура зон и поддержка адресной топологии.',
    actions: ['Справочник складов', 'Редактор зон и ячеек', 'Топология маршрутов погрузки']
  },
  {
    title: 'Мастер-данные',
    description: 'Номенклатура, единицы хранения, параметры партий и серий.',
    actions: ['Справочник товаров', 'Группы единиц хранения', 'Профили партий']
  },
  {
    title: 'Интеграции и доступ',
    description: 'Синхронизация с ERP и CRM, роли пользователей и аудит действий.',
    actions: ['Настройки интеграций', 'Роли и сотрудники', 'Журнал аудита']
  },
  {
    title: 'Шаблоны процессов',
    description: 'Маршруты перемещений, SLA операций, чек-листы приемки и отгрузки.',
    actions: ['Шаблоны приемки', 'Шаблоны отгрузки', 'Маршруты перемещений']
  }
];

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  width: '100%'
};

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 26,
  fontWeight: 600,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: palette.textMuted,
  fontFamily: typography.accentFamily,
  lineHeight: 1.5
};

const navStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12
};

const navButtonBase: CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  padding: '10px 18px',
  fontSize: 13,
  fontWeight: 500,
  color: palette.textSecondary,
  cursor: 'pointer',
  fontFamily: typography.accentFamily,
  transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease'
};

const activeNavButton: CSSProperties = {
  ...navButtonBase,
  background: palette.primary,
  border: `1px solid ${palette.primary}`,
  color: '#fff',
  boxShadow: palette.shadowElevated
};

const sectionCardStyle: CSSProperties = {
  borderRadius: 20,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  boxShadow: palette.shadowElevated,
  padding: '20px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 18
};

const summaryGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12
};

const summaryCardStyle: CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const summaryLabelStyle: CSSProperties = {
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: palette.textSoft,
  fontFamily: typography.accentFamily
};

const summaryValueStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 600,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const summaryHintStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textMuted,
  fontFamily: typography.accentFamily
};

const searchBarStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  alignItems: 'center'
};

const searchInputStyle: CSSProperties = {
  flex: '1 1 260px',
  minWidth: 200,
  borderRadius: 14,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  padding: '10px 14px',
  fontSize: 14,
  fontFamily: typography.accentFamily,
  color: palette.textPrimary
};

const actionsRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10
};

const actionButtonStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  color: palette.textSecondary,
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: typography.accentFamily,
  transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease'
};

const infoGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12
};

const infoCardStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8
};

const infoHeaderStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily,
  margin: 0
};

const infoValueStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const infoMutedStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textMuted,
  fontFamily: typography.accentFamily,
  margin: 0
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  margin: 0,
  paddingLeft: 16,
  fontSize: 12,
  color: palette.textSecondary,
  fontFamily: typography.accentFamily
};

const listItemStrongStyle: CSSProperties = {
  fontWeight: 600,
  color: palette.textPrimary
};

const taskGroupGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12
};

const taskGroupCardStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8
};

const taskGroupTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const statusBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  borderRadius: 999,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  fontSize: 11,
  color: palette.textSecondary,
  fontFamily: typography.accentFamily,
  textTransform: 'uppercase',
  letterSpacing: '0.06em'
};

const operationsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16
};

const formStyle: CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14
};

const formTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const formFieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: palette.textSecondary,
  fontFamily: typography.accentFamily
};

const inputStyle: CSSProperties = {
  borderRadius: 12,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  padding: '10px 12px',
  fontSize: 14,
  color: palette.textPrimary,
  fontFamily: typography.accentFamily
};

const submitRowStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
};

const primaryButtonStyle: CSSProperties = {
  borderRadius: 14,
  border: 'none',
  background: palette.primary,
  color: '#fff',
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: typography.accentFamily,
  boxShadow: palette.shadowElevated
};

const secondaryButtonStyle: CSSProperties = {
  borderRadius: 14,
  border: `1px solid ${palette.border}`,
  background: 'transparent',
  color: palette.textSecondary,
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: typography.accentFamily
};

const operationStatsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12
};

const operationStatCardStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const operationStatValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const operationStatHintStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textMuted,
  fontFamily: typography.accentFamily
};

const guideWrapperStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10
};

const guideTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 600,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const guideListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  margin: 0,
  paddingLeft: 18,
  fontSize: 12,
  color: palette.textSecondary,
  fontFamily: typography.accentFamily
};

const tableWrapperStyle: CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  overflow: 'hidden',
  background: palette.surface,
  boxShadow: palette.shadowElevated
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: typography.accentFamily,
  fontSize: 13,
  color: palette.textSecondary
};

const tableHeadCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  background: palette.layer,
  color: palette.textSoft,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontSize: 11
};

const tableCellStyle: CSSProperties = {
  padding: '12px 16px',
  borderTop: `1px solid ${palette.glassBorder}`
};

const suppliersGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16
};

const supplierCardStyle: CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8
};

const supplierTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const supplierTablesWrapperStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16
};

const tasksListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12
};

const taskCardStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const taskTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 600,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const taskMetaStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: palette.textMuted,
  fontFamily: typography.accentFamily,
  lineHeight: 1.45
};

const progressGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12
};

const progressCardStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const shortcutListStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 10
};

const shortcutItemStyle: CSSProperties = {
  borderRadius: 14,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4
};

const shortcutKeyStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: palette.textPrimary,
  fontFamily: typography.accentFamily,
  textTransform: 'uppercase'
};

const journalSummaryRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 10,
  marginBottom: 12
};

const journalListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10
};

const journalItemStyle: CSSProperties = {
  borderRadius: 14,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4
};

const settingsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16
};

const settingsCardStyle = sectionCardStyle;

const settingsDescriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: palette.textMuted,
  fontFamily: typography.accentFamily,
  lineHeight: 1.45
};

const settingsLinksStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8
};

const settingsActionStyle: CSSProperties = {
  ...actionButtonStyle,
  width: '100%',
  justifyContent: 'flex-start'
};

const buildOperationForms = (warehouseName?: string, warehouseCode?: string): OperationFormDefinition[] => [
  {
    id: 'inbound',
    title: 'Приход',
    fields: [
      { label: 'Поставщик или источник', placeholder: `Укажите контрагента${warehouseName ? ` для ${warehouseName}` : ''}` },
      { label: 'Документ или ТТН', placeholder: 'Например, ТТН 000347 от 13.01' },
      { label: 'Зона разгрузки', placeholder: warehouseCode ? `Ворота или буфер для ${warehouseCode}` : 'Ворота 3 или буфер B1' }
    ],
    primaryAction: 'Создать приход',
    secondaryAction: 'Сохранить черновик'
  },
  {
    id: 'outbound',
    title: 'Расход',
    fields: [
      { label: 'Получатель или заказ', placeholder: 'Клиент / номер заказа' },
      { label: 'Документ отгрузки', placeholder: 'Добавьте ссылку на УПД или вложите PDF' },
      { label: 'Ответственный', placeholder: 'Назначьте сотрудника или бригаду' }
    ],
    primaryAction: 'Создать расход',
    secondaryAction: 'Печать этикеток'
  },
  {
    id: 'movement',
    title: 'Перемещение',
    fields: [
      { label: 'Откуда (ячейка / зона)', placeholder: 'C-14-02 или стеллаж D02' },
      { label: 'Куда (ячейка / зона)', placeholder: 'D-03-10 или буфер отгрузки' },
      { label: 'Количество или упаковка', placeholder: 'Введите единицы, например 12 шт' }
    ],
    primaryAction: 'Запустить перемещение',
    secondaryAction: 'Добавить сканирование'
  },
  {
    id: 'writeoff',
    title: 'Списание',
    fields: [
      { label: 'Основание', placeholder: 'Бой, утилизация, пересортица' },
      { label: 'Номенклатура', placeholder: 'Выберите товар или SKU' },
      { label: 'Количество', placeholder: 'Введите количество или вес' }
    ],
    primaryAction: 'Подтвердить списание',
    secondaryAction: 'Сохранить как задачу'
  }
];

const OverviewSection = ({ summaryCards, quickActions: actions, shift, flows, alerts, taskGroups }: OverviewSectionProps) => (
  <div style={sectionCardStyle}>
    <div style={summaryGridStyle}>
      {summaryCards.map((card) => (
        <div key={card.label} style={summaryCardStyle}>
          <span style={summaryLabelStyle}>{card.label}</span>
          <span style={summaryValueStyle}>{card.value}</span>
          {card.hint ? <span style={summaryHintStyle}>{card.hint}</span> : null}
        </div>
      ))}
    </div>

    <div style={searchBarStyle}>
      <input type='search' placeholder='Поиск товаров, ячеек, документов...' style={searchInputStyle} />
      <div style={actionsRowStyle}>
        {actions.map((action) => (
          <button key={action} type='button' style={actionButtonStyle}>
            {action}
          </button>
        ))}
      </div>
    </div>

    <div style={infoGridStyle}>
      <div style={infoCardStyle}>
        <h3 style={infoHeaderStyle}>Текущая смена</h3>
        <span style={infoValueStyle}>{shift.shift}</span>
        <p style={infoMutedStyle}>{shift.timeframe}</p>
        <p style={infoMutedStyle}>
          <span style={listItemStrongStyle}>Бригадир:</span> {shift.lead}
        </p>
        <p style={infoMutedStyle}>{shift.workforce}</p>
        <p style={infoMutedStyle}>{shift.note}</p>
      </div>

      <div style={infoCardStyle}>
        <h3 style={infoHeaderStyle}>Потоки</h3>
        <ul style={listStyle}>
          {flows.map((flow) => (
            <li key={flow.id}>
              <span style={listItemStrongStyle}>{flow.title}</span>: {flow.value} ({flow.detail})
              <div style={{ marginTop: 4 }}>
                <span style={statusBadgeStyle}>{flow.trend}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div style={infoCardStyle}>
        <h3 style={infoHeaderStyle}>Контроль</h3>
        {alerts.map((alert) => (
          <div key={alert.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={statusBadgeStyle}>{alert.label}</span>
            <p style={infoMutedStyle}>
              <span style={listItemStrongStyle}>{alert.value}</span> - {alert.description}
            </p>
          </div>
        ))}
      </div>
    </div>

    <div style={taskGroupGridStyle}>
      {taskGroups.map((group) => (
        <div key={group.id} style={taskGroupCardStyle}>
          <h4 style={taskGroupTitleStyle}>{group.title}</h4>
          <ul style={listStyle}>
            {group.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

const OperationsSection = ({ forms, stats, guides }: OperationsSectionProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={operationsGridStyle}>
      {forms.map((form) => (
        <form key={form.id} style={formStyle}>
          <h2 style={formTitleStyle}>{form.title}</h2>
          {form.fields.map((field) => (
            <label key={field.label} style={formFieldStyle}>
              <span style={labelStyle}>{field.label}</span>
              <input type='text' placeholder={field.placeholder} style={inputStyle} />
            </label>
          ))}
          <div style={submitRowStyle}>
            <button type='button' style={primaryButtonStyle}>
              {form.primaryAction}
            </button>
            <button type='button' style={secondaryButtonStyle}>
              {form.secondaryAction}
            </button>
          </div>
        </form>
      ))}
    </div>

    <div style={operationStatsGridStyle}>
      {stats.map((stat) => (
        <div key={stat.id} style={operationStatCardStyle}>
          <span style={infoHeaderStyle}>{stat.title}</span>
          <span style={operationStatValueStyle}>{stat.value}</span>
          <span style={operationStatHintStyle}>{stat.note}</span>
        </div>
      ))}
    </div>

    <div style={taskGroupGridStyle}>
      {guides.map((guide) => (
        <div key={guide.id} style={guideWrapperStyle}>
          <h4 style={guideTitleStyle}>{guide.title}</h4>
          <ol style={guideListStyle}>
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  </div>
);

const StockSection = ({ rows, highlights }: StockSectionProps) => (
  <div style={sectionCardStyle}>
    <div style={tableWrapperStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={tableHeadCellStyle}>SKU</th>
            <th style={tableHeadCellStyle}>Склад</th>
            <th style={tableHeadCellStyle}>Количество</th>
            <th style={tableHeadCellStyle}>Ед.</th>
            <th style={tableHeadCellStyle}>Обновлено</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={tableCellStyle}>{row.sku}</td>
              <td style={tableCellStyle}>{row.warehouse}</td>
              <td style={tableCellStyle}>{row.quantity}</td>
              <td style={tableCellStyle}>{row.unit}</td>
              <td style={tableCellStyle}>{row.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h4 style={taskGroupTitleStyle}>Фокусы по остаткам</h4>
      <div style={infoGridStyle}>
        {highlights.map((highlight) => (
          <div key={highlight.id} style={infoCardStyle}>
            <span style={statusBadgeStyle}>{highlight.label}</span>
            <span style={infoValueStyle}>{highlight.value}</span>
            <p style={infoMutedStyle}>{highlight.description}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SuppliersSection = ({ cards, invoices, contracts }: SuppliersSectionProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={suppliersGridStyle}>
      {cards.map((card) => (
        <div key={card.name} style={supplierCardStyle}>
          <h3 style={supplierTitleStyle}>{card.name}</h3>
          <span style={summaryHintStyle}>{card.invoice}</span>
          <span style={summaryHintStyle}>{card.contract}</span>
          <span style={summaryHintStyle}>{card.contact}</span>
        </div>
      ))}
    </div>

    <div style={supplierTablesWrapperStyle}>
      <div style={guideWrapperStyle}>
        <h4 style={guideTitleStyle}>Счета</h4>
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeadCellStyle}>Поставщик</th>
                <th style={tableHeadCellStyle}>Документ</th>
                <th style={tableHeadCellStyle}>Сумма</th>
                <th style={tableHeadCellStyle}>Срок</th>
                <th style={tableHeadCellStyle}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={tableCellStyle}>{invoice.supplier}</td>
                  <td style={tableCellStyle}>{invoice.document}</td>
                  <td style={tableCellStyle}>{invoice.amount}</td>
                  <td style={tableCellStyle}>{invoice.due}</td>
                  <td style={tableCellStyle}>
                    <span style={statusBadgeStyle}>{invoice.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={guideWrapperStyle}>
        <h4 style={guideTitleStyle}>Договоры</h4>
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeadCellStyle}>Договор</th>
                <th style={tableHeadCellStyle}>Действует до</th>
                <th style={tableHeadCellStyle}>Контакт</th>
                <th style={tableHeadCellStyle}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id}>
                  <td style={tableCellStyle}>{contract.name}</td>
                  <td style={tableCellStyle}>{contract.validUntil}</td>
                  <td style={tableCellStyle}>{contract.contact}</td>
                  <td style={tableCellStyle}>
                    <span style={statusBadgeStyle}>{contract.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

const InventorySection = ({ tasks, progress, shortcuts }: InventorySectionProps) => (
  <div style={sectionCardStyle}>
    <div style={tasksListStyle}>
      {tasks.map((task) => (
        <div key={task.id} style={taskCardStyle}>
          <p style={taskTitleStyle}>{task.title}</p>
          <p style={taskMetaStyle}>{task.meta}</p>
        </div>
      ))}
    </div>

    <div style={progressGridStyle}>
      {progress.map((item) => (
        <div key={item.id} style={progressCardStyle}>
          <span style={infoHeaderStyle}>{item.title}</span>
          <span style={infoValueStyle}>{item.progress}</span>
          <span style={statusBadgeStyle}>{item.status}</span>
          <p style={infoMutedStyle}>{item.detail}</p>
        </div>
      ))}
    </div>

    <div style={shortcutListStyle}>
      {shortcuts.map((shortcut) => (
        <div key={shortcut.id} style={shortcutItemStyle}>
          <span style={shortcutKeyStyle}>{shortcut.key}</span>
          <span style={infoMutedStyle}>{shortcut.description}</span>
        </div>
      ))}
    </div>
  </div>
);

const JournalSection = ({ summary, items }: JournalSectionProps) => (
  <div style={sectionCardStyle}>
    <div style={journalSummaryRowStyle}>
      {summary.map((item) => (
        <div key={item.id} style={infoCardStyle}>
          <span style={summaryLabelStyle}>{item.label}</span>
          <span style={summaryValueStyle}>{item.value}</span>
          <span style={summaryHintStyle}>{item.hint}</span>
        </div>
      ))}
    </div>

    <div style={journalListStyle}>
      {items.map((entry) => (
        <div key={entry.id} style={journalItemStyle}>
          <span style={taskTitleStyle}>{entry.title}</span>
          <span style={taskMetaStyle}>{entry.meta}</span>
        </div>
      ))}
    </div>
  </div>
);

const SettingsSection = ({ groups }: SettingsSectionProps) => (
  <div style={settingsGridStyle}>
    {groups.map((group) => (
      <div key={group.title} style={settingsCardStyle}>
        <h3 style={supplierTitleStyle}>{group.title}</h3>
        <p style={settingsDescriptionStyle}>{group.description}</p>
        <div style={settingsLinksStyle}>
          {group.actions.map((action) => (
            <button key={action} type='button' style={settingsActionStyle}>
              {action}
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div style={{ ...sectionCardStyle, alignItems: 'flex-start' }}>
    <h3 style={supplierTitleStyle}>Не удалось загрузить данные склада</h3>
    <p style={infoMutedStyle}>{message}</p>
    <div>
      <button type='button' style={primaryButtonStyle} onClick={onRetry}>
        Попробовать снова
      </button>
    </div>
  </div>
);

const InventoryPage = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const dashboard = useInventoryDashboardData();

  const operationForms = useMemo(
    () => buildOperationForms(dashboard.selectedWarehouse?.name, dashboard.selectedWarehouse?.code),
    [dashboard.selectedWarehouse]
  );

  const sections = useMemo(() => {
    const base: Record<SectionId, JSX.Element> = {
      overview: (
        <OverviewSection
          summaryCards={dashboard.summaryCards}
          quickActions={quickActions}
          shift={dashboard.overviewShift}
          flows={dashboard.overviewFlows}
          alerts={dashboard.overviewAlerts}
          taskGroups={dashboard.overviewTaskGroups}
        />
      ),
      operations: (
        <OperationsSection forms={operationForms} stats={dashboard.operationStats} guides={operationGuides} />
      ),
      stock: <StockSection rows={dashboard.stockRows} highlights={dashboard.stockHighlights} />,
      suppliers: (
        <SuppliersSection
          cards={dashboard.supplierCards}
          invoices={dashboard.supplierInvoices}
          contracts={dashboard.supplierContracts}
        />
      ),
      inventory: (
        <InventorySection
          tasks={dashboard.inventoryTasks}
          progress={dashboard.inventoryProgress}
          shortcuts={dashboard.scanShortcuts}
        />
      ),
      journal: <JournalSection summary={dashboard.journalSummary} items={dashboard.journalItems} />,
      settings: <SettingsSection groups={settingsGroups} />
    };
    return base;
  }, [dashboard, operationForms]);

  if (dashboard.isLoading) {
    return <PageLoader />;
  }

  if (dashboard.isError) {
    return <ErrorState message={dashboard.error?.message ?? 'Неизвестная ошибка'} onRetry={dashboard.refetch} />;
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Склад</h1>
        <p style={subtitleStyle}>
          Оперативный контроль склада: актуальные показатели из WMS, типовые операции и история действий.
        </p>
      </header>

      <nav style={navStyle}>
        {(
          [
            { id: 'overview', label: 'Главная' },
            { id: 'operations', label: 'Операции' },
            { id: 'stock', label: 'Остатки' },
            { id: 'suppliers', label: 'Поставщики' },
            { id: 'inventory', label: 'Инвентаризация' },
            { id: 'journal', label: 'Журнал' },
            { id: 'settings', label: 'Настройки' }
          ] as { id: SectionId; label: string }[]
        ).map((section) => (
          <button
            key={section.id}
            type='button'
            style={activeSection === section.id ? activeNavButton : navButtonBase}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      {sections[activeSection]}
    </div>
  );
};

export default InventoryPage;
