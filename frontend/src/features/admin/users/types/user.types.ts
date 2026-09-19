export interface User {
  id: string;
  username: string;
  fullName: string;
  mobile?: string | null;
  isActive: boolean;
  roleId: string;
  role: {
    id: string;
    name: string;
  };
}

export interface CreateUserDto {
  username: string;
  password: string;
  fullName: string;
  mobile?: string;
  roleId: string;
  isActive?: boolean;
}

export interface UpdateUserDto {
  fullName?: string;
  mobile?: string;
  roleId?: string;
  isActive?: boolean;
}
