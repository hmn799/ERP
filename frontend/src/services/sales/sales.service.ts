import api from "@/api";

export const salesService = {
  async findAll() {
    const { data } = await api.get("/sales");

    return data;
  },

  async findOne(id: string) {
    const { data } = await api.get(`/sales/${id}`);

    return data;
  },

  async create(body: unknown) {
    const { data } = await api.post("/sales", body);

    return data;
  },

  async remove(id: string) {
    const { data } = await api.delete(`/sales/${id}`);

    return data;
  },
};

export default salesService;