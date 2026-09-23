import apiClient from "@/api/client";

export type AdjustmentNoteType = "DEBIT" | "CREDIT";

export interface AdjustmentNoteItem {
  id: string;
  description: string;
  hsnCode?: string | null;
  taxableAmount: number | string;
  gstPercent: number | string;
  cgstAmount: number | string;
  sgstAmount: number | string;
  igstAmount: number | string;
  netAmount: number | string;
}

export interface AdjustmentNote {
  id: string;
  noteNo: string;
  noteType: AdjustmentNoteType;
  noteDate: string;
  partyType: "SUPPLIER" | "CUSTOMER";
  partyId: string;
  partyName: string;
  reason: string;
  taxableAmount: number | string;
  cgstAmount: number | string;
  sgstAmount: number | string;
  igstAmount: number | string;
  netAmount: number | string;
  status: string;
  items: AdjustmentNoteItem[];
}

export interface CreateAdjustmentNoteItemDto {
  description: string;
  hsnCode?: string;
  taxableAmount: number;
  gstPercent: number;
}

export interface CreateAdjustmentNoteDto {
  noteType: AdjustmentNoteType;
  noteDate: string;
  partyId: string;
  reason: string;
  items: CreateAdjustmentNoteItemDto[];
}

const AdjustmentNoteService = {
  async getAll(
    noteType: AdjustmentNoteType,
  ): Promise<AdjustmentNote[]> {
    const { data } = await apiClient.get(
      `/adjustment-notes?noteType=${noteType}`,
    );
    return data;
  },

  async create(
    dto: CreateAdjustmentNoteDto,
  ): Promise<AdjustmentNote> {
    const { data } = await apiClient.post(
      "/adjustment-notes",
      dto,
    );
    return data;
  },

  async cancel(id: string): Promise<AdjustmentNote> {
    const { data } = await apiClient.post(
      `/adjustment-notes/${id}/cancel`,
    );
    return data;
  },
};

export default AdjustmentNoteService;
