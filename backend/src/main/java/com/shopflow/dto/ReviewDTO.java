package com.shopflow.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String customerEmail;
    private Integer rating;
    private String comment;
    private boolean approved;
    private LocalDateTime createdAt;
}
