import salesService from "../sales/sales.service";

export const dashboardService = {
  async getDashboard() {
    const sales = await salesService.findAll();

    return {
      sales,
    };
  },
};

export default dashboardService;