import apiClient from "@/lib/api-client";

export interface AddressDTO {
  id?: number;
  rue: string;
  ville: string;
  codePostal: string;
  pays: string;
  principal: boolean;
  type: string;
}

export const addressService = {
  async getMyAddresses(): Promise<AddressDTO[]> {
    const response = await apiClient.get<AddressDTO[]>("/addresses");
    return response.data;
  },

  async addAddress(data: AddressDTO): Promise<AddressDTO> {
    const response = await apiClient.post<AddressDTO>("/addresses", data);
    return response.data;
  },

  async deleteAddress(id: number): Promise<void> {
    await apiClient.delete(`/addresses/${id}`);
  }
};
