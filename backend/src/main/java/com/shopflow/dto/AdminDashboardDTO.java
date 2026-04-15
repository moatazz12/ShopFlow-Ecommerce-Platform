package com.shopflow.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminDashboardDTO {
    private Double globalRevenue;
    private List<String> topProducts;
    private List<String> topSellers;
    private List<String> recentOrders;
}
