import apiClient from "@/lib/api-client";
import { CheckoutRequest, OrderDTO } from "@/types";

export const orderService = {
  async checkout(data: CheckoutRequest): Promise<OrderDTO> {
    const response = await apiClient.post<OrderDTO>("/orders", data);
    return response.data;
  },

  async getMyOrders(): Promise<OrderDTO[]> {
    const response = await apiClient.get<OrderDTO[]>("/orders/my");
    return response.data;
  },

  async getOrderById(id: number): Promise<OrderDTO> {
    const response = await apiClient.get<OrderDTO>(`/orders/${id}`);
    return response.data;
  },

  async getReceivedOrders(): Promise<OrderDTO[]> {
    const response = await apiClient.get<OrderDTO[]>("/orders/received");
    return response.data;
  },

  async updateOrderStatus(orderId: number, status: string): Promise<OrderDTO> {
    const response = await apiClient.put<OrderDTO>(`/orders/${orderId}/status`, { status });
    return response.data;
  }
};
