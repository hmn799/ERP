import apiClient from "@/api/client";

import type {
  AccountGroup,
  CreateAccountGroupDto,
} from "@/features/masters/account-groups/types/account-group.types";

export const AccountGroupService = {
  async getAll(): Promise<AccountGroup[]> {
    const { data } = await apiClient.get(
      "/account-groups",
    );
    return data;
  },

  async get(id: string): Promise<AccountGroup> {
    const { data } = await apiClient.get(
      `/account-groups/${id}`,
    );
    return data;
  },

  async create(
    dto: CreateAccountGroupDto,
  ): Promise<AccountGroup> {
    const { data } = await apiClient.post(
      "/account-groups",
      dto,
    );
    return data;
  },

  async update(
    id: string,
    dto: CreateAccountGroupDto,
  ): Promise<AccountGroup> {
    const { data } = await apiClient.put(
      `/account-groups/${id}`,
      dto,
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(
      `/account-groups/${id}`,
    );
  },
};

export default AccountGroupService;
