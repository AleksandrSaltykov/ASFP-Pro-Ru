import { useEffect, useState, type ChangeEvent } from 'react';

import type { CrmCustomer, CrmCustomerPayload } from '@shared/api';

import { ItemForm, type ItemFormTab } from '../../../layout/ItemForm/ItemForm';
import '../../../styles/warehouse.css';

const DEFAULT_COMMENT = 'Поставщик';

const generateTempId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

type BankAccountForm = {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  bik: string;
  corrAccount: string;
  comment: string;
};

type ContactForm = {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  comment: string;
};

const createEmptyBankAccount = (): BankAccountForm => ({
  id: generateTempId(),
  accountName: '',
  bankName: '',
  accountNumber: '',
  bik: '',
  corrAccount: '',
  comment: ''
});

const createEmptyContact = (): ContactForm => ({
  id: generateTempId(),
  name: '',
  position: '',
  phone: '',
  email: '',
  comment: ''
});

export type PartnerEditorSubmitPayload = {
  payload: CrmCustomerPayload;
  customerId?: string;
};

export type PartnerEditorDrawerProps = {
  open: boolean;
  mode: 'create' | 'edit';
  customer: CrmCustomer | null;
  isSubmitting: boolean;
  error?: string;
  onSubmit: (payload: PartnerEditorSubmitPayload) => Promise<void>;
  onClose: () => void;
  onErrorDismiss?: () => void;
};

type FormState = {
  name: string;
  comment: string;
  inn: string;
  kpp: string;
  phone: string;
  email: string;
  website: string;
  legalAddress: string;
  actualAddress: string;
  bankAccounts: BankAccountForm[];
  contacts: ContactForm[];
};

const emptyState: FormState = {
  name: '',
  comment: DEFAULT_COMMENT,
  inn: '',
  kpp: '',
  phone: '',
  email: '',
  website: '',
  legalAddress: '',
  actualAddress: '',
  bankAccounts: [createEmptyBankAccount()],
  contacts: [createEmptyContact()]
};

const mapBankAccounts = (customer: CrmCustomer | null) => {
  const accounts = customer?.bankAccounts ?? [];
  if (!accounts.length) {
    return [createEmptyBankAccount()];
  }
  return accounts.map((account) => ({
    id: account.id ?? generateTempId(),
    accountName: account.accountName ?? '',
    bankName: account.bankName ?? '',
    accountNumber: account.accountNumber ?? '',
    bik: account.bik ?? '',
    corrAccount: account.corrAccount ?? '',
    comment: account.comment ?? ''
  }));
};

const mapContacts = (customer: CrmCustomer | null) => {
  const contacts = customer?.contacts ?? [];
  if (!contacts.length) {
    return [createEmptyContact()];
  }
  return contacts.map((contact) => ({
    id: contact.id ?? generateTempId(),
    name: contact.name ?? '',
    position: contact.position ?? '',
    phone: contact.phone ?? '',
    email: contact.email ?? '',
    comment: contact.comment ?? ''
  }));
};

const buildInitialState = (customer: CrmCustomer | null): FormState => {
  if (!customer) {
    return emptyState;
  }
  return {
    name: customer.name ?? '',
    comment: customer.comment ?? DEFAULT_COMMENT,
    inn: customer.inn ?? '',
    kpp: customer.kpp ?? '',
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    website: customer.website ?? '',
    legalAddress: customer.legalAddress ?? '',
    actualAddress: customer.actualAddress ?? '',
    bankAccounts: mapBankAccounts(customer),
    contacts: mapContacts(customer)
  };
};

