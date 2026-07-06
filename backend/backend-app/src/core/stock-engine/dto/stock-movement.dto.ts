import { StockMovementType } from '../stock-movement-type.enum';

export class StockMovementDto {
  movementType: StockMovementType;

  warehouseId: string;

  itemId: string;

  batchId: string;

  qty: number;

  referenceId: string;

  referenceType: string;

  referenceNo: string;

  movementDate: Date;

  remarks?: string;

  createdBy?: string;
}