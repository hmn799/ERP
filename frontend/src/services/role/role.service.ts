import apiClient from "@/api/client";

export interface Role {
  id: string;
  name: string;
}

export const RoleService = {
  async getAll(): Promise<Role[]> {
    const { data } = await apiClient.get("/roles");
    return data;
  },
};

export default RoleService;
