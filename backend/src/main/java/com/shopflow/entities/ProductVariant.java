package com.shopflow.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductVariant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String attribut; // Ex: "Taille" ou "Couleur" [cite: 79]
    private String valeur;   // Ex: "XL" ou "Noir" [cite: 79]

    private Integer stockSupplementaire; // Stock propre à cette variante [cite: 79]
    private Double prixDelta; // Supplément de prix (ex: +5€ pour du cuir) [cite: 79]

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Product product; // Lien vers le produit principal [cite: 79]
}
