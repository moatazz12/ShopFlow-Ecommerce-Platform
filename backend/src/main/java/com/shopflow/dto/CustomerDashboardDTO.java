package com.shopflow.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CustomerDashboardDTO {
    private List<String> currentOrders;
    private List<String> latestReviews;
}
