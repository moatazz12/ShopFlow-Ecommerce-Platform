package com.shopflow.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SellerDashboardDTO {
    private Double revenue;
    private Long pendingOrders;
    private List<String> lowStockAlerts;
}
