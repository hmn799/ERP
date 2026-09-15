import apiClient from "@/api/client";

import type { LoginResponse } from "@/features/auth/types/auth.types";

export const AuthService = {
  async login(
    username: string,
    password: string,
  ): Promise<LoginResponse> {
    const { data } = await apiClient.post(
      "/auth/login",
      { username, password },
    );

    return data;
  },
};

export default AuthService;
