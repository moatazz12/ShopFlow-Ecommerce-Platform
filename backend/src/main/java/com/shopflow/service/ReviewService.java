package com.shopflow.service;

import com.shopflow.dto.ReviewDTO;
import com.shopflow.dto.ReviewRequest;

import java.util.List;

public interface ReviewService {
    ReviewDTO addReview(String customerEmail, Long productId, ReviewRequest request);

    List<ReviewDTO> getProductReviews(Long productId);

    List<ReviewDTO> getPendingReviews();

    ReviewDTO moderateReview(Long reviewId, boolean approved);

    Double getAverageRating(Long productId);

    long getReviewCount(Long productId);

    List<ReviewDTO> getCustomerReviews(String customerEmail);

    List<ReviewDTO> getLatestApprovedReviews(int limit);

    void deleteReview(Long reviewId);
}
