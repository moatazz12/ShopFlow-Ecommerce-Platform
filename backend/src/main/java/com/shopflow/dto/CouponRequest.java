package com.shopflow.dto;

import com.shopflow.entities.DiscountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CouponRequest {
    @NotBlank
    private String code;

    @NotNull
    private DiscountType discountType;

    @NotNull
    private Double value;

    private LocalDateTime dateExpiration;
    private Integer usagesMax;
    private boolean active = true;
}
