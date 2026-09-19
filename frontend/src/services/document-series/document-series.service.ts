import apiClient from "@/api/client";

import type {
  CreateDocumentSeriesDto,
  DocumentSeries,
} from "@/features/admin/document-series/types/document-series.types";

export const DocumentSeriesService = {
  async getAll(): Promise<DocumentSeries[]> {
    const { data } = await apiClient.get(
      "/document-series",
    );
    return data;
  },

  async get(id: string): Promise<DocumentSeries> {
    const { data } = await apiClient.get(
      `/document-series/${id}`,
    );
    return data;
  },

  async create(
    dto: CreateDocumentSeriesDto,
  ): Promise<DocumentSeries> {
    const { data } = await apiClient.post(
      "/document-series",
      dto,
    );
    return data;
  },

  async update(
    id: string,
    dto: Partial<CreateDocumentSeriesDto>,
  ): Promise<DocumentSeries> {
    const { data } = await apiClient.patch(
      `/document-series/${id}`,
      dto,
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(
      `/document-series/${id}`,
    );
  },

  async preview(
    documentType: string,
  ): Promise<string> {
    const { data } = await apiClient.get(
      `/document-series/preview/${documentType}`,
    );
    return data;
  },
};

export default DocumentSeriesService;
