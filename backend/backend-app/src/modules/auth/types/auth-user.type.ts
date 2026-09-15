export interface AuthUser {
  sub: string;
  username: string;
  fullName: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}
