package com.shopflow.service;

import com.shopflow.dto.ReviewDTO;
import com.shopflow.dto.ReviewRequest;
import com.shopflow.entities.Review;
import com.shopflow.entities.User;
import com.shopflow.repository.CustomerOrderRepository;
import com.shopflow.repository.ProductRepository;
import com.shopflow.repository.ReviewRepository;
import com.shopflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("null")
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CustomerOrderRepository orderRepository;

    @Override
    public ReviewDTO addReview(String customerEmail, Long productId, ReviewRequest request) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur non trouve"));

        productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Produit non trouve"));

        boolean hasPurchased = orderRepository.hasCustomerPurchasedProduct(customerEmail, productId);

        if (!hasPurchased) {
            throw new ResponseStatusException(BAD_REQUEST, "Avis autorisé uniquement sur un produit acheté");
        }

        Review review = reviewRepository.findByProductIdAndCustomerEmail(productId, customerEmail)
                .map(existing -> {
                    existing.setRating(request.getRating());
                    existing.setComment(request.getComment());
                    existing.setApproved(false); // Remodérer si modifié
                    existing.setCreatedAt(LocalDateTime.now());
                    return existing;
                })
                .orElseGet(() -> Review.builder()
                        .product(productRepository.findById(productId).orElseThrow())
                        .customer(customer)
                        .rating(request.getRating())
                        .comment(request.getComment())
                        .approved(false) // Par défaut en attente
                        .createdAt(LocalDateTime.now())
                        .build());

        return toDto(reviewRepository.save(review));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDTO> getProductReviews(Long productId) {
        return reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(productId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDTO> getPendingReviews() {
        return reviewRepository.findByApprovedFalseOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public ReviewDTO moderateReview(Long reviewId, boolean approved) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Avis non trouve"));
        review.setApproved(approved);
        return toDto(reviewRepository.save(review));
    }

    @Override
    @Transactional(readOnly = true)
    public Double getAverageRating(Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(productId);
        if (reviews.isEmpty()) {
            return 0.0;
        }
        return reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
    }

    @Override
    @Transactional(readOnly = true)
    public long getReviewCount(Long productId) {
        return reviewRepository.countByProductIdAndApprovedTrue(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDTO> getCustomerReviews(String customerEmail) {
        return reviewRepository.findByCustomerEmailOrderByCreatedAtDesc(customerEmail).stream()
                .map(this::toDto)
                .toList();
    }

    private ReviewDTO toDto(Review review) {
        return ReviewDTO.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .productName(review.getProduct().getNom())
                .customerEmail(review.getCustomer().getEmail())
                .rating(review.getRating())
                .comment(review.getComment())
                .approved(review.isApproved())
                .createdAt(review.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDTO> getLatestApprovedReviews(int limit) {
        return reviewRepository.findByApprovedTrueOrderByCreatedAtDesc().stream()
                .limit(limit)
                .map(this::toDto)
                .toList();
    }

    @Override
    public void deleteReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Avis non trouve"));
        reviewRepository.delete(review);
    }
}
