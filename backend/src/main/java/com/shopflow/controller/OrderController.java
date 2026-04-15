package com.shopflow.controller;

import com.shopflow.dto.CheckoutRequest;
import com.shopflow.dto.OrderDTO;
import com.shopflow.dto.OrderStatusUpdateRequest;
import com.shopflow.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "APIs de commande et paiement simule")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Transformer le panier en commande avec paiement simule")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Commande creee"),
            @ApiResponse(responseCode = "400", description = "Panier vide, stock insuffisant ou paiement echoue"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Reserve au role CUSTOMER")
    })
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderDTO> checkout(Authentication authentication,
            @Valid @RequestBody CheckoutRequest request) {
        return ResponseEntity.ok(orderService.checkout(authentication.getName(), request));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Afficher le detail d'une commande")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detail de la commande retourne"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Acces refuse a cette commande"),
            @ApiResponse(responseCode = "404", description = "Commande non trouvee")
    })
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrderDTO> getOrderById(Authentication authentication, @PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId, authentication.getName()));
    }

    @GetMapping("/my")
    @Operation(summary = "Afficher les commandes du client connecte")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des commandes client"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Role CUSTOMER requis")
    })
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<List<OrderDTO>> getMyOrders(Authentication authentication) {
        return ResponseEntity.ok(orderService.getCustomerOrders(authentication.getName()));
    }

    @GetMapping("/received")
    @Operation(summary = "Afficher les commandes recues par le vendeur connecte")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des commandes vendeur"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Role SELLER ou ADMIN requis")
    })
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<List<OrderDTO>> getReceivedOrders(Authentication authentication) {
        return ResponseEntity.ok(orderService.getSellerOrders(authentication.getName()));
    }

    @GetMapping
    @Operation(summary = "Afficher toutes les commandes pour l'administrateur")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste de toutes les commandes"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Role ADMIN requis")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderDTO>> getAllOrders(Authentication authentication) {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PutMapping("/{orderId}/status")
    @Operation(summary = "Mettre a jour le statut d'une commande")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Statut mis a jour"),
            @ApiResponse(responseCode = "403", description = "Acces refuse a la commande"),
            @ApiResponse(responseCode = "404", description = "Commande non trouvee")
    })
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<OrderDTO> updateOrderStatus(Authentication authentication,
            @PathVariable Long orderId,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        return ResponseEntity
                .ok(orderService.updateOrderStatus(orderId, authentication.getName(), request.getStatus()));
    }

    @PutMapping("/{orderId}/cancel")
    @Operation(summary = "Annuler une commande si son statut le permet")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Commande annulee"),
            @ApiResponse(responseCode = "400", description = "Commande non annulable"),
            @ApiResponse(responseCode = "403", description = "Acces refuse"),
            @ApiResponse(responseCode = "404", description = "Commande non trouvee")
    })
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderDTO> cancelOrder(Authentication authentication, @PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.cancelOrder(orderId, authentication.getName()));
    }
}
