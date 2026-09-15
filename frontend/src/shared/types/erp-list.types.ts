export interface ERPListQuery {
  page: number;

  pageSize: number;

  search: string;

  supplierId?: string;

  warehouseId?: string;

  fromDate?: string;

  toDate?: string;

  status?: string;

  sortBy?: string;

  sortOrder?: "asc" | "desc";

  filters?: Record<
    string,
    string | number | boolean | undefined
  >;
}

export interface ERPListResponse<T> {
  data: T[];

  total: number;

  page: number;

  pageSize: number;
}

export interface ERPListFetcher<T> {
  (
    query: ERPListQuery,
  ): Promise<ERPListResponse<T>>;
}