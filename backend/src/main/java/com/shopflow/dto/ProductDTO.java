package com.shopflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.util.List;

@Data
public class ProductDTO {
    private Long id;

    @NotBlank
    private String nom;

    private String description;

    @NotNull
    @Positive
    private Double prix;

    @PositiveOrZero
    private Double prixPromo;

    @PositiveOrZero
    private Integer stock;
    private boolean actif = true;
    private String sellerName;
    private List<String> categoryNames;
    private List<String> images;
    private List<ProductVariantDTO> variants;
    private Double averageRating;
    private Long reviewCount;
    private List<ReviewDTO> reviews;

    @JsonProperty("discountPercentage")
    public Double getDiscountPercentage() {
        if (prix == null || prixPromo == null || prix <= 0 || prixPromo >= prix) {
            return 0.0;
        }
        return ((prix - prixPromo) / prix) * 100;
    }
}
