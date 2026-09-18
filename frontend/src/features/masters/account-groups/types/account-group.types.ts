export const ACCOUNT_GROUP_NATURE_TYPES = [
  "ASSET",
  "LIABILITY",
  "INCOME",
  "EXPENSE",
] as const;

export type AccountGroupNatureType =
  (typeof ACCOUNT_GROUP_NATURE_TYPES)[number];

export interface AccountGroup {
  id: string;
  name: string;
  natureType: AccountGroupNatureType;
  description?: string | null;
  isActive: boolean;
}

export interface CreateAccountGroupDto {
  name: string;
  natureType: AccountGroupNatureType;
  description?: string;
}