const normalizeOptional = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const PartnerEditorDrawer = ({
  open,
  mode,
  customer,
  isSubmitting,
  error,
  onSubmit,
  onClose,
  onErrorDismiss
}: PartnerEditorDrawerProps) => {
  const [state, setState] = useState<FormState>(emptyState);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setState(buildInitialState(customer));
    setLocalError(null);
    onErrorDismiss?.();
  }, [open, customer, onErrorDismiss]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankAccountChange = (id: string, field: keyof BankAccountForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setState((prev) => ({
        ...prev,
        bankAccounts: prev.bankAccounts.map((account) =>
          account.id === id ? { ...account, [field]: value } : account
        )
      }));
    };

  const handleAddBankAccount = () => {
    setState((prev) => ({ ...prev, bankAccounts: [...prev.bankAccounts, createEmptyBankAccount()] }));
  };

  const handleRemoveBankAccount = (id: string) => {
    setState((prev) => {
      const remaining = prev.bankAccounts.filter((account) => account.id !== id);
      return {
        ...prev,
        bankAccounts: remaining.length ? remaining : [createEmptyBankAccount()]
      };
    });
  };

  const handleContactChange = (id: string, field: keyof ContactForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setState((prev) => ({
        ...prev,
        contacts: prev.contacts.map((contact) =>
          contact.id === id ? { ...contact, [field]: value } : contact
        )
      }));
    };

  const handleAddContact = () => {
    setState((prev) => ({ ...prev, contacts: [...prev.contacts, createEmptyContact()] }));
  };

  const handleRemoveContact = (id: string) => {
    setState((prev) => {
      const remaining = prev.contacts.filter((contact) => contact.id !== id);
      return {
        ...prev,
        contacts: remaining.length ? remaining : [createEmptyContact()]
      };
    });
  };

  const handleSubmit = async () => {
    if (!state.name.trim()) {
      setLocalError('Укажите название контрагента');
      return;
    }
    if (!state.comment.trim()) {
      setLocalError('Комментарий обязателен');
      return;
    }

    const comment = state.comment.trim() || DEFAULT_COMMENT;
    const normalizedInn = normalizeOptional(state.inn);
    const normalizedKpp = normalizeOptional(state.kpp);
    const normalizedPhone = normalizeOptional(state.phone);
    const normalizedEmail = normalizeOptional(state.email);
    const normalizedWebsite = normalizeOptional(state.website);
    const normalizedLegalAddress = normalizeOptional(state.legalAddress);
    const normalizedActualAddress = normalizeOptional(state.actualAddress);

    const bankAccountsPayload = state.bankAccounts
      .map((account) => {
        const accountNumber = account.accountNumber.replace(/\s+/g, '');
        if (!accountNumber) {
          return null;
        }
        return {
          id: account.id.startsWith('tmp-') ? undefined : account.id,
          accountName: normalizeOptional(account.accountName),
          bankName: normalizeOptional(account.bankName),
          accountNumber,
          bik: normalizeOptional(account.bik),
          corrAccount: normalizeOptional(account.corrAccount),
          comment: normalizeOptional(account.comment)
        };
      })
      .filter((account): account is NonNullable<typeof account> => account !== null);

    const contactsPayload = state.contacts
      .map((contact) => {
        const name = contact.name.trim();
        if (!name) {
          return null;
        }
        return {
          id: contact.id.startsWith('tmp-') ? undefined : contact.id,
          name,
          position: normalizeOptional(contact.position),
          phone: normalizeOptional(contact.phone),
          email: normalizeOptional(contact.email),
          comment: normalizeOptional(contact.comment)
        };
      })
      .filter((contact): contact is NonNullable<typeof contact> => contact !== null);

    const payload: CrmCustomerPayload = {
      name: state.name.trim(),
      comment,
      inn: normalizedInn,
      kpp: normalizedKpp,
      phone: normalizedPhone,
      email: normalizedEmail,
      website: normalizedWebsite,
      legalAddress: normalizedLegalAddress,
      actualAddress: normalizedActualAddress,
      bankAccounts: bankAccountsPayload.length ? bankAccountsPayload : undefined,
      contacts: contactsPayload.length ? contactsPayload : undefined
    };

    try {
      await onSubmit({ payload, customerId: customer?.id });
      setLocalError(null);
    } catch (submitError) {
      setLocalError((submitError as Error).message);
      throw submitError;
    }
  };

  const generalTab: ItemFormTab = {
    id: 'general',
    label: 'Основное',
    content: (
      <div className='warehouse-form__section'>
        <label className='warehouse-form__control'>
          <span className='warehouse-form__label'>Название <span className='warehouse-form__required'>*</span></span>
          <input
            name='name'
            type='text'
            value={state.name}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder='ООО «Партнёр»'
          />
        </label>
        <label className='warehouse-form__control'>
          <span className='warehouse-form__label'>Комментарий <span className='warehouse-form__required'>*</span></span>
          <textarea
            name='comment'
            value={state.comment}
            onChange={handleChange}
            disabled={isSubmitting}
            rows={2}
            placeholder={DEFAULT_COMMENT}
          />
          <span className='warehouse-form__hint'>Комментарий используется в карточке поставщика. По умолчанию — «Поставщик».</span>
        </label>
        <div className='warehouse-form__row'>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>ИНН</span>
            <input
              name='inn'
              type='text'
              value={state.inn}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder='7701234567'
            />
          </label>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>КПП</span>
            <input
              name='kpp'
              type='text'
              value={state.kpp}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder='770101001'
            />
          </label>
        </div>
        <div className='warehouse-form__row'>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Телефон</span>
            <input
              name='phone'
              type='tel'
              value={state.phone}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder='+7 (999) 000-00-00'
            />
          </label>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Email</span>
            <input
              name='email'
              type='email'
              value={state.email}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder='supply@example.ru'
            />
          </label>
        </div>
        <div className='warehouse-form__row'>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Сайт</span>
            <input
              name='website'
              type='url'
              value={state.website}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder='https://example.ru'
            />
          </label>
        </div>
        <div className='warehouse-form__row'>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Юридический адрес</span>
            <textarea
              name='legalAddress'
              value={state.legalAddress}
              onChange={handleChange}
              disabled={isSubmitting}
              rows={3}
              placeholder='109004, г. Москва, ул. ...'
            />
          </label>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Фактический адрес</span>
            <textarea
              name='actualAddress'
              value={state.actualAddress}
              onChange={handleChange}
              disabled={isSubmitting}
              rows={3}
              placeholder='143900, Московская обл., ...'
            />
          </label>
        </div>
      </div>
    )
  };

  const bankAccountsTab: ItemFormTab = {
    id: 'bank',
    label: 'Банковские реквизиты',
    content: (
      <div className='warehouse-form__section warehouse-form__repeater'>
        {state.bankAccounts.map((account, index) => (
          <fieldset key={account.id} className='warehouse-form__fieldset'>
            <legend>Счёт {index + 1}</legend>
            <div className='warehouse-form__row'>
              <label className='warehouse-form__control'>
                <span className='warehouse-form__label'>Наименование</span>
                <input
                  name='accountName'
                  type='text'
                  value={account.accountName}
                  onChange={handleBankAccountChange(account.id, 'accountName')}
                  disabled={isSubmitting}
                  placeholder='Основной расчётный счёт'
                />
              </label>
              <label className='warehouse-form__control'>
                <span className='warehouse-form__label'>Банк</span>
                <input
                  name='bankName'
                  type='text'
                  value={account.bankName}
                  onChange={handleBankAccountChange(account.id, 'bankName')}
                  disabled={isSubmitting}
                  placeholder='ПАО «Сбербанк»'
                />
              </label>
            </div>
            <div className='warehouse-form__row'>
              <label className='warehouse-form__control'>
                <span className='warehouse-form__label'>№ счёта</span>
                <input
                  name='accountNumber'
                  type='text'
                  value={account.accountNumber}
                  onChange={handleBankAccountChange(account.id, 'accountNumber')}
                  disabled={isSubmitting}
                  placeholder='40702810...'
                />
              </label>
              <label className='warehouse-form__control'>
                <span className='warehouse-form__label'>БИК</span>
                <input
                  name='bik'
                  type='text'
                  value={account.bik}
                  onChange={handleBankAccountChange(account.id, 'bik')}
                  disabled={isSubmitting}
                  placeholder='044525225'
                />
              </label>
              <label className='warehouse-form__control'>
                <span className='warehouse-form__label'>Кор.счёт</span>
                <input
                  name='corrAccount'
                  type='text'
                  value={account.corrAccount}
                  onChange={handleBankAccountChange(account.id, 'corrAccount')}
                  disabled={isSubmitting}
                  placeholder='30101810...'
                />
              </label>
            </div>
            <label className='warehouse-form__control'>
              <span className='warehouse-form__label'>Комментарий</span>
              <textarea
                name='comment'
                value={account.comment}
                onChange={handleBankAccountChange(account.id, 'comment')}
                disabled={isSubmitting}
                rows={2}
              />
            </label>
            <div className='warehouse-form__inline-actions'>
              <button
                type='button'
                className='warehouse-shell__secondary-action'
                onClick={() => handleRemoveBankAccount(account.id)}
                disabled={state.bankAccounts.length <= 1 && index === 0}
              >
                Удалить счёт
              </button>
            </div>
          </fieldset>
        ))}
        <button
          type='button'
          className='warehouse-shell__secondary-action warehouse-form__repeater-add'
          onClick={handleAddBankAccount}
          disabled={isSubmitting}
        >
          Добавить счёт
        </button>
      </div>
    )
  };

  const contactsTab: ItemFormTab = {
    id: 'contacts',
    label: 'Контакты',
    content: (
      <div className='warehouse-form__section warehouse-form__repeater'>
        {state.contacts.map((contact, index) => (
          <fieldset key={contact.id} className='warehouse-form__fieldset'>
            <legend>Контакт {index + 1}</legend>
            <div className='warehouse-form__row'>
              <label className='warehouse-form__control'>
                <span className='warehouse-form__label'>Имя <span className='warehouse-form__required'>*</span></span>
                <input
                  name='contact-name'
                  type='text'
                  value={contact.name}
                  onChange={handleContactChange(contact.id, 'name')}
                  disabled={isSubmitting}
                  placeholder='Иван Иванов'
                />
              </label>
              <label className='warehouse-form__control'>
                <span className='warehouse-form__label'>Должность</span>
                <input
                  name='contact-position'
                  type='text'
                  value={contact.position}
                  onChange={handleContactChange(contact.id, 'position')}
                  disabled={isSubmitting}
                  placeholder='Менеджер по закупкам'
                />
              </label>
            </div>
            <div className='warehouse-form__row'>
              <label className='warehouse-form__control'>
                <span className='warehouse-form__label'>Телефон</span>
                <input
                  name='contact-phone'
                  type='tel'
                  value={contact.phone}
                  onChange={handleContactChange(contact.id, 'phone')}
                  disabled={isSubmitting}
                  placeholder='+7 (999) 000-00-00'
                />
              </label>
              <label className='warehouse-form__control'>
                <span className='warehouse-form__label'>Email</span>
                <input
                  name='contact-email'
                  type='email'
                  value={contact.email}
                  onChange={handleContactChange(contact.id, 'email')}
                  disabled={isSubmitting}
                  placeholder='contact@example.ru'
                />
              </label>
            </div>
            <label className='warehouse-form__control'>
              <span className='warehouse-form__label'>Комментарий</span>
              <textarea
                name='contact-comment'
                value={contact.comment}
                onChange={handleContactChange(contact.id, 'comment')}
                disabled={isSubmitting}
                rows={2}
              />
            </label>
            <div className='warehouse-form__inline-actions'>
              <button
                type='button'
                className='warehouse-shell__secondary-action'
                onClick={() => handleRemoveContact(contact.id)}
                disabled={state.contacts.length <= 1 && index === 0}
              >
                Удалить контакт
              </button>
            </div>
          </fieldset>
        ))}
        <button
          type='button'
          className='warehouse-shell__secondary-action warehouse-form__repeater-add'
          onClick={handleAddContact}
          disabled={isSubmitting}
        >
          Добавить контакт
        </button>
      </div>
    )
  };

  const tabs: ItemFormTab[] = [generalTab, bankAccountsTab, contactsTab];

  const combinedError = localError ?? error;

  if (!open) {
    return null;
  }

  return (
    <ItemForm
      title={mode === 'create' ? 'Новый поставщик' : 'Редактирование поставщика'}
      tabs={tabs}
      onClose={onClose}
      onSave={handleSubmit}
      saveDisabled={isSubmitting}
    >
      {combinedError ? <div className='warehouse-form__error'>{combinedError}</div> : null}
      <div className='warehouse-form__footer-note'>Поля с * обязательны. Сохранение недоступно во время отправки.</div>
    </ItemForm>
  );
};

export default PartnerEditorDrawer;
