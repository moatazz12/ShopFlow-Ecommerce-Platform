package com.shopflow.repository;

import com.shopflow.entities.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByParentIsNull();

    List<Category> findByNomIn(List<String> noms);
    java.util.Optional<Category> findByNomIgnoreCase(String nom);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM product_category WHERE category_id = :categoryId", nativeQuery = true)
    void deleteAssociationsInProductCategory(
            @org.springframework.data.repository.query.Param("categoryId") Long categoryId);
}
