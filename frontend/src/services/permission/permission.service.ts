import apiClient from "@/api/client";

import type { Permission } from "@/services/role/role.service";

export const PermissionService = {
  async getAll(): Promise<Permission[]> {
    const { data } = await apiClient.get(
      "/permissions",
    );
    return data;
  },
};

export default PermissionService;
