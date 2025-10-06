export type CrmUUID = string;

export type CrmCustomerBankAccount = {
  id: CrmUUID;
  accountName?: string;
  bankName?: string;
  accountNumber: string;
  bik?: string;
  corrAccount?: string;
  comment?: string;
  isDefault?: boolean;
};

export type CrmCustomerContact = {
  id: CrmUUID;
  name: string;
  position?: string;
  phone?: string;
  email?: string;
  comment?: string;
};

export type CrmCustomer = {
  id: CrmUUID;
  name: string;
  inn?: string | null;
  kpp?: string | null;
  comment?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  legalAddress?: string | null;
  actualAddress?: string | null;
  bankAccounts?: CrmCustomerBankAccount[];
  contacts?: CrmCustomerContact[];
  createdAt: string;
  updatedAt?: string;
};

export type CrmCustomerBankAccountInput = Omit<CrmCustomerBankAccount, 'id'> & { id?: CrmUUID };
export type CrmCustomerContactInput = Omit<CrmCustomerContact, 'id'> & { id?: CrmUUID };

export type CrmCustomerPayload = {
  name: string;
  inn?: string;
  kpp?: string;
  comment?: string;
  phone?: string;
  email?: string;
  website?: string;
  legalAddress?: string;
  actualAddress?: string;
  bankAccounts?: CrmCustomerBankAccountInput[];
  contacts?: CrmCustomerContactInput[];
};

export type CrmDeal = {
  id: CrmUUID;
  title: string;
  customerId: CrmUUID;
  stage: string;
  amount: number;
  currency: string;
  createdBy?: string;
  createdAt: string;
};

export type CrmDealEvent = {
  id: number;
  dealId: CrmUUID;
  eventType: string;
  payload?: unknown;
  createdAt: string;
};

export type CrmListResponse<TItem> = {
  items: TItem[];
};
