import apiClient from "@/api/client";

export interface BatchBarcode {
  id: string;
  barcode: string;
  isPrimary: boolean;
}

export interface Batch {
  id: string;
  batchNo: string;
  barcodes: BatchBarcode[];
}

const batchService = {
  async get(id: string): Promise<Batch> {
    const { data } = await apiClient.get(`/batches/${id}`);
    return data;
  },

  async addBarcode(
    batchId: string,
    barcode: string,
  ): Promise<BatchBarcode> {
    const { data } = await apiClient.post(
      `/batches/${batchId}/barcodes`,
      { barcode },
    );
    return data;
  },

  async removeBarcode(
    batchId: string,
    barcodeId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/batches/${batchId}/barcodes/${barcodeId}`,
    );
  },

  async setPrimaryBarcode(
    batchId: string,
    barcodeId: string,
  ): Promise<void> {
    await apiClient.patch(
      `/batches/${batchId}/barcodes/${barcodeId}/primary`,
    );
  },
};

export default batchService;
