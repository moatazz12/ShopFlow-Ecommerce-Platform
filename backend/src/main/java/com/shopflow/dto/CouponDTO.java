package com.shopflow.dto;

import com.shopflow.entities.DiscountType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CouponDTO {
    private Long id;
    private String code;
    private DiscountType discountType;
    private Double value;
    private LocalDateTime dateExpiration;
    private Integer usagesMax;
    private Integer usagesActuels;
    private boolean active;
    private boolean valid;
}
