package com.shopflow.service;

import com.shopflow.dto.AdminDashboardDTO;
import com.shopflow.dto.CustomerDashboardDTO;
import com.shopflow.dto.SellerDashboardDTO;
import com.shopflow.entities.CustomerOrder;
import com.shopflow.entities.OrderItem;
import com.shopflow.entities.OrderStatus;
import com.shopflow.entities.Product;
import com.shopflow.entities.Review;
import com.shopflow.entities.User;
import com.shopflow.repository.CustomerOrderRepository;
import com.shopflow.repository.ProductRepository;
import com.shopflow.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private CustomerOrderRepository customerOrderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private User customer;
    private User seller;
    private Product product;
    private CustomerOrder order;

    @BeforeEach
    void setUp() {
        customer = new User();
        customer.setEmail("customer@test.com");

        seller = new User();
        seller.setEmail("seller@test.com");
        seller.setNom("Seller One");

        product = new Product();
        product.setId(1L);
        product.setNom("Laptop");
        product.setSeller(seller);
        product.setStock(3);

        OrderItem item = OrderItem.builder()
                .product(product)
                .seller(seller)
                .quantity(2)
                .unitPrice(100.0)
                .build();

        order = CustomerOrder.builder()
                .id(10L)
                .customer(customer)
                .status(OrderStatus.PAID)
                .orderNumber("ORD-2026-00001")
                .totalAmount(240.0)
                .items(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();
        item.setOrder(order);
        order.getItems().add(item);
    }

    @Test
    void getAdminDashboardAggregatesStats() {
        when(customerOrderRepository.findAll()).thenReturn(List.of(order));

        AdminDashboardDTO result = dashboardService.getAdminDashboard();

        assertEquals(240.0, result.getGlobalRevenue());
        assertEquals(1, result.getTopProducts().size());
        assertEquals(1, result.getTopSellers().size());
    }

    @Test
    void getSellerDashboardReturnsRevenueAndLowStockAlerts() {
        when(customerOrderRepository.findDistinctByItemsSellerEmailOrderByCreatedAtDesc("seller@test.com")).thenReturn(List.of(order));
        when(productRepository.findAll()).thenReturn(List.of(product));

        SellerDashboardDTO result = dashboardService.getSellerDashboard("seller@test.com");

        assertEquals(200.0, result.getRevenue());
        assertEquals(1, result.getPendingOrders());
        assertEquals(1, result.getLowStockAlerts().size());
    }

    @Test
    void getCustomerDashboardReturnsOrdersAndReviews() {
        Review review = Review.builder()
                .product(product)
                .customer(customer)
                .rating(4)
                .comment("Bien")
                .approved(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(customerOrderRepository.findByCustomerEmailOrderByCreatedAtDesc("customer@test.com")).thenReturn(List.of(order));
        when(reviewRepository.findByCustomerEmailOrderByCreatedAtDesc("customer@test.com")).thenReturn(List.of(review));

        CustomerDashboardDTO result = dashboardService.getCustomerDashboard("customer@test.com");

        assertEquals(1, result.getCurrentOrders().size());
        assertEquals(1, result.getLatestReviews().size());
    }
}
