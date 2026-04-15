import apiClient from "@/lib/api-client";
import { CartDTO, CartItemRequest } from "@/types";

export const cartService = {
  async getCart(): Promise<CartDTO> {
    const response = await apiClient.get<CartDTO>("/cart");
    return response.data;
  },

  async addItem(data: CartItemRequest): Promise<CartDTO> {
    const response = await apiClient.post<CartDTO>("/cart/items", data);
    return response.data;
  },

  async updateQuantity(itemId: number, quantity: number): Promise<CartDTO> {
    const response = await apiClient.put<CartDTO>(`/cart/items/${itemId}?quantity=${quantity}`);
    return response.data;
  },

  async removeItem(itemId: number): Promise<void> {
    await apiClient.delete(`/cart/items/${itemId}`);
  },

  async clearCart(): Promise<void> {
    await apiClient.delete("/cart");
  },

  async applyCoupon(code: string): Promise<CartDTO> {
    const response = await apiClient.post<CartDTO>(`/cart/coupon?code=${code}`);
    return response.data;
  },

  async removeCoupon(): Promise<CartDTO> {
    const response = await apiClient.delete<CartDTO>("/cart/coupon");
    return response.data;
  }
};
