import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

import {
  type CrmCustomer,
  type CrmCustomerPayload,
  useCreateCustomerMutation,
  useCustomersQuery,
  useUpdateCustomerMutation
} from "@shared/api";
import { PageLoader } from "@shared/ui/PageLoader";
import { palette, typography } from "@shared/ui/theme";

import DataTable, { type TableColumn } from "../../components/DataTable";
import { PartnerEditorDrawer, type PartnerEditorSubmitPayload } from "../../../../modules/warehouse/views/masters/components/PartnerEditorDrawer";
import { fallbackCustomers } from "../../../../modules/warehouse/views/masters/fallbacks";
import { normalizeSearch, shouldUseFallback } from "../../../../modules/warehouse/views/masters/utils";

const layoutStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 16
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap"
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: typography.fontFamily,
  fontSize: 28,
  fontWeight: 600,
  color: palette.textPrimary
};

const primaryButtonStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: 14,
  border: "none",
  background: palette.primary,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer"
};

const filtersCardStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  padding: 20,
  borderRadius: 16,
  border: `1px solid ${palette.border}`,
  background: palette.layer,
  boxShadow: palette.shadowElevated
};

const filterControlStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  minWidth: 220
};

const filterLabelStyle: CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: palette.textSoft,
  fontWeight: 600
};

const searchInputStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  fontFamily: typography.fontFamily,
  fontSize: 14,
  color: palette.textPrimary
};

const cardStyle: CSSProperties = {
  padding: 24,
  borderRadius: 20,
  border: `1px solid ${palette.border}`,
  background: palette.layer,
  boxShadow: palette.shadowElevated
};

const QUERY_LIMIT = 100;

const getContactLines = (partner: CrmCustomer) => {
  const primaryContact = partner.contacts?.find((contact) => contact.phone || contact.email);
  const parts: string[] = [];
  if (primaryContact?.name) {
    parts.push(primaryContact.name);
  }
  if (primaryContact?.phone) {
    parts.push(primaryContact.phone);
  } else if (partner.phone) {
    parts.push(partner.phone);
  }
  if (primaryContact?.email) {
    parts.push(primaryContact.email);
  } else if (partner.email) {
    parts.push(partner.email);
  }
  return parts;
};

const formatAddress = (partner: CrmCustomer) =>
  partner.actualAddress || partner.legalAddress || undefined;

const generateLocalId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const cloneCustomer = (partner: CrmCustomer): CrmCustomer => ({
  ...partner,
  bankAccounts: partner.bankAccounts?.map((account) => ({ ...account })),
  contacts: partner.contacts?.map((contact) => ({ ...contact }))
});

const getTaxLines = (partner: CrmCustomer) => {
  const inn = partner.inn ? `ИНН ${partner.inn}` : undefined;
  return inn ? [inn] : [];
};

const mapBankAccountsFromPayload = (accounts: CrmCustomerPayload["bankAccounts"] | undefined) => {
  if (!accounts?.length) {
    return undefined;
  }
  const mapped = accounts
    .filter((account) => account.accountNumber?.trim())
    .map((account) => ({
      id: account.id ?? generateLocalId(),
      accountName: account.accountName,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      bik: account.bik,
      corrAccount: account.corrAccount,
      comment: account.comment
    }));
  return mapped.length ? mapped : undefined;
};

const mapContactsFromPayload = (contacts: CrmCustomerPayload["contacts"] | undefined) => {
  if (!contacts?.length) {
    return undefined;
  }
  const mapped = contacts
    .filter((contact) => contact.name?.trim())
    .map((contact) => ({
      id: contact.id ?? generateLocalId(),
      name: contact.name.trim(),
      position: contact.position,
      phone: contact.phone,
      email: contact.email,
      comment: contact.comment
    }));
  return mapped.length ? mapped : undefined;
};

const createLocalCustomer = (payload: CrmCustomerPayload): CrmCustomer => {
  const now = new Date().toISOString();
  return {
    id: generateLocalId(),
    name: payload.name,
    inn: payload.inn ?? null,
    kpp: payload.kpp ?? null,
    comment: payload.comment ?? null,
    phone: payload.phone ?? null,
    email: payload.email ?? null,
    website: payload.website ?? null,
    legalAddress: payload.legalAddress ?? null,
    actualAddress: payload.actualAddress ?? null,
    bankAccounts: mapBankAccountsFromPayload(payload.bankAccounts),
    contacts: mapContactsFromPayload(payload.contacts),
    createdAt: now,
    updatedAt: now
  };
};

