export type BpmUUID = string;

export type BpmProcess = {
  id: BpmUUID;
  code: string;
  name: string;
  description: string;
  version: number;
  status: string;
  definition: unknown;
  createdAt: string;
  updatedAt: string;
};

export type BpmForm = {
  id: BpmUUID;
  processId: BpmUUID;
  code: string;
  name: string;
  version: number;
  schema: unknown;
  uiSchema: unknown;
  createdAt: string;
  updatedAt: string;
};

export type BpmTask = {
  id: BpmUUID;
  processId: BpmUUID;
  code: string;
  title: string;
  status: string;
  assignee: string;
  dueAt?: string;
  payload: unknown;
  createdAt: string;
  updatedAt: string;
};

export type BpmListResponse<TItem> = {
  items: TItem[];
};
