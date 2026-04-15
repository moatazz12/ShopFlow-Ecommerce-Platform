package com.shopflow.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderItemDTO {
    private Long productId;
    private String productName;
    private Long variantId;
    private String variantLabel;
    private String sellerName;
    private Integer quantity;
    private Double unitPrice;
    private Double subtotal;
}
