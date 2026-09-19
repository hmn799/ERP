import apiClient from "@/api/client";

export interface Permission {
  id: string;
  code: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  userCount?: number;
  permissions?: Permission[];
}

export interface CreateRoleDto {
  name: string;
  permissionIds?: string[];
}

export interface UpdateRoleDto {
  name: string;
}

export const RoleService = {
  async getAll(): Promise<Role[]> {
    const { data } = await apiClient.get("/roles");
    return data;
  },

  async get(id: string): Promise<Role> {
    const { data } = await apiClient.get(
      `/roles/${id}`,
    );
    return data;
  },

  async create(dto: CreateRoleDto): Promise<Role> {
    const { data } = await apiClient.post(
      "/roles",
      dto,
    );
    return data;
  },

  async update(
    id: string,
    dto: UpdateRoleDto,
  ): Promise<Role> {
    const { data } = await apiClient.put(
      `/roles/${id}`,
      dto,
    );

    return data;
  },

  async updatePermissions(
    id: string,
    permissionIds: string[],
  ): Promise<Role> {
    const { data } = await apiClient.put(
      `/roles/${id}/permissions`,
      { permissionIds },
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/roles/${id}`);
  },
};

export default RoleService;
