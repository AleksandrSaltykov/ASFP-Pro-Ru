import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';

import { gradients, palette, typography } from '@shared/ui/theme';

type MessengerBlock = {
  title: string;
  description: string;
  items: string[];
};

type MessengerTab = {
  id: string;
  title: string;
  summary: string;
  blocks: MessengerBlock[];
};

type MessengerSection = {
  id: string;
  title: string;
  description: string;
  tabs: MessengerTab[];
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
  fontSize: 22,
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

const sectionControlsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12
};

const tabNavStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8
};

const tabButtonBase: CSSProperties = {
  padding: '7px 14px',
  borderRadius: 14,
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
  lineHeight: 1.6,
  fontFamily: typography.accentFamily,
  boxShadow: palette.shadowElevated
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14
};

const cardStyle: CSSProperties = {
  backgroundColor: palette.layer,
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  boxShadow: palette.shadowElevated
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const cardDescriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: palette.textMuted,
  fontFamily: typography.accentFamily,
  lineHeight: 1.45
};

const listStyle: CSSProperties = {
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

const messengerSections: MessengerSection[] = [
  {
    id: 'channels',
    title: 'Рабочие пространства',
    description: 'Каналы, проектные комнаты, отделы, цифровые двойники переговорных.',
    tabs: [
      {
        id: 'structure',
        title: 'Структура каналов',
        summary:
          'Иерархия: компания → направления → проекты. Настройка приватности, модерации, архивов, шаблонов комнат.',
        blocks: [
          {
            title: 'Каналы и комнаты',
            description: 'Публичные, приватные, временные, чит-каналы, интеграция с задачами.',
            items: [
              'Шаблоны для проектов, инцидентов, change-менеджмента',
              'Каналы с привязкой к CRM/WMS/ERP объектам',
              'Голосования, опросы, закрепленные сообщения',
              'Автосоздание комнат по событиям (митинг, инцидент)'
            ]
          },
          {
            title: 'Управление доступами',
            description: 'Роли: владелец, модератор, участник, гость. SSO, SCIM, АД/LDAP.',
            items: [
              'Гибридный доступ: внутренние/внешние пользователи',
              'Автоматическое управление ролями по оргструктуре',
              'Гостевой доступ с временными ссылками',
              'Журнал действий, аудит изменений, eDiscovery'
            ]
          }
        ]
      },
      {
        id: 'presence',
        title: 'Статусы и рабочие режимы',
        summary: 'Онлайн/оффлайн, do-not-disturb, статус занятости по календарю, командировки, смены.',
        blocks: [
          {
            title: 'Присутствие',
            description: 'Автостатусы по звонкам, встречам, телефону, мобильному клиенту.',
            items: [
              'Присутствие на основе календаря и геолокации (опционально)',
              'Настройка видимости статусов для разных групп',
              'Push и e-mail уведомления о важных изменениях статуса',
              'Режим фокусировки, “не беспокоить”, тихие часы'
            ]
          },
          {
            title: 'Рабочие режимы',
            description: 'Смены, отпуск, командировки, удалённая работа.',
            items: [
              'Синхронизация с HRM и графиком смен',
              'Автоуведомления командам о смене режима',
              'Отображение статуса на орг-диаграмме',
              'Настройка автосообщений при отсутствии'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'messaging',
    title: 'Сообщения и медиа',
    description:
      'Личные и групповые чаты, вложения, смайлики, реакции, стикеры, цитаты, упоминания, голосовые и видео.',
    tabs: [
      {
        id: 'rich-messaging',
        title: 'Богатый редактор',
        summary: 'Markdown, форматирование, треды, цитирование, ответы, шаблоны сообщений.',
        blocks: [
          {
            title: 'Работа с текстом',
            description: 'Поддержка списков, таблиц, кода, встроенных ссылок, шаблонов.',
            items: [
              'Структурированные сообщения с карточками и кнопками',
              'Цитирование, прикрепление нескольких сообщений',
              'Сохраненные шаблоны и быстрые ответы',
              'Переводчик сообщений, автозамена, упоминания @user #channel'
            ]
          },
          {
            title: 'Медиа и файлы',
            description: 'Drag&drop, предпросмотр, контроль версий, совместное редактирование.',
            items: [
              'Поддержка файлов до N ГБ, синхронизация с корпоративным хранилищем',
              'Предпросмотр офисных документов, PDF, CAD, изображений',
              'Автоматическая классификация по типам и тегам',
              'Подписи, OCR, поиск внутри документов'
            ]
          }
        ]
      },
      {
        id: 'voice-video',
        title: 'Голос и видео',
        summary: 'Встроенные звонки 1:1 и групповые, конференции, запись, расшифровка.',
        blocks: [
          {
            title: 'Голосовые сообщения',
            description: 'Отправка, ускоренное прослушивание, авторасшифровка, перевод.',
            items: [
              'Текстовая расшифровка и поиск по аудио',
              'Отметки говорящих, шумоподавление',
              'Интеграция с задачами (превратить голос в чек-лист)',
              'Сохранение в CRM/WMS карточках'
            ]
          },
          {
            title: 'Видеозвонки и конференции',
            description: 'WebRTC, запись, демонстрация экрана, виртуальные доски, совместное редактирование.',
            items: [
              'Запросы на подключение, лобби, модерация участников',
              'Интерактивные доски, заметки, совместные документы',
              'Запись встреч, отправка расшифровки и решений',
              'Интеграция с календарями, Outlook, Google Workspace'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'collaboration',
    title: 'Совместная работа',
    description: 'Задачи, интеграции, автоматизация, боты, уведомления, реактивная аналитика.',
    tabs: [
      {
        id: 'tasks',
        title: 'Связь с задачами и проектами',
        summary: 'Трелло/джиры, CRM, WMS — сообщения связываются с задачами, событиями, договорами.',
        blocks: [
          {
            title: 'Карточки задач',
            description: 'Встраивание карточек статусов, чек-листов, дедлайнов прямо в чат.',
            items: [
              'Создание задач из сообщений (slash-команды)',
              'Автосинхронизация статусов и комментариев',
              'Сводки по проекту, burn-down/gantt в канале',
              'Контроль SLA и эскалации по просроченным задачам'
            ]
          },
          {
            title: 'Интеграции',
            description: 'CRM, WMS, ERP, BI, DevOps, HRM, SupportDesk.',
            items: [
              'Webhooks, API, боты и slash-команды',
              'Встроенные уведомления об инцидентах и метриках',
              'Стриминг BI-дашбордов и метрик в каналы',
              'Автоматизация (Zapier, Make, собственные скрипты)'
            ]
          }
        ]
      },
      {
        id: 'automation',
        title: 'Боты и автоматизация',
        summary: 'Боты-помощники, триггеры, напоминания, заявки в ИТ и сервис-деск.',
        blocks: [
          {
            title: 'Боты и ассистенты',
            description: 'Сценарии самообслуживания, HR-помощник, ИТ-заявки, Q&A.',
            items: [
              'Конструктор ботов без кода',
              'AI-помощник на корпоративных знаниях',
              'Обработка типовых запросов (отпуск, командировка, доступ)',
              'Интеграция с Jira Service Management/GLPI/Otrs'
            ]
          },
          {
            title: 'Flow и автоматизация',
            description: 'Автотриггеры на события, расписания, SLA оповещения.',
            items: [
              'Напоминания по тредам и задачам',
              'Автоархивация каналов, очистка файлов',
              'Настройка бизнес-правил на события (состояние заказа, инцидент)',
              'Интеграция с BPMN и системами документооборота'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'security',
    title: 'Безопасность и соответствие',
    description: 'Шифрование, DLP, архивирование, аудит, соответствие ISO/GDPR/152-ФЗ.',
    tabs: [
      {
        id: 'security',
        title: 'Информационная безопасность',
        summary: 'Контроль доступа, шифрование, DLP, управление ключами, логирование.',
        blocks: [
          {
            title: 'Шифрование и хранение',
            description: 'End-to-end шифрование, BYOK, хранение в РФ, резервное копирование.',
            items: [
              'Шифрование сообщений, файлов, звонков',
              'Управление ключами (HSM, собственные ключи)',
              'Двухфакторная аутентификация, OTP, аппаратные токены',
              'Резервное копирование, disaster recovery, geo-redundancy'
            ]
          },
          {
            title: 'Контроль утечек и аудит',
            description: 'DLP-политики, мониторинг, автоматическое маскирование, eDiscovery.',
            items: [
              'Настройка DLP-правил по типам данных',
              'Автоматическое скрытие чувствительных данных',
              'Экспорт чатов для юридических расследований',
              'Нарушения политик и workflow эскалаций'
            ]
          }
        ]
      },
      {
        id: 'compliance',
        title: 'Соответствие и регламенты',
        summary: 'Политики хранения, регуляторные требования, юридически значимый обмен.',
        blocks: [
          {
            title: 'Хранение и retention',
            description: 'Сроки хранения, архивирование, legal hold, экспирация сообщений.',
            items: [
              'Политики по подразделениям и темам',
              'Интеграция с архивами и гос. системами (СЭД)',
              'Конфигурация legal hold и судебных запросов',
              'Журнал политики и отчеты для аудиторов'
            ]
          },
          {
            title: 'Регламенты и политика',
            description: 'Настройка корпоративного этикета, модерация, контент-фильтры.',
            items: [
              'Обязательное подтверждение ознакомления с политиками',
              'Фильтрация нецензурной и токсичной лексики',
              'Инструменты модераторов и автоматические предупреждения',
              'Логbook действий и уведомления службе безопасности'
            ]
          }
        ]
      }
    ]
  }
];

const MessengerPage = () => {
  const [activeSectionId, setActiveSectionId] = useState(messengerSections[0].id);
  const [activeTabId, setActiveTabId] = useState(messengerSections[0].tabs[0].id);

  useEffect(() => {
    const section = messengerSections.find((item) => item.id === activeSectionId);
    if (section) {
      setActiveTabId(section.tabs[0].id);
    }
  }, [activeSectionId]);

  const activeSection = messengerSections.find((section) => section.id === activeSectionId) ?? messengerSections[0];
  const activeTab = activeSection.tabs.find((tab) => tab.id === activeTabId) ?? activeSection.tabs[0];

  return (
    <section style={sectionStyle}>
      <header style={moduleHeaderStyle}>
        <div style={moduleHeadingStyle}>
          <span style={moduleBadgeStyle}>Коммуникации</span>
          <h1 style={moduleTitleStyle}>Корпоративный мессенджер</h1>
        </div>
        <span style={moduleMetaStyle}>{activeSection.title}</span>
      </header>

      <div style={sectionControlsStyle}>
        <div style={tabNavStyle}>
          {messengerSections.map((section) => {
            const isActiveSection = section.id === activeSectionId;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                style={{
                  ...tabButtonBase,
                  backgroundColor: isActiveSection ? palette.accentSoft : palette.layer,
                  border: isActiveSection ? `1px solid ${palette.accentMuted}` : tabButtonBase.border,
                  color: isActiveSection ? palette.textPrimary : tabButtonBase.color,
                  boxShadow: isActiveSection ? palette.shadowElevated : 'none'
                }}
              >
                {section.title}
              </button>
            );
          })}
        </div>
        <div style={tabNavStyle}>
          {activeSection.tabs.map((tab) => {
            const isActiveTab = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                style={{
                  ...tabButtonBase,
                  backgroundColor: isActiveTab ? palette.accentSoft : palette.layer,
                  border: isActiveTab ? `1px solid ${palette.accentMuted}` : tabButtonBase.border,
                  color: isActiveTab ? palette.textPrimary : tabButtonBase.color,
                  boxShadow: isActiveTab ? palette.shadowElevated : 'none'
                }}
              >
                {tab.title}
              </button>
            );
          })}
        </div>
        <div style={summaryCardStyle}>{activeTab.summary}</div>
      </div>

      <div style={gridStyle}>
        {activeTab.blocks.map((block) => (
          <article key={block.title} style={cardStyle}>
            <h3 style={cardTitleStyle}>{block.title}</h3>
            <p style={cardDescriptionStyle}>{block.description}</p>
            <ul style={listStyle}>
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

export default MessengerPage;
