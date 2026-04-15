package com.shopflow.service;

import com.shopflow.dto.ReviewDTO;
import com.shopflow.dto.ReviewRequest;
import com.shopflow.entities.CustomerOrder;
import com.shopflow.entities.OrderItem;
import com.shopflow.entities.OrderStatus;
import com.shopflow.entities.Product;
import com.shopflow.entities.Review;
import com.shopflow.entities.Role;
import com.shopflow.entities.User;
import com.shopflow.repository.CustomerOrderRepository;
import com.shopflow.repository.ProductRepository;
import com.shopflow.repository.ReviewRepository;
import com.shopflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
@DisplayName("ReviewService — Tests unitaires")
class ReviewServiceTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UserRepository userRepository;
    @Mock private CustomerOrderRepository customerOrderRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private User customer;
    private Product product;
    private CustomerOrder deliveredOrder;
    private ReviewRequest request;

    @BeforeEach
    void setUp() {
        customer = new User();
        customer.setId(1L);
        customer.setEmail("customer@shopflow.com");
        customer.setRole(Role.CUSTOMER);

        product = new Product();
        product.setId(10L);
        product.setNom("Laptop Pro");

        OrderItem orderItem = new OrderItem();
        orderItem.setProduct(product);

        deliveredOrder = new CustomerOrder();
        deliveredOrder.setId(100L);
        deliveredOrder.setCustomer(customer);
        deliveredOrder.setStatus(OrderStatus.DELIVERED);
        deliveredOrder.setItems(List.of(orderItem));

        request = new ReviewRequest();
        request.setRating(5);
        request.setComment("Excellent produit !");
    }

    @Test
    @DisplayName("addReview — succès si achat vérifié et pas de doublon")
    void addReview_Success_WhenPurchaseVerifiedAndNoDuplicate() {
        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(customerOrderRepository.hasCustomerPurchasedProduct(customer.getEmail(), 10L))
                .thenReturn(true);
        when(reviewRepository.findByProductIdAndCustomerEmail(10L, customer.getEmail()))
                .thenReturn(Optional.empty());

        Review saved = Review.builder()
                .id(50L).product(product).customer(customer)
                .rating(5).comment("Excellent produit !")
                .approved(false).createdAt(LocalDateTime.now()).build();
        when(reviewRepository.save(any(Review.class))).thenReturn(saved);

        ReviewDTO result = reviewService.addReview(customer.getEmail(), 10L, request);

        assertNotNull(result);
        assertEquals(5, result.getRating());
        assertFalse(result.isApproved(), "Un avis ne doit pas être approuvé automatiquement");
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    @DisplayName("addReview — rejet si produit non acheté")
    void addReview_Fails_WhenProductNotPurchased() {
        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(customerOrderRepository.hasCustomerPurchasedProduct(customer.getEmail(), 10L))
                .thenReturn(false);

        assertThrows(ResponseStatusException.class,
                () -> reviewService.addReview(customer.getEmail(), 10L, request));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("addReview — met à jour l'avis s'il est déjà soumis")
    void addReview_UpdatesExistingReview() {
        Review existing = Review.builder().id(99L).product(product).customer(customer)
                .rating(3).comment("Déjà soumis").approved(true).createdAt(LocalDateTime.now()).build();

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(customerOrderRepository.hasCustomerPurchasedProduct(customer.getEmail(), 10L))
                .thenReturn(true);
        when(reviewRepository.findByProductIdAndCustomerEmail(10L, customer.getEmail()))
                .thenReturn(Optional.of(existing));
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReviewDTO result = reviewService.addReview(customer.getEmail(), 10L, request);

        assertEquals(5, result.getRating());
        assertEquals("Excellent produit !", result.getComment());
        assertFalse(result.isApproved(), "L'avis doit repasser en modération après modification");
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    @DisplayName("addReview — rejet si utilisateur introuvable")
    void addReview_Fails_WhenUserNotFound() {
        when(userRepository.findByEmail("ghost@shopflow.com")).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class,
                () -> reviewService.addReview("ghost@shopflow.com", 10L, request));
    }

    @Test
    @DisplayName("addReview — rejet si produit introuvable")
    void addReview_Fails_WhenProductNotFound() {
        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class,
                () -> reviewService.addReview(customer.getEmail(), 99L, request));
    }

    @Test
    @DisplayName("getProductReviews — retourne seulement les avis approuvés")
    void getProductReviews_ReturnsOnlyApproved() {
        Review approved = Review.builder().id(1L).product(product).customer(customer)
                .rating(4).comment("Bien").approved(true).createdAt(LocalDateTime.now()).build();

        when(reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(10L))
                .thenReturn(List.of(approved));

        List<ReviewDTO> result = reviewService.getProductReviews(10L);

        assertEquals(1, result.size());
        assertTrue(result.get(0).isApproved());
    }

    @Test
    @DisplayName("getProductReviews — liste vide si aucun avis approuvé")
    void getProductReviews_EmptyWhenNoApprovedReviews() {
        when(reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(10L))
                .thenReturn(Collections.emptyList());

        assertTrue(reviewService.getProductReviews(10L).isEmpty());
    }

    @Test
    @DisplayName("getPendingReviews — retourne les avis en attente de modération")
    void getPendingReviews_ReturnsPendingReviews() {
        Review pending = Review.builder().id(2L).product(product).customer(customer)
                .rating(3).comment("En attente").approved(false).createdAt(LocalDateTime.now()).build();

        when(reviewRepository.findByApprovedFalseOrderByCreatedAtDesc())
                .thenReturn(List.of(pending));

        List<ReviewDTO> result = reviewService.getPendingReviews();

        assertEquals(1, result.size());
        assertFalse(result.get(0).isApproved());
    }

    @Test
    @DisplayName("moderateReview — approve met approved=true")
    void moderateReview_SetApprovedTrue() {
        Review review = Review.builder().id(5L).product(product).customer(customer)
                .rating(5).comment("Top").approved(false).createdAt(LocalDateTime.now()).build();

        when(reviewRepository.findById(5L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(review)).thenReturn(review);

        ReviewDTO result = reviewService.moderateReview(5L, true);

        assertTrue(result.isApproved());
        verify(reviewRepository).save(review);
    }

    @Test
    @DisplayName("moderateReview — reject met approved=false")
    void moderateReview_SetApprovedFalse() {
        Review review = Review.builder().id(6L).product(product).customer(customer)
                .rating(2).comment("Mauvais").approved(true).createdAt(LocalDateTime.now()).build();

        when(reviewRepository.findById(6L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(review)).thenReturn(review);

        ReviewDTO result = reviewService.moderateReview(6L, false);

        assertFalse(result.isApproved());
    }

    @Test
    @DisplayName("moderateReview — rejet si avis introuvable")
    void moderateReview_Fails_WhenReviewNotFound() {
        when(reviewRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class,
                () -> reviewService.moderateReview(999L, true));
    }

    @Test
    @DisplayName("getAverageRating — calcul correct de la moyenne")
    void getAverageRating_CalculatesCorrectAverage() {
        Review r1 = Review.builder().id(1L).product(product).customer(customer)
                .rating(4).comment("A").approved(true).createdAt(LocalDateTime.now()).build();
        Review r2 = Review.builder().id(2L).product(product).customer(customer)
                .rating(5).comment("B").approved(true).createdAt(LocalDateTime.now()).build();

        when(reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(10L))
                .thenReturn(List.of(r1, r2));

        Double avg = reviewService.getAverageRating(10L);

        assertEquals(4.5, avg);
    }

    @Test
    @DisplayName("getAverageRating — retourne 0.0 si aucun avis")
    void getAverageRating_ReturnsZeroWhenNoReviews() {
        when(reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(10L))
                .thenReturn(Collections.emptyList());

        assertEquals(0.0, reviewService.getAverageRating(10L));
    }

    @Test
    @DisplayName("getReviewCount — retourne le compte correct")
    void getReviewCount_ReturnsCorrectCount() {
        when(reviewRepository.countByProductIdAndApprovedTrue(10L)).thenReturn(7L);

        assertEquals(7L, reviewService.getReviewCount(10L));
    }

    @Test
    @DisplayName("getCustomerReviews — retourne les avis du client")
    void getCustomerReviews_ReturnsCustomerReviews() {
        Review review = Review.builder().id(1L).product(product).customer(customer)
                .rating(5).comment("Super").approved(true).createdAt(LocalDateTime.now()).build();

        when(reviewRepository.findByCustomerEmailOrderByCreatedAtDesc(customer.getEmail()))
                .thenReturn(List.of(review));

        List<ReviewDTO> results = reviewService.getCustomerReviews(customer.getEmail());

        assertEquals(1, results.size());
        assertEquals(customer.getEmail(), results.get(0).getCustomerEmail());
    }

    @Test
    @DisplayName("addReview — achat SHIPPED suffit pour soumettre un avis")
    void addReview_Success_WithShippedOrder() {
        deliveredOrder.setStatus(OrderStatus.SHIPPED);

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(customerOrderRepository.hasCustomerPurchasedProduct(customer.getEmail(), 10L))
                .thenReturn(true);
        when(reviewRepository.findByProductIdAndCustomerEmail(10L, customer.getEmail()))
                .thenReturn(Optional.empty());

        Review saved = Review.builder().id(1L).product(product).customer(customer)
                .rating(5).comment("!").approved(false).createdAt(LocalDateTime.now()).build();
        when(reviewRepository.save(any())).thenReturn(saved);

        assertDoesNotThrow(() -> reviewService.addReview(customer.getEmail(), 10L, request));
    }
}
