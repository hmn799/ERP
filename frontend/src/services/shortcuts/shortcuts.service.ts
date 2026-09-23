import apiClient from "@/api/client";

export interface ShortcutRoleOverride {
  id: string;
  roleId: string;
  isEnabled: boolean;
  role: { id: string; name: string };
}

export interface Shortcut {
  id: string;
  actionCode: string;
  label: string;
  category: string | null;
  defaultKey: string;
  currentKey: string;
  isEnabled: boolean;
  actionType: "SYSTEM" | "NAVIGATE";
  targetPath: string | null;
  roleOverrides: ShortcutRoleOverride[];
}

export interface EffectiveShortcut {
  actionCode: string;
  label: string;
  category: string | null;
  key: string;
  actionType: "SYSTEM" | "NAVIGATE";
  targetPath: string | null;
  enabled: boolean;
}

export interface CreateShortcutDto {
  label: string;
  category?: string;
  key: string;
  targetPath: string;
}

export const ShortcutsService = {
  async getAll(): Promise<Shortcut[]> {
    const { data } = await apiClient.get(
      "/shortcuts",
    );
    return data;
  },

  async getEffective(
    roleId: string,
  ): Promise<EffectiveShortcut[]> {
    const { data } = await apiClient.get(
      `/shortcuts/effective/${roleId}`,
    );
    return data;
  },

  async create(
    dto: CreateShortcutDto,
  ): Promise<Shortcut> {
    const { data } = await apiClient.post(
      "/shortcuts",
      dto,
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/shortcuts/${id}`);
  },

  async update(
    id: string,
    dto: { currentKey?: string; isEnabled?: boolean },
  ): Promise<Shortcut> {
    const { data } = await apiClient.put(
      `/shortcuts/${id}`,
      dto,
    );
    return data;
  },

  async resetToDefault(id: string): Promise<Shortcut> {
    const { data } = await apiClient.put(
      `/shortcuts/${id}/reset`,
    );
    return data;
  },

  async setRoleOverride(
    shortcutId: string,
    roleId: string,
    isEnabled: boolean,
  ): Promise<ShortcutRoleOverride> {
    const { data } = await apiClient.put(
      `/shortcuts/${shortcutId}/role/${roleId}`,
      { isEnabled },
    );
    return data;
  },

  async removeRoleOverride(
    shortcutId: string,
    roleId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/shortcuts/${shortcutId}/role/${roleId}`,
    );
  },
};

export default ShortcutsService;
