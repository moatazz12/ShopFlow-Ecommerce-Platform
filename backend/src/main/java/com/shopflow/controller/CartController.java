package com.shopflow.controller;

import com.shopflow.dto.CartDTO;
import com.shopflow.dto.CartItemRequest;
import com.shopflow.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "APIs de gestion du panier client")
@PreAuthorize("hasRole('CUSTOMER')")
@Validated
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Afficher le panier du client connecte")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Panier retourne"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Reserve au role CUSTOMER")
    })
    public ResponseEntity<CartDTO> getCurrentCart(Authentication authentication) {
        return ResponseEntity.ok(cartService.getCurrentCart(authentication.getName()));
    }

    @PostMapping("/items")
    @Operation(summary = "Ajouter un produit au panier")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Produit ajoute au panier"),
            @ApiResponse(responseCode = "400", description = "Stock insuffisant ou donnees invalides"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Reserve au role CUSTOMER"),
            @ApiResponse(responseCode = "404", description = "Produit non trouve")
    })
    public ResponseEntity<CartDTO> addItem(Authentication authentication, @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(cartService.addItem(authentication.getName(), request));
    }

    @PutMapping("/items/{itemId}")
    @Operation(summary = "Modifier la quantite d'un produit du panier")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Quantite mise a jour"),
            @ApiResponse(responseCode = "400", description = "Stock insuffisant ou quantite invalide"),
            @ApiResponse(responseCode = "404", description = "Produit absent du panier")
    })
    public ResponseEntity<CartDTO> updateItemQuantity(Authentication authentication,
                                                      @PathVariable Long itemId,
                                                      @RequestParam @Min(1) Integer quantity) {
        return ResponseEntity.ok(cartService.updateItemQuantity(authentication.getName(), itemId, quantity));
    }

    @PostMapping("/coupon")
    @Operation(summary = "Appliquer un code promo au panier")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Code promo applique"),
            @ApiResponse(responseCode = "404", description = "Code promo introuvable")
    })
    public ResponseEntity<CartDTO> applyPromoCode(Authentication authentication, @RequestParam @NotBlank String code) {
        return ResponseEntity.ok(cartService.applyPromoCode(authentication.getName(), code));
    }

    @DeleteMapping("/coupon")
    @Operation(summary = "Retirer le code promo du panier")
    public ResponseEntity<CartDTO> removePromoCode(Authentication authentication) {
        return ResponseEntity.ok(cartService.removePromoCode(authentication.getName()));
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Retirer un produit du panier")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Produit retire du panier"),
            @ApiResponse(responseCode = "404", description = "Produit absent du panier")
    })
    public ResponseEntity<Void> removeItem(Authentication authentication,
                                           @PathVariable Long itemId) {
        cartService.removeItem(authentication.getName(), itemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    @Operation(summary = "Vider completement le panier")
    @ApiResponse(responseCode = "204", description = "Panier vide")
    public ResponseEntity<Void> clearCart(Authentication authentication) {
        cartService.clearCart(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
