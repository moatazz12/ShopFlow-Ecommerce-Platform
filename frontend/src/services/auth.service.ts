import apiClient from "@/lib/api-client";
import { AuthLoginRequest, AuthRegisterRequest, AuthResponse, UserDTO } from "@/types";

export const authService = {
  async login(data: AuthLoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  async register(data: AuthRegisterRequest): Promise<UserDTO> {
    const response = await apiClient.post<UserDTO>("/auth/register", data);
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post(`/auth/logout?refreshToken=${refreshToken}`);
  },

  async refresh(refreshToken: string): Promise<string> {
    const response = await apiClient.post<string>(`/auth/refresh?refreshToken=${refreshToken}`);
    return response.data;
  }
};
