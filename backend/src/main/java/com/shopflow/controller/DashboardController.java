package com.shopflow.controller;

import com.shopflow.dto.AdminDashboardDTO;
import com.shopflow.dto.CustomerDashboardDTO;
import com.shopflow.dto.SellerDashboardDTO;
import com.shopflow.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "APIs de synthese par role")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/admin")
    @Operation(summary = "Afficher le tableau de bord administrateur")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Donnees du tableau de bord admin"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Role ADMIN requis")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardDTO> getAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }

    @GetMapping("/seller")
    @Operation(summary = "Afficher le tableau de bord vendeur")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Donnees du tableau de bord vendeur"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Role SELLER requis")
    })
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerDashboardDTO> getSellerDashboard(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getSellerDashboard(authentication.getName()));
    }

    @GetMapping("/customer")
    @Operation(summary = "Afficher le tableau de bord client")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Donnees du tableau de bord client"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Role CUSTOMER requis")
    })
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerDashboardDTO> getCustomerDashboard(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getCustomerDashboard(authentication.getName()));
    }
}
