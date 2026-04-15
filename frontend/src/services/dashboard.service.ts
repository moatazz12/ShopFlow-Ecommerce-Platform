import apiClient from "@/lib/api-client";
import { AdminDashboardDTO, SellerDashboardDTO } from "@/types";

export const dashboardService = {
  async getAdminStats(): Promise<AdminDashboardDTO> {
    const response = await apiClient.get<AdminDashboardDTO>("/dashboard/admin");
    return response.data;
  },

  async getSellerStats(): Promise<SellerDashboardDTO> {
    const response = await apiClient.get<SellerDashboardDTO>("/dashboard/seller");
    return response.data;
  }
};
