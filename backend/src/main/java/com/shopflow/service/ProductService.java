package com.shopflow.service;

import com.shopflow.dto.ProductDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductService {
    Page<ProductDTO> getAllProducts(Pageable pageable);
    Page<ProductDTO> searchProducts(String q, String category, Double minPrice, Double maxPrice, Boolean promotionOnly, String sortBy, Long sellerId, Pageable pageable);
    Page<ProductDTO> getPromotionProducts(Pageable pageable);
    Page<ProductDTO> getTopSellingProducts(Pageable pageable);
    ProductDTO getProductById(Long id);
    ProductDTO saveProduct(ProductDTO productDTO, Long sellerId);
    ProductDTO updateProduct(Long id, ProductDTO productDTO, Long sellerId);
    void deleteProduct(Long id); // Sera un "soft delete"
}
