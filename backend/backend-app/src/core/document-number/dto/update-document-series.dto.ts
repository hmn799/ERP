export class UpdateDocumentSeriesDto {
  documentType?: string;

  name?: string;

  prefix?: string;

  suffix?: string;

  padding?: number;

  currentNumber?: number;

  resetYearly?: boolean;

  financialYear?: string;

  isActive?: boolean;
}