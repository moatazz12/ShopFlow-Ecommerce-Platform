package com.shopflow.dto;

import com.shopflow.entities.OrderStatus;
import com.shopflow.entities.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderDTO {
    private Long id;
    private String customerEmail;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private Double totalAmount;
    private Double subtotalAmount;
    private Double discountAmount;
    private Double shippingFee;
    private Double taxAmount;
    private String orderNumber;
    private String paymentReference;
    private Long shippingAddressId;
    private boolean isNew;
    private boolean refunded;
    private LocalDateTime createdAt;
    private List<OrderItemDTO> items;
}
