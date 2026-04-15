package com.shopflow.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CartDTO {
    private Long id;
    private String customerEmail;
    private List<CartItemDTO> items;
    private Integer totalItems;
    private Double subtotalAmount;
    private Double discountAmount;
    private Double shippingFee;
    private Double taxAmount;
    private Double totalAmount;
    private String promoCode;
}
