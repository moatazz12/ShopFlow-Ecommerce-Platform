package com.shopflow.dto;

import lombok.Data;

@Data
public class ProductVariantDTO {
    private Long id;
    private String attribut;
    private String valeur;
    private Integer stockSupplementaire;
    private Double prixDelta;
}
