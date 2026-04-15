package com.shopflow.controller;

import com.shopflow.dto.ReviewDTO;
import com.shopflow.dto.ReviewRequest;
import com.shopflow.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "APIs d'avis et notation produit")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/product/{productId}")
    @Operation(summary = "Afficher les avis moderes d'un produit")
    @ApiResponse(responseCode = "200", description = "Liste des avis")
    public ResponseEntity<List<ReviewDTO>> getProductReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId));
    }

    @GetMapping("/pending")
    @Operation(summary = "Afficher les avis en attente de moderation")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReviewDTO>> getPendingReviews() {
        return ResponseEntity.ok(reviewService.getPendingReviews());
    }

    @GetMapping("/customer/{email}")
    @Operation(summary = "Afficher les avis d'un client")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ReviewDTO>> getCustomerReviews(@PathVariable String email) {
        return ResponseEntity.ok(reviewService.getCustomerReviews(email));
    }

    @PostMapping
    @Operation(summary = "Laisser un avis sur un produit achete")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Avis cree"),
            @ApiResponse(responseCode = "400", description = "Produit non achete ou avis deja present")
    })
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewDTO> addReview(Authentication authentication,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.addReview(authentication.getName(), request.getProductId(), request));
    }

    @PutMapping("/{reviewId}/approve")
    @Operation(summary = "Approuver un avis par l'administrateur")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Avis modere"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Role ADMIN requis"),
            @ApiResponse(responseCode = "404", description = "Avis non trouve")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReviewDTO> moderateReview(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.moderateReview(reviewId, true));
    }

    @DeleteMapping("/{reviewId}")
    @Operation(summary = "Supprimer (rejeter) un avis par l'administrateur")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Avis supprimé"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Role ADMIN requis"),
            @ApiResponse(responseCode = "404", description = "Avis non trouvé")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.noContent().build();
    }
}
