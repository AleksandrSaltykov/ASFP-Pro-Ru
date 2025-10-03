export type AnalyticsConversionRow = {
  period: string;
  totalCount: number;
  wonCount: number;
  totalAmount: number;
  wonAmount: number;
  conversionRate: number;
};

export type AnalyticsManagerLoadRow = {
  manager: string;
  totalCount: number;
  totalAmount: number;
};

export type AnalyticsExportFile = {
  fileName: string;
  mimeType: string;
  contentBase64: string;
  generatedAt: string;
};

export type AnalyticsListResponse<TItem> = {
  items: TItem[];
};

export type AnalyticsRange = {
  from?: Date | string;
  to?: Date | string;
};
