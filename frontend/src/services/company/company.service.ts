import apiClient from "@/api/client";

import type {
  CompanyProfile,
  UpdateCompanyDto,
} from "@/features/settings/types/company.types";

export const CompanyService = {
  async getProfile(): Promise<CompanyProfile | null> {
    const { data } = await apiClient.get("/company");
    return data;
  },

  async updateProfile(
    dto: UpdateCompanyDto,
  ): Promise<CompanyProfile> {
    const { data } = await apiClient.put(
      "/company",
      dto,
    );

    return data;
  },
};

export default CompanyService;
