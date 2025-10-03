export type DocsUUID = string;

export type DocsTemplate = {
  id: DocsUUID;
  code: string;
  name: string;
  description: string;
  version: number;
  body: unknown;
  createdAt: string;
  updatedAt: string;
};

export type DocsSigner = {
  id: DocsUUID;
  code: string;
  fullName: string;
  position: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

export type DocsDocumentSigner = {
  id: DocsUUID;
  signerId: DocsUUID;
  fullName: string;
  email: string;
  status: string;
  order: number;
  signedAt?: string;
  updatedAt: string;
};

export type DocsDocument = {
  id: DocsUUID;
  templateId: DocsUUID;
  sequenceId: DocsUUID;
  number: string;
  title: string;
  status: string;
  payload: unknown;
  issuedAt?: string;
  signedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  signers: DocsDocumentSigner[];
};

export type DocsListResponse<TItem> = {
  items: TItem[];
};
