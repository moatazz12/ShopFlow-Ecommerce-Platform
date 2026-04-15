package com.shopflow.repository;

import com.shopflow.entities.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductIdAndApprovedTrueOrderByCreatedAtDesc(Long productId);
    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    List<Review> findByApprovedFalseOrderByCreatedAtDesc();
    List<Review> findByApprovedTrueOrderByCreatedAtDesc();

    List<Review> findByCustomerEmailOrderByCreatedAtDesc(String email);

    Optional<Review> findByProductIdAndCustomerEmail(Long productId, String email);

    long countByProductIdAndApprovedTrue(Long productId);
    long countByApprovedFalse();
}
