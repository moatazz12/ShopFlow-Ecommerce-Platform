package com.shopflow.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    private String description;

    private Double prix;

    private Double prixPromo; // Pour gérer le prix barré

    private Integer stock;

    @Builder.Default
    private boolean actif = true;

    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

    // Relation avec le Vendeur (User avec rôle SELLER)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User seller;

    // Relation Many-to-Many avec les catégories
    @ManyToMany
    @JoinTable(
            name = "product_category",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<Category> categories = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    @ElementCollection
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
        if (stock == null) {
            stock = 0;
        }
        if (prixPromo != null && prix != null && prixPromo > prix) {
            prixPromo = prix;
        }
    }

    @PreUpdate
    void preUpdate() {
        if (stock == null) {
            stock = 0;
        }
        if (prixPromo != null && prix != null && prixPromo > prix) {
            prixPromo = prix;
        }
    }
}
