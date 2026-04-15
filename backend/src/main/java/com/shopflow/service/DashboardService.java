package com.shopflow.service;

import com.shopflow.dto.AdminDashboardDTO;
import com.shopflow.dto.CustomerDashboardDTO;
import com.shopflow.dto.SellerDashboardDTO;

public interface DashboardService {
    AdminDashboardDTO getAdminDashboard();

    SellerDashboardDTO getSellerDashboard(String sellerEmail);

    CustomerDashboardDTO getCustomerDashboard(String customerEmail);
}