const PartnersPage = () => {
  const partnersQuery = useCustomersQuery({ limit: QUERY_LIMIT });
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [localPartners, setLocalPartners] = useState<CrmCustomer[]>(
    () => fallbackCustomers.map(cloneCustomer)
  );

  const useFallback = shouldUseFallback(partnersQuery.error);

  const partners = useMemo(() => {
    if (partnersQuery.data?.length) {
      return partnersQuery.data;
    }
    if (useFallback) {
      return localPartners;
    }
    return [];
  }, [partnersQuery.data, useFallback, localPartners]);

  useEffect(() => {
    if (selectedPartnerId && !partners.some((partner) => partner.id === selectedPartnerId)) {
      setSelectedPartnerId(null);
    }
  }, [partners, selectedPartnerId]);

  const filteredPartners = useMemo(() => {
    const needle = normalizeSearch(search);
    if (!needle) {
      return partners;
    }
    return partners.filter((partner) => {
      const fields: string[] = [
        partner.name ?? "",
        partner.inn ?? "",
        partner.kpp ?? "",
        partner.comment ?? "",
        partner.phone ?? "",
        partner.email ?? "",
        partner.website ?? "",
        partner.legalAddress ?? "",
        partner.actualAddress ?? ""
      ];
      partner.contacts?.forEach((contact) => {
        fields.push(contact.name ?? "");
        fields.push(contact.phone ?? "");
        fields.push(contact.email ?? "");
        fields.push(contact.position ?? "");
      });
      return fields.some((value) => normalizeSearch(value).includes(needle));
    });
  }, [partners, search]);

  const handleCreateClick = () => {
    setDrawerMode("create");
    setSelectedPartnerId(null);
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleEditClick = useCallback((partner: CrmCustomer) => {
    setDrawerMode("edit");
    setSelectedPartnerId(partner.id);
    setFormError(null);
    setDrawerOpen(true);
  }, []);

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
    if (useFallback) {
      const now = new Date().toISOString();
      if (drawerMode === "create") {
        const created = createLocalCustomer(payload);
        created.createdAt = now;
        created.updatedAt = now;
        setLocalPartners((prev) => [created, ...prev]);
        setSelectedPartnerId(created.id);
      } else {
        const targetId = customerId ?? selectedPartner?.id;
        if (!targetId) {
          setFormError("Не выбрана запись для изменения");
          return;
        }
        setLocalPartners((prev) =>
          prev.map((partner) =>
            partner.id === targetId
              ? {
                  ...partner,
                  name: payload.name,
                  inn: payload.inn ?? null,
                  kpp: payload.kpp ?? null,
                  comment: payload.comment ?? null,
                  phone: payload.phone ?? null,
                  email: payload.email ?? null,
                  website: payload.website ?? null,
                  legalAddress: payload.legalAddress ?? null,
                  actualAddress: payload.actualAddress ?? null,
                  bankAccounts: mapBankAccountsFromPayload(payload.bankAccounts),
                  contacts: mapContactsFromPayload(payload.contacts),
                  updatedAt: now
                }
              : partner
          )
        );
        setSelectedPartnerId(targetId);
      }
      setDrawerOpen(false);
      setFormError(null);
      return;
    }

    try {
      if (drawerMode === "create") {
        const created = await createMutation.mutateAsync({ payload, limit: QUERY_LIMIT });
        setSelectedPartnerId(created.id);
      } else {
        const targetId = customerId ?? selectedPartner?.id;
        if (!targetId) {
          throw new Error("Не выбрана запись для изменения");
        }
        const updated = await updateMutation.mutateAsync({ id: targetId, payload, limit: QUERY_LIMIT });
        setSelectedPartnerId(updated.id);
      }
      setDrawerOpen(false);
      setFormError(null);
      await partnersQuery.refetch();
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  const columns: TableColumn<CrmCustomer>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Наименование",
        render: (partner: CrmCustomer) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 280 }}>
            <strong>{partner.name ?? "—"}</strong>
            {partner.comment ? (
              <span style={{ color: palette.textSecondary, fontSize: 12 }}>{partner.comment}</span>
            ) : null}
          </div>
        )
      },
      {
        id: "taxIds",
        label: "ИНН",
        width: 220,
        render: (partner: CrmCustomer) => {
          const taxLines = getTaxLines(partner);
          return taxLines.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {taxLines.map((value, index) => (
                <span key={`${value}-${index}`}>{value}</span>
              ))}
            </div>
          ) : (
            <span>—</span>
          );
        }
      },
      {
        id: "contacts",
        label: "Контакты",
        width: 240,
        render: (partner: CrmCustomer) => {
          const contactLines = getContactLines(partner);
          return contactLines.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {contactLines.map((value, index) => (
                <span key={`${value}-${index}`}>{value}</span>
              ))}
            </div>
          ) : (
            <span>—</span>
          );
        }
      },
      {
        id: "address",
        label: "Адрес",
        render: (partner: CrmCustomer) => (
          <span style={{ display: "inline-block", maxWidth: 260, whiteSpace: "normal" }}>
            {formatAddress(partner) ?? "—"}
          </span>
        )
      },
      {
        id: "actions",
        label: "",
        width: 120,
        align: "right",
        render: (partner: CrmCustomer) => (
          <button
            type="button"
            style={{ ...primaryButtonStyle, padding: "8px 14px" }}
            onClick={() => handleEditClick(partner)}
          >
            Изменить
          </button>
        )
      }
    ],
    [handleEditClick]
  );

  const isLoading = partnersQuery.isLoading;
  const hasError = partnersQuery.isError && !useFallback;

  return (
    <section style={layoutStyle}>
      <header style={headerStyle}>
        <h1 style={headingStyle}>Поставщики</h1>
        <div style={headerActionsStyle}>
          <span style={{ color: palette.textSecondary, fontSize: 14 }}>
            Контрагентов: {filteredPartners.length}
          </span>
          <button type="button" style={primaryButtonStyle} onClick={handleCreateClick}>
            Создать
          </button>
        </div>
      </header>

      <div style={filtersCardStyle}>
        <label style={filterControlStyle}>
          <span style={filterLabelStyle}>Поиск</span>
          <input
            type="search"
            placeholder="Название, ИНН или контакт"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={searchInputStyle}
          />
        </label>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : hasError ? (
        <div style={cardStyle}>Не удалось загрузить поставщиков: {(partnersQuery.error as Error).message}</div>
      ) : (
        <DataTable
          columns={columns}
          items={filteredPartners}
          emptyMessage={search ? "Совпадений не найдено" : "Справочник поставщиков пуст"}
        />
      )}

      <PartnerEditorDrawer
        open={drawerOpen}
        mode={drawerMode}
        customer={drawerMode === "edit" ? selectedPartner : null}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        error={formError ?? undefined}
        onSubmit={handleDrawerSubmit}
        onClose={handleDrawerClose}
        onErrorDismiss={() => setFormError(null)}
      />
    </section>
  );
};

export default PartnersPage;
