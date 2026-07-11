import apiClient from "@/api/client";

import type {
  Customer,
  CreateCustomerDto,
} from "@/features/masters/customers/types/customer.types";

export const CustomerService = {
  async getAll(): Promise<Customer[]> {
    const { data } = await apiClient.get("/customers");
    return data;
  },

  async get(id: string): Promise<Customer> {
    const { data } = await apiClient.get(`/customers/${id}`);
    return data;
  },

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const { data } = await apiClient.post("/customers", dto);
    return data;
  },

  async update(
    id: string,
    dto: CreateCustomerDto,
  ): Promise<Customer> {
    const { data } = await apiClient.put(
      `/customers/${id}`,
      dto,
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },
};

export default CustomerService;