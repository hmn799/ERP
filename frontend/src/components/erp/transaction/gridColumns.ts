export const GridColumn = {
  BARCODE: 0,

  ITEM: 1,

  BATCH: 2,

  QTY: 3,

  FREE_QTY: 4,

  PURCHASE_RATE: 5,

  RETAIL_RATE: 6,

  WHOLESALE_RATE: 7,

  DISTRIBUTOR_RATE: 8,

  MRP: 9,
} as const;

export type GridColumnKey =
  keyof typeof GridColumn;