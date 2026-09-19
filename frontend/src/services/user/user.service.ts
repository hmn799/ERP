import apiClient from "@/api/client";

import type {
  CreateUserDto,
  UpdateUserDto,
  User,
} from "@/features/admin/users/types/user.types";

export const UserService = {
  async getAll(): Promise<User[]> {
    const { data } = await apiClient.get("/users");
    return data;
  },

  async get(id: string): Promise<User> {
    const { data } = await apiClient.get(
      `/users/${id}`,
    );
    return data;
  },

  async create(
    dto: CreateUserDto,
  ): Promise<User> {
    const { data } = await apiClient.post(
      "/users",
      dto,
    );
    return data;
  },

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<User> {
    const { data } = await apiClient.patch(
      `/users/${id}`,
      dto,
    );

    return data;
  },

  async resetPassword(
    id: string,
    newPassword: string,
  ): Promise<void> {
    await apiClient.patch(
      `/users/${id}/reset-password`,
      { newPassword },
    );
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};

export default UserService;
