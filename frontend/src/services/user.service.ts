import apiClient from "@/lib/api-client";

export const userService = {
  async updateProfile(data: any) {
    const response = await apiClient.put("/users/me", data);
    return response.data;
  },

  async changePassword(data: any) {
    await apiClient.patch("/users/me/password", data);
  }
};
