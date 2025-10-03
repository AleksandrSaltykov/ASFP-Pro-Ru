export type CrmUUID = string;

export type CrmCustomer = {
  id: CrmUUID;
  name: string;
  inn: string;
  kpp: string;
  createdAt: string;
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
