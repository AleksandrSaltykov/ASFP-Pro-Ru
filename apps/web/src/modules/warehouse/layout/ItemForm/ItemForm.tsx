import type { ReactNode } from 'react';
import { useState } from 'react';

import '../../styles/warehouse.css';

export type ItemFormTab = {
  id: string;
  label: string;
  content: ReactNode;
};

export type ItemFormProps = {
  title: string;
  tabs: ItemFormTab[];
  onClose: () => void;
  onSave?: () => void;
  saveDisabled?: boolean;
  children?: ReactNode;
};

export const ItemForm = ({ title, tabs, onClose, onSave, saveDisabled = false, children }: ItemFormProps) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '');

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content ?? null;

  return (
    <div className='item-form__overlay'>
      <div className='item-form__dialog' role='dialog' aria-modal>
        <header className='item-form__header'>
          <h2 className='item-form__title'>{title}</h2>
          <button type='button' className='item-form__close' onClick={onClose} aria-label='Закрыть'>
            <span aria-hidden='true'>×</span>
          </button>
        </header>
        <nav className='item-form__tabs'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type='button'
              className={['item-form__tab', activeTab === tab.id && 'item-form__tab--active'].filter(Boolean).join(' ')}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className='item-form__body'>{activeContent}</div>
        {children}
        <footer className='item-form__footer'>
          <button type='button' onClick={onSave} disabled={saveDisabled}>
            Сохранить
          </button>
          <button type='button' onClick={onClose}>
            Закрыть
          </button>
        </footer>
      </div>
    </div>
  );
};
