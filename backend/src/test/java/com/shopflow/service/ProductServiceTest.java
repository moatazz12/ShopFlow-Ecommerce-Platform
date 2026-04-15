package com.shopflow.service;

import com.shopflow.dto.ProductDTO;
import com.shopflow.dto.ProductVariantDTO;
import com.shopflow.entities.Category;
import com.shopflow.entities.Product;
import com.shopflow.entities.ProductVariant;
import com.shopflow.entities.Review;
import com.shopflow.entities.User;
import com.shopflow.exception.BadRequestException;
import com.shopflow.exception.ResourceNotFoundException;
import com.shopflow.mapper.ProductMapper;
import com.shopflow.repository.CategoryRepository;
import com.shopflow.repository.ProductRepository;
import com.shopflow.repository.ReviewRepository;
import com.shopflow.repository.UserRepository;
import com.shopflow.repository.CustomerOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductMapper productMapper;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private CustomerOrderRepository customerOrderRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private User seller;
    private Product product;
    private ProductDTO productDTO;

    @BeforeEach
    void setUp() {
        seller = new User();
        seller.setId(1L);
        seller.setNom("MELEK");
        seller.setEmail("seller@shopflow.com");

        product = new Product();
        product.setId(10L);
        product.setNom("PC Test");
        product.setDescription("Gaming");
        product.setPrix(1000.0);
        product.setPrixPromo(900.0);
        product.setStock(5);
        product.setActif(true);
        product.setSeller(seller);

        productDTO = new ProductDTO();
        productDTO.setNom("PC Test");
        productDTO.setPrix(1000.0);
        productDTO.setPrixPromo(900.0);
        productDTO.setStock(5);
    }

    @Test
    void testSaveProductSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(seller));
        when(productMapper.toEntity(any(ProductDTO.class))).thenReturn(product);
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(productMapper.toDto(any(Product.class))).thenReturn(productDTO);
        when(reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(any())).thenReturn(List.of());

        ProductDTO result = productService.saveProduct(productDTO, 1L);

        assertNotNull(result);
        assertEquals("PC Test", result.getNom());
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void saveProductMapsCategoriesImagesAndVariants() {
        Category category = Category.builder().id(2L).nom("SPORT").build();
        ProductVariantDTO variantDTO = new ProductVariantDTO();
        variantDTO.setAttribut("Couleur");
        variantDTO.setValeur("Rouge");
        ProductVariant variant = ProductVariant.builder().id(5L).attribut("Couleur").valeur("Rouge").build();
        productDTO.setCategoryNames(List.of("SPORT"));
        productDTO.setImages(List.of("a.png", "b.png"));
        productDTO.setVariants(List.of(variantDTO));

        when(userRepository.findById(1L)).thenReturn(Optional.of(seller));
        when(productMapper.toEntity(any(ProductDTO.class))).thenReturn(product);
        when(categoryRepository.findByNomIn(productDTO.getCategoryNames())).thenReturn(List.of(category));
        when(productMapper.toEntity(any(ProductVariantDTO.class))).thenReturn(variant);
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(productMapper.toDto(any(Product.class))).thenReturn(productDTO);
        when(reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(any())).thenReturn(List.of());

        productService.saveProduct(productDTO, 1L);

        assertEquals(1, product.getCategories().size());
        assertEquals(2, product.getImages().size());
        assertEquals(1, product.getVariants().size());
        assertEquals(product, product.getVariants().get(0).getProduct());
    }

    @Test
    void getAllProductsMapsActiveProductsPage() {
        when(productRepository.findByActifTrue(any())).thenReturn(new PageImpl<>(List.of(product)));
        when(productMapper.toDto(product)).thenReturn(productDTO);
        when(reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(10L)).thenReturn(List.of());

        var result = productService.getAllProducts(PageRequest.of(0, 5));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getProductByIdReturnsDtoWithReviewStats() {
        Review review1 = Review.builder()
                .id(1L)
                .product(product)
                .customer(seller)
                .rating(4)
                .comment("Bien")
                .approved(true)
                .createdAt(LocalDateTime.now())
                .build();
        Review review2 = Review.builder()
                .id(2L)
                .product(product)
                .customer(seller)
                .rating(2)
                .comment("Moyen")
                .approved(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(productMapper.toDto(product)).thenReturn(productDTO);
        when(reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(10L)).thenReturn(List.of(review1, review2));

        ProductDTO result = productService.getProductById(10L);

        assertEquals(2L, result.getReviewCount());
        assertEquals(3.0, result.getAverageRating());
        assertEquals(2, result.getReviews().size());
    }

    @Test
    void getProductByIdThrowsWhenMissing() {
        when(productRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(10L));
    }

    @Test
    void deleteProductSoftDeletesEntity() {
        product.setActif(true);
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(customerOrderRepository.isProductInAnyOrder(10L)).thenReturn(true);
        when(productRepository.save(product)).thenReturn(product);

        productService.deleteProduct(10L);

        assertEquals(false, product.isActif());
        verify(productRepository).save(product);
    }

    @Test
    void searchProductsPopularityUsesDedicatedQuery() {
        when(productRepository.findPopularActiveProductsNative()).thenReturn(List.of(product));
        when(productMapper.toDto(product)).thenReturn(productDTO);
        when(reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(10L)).thenReturn(List.of());

        var result = productService.searchProducts(null, null, null, null, false, "popularity", null, PageRequest.of(0, 5));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @SuppressWarnings("unchecked")
    void searchProductsWithFiltersUsesSpecificationBranch() {
        when(productRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(product)));
        when(productMapper.toDto(product)).thenReturn(productDTO);
        when(reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(10L)).thenReturn(List.of());

        var result = productService.searchProducts("pc", "sport", 10.0, 1000.0, true, "priceAsc", 1L, PageRequest.of(0, 5));

        assertEquals(1, result.getTotalElements());
        verify(productRepository).findAll(any(Specification.class), any(PageRequest.class));
    }

    @Test
    void getPromotionProductsUsesNewestSort() {
        when(productRepository.findByActifTrueAndPrixPromoIsNotNull(any())).thenReturn(new PageImpl<>(List.of(product)));
        when(productMapper.toDto(product)).thenReturn(productDTO);
        when(reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(10L)).thenReturn(List.of());

        var result = productService.getPromotionProducts(PageRequest.of(0, 5));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getTopSellingProductsCapsPageSizeToTen() {
        when(productRepository.findPopularActiveProductsNative()).thenReturn(List.of(product));
        when(productMapper.toDto(product)).thenReturn(productDTO);
        when(reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(10L)).thenReturn(List.of());

        var result = productService.getTopSellingProducts(PageRequest.of(0, 50));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void updateProductReplacesMutableFields() {
        ProductVariantDTO variantDTO = new ProductVariantDTO();
        variantDTO.setAttribut("RAM");
        variantDTO.setValeur("16Go");
        ProductVariant variant = ProductVariant.builder().attribut("RAM").valeur("16Go").build();
        Category category = Category.builder().nom("INFO").build();
        productDTO.setDescription("Updated");
        productDTO.setCategoryNames(List.of("INFO"));
        productDTO.setImages(List.of("x.png"));
        productDTO.setVariants(List.of(variantDTO));

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(userRepository.findById(1L)).thenReturn(Optional.of(seller));
        when(categoryRepository.findByNomIn(List.of("INFO"))).thenReturn(List.of(category));
        when(productMapper.toEntity(any(ProductVariantDTO.class))).thenReturn(variant);
        when(productRepository.save(product)).thenReturn(product);
        when(productMapper.toDto(product)).thenReturn(productDTO);
        when(reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(10L)).thenReturn(List.of());

        ProductDTO result = productService.updateProduct(10L, productDTO, 1L);

        assertEquals("PC Test", result.getNom());
        assertEquals("Updated", product.getDescription());
        assertEquals(1, product.getCategories().size());
        assertEquals(1, product.getImages().size());
        assertEquals(1, product.getVariants().size());
    }

    @Test
    void saveProductThrowsWhenCategoryMissing() {
        productDTO.setCategoryNames(List.of("SPORT"));

        when(userRepository.findById(1L)).thenReturn(Optional.of(seller));
        when(productMapper.toEntity(any(ProductDTO.class))).thenReturn(product);
        when(categoryRepository.findByNomIn(productDTO.getCategoryNames())).thenReturn(List.of());

        assertThrows(BadRequestException.class, () -> productService.saveProduct(productDTO, 1L));
    }
}
