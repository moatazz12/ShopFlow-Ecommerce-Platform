package com.shopflow.repository;

import com.shopflow.BackendApplication;
import com.shopflow.entities.Product;
import com.shopflow.entities.Role;
import com.shopflow.entities.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ContextConfiguration;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
@ContextConfiguration(classes = BackendApplication.class)
@SuppressWarnings("null")
class ProductRepositoryTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByActifTrueAndPrixPromoIsNotNullReturnsOnlyPromotedActiveProducts() {
        User seller = userRepository.save(User.builder()
                .email("repo-seller@shopflow.com")
                .password("encoded")
                .role(Role.SELLER)
                .actif(true)
                .build());

        productRepository.save(Product.builder()
                .nom("Produit promo")
                .prix(100.0)
                .prixPromo(80.0)
                .stock(10)
                .actif(true)
                .seller(seller)
                .build());

        productRepository.save(Product.builder()
                .nom("Produit sans promo")
                .prix(90.0)
                .stock(8)
                .actif(true)
                .seller(seller)
                .build());

        productRepository.save(Product.builder()
                .nom("Produit inactif")
                .prix(120.0)
                .prixPromo(95.0)
                .stock(4)
                .actif(false)
                .seller(seller)
                .build());

        var result = productRepository.findByActifTrueAndPrixPromoIsNotNull(PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        assertEquals("Produit promo", result.getContent().get(0).getNom());
    }
}
