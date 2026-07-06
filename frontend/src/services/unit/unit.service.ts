import api from "@/api/client";

import { Unit } from "@/features/masters/units/types/unit.types";

export interface CreateUnitDto {
  name: string;
  shortName: string;
}

export const UnitService = {
  async getAll() {
    const { data } = await api.get<Unit[]>("/units");
    return data;
  },

  async create(dto: CreateUnitDto) {
    const { data } = await api.post<Unit>("/units", dto);
    return data;
  },

  async update(
    id: string,
    dto: CreateUnitDto,
  ) {
    const { data } = await api.patch<Unit>(
      `/units/${id}`,
      dto,
    );

    return data;
  },

  async remove(id: string) {
    await api.delete(`/units/${id}`);
  },
};
export default UnitService;