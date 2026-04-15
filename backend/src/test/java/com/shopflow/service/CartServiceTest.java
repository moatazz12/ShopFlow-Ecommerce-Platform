package com.shopflow.service;

import com.shopflow.dto.CartDTO;
import com.shopflow.dto.CartItemRequest;
import com.shopflow.entities.Cart;
import com.shopflow.entities.CartItem;
import com.shopflow.entities.DiscountType;
import com.shopflow.entities.Product;
import com.shopflow.entities.ProductVariant;
import com.shopflow.entities.PromoCode;
import com.shopflow.entities.Role;
import com.shopflow.entities.User;
import com.shopflow.repository.CartRepository;
import com.shopflow.repository.CustomerOrderRepository;
import com.shopflow.repository.ProductRepository;
import com.shopflow.repository.PromoCodeRepository;
import com.shopflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CustomerOrderRepository customerOrderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private PromoCodeRepository promoCodeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CartServiceImpl cartService;

    private User customer;
    private Product product;
    private Cart cart;

    @BeforeEach
    void setUp() {
        customer = new User();
        customer.setId(1L);
        customer.setEmail("customer@shopflow.com");
        customer.setRole(Role.CUSTOMER);
        customer.setActif(true);

        product = new Product();
        product.setId(10L);
        product.setNom("Laptop");
        product.setPrix(1500.0);
        product.setPrixPromo(1200.0);
        product.setStock(5);
        product.setActif(true);
        product.setVariants(new ArrayList<>());

        cart = Cart.builder()
                .id(100L)
                .customer(customer)
                .items(new ArrayList<>())
                .build();
    }

    @Test
    void addItemCreatesCartAndAddsProduct() {
        CartItemRequest request = new CartItemRequest();
        request.setProductId(10L);
        request.setQuantity(2);

        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> {
            Cart saved = invocation.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(100L);
            }
            return saved;
        });
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        CartDTO result = cartService.addItem(customer.getEmail(), request);

        assertNotNull(result);
        assertEquals(1, result.getItems().size());
        assertEquals(2, result.getItems().get(0).getQuantity());
        assertEquals(2400.0, result.getSubtotalAmount());
        assertEquals(480.0, result.getTaxAmount());
        assertEquals(2880.0, result.getTotalAmount());
        verify(cartRepository, atLeastOnce()).save(any(Cart.class));
    }

    @Test
    void addItemMergesExistingItemWhenSameProductAndVariant() {
        CartItem existingItem = CartItem.builder()
                .id(1L)
                .cart(cart)
                .product(product)
                .quantity(1)
                .build();
        cart.getItems().add(existingItem);

        CartItemRequest request = new CartItemRequest();
        request.setProductId(10L);
        request.setQuantity(2);

        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartDTO result = cartService.addItem(customer.getEmail(), request);

        assertEquals(1, result.getItems().size());
        assertEquals(3, result.getItems().get(0).getQuantity());
    }

    @Test
    void addItemUsesVariantStockAndPriceDelta() {
        ProductVariant variant = ProductVariant.builder()
                .id(99L)
                .attribut("Couleur")
                .valeur("Noir")
                .stockSupplementaire(3)
                .prixDelta(50.0)
                .product(product)
                .build();
        product.setVariants(List.of(variant));

        CartItemRequest request = new CartItemRequest();
        request.setProductId(10L);
        request.setVariantId(99L);
        request.setQuantity(2);

        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartDTO result = cartService.addItem(customer.getEmail(), request);

        assertEquals(1, result.getItems().size());
        assertEquals(2500.0, result.getSubtotalAmount());
        assertEquals("Couleur: Noir", result.getItems().get(0).getVariantLabel());
    }

    @Test
    void addItemFailsWhenRequestedQuantityExceedsStock() {
        CartItemRequest request = new CartItemRequest();
        request.setProductId(10L);
        request.setQuantity(10);

        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> cartService.addItem(customer.getEmail(), request));

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void addItemFailsWhenProductInactive() {
        CartItemRequest request = new CartItemRequest();
        request.setProductId(10L);
        request.setQuantity(1);
        product.setActif(false);

        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> cartService.addItem(customer.getEmail(), request));

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void addItemFailsWhenVariantMissing() {
        CartItemRequest request = new CartItemRequest();
        request.setProductId(10L);
        request.setVariantId(77L);
        request.setQuantity(1);

        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> cartService.addItem(customer.getEmail(), request));

        assertEquals(404, exception.getStatusCode().value());
    }

    @Test
    void getCurrentCartCreatesCartForCustomerOnly() {
        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> {
            Cart saved = invocation.getArgument(0);
            saved.setId(101L);
            return saved;
        });

        CartDTO result = cartService.getCurrentCart(customer.getEmail());

        assertEquals(101L, result.getId());
        assertEquals(customer.getEmail(), result.getCustomerEmail());
    }

    @Test
    void getCurrentCartFailsWhenUserIsNotCustomer() {
        User seller = new User();
        seller.setEmail("seller@shopflow.com");
        seller.setRole(Role.SELLER);

        when(cartRepository.findByCustomerEmail(seller.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findByEmail(seller.getEmail())).thenReturn(Optional.of(seller));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> cartService.getCurrentCart(seller.getEmail()));

        assertEquals(403, exception.getStatusCode().value());
    }

    @Test
    void updateItemQuantityChangesQuantity() {
        CartItem item = CartItem.builder()
                .id(50L)
                .cart(cart)
                .product(product)
                .quantity(1)
                .build();
        cart.getItems().add(item);

        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartDTO result = cartService.updateItemQuantity(customer.getEmail(), 50L, 3);

        assertEquals(3, result.getItems().get(0).getQuantity());
    }

    @Test
    void updateItemQuantityRejectsInvalidQuantity() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> cartService.updateItemQuantity(customer.getEmail(), 50L, 0));

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void updateItemQuantityRejectsMissingItem() {
        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> cartService.updateItemQuantity(customer.getEmail(), 99L, 1));

        assertEquals(404, exception.getStatusCode().value());
    }

    @Test
    void applyAndRemovePromoCodeUpdatesTotals() {
        CartItem item = CartItem.builder()
                .id(1L)
                .cart(cart)
                .product(product)
                .quantity(1)
                .build();
        cart.getItems().add(item);

        PromoCode promoCode = PromoCode.builder()
                .id(5L)
                .code("SAVE20")
                .discountType(DiscountType.FIXED)
                .value(20.0)
                .active(true)
                .build();

        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(promoCodeRepository.findByCodeIgnoreCaseAndActiveTrue("SAVE20")).thenReturn(Optional.of(promoCode));
        when(customerOrderRepository.existsByCustomerEmailAndPromoCode(customer.getEmail(), promoCode)).thenReturn(false);
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartDTO applied = cartService.applyPromoCode(customer.getEmail(), "SAVE20");
        assertEquals("SAVE20", applied.getPromoCode());
        assertEquals(20.0, applied.getDiscountAmount());

        CartDTO removed = cartService.removePromoCode(customer.getEmail());
        assertNull(removed.getPromoCode());
        assertEquals(0.0, removed.getDiscountAmount());
    }

    @Test
    void applyPromoCodeFailsWhenCodeMissing() {
        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(promoCodeRepository.findByCodeIgnoreCaseAndActiveTrue("BAD")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> cartService.applyPromoCode(customer.getEmail(), "BAD"));

        assertEquals(404, exception.getStatusCode().value());
    }

    @Test
    void removeItemDeletesExistingItem() {
        CartItem item = CartItem.builder()
                .id(22L)
                .cart(cart)
                .product(product)
                .quantity(1)
                .build();
        cart.getItems().add(item);

        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        cartService.removeItem(customer.getEmail(), 22L);

        assertEquals(0, cart.getItems().size());
    }

    @Test
    void removeItemFailsWhenMissing() {
        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> cartService.removeItem(customer.getEmail(), 999L));

        assertEquals(404, exception.getStatusCode().value());
    }

    @Test
    void clearCartRemovesItemsAndPromoCode() {
        CartItem item = CartItem.builder()
                .id(22L)
                .cart(cart)
                .product(product)
                .quantity(1)
                .build();
        cart.getItems().add(item);
        cart.setPromoCode(PromoCode.builder().code("WELCOME10").discountType(DiscountType.PERCENTAGE).value(10.0).build());

        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        cartService.clearCart(customer.getEmail());

        assertEquals(0, cart.getItems().size());
        assertNull(cart.getPromoCode());
    }
}
