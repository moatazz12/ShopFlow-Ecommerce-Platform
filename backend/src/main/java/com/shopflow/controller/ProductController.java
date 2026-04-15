package com.shopflow.controller;

import com.shopflow.dto.ProductDTO;
import com.shopflow.entities.Product;
import com.shopflow.entities.Role;
import com.shopflow.entities.User;
import com.shopflow.repository.ProductRepository;
import com.shopflow.repository.UserRepository;
import com.shopflow.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Product Management", description = "APIs pour le catalogue de produits")
@Validated
@SuppressWarnings("null")
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @GetMapping
    @Operation(summary = "Recuperer tous les produits actifs avec pagination")
    @ApiResponse(responseCode = "200", description = "Liste paginee des produits")
    public ResponseEntity<Page<ProductDTO>> getAllProducts(@RequestParam(required = false) String q,
                                                           @RequestParam(required = false) String category,
                                                           @RequestParam(required = false) Double minPrice,
                                                           @RequestParam(required = false) Double maxPrice,
                                                           @RequestParam(required = false) Boolean promotionOnly,
                                                           @RequestParam(required = false) Long sellerId,
                                                           @RequestParam(required = false) String sortBy,
                                                           Pageable pageable) {
        if (q != null || category != null || minPrice != null || maxPrice != null || Boolean.TRUE.equals(promotionOnly) || sellerId != null || sortBy != null) {
            return ResponseEntity.ok(productService.searchProducts(q, category, minPrice, maxPrice, promotionOnly, sortBy, sellerId, pageable));
        }
        return ResponseEntity.ok(productService.getAllProducts(pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher des produits en full-text")
    public ResponseEntity<Page<ProductDTO>> searchProducts(@RequestParam String q,
                                                           @RequestParam(required = false) String category,
                                                           @RequestParam(required = false) Double minPrice,
                                                           @RequestParam(required = false) Double maxPrice,
                                                           @RequestParam(required = false) Boolean promotionOnly,
                                                           @RequestParam(required = false) Long sellerId,
                                                           @RequestParam(required = false) String sortBy,
                                                           Pageable pageable) {
        return ResponseEntity.ok(productService.searchProducts(q, category, minPrice, maxPrice, promotionOnly, sortBy, sellerId, pageable));
    }

    @GetMapping("/top-selling")
    @Operation(summary = "Afficher le top 10 des meilleures ventes")
    public ResponseEntity<Page<ProductDTO>> getTopSellingProducts(Pageable pageable) {
        return ResponseEntity.ok(productService.getTopSellingProducts(pageable));
    }

    @GetMapping("/promotions")
    @Operation(summary = "Afficher les produits en promotion")
    @ApiResponse(responseCode = "200", description = "Liste paginee des produits en promotion")
    public ResponseEntity<Page<ProductDTO>> getPromotionProducts(Pageable pageable) {
        return ResponseEntity.ok(productService.getPromotionProducts(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir les details d'un produit par son ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Produit trouve"),
            @ApiResponse(responseCode = "404", description = "Produit non trouve")
    })
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping
    @Operation(summary = "Creer un produit")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Produit cree"),
            @ApiResponse(responseCode = "400", description = "Categorie invalide ou donnees invalides"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Role insuffisant"),
            @ApiResponse(responseCode = "404", description = "Vendeur non trouve")
    })
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductDTO productDTO,
                                                    @RequestParam(required = false) @Positive Long sellerId,
                                                    Authentication authentication) {
        Long effectiveSellerId = resolveSellerId(authentication, sellerId);
        ProductDTO createdProduct = productService.saveProduct(productDTO, effectiveSellerId);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdProduct.getId())
                .toUri();
        return ResponseEntity.created(location).body(createdProduct);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un produit")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Produit modifie"),
            @ApiResponse(responseCode = "400", description = "Categorie invalide ou donnees invalides"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Role insuffisant"),
            @ApiResponse(responseCode = "404", description = "Produit ou vendeur non trouve")
    })
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<ProductDTO> updateProduct(@PathVariable Long id,
                                                    @Valid @RequestBody ProductDTO productDTO,
                                                    @RequestParam(required = false) @Positive Long sellerId,
                                                    Authentication authentication) {
        assertSellerOwnsProduct(authentication, id);
        Long effectiveSellerId = resolveSellerId(authentication, sellerId);
        return ResponseEntity.ok(productService.updateProduct(id, productDTO, effectiveSellerId));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desactiver un produit (soft delete)")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Produit desactive"),
            @ApiResponse(responseCode = "401", description = "Authentification requise"),
            @ApiResponse(responseCode = "403", description = "Role insuffisant"),
            @ApiResponse(responseCode = "404", description = "Produit non trouve")
    })
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id, Authentication authentication) {
        assertSellerOwnsProduct(authentication, id);
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    private Long resolveSellerId(Authentication authentication, Long requestedSellerId) {
        User actor = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur non trouve"));

        if (actor.getRole() == Role.ADMIN) {
            if (requestedSellerId == null) {
                throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,
                        "sellerId est obligatoire pour un administrateur");
            }
            return requestedSellerId;
        }

        return actor.getId();
    }

    private void assertSellerOwnsProduct(Authentication authentication, Long productId) {
        User actor = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur non trouve"));
        if (actor.getRole() == Role.ADMIN) {
            return;
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Produit non trouve"));
        if (product.getSeller() == null || !actor.getId().equals(product.getSeller().getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Vous ne pouvez modifier que vos propres produits");
        }
    }
}
