package com.shopflow.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CartItemDTO {
    private Long id;
    private Long productId;
    private Long variantId;
    private String productName;
    private String variantLabel;
    private String productImage;
    private Integer quantity;
    private Double unitPrice;
    private Double lineTotal;
}
