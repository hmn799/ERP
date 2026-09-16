export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
