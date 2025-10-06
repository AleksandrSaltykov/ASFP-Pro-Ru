import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type CrmCustomer,
  useCreateCustomerMutation,
  useCustomersQuery,
  useUpdateCustomerMutation
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';

import { WarehouseShell } from '../../../layout/WarehouseShell';
import { ListForm } from '../../../layout/ListForm/ListForm';
import type { WarehouseColumn } from '../../../layout/types';
import { warehouseMenu } from '../../../menu/warehouse.menu';
import { EmptyState, QueryErrorState } from '../../components/QueryState';
import { fallbackCustomers } from '../fallbacks';
import { formatDateTime, normalizeSearch, shouldUseFallback } from '../utils';
import { PartnerEditorDrawer, type PartnerEditorSubmitPayload } from '../components/PartnerEditorDrawer';

const QUERY_LIMIT = 100;

export const PartnersList = () => {
  const partnersQuery = useCustomersQuery({ limit: QUERY_LIMIT });
  const [search, setSearch] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [formError, setFormError] = useState<string | null>(null);

  const useFallback = shouldUseFallback(partnersQuery.error);
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();

  const partners = useMemo(() => {
    if (partnersQuery.data) {
      return partnersQuery.data;
    }
    if (useFallback) {
      return fallbackCustomers;
    }
    return [];
  }, [partnersQuery.data, useFallback]);

  useEffect(() => {
    if (!selectedPartnerId) {
      return;
    }
    if (!partners.some((partner) => partner.id === selectedPartnerId)) {
      setSelectedPartnerId(null);
    }
  }, [partners, selectedPartnerId]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(search);
    return partners.filter((partner) => {
      if (!needle) {
        return true;
      }
      const fields: string[] = [
        partner.name ?? '',
        partner.inn ?? '',
        partner.kpp ?? '',
        partner.comment ?? '',
        partner.phone ?? '',
        partner.email ?? '',
        partner.website ?? '',
        partner.legalAddress ?? '',
        partner.actualAddress ?? ''
      ];
      if (partner.contacts?.length) {
        partner.contacts.forEach((contact) => {
          fields.push(contact.name ?? '');
          fields.push(contact.phone ?? '');
          fields.push(contact.email ?? '');
          fields.push(contact.position ?? '');
        });
      }
      return fields.some((value) => normalizeSearch(value ?? '').includes(needle));
    });
  }, [partners, search]);

  const renderFilters = () => (
    <div className='filters-panel'>
      <label>
        <span>Поиск</span>
        <input
          type='search'
          placeholder='Название, ИНН или КПП'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
    </div>
  );

  const handleCreateClick = useCallback(() => {
    setDrawerMode('create');
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const handleEditClick = useCallback((partner: CrmCustomer) => {
    setSelectedPartnerId(partner.id);
    setDrawerMode('edit');
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const handleDeleteClick = useCallback((partner: CrmCustomer) => {
    window.alert(`Удаление поставщика «${partner.name}» пока не доступно.`);
  }, []);

  const columns: WarehouseColumn<CrmCustomer>[] = useMemo(
    () => [
      {
        id: 'name',
        label: 'Контрагент',
        render: (row) => row.name
      },
      {
        id: 'inn',
        label: 'ИНН',
        render: (row) => row.inn || '—'
      },
      {
        id: 'kpp',
        label: 'КПП',
        render: (row) => row.kpp || '—'
      },
      {
        id: 'contacts',
        label: 'Контакты',
        render: (row) => {
          const primaryEmail = row.email ?? row.contacts?.find((contact) => contact.email)?.email;
          const primaryPhone = row.phone ?? row.contacts?.find((contact) => contact.phone)?.phone;
          if (!primaryEmail && !primaryPhone) {
            return '—';
          }
          return (
            <div className='list-form__value'>
              {primaryEmail ? <span className='list-form__meta'>{primaryEmail}</span> : null}
              {primaryPhone ? <span className='list-form__meta'>{primaryPhone}</span> : null}
            </div>
          );
        }
      },
      {
        id: 'createdAt',
        label: 'Создан',
        render: (row) => formatDateTime(row.createdAt)
      },
      {
        id: 'actions',
        label: '',
        align: 'center',
        render: (row) => (
          <div className='list-form__actions'>
            <button
              type='button'
              className='list-form__icon-button list-form__icon-button--edit'
              onClick={(event) => {
                event.stopPropagation();
                handleEditClick(row);
              }}
              title='Редактировать'
              aria-label={`Редактировать «${row.name}»`}
            >
              ✶
            </button>
            <button
              type='button'
              className='list-form__icon-button list-form__icon-button--delete'
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteClick(row);
              }}
              title='Удалить'
              aria-label={`Удалить «${row.name}»`}
            >
              ✶
            </button>
          </div>
        )
      }
    ],
    [handleEditClick, handleDeleteClick]
  );

  const handleDrawerClose = () => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }
    setDrawerOpen(false);
    setFormError(null);
  };

  const selectedPartner = useMemo(
    () => (selectedPartnerId ? partners.find((partner) => partner.id === selectedPartnerId) ?? null : null),
    [partners, selectedPartnerId]
  );

  const handleDrawerSubmit = async ({ payload, customerId }: PartnerEditorSubmitPayload) => {
    try {
      if (drawerMode === 'create') {
        const created = await createMutation.mutateAsync({ payload, limit: QUERY_LIMIT });
        setSelectedPartnerId(created.id);
      } else {
        const targetId = customerId ?? selectedPartner?.id;
        if (!targetId) {
          throw new Error('Не выбрана запись для изменения');
        }
        const updated = await updateMutation.mutateAsync({ id: targetId, payload, limit: QUERY_LIMIT });
        setSelectedPartnerId(updated.id);
      }
      setDrawerOpen(false);
      setFormError(null);
      await partnersQuery.refetch();
    } catch (submitError) {
      setFormError((submitError as Error).message);
      throw submitError;
    }
  };

  return (
    <WarehouseShell
      title='Поставщики'
      menu={warehouseMenu}
      activePath='/warehouse/masters/partners'
      commands={[]}
      status={partnersQuery.isLoading ? 'Загрузка…' : `Контрагентов: ${filtered.length}`}
      renderFilters={renderFilters}
      headerActions={
        <button type='button' className='warehouse-shell__primary-action' onClick={handleCreateClick}>
          Создать
        </button>
      }
    >
      {partnersQuery.isLoading ? (
        <PageLoader />
      ) : partnersQuery.isError && !useFallback ? (
        <QueryErrorState message={`Не удалось загрузить контрагентов: ${partnersQuery.error?.message ?? 'неизвестная ошибка'}`} />
      ) : filtered.length === 0 ? (
        <EmptyState message={search ? 'Совпадений не найдено' : 'Справочник поставщиков пуст'} />
      ) : (
        <ListForm
          columns={columns}
          rows={filtered}
          primaryKey={(row) => row.id}
          emptyMessage='Справочник поставщиков пуст'
          selectedKey={selectedPartnerId ?? undefined}
          onRowClick={(row) => setSelectedPartnerId((row as CrmCustomer).id)}
        />
      )}

      <PartnerEditorDrawer
        open={drawerOpen}
        mode={drawerMode}
        customer={drawerMode === 'edit' ? selectedPartner : null}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        error={formError ?? undefined}
        onSubmit={handleDrawerSubmit}
        onClose={handleDrawerClose}
        onErrorDismiss={() => setFormError(null)}
      />
    </WarehouseShell>
  );
};

export default PartnersList;
