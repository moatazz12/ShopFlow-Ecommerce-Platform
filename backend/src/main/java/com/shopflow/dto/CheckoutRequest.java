package com.shopflow.dto;

import lombok.Data;

@Data
public class CheckoutRequest {
    private boolean paymentSuccess = true;
    private Long shippingAddressId;
}
