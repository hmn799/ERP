export class ItemLookupDto {
  id!: string;

  itemCode!: string;

  name!: string;

  barcode!: string | null;

  purchaseRate!: number;

  retailRate!: number;

  wholesaleRate!: number;

  distributorRate!: number;

  mrp!: number;

  gstPercent!: number;

  unit!: string;
}