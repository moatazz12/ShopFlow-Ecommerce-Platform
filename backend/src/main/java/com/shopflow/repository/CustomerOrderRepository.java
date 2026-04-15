package com.shopflow.repository;

import com.shopflow.entities.CustomerOrder;
import com.shopflow.entities.PromoCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

    List<CustomerOrder> findByCustomerEmailOrderByCreatedAtDesc(String email);

    List<CustomerOrder> findDistinctByItemsSellerEmailOrderByCreatedAtDesc(String email);

    @Query("SELECT COUNT(oi) > 0 FROM CustomerOrder co JOIN co.items oi " +
            "WHERE co.customer.email = :email " +
            "AND oi.product.id = :productId " +
            "AND co.status IN ('PAID', 'SHIPPED', 'DELIVERED', 'PROCESSING')")
    boolean hasCustomerPurchasedProduct(@Param("email") String email, @Param("productId") Long productId);

    boolean existsByCustomerEmailAndPromoCode(String email, PromoCode promoCode);

    @Query("SELECT COUNT(oi) > 0 FROM CustomerOrder co JOIN co.items oi WHERE oi.product.id = :productId")
    boolean isProductInAnyOrder(@Param("productId") Long productId);
}
