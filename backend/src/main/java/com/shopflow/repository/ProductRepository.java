package com.shopflow.repository;

import com.shopflow.entities.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    // Pagination demandée au point 2.1
    Page<Product> findByActifTrue(Pageable pageable);

    // Recherche par prix min/max demandée au point 2.1
    List<Product> findByPrixBetween(Double min, Double max);

    // Filtre par vendeur (SELLER) pour son dashboard
    List<Product> findBySellerId(Long sellerId);

    Page<Product> findByActifTrueAndPrixPromoIsNotNull(Pageable pageable);

    @Query(value = """
            SELECT p.* FROM product p
            LEFT JOIN order_item oi ON oi.product_id = p.id
            WHERE p.actif = true
            GROUP BY p.id
            ORDER BY count(oi.id) DESC, p.date_creation DESC
            """, nativeQuery = true)
    List<Product> findPopularActiveProductsNative();
}
