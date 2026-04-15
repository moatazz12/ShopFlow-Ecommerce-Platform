import apiClient from "@/lib/api-client";
import { ReviewDTO } from "@/types";

export const reviewService = {
  /** Avis en attente de modération (ADMIN) */
  async getPendingReviews(): Promise<ReviewDTO[]> {
    const response = await apiClient.get<ReviewDTO[]>("/reviews/pending");
    return response.data;
  },

  /** Derniers avis approuvés (page d'accueil publique) */
  async getLatestReviews(): Promise<ReviewDTO[]> {
    const response = await apiClient.get<ReviewDTO[]>("/reviews/latest");
    return response.data;
  },

  /** Avis approuvés d'un produit */
  async getProductReviews(productId: number): Promise<ReviewDTO[]> {
    const response = await apiClient.get<ReviewDTO[]>(`/reviews/product/${productId}`);
    return response.data;
  },

  /** Approuver un avis (ADMIN) */
  async approveReview(reviewId: number): Promise<ReviewDTO> {
    const response = await apiClient.put<ReviewDTO>(`/reviews/${reviewId}/approve`);
    return response.data;
  },

  /** Rejeter / supprimer un avis (ADMIN) */
  async deleteReview(reviewId: number): Promise<void> {
    await apiClient.delete(`/reviews/${reviewId}`);
  },

  /** Soumettre un avis (CUSTOMER - produit acheté uniquement) */
  async submitReview(productId: number, rating: number, comment: string): Promise<ReviewDTO> {
    const response = await apiClient.post<ReviewDTO>("/reviews", { productId, rating, comment });
    return response.data;
  }
};
