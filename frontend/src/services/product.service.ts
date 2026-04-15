import apiClient from "@/lib/api-client";
import { CategoryDTO, ProductDTO } from "@/types";

export interface SearchParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  promotionOnly?: boolean;
  sortBy?: string;
  sellerId?: number;
  page?: number;
  size?: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const productService = {
  async getProducts(params: SearchParams): Promise<PaginatedResponse<ProductDTO>> {
    const response = await apiClient.get<PaginatedResponse<ProductDTO>>("/products", { params });
    return response.data;
  },

  async getProductById(id: number): Promise<ProductDTO> {
    const response = await apiClient.get<ProductDTO>(`/products/${id}`);
    return response.data;
  },

  async getCategories(): Promise<CategoryDTO[]> {
    const response = await apiClient.get<CategoryDTO[]>("/categories");
    return response.data;
  },

  async getPromotionProducts(page = 0, size = 10): Promise<PaginatedResponse<ProductDTO>> {
    const response = await apiClient.get<PaginatedResponse<ProductDTO>>("/products/promotions", {
      params: { page, size }
    });
    return response.data;
  },

  async saveProduct(data: Partial<ProductDTO>): Promise<ProductDTO> {
    const response = await apiClient.post<ProductDTO>("/products", data);
    return response.data;
  },

  async updateProduct(id: number, data: Partial<ProductDTO>): Promise<ProductDTO> {
    const response = await apiClient.put<ProductDTO>(`/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  }
};
