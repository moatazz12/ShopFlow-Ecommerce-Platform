package com.shopflow.service;

import com.shopflow.dto.CheckoutRequest;
import com.shopflow.dto.OrderDTO;
import com.shopflow.entities.Address;
import com.shopflow.entities.Cart;
import com.shopflow.entities.CartItem;
import com.shopflow.entities.CustomerOrder;
import com.shopflow.entities.DiscountType;
import com.shopflow.entities.OrderItem;
import com.shopflow.entities.OrderStatus;
import com.shopflow.entities.PaymentStatus;
import com.shopflow.entities.Product;
import com.shopflow.entities.ProductVariant;
import com.shopflow.entities.PromoCode;
import com.shopflow.entities.Role;
import com.shopflow.entities.User;
import com.shopflow.exception.BadRequestException;
import com.shopflow.exception.ForbiddenActionException;
import com.shopflow.repository.AddressRepository;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class OrderServiceTest {

    @Mock
    private CustomerOrderRepository customerOrderRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private PromoCodeRepository promoCodeRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User customer;
    private User seller;
    private User admin;
    private Product product;
    private Cart cart;
    private Address address;

    @BeforeEach
    void setUp() {
        customer = new User();
        customer.setId(1L);
        customer.setEmail("customer@shopflow.com");
        customer.setRole(Role.CUSTOMER);
        customer.setActif(true);

        seller = new User();
        seller.setId(2L);
        seller.setEmail("seller@shopflow.com");
        seller.setNom("Seller");
        seller.setRole(Role.SELLER);
        seller.setActif(true);

        admin = new User();
        admin.setId(3L);
        admin.setEmail("admin@shopflow.com");
        admin.setNom("Admin");
        admin.setRole(Role.ADMIN);
        admin.setActif(true);

        product = new Product();
        product.setId(10L);
        product.setNom("Laptop");
        product.setPrix(1500.0);
        product.setPrixPromo(1200.0);
        product.setStock(4);
        product.setActif(true);
        product.setSeller(seller);

        CartItem item = CartItem.builder()
                .id(50L)
                .product(product)
                .quantity(2)
                .build();

        cart = Cart.builder()
                .id(100L)
                .customer(customer)
                .items(new ArrayList<>())
                .build();
        item.setCart(cart);
        cart.getItems().add(item);

        address = new Address() {
        };
        address.setId(300L);
        address.setUser(customer);
        address.setRue("Rue test");
        address.setVille("Tunis");
        address.setCodePostal("1000");
        address.setPays("TN");
    }

    @Test
    void checkoutSuccessCreatesPaidOrderAndDecrementsStock() {
        CheckoutRequest request = new CheckoutRequest();
        request.setPaymentSuccess(true);
        request.setShippingAddressId(300L);

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(addressRepository.findById(300L)).thenReturn(Optional.of(address));
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(customerOrderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        OrderDTO result = orderService.checkout(customer.getEmail(), request);

        assertNotNull(result);
        assertEquals(OrderStatus.PAID, result.getStatus());
        assertEquals(PaymentStatus.PAID, result.getPaymentStatus());
        assertEquals(2400.0, result.getSubtotalAmount());
        assertEquals(480.0, result.getTaxAmount());
        assertEquals(2880.0, result.getTotalAmount());
        assertEquals(2, product.getStock());
        assertEquals(0, cart.getItems().size());
        verify(customerOrderRepository).save(any());
    }

    @Test
    void checkoutWithPaymentFailureKeepsCartAndMarksOrderFailed() {
        CheckoutRequest request = new CheckoutRequest();
        request.setPaymentSuccess(false);
        request.setShippingAddressId(300L);

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(addressRepository.findById(300L)).thenReturn(Optional.of(address));
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(customerOrderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        OrderDTO result = orderService.checkout(customer.getEmail(), request);

        assertEquals(OrderStatus.PENDING, result.getStatus());
        assertEquals(PaymentStatus.FAILED, result.getPaymentStatus());
        assertEquals(1, cart.getItems().size());
        assertEquals(4, product.getStock());
    }

    @Test
    void checkoutWithVariantAndPromoCodeUsesDiscountAndVariantStock() {
        ProductVariant variant = ProductVariant.builder()
                .id(88L)
                .attribut("Taille")
                .valeur("XL")
                .stockSupplementaire(4)
                .prixDelta(50.0)
                .product(product)
                .build();
        cart.getItems().get(0).setVariant(variant);
        cart.setPromoCode(PromoCode.builder()
                .code("WELCOME10")
                .discountType(DiscountType.PERCENTAGE)
                .value(10.0)
                .usagesActuels(0)
                .build());

        CheckoutRequest request = new CheckoutRequest();
        request.setPaymentSuccess(true);
        request.setShippingAddressId(300L);

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(addressRepository.findById(300L)).thenReturn(Optional.of(address));
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(promoCodeRepository.save(any(PromoCode.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(customerOrderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        OrderDTO result = orderService.checkout(customer.getEmail(), request);

        assertEquals(2500.0, result.getSubtotalAmount());
        assertEquals(250.0, result.getDiscountAmount());
        assertEquals(450.0, result.getTaxAmount());
        assertEquals(2700.0, result.getTotalAmount());
        assertEquals(2, variant.getStockSupplementaire());
    }

    @Test
    void checkoutFailsWhenCartIsEmpty() {
        CheckoutRequest request = new CheckoutRequest();
        request.setPaymentSuccess(true);
        request.setShippingAddressId(300L);

        Cart emptyCart = Cart.builder()
                .id(200L)
                .customer(customer)
                .items(new ArrayList<>())
                .build();

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(emptyCart));

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> orderService.checkout(customer.getEmail(), request));

        assertEquals("Panier vide", exception.getMessage());
    }

    @Test
    void checkoutFailsWhenActorIsNotCustomer() {
        CheckoutRequest request = new CheckoutRequest();
        request.setPaymentSuccess(true);
        request.setShippingAddressId(300L);

        when(userRepository.findByEmail(seller.getEmail())).thenReturn(Optional.of(seller));

        assertThrows(ForbiddenActionException.class, () -> orderService.checkout(seller.getEmail(), request));
    }

    @Test
    void checkoutFailsWhenShippingAddressBelongsToAnotherUser() {
        User anotherUser = new User();
        anotherUser.setEmail("other@shopflow.com");
        address.setUser(anotherUser);

        CheckoutRequest request = new CheckoutRequest();
        request.setPaymentSuccess(true);
        request.setShippingAddressId(300L);

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(addressRepository.findById(300L)).thenReturn(Optional.of(address));

        assertThrows(ForbiddenActionException.class, () -> orderService.checkout(customer.getEmail(), request));
    }

    @Test
    void checkoutFailsWhenStockInsufficient() {
        cart.getItems().get(0).setQuantity(10);

        CheckoutRequest request = new CheckoutRequest();
        request.setPaymentSuccess(true);
        request.setShippingAddressId(300L);

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerEmail(customer.getEmail())).thenReturn(Optional.of(cart));
        when(addressRepository.findById(300L)).thenReturn(Optional.of(address));
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));

        assertThrows(BadRequestException.class, () -> orderService.checkout(customer.getEmail(), request));
    }

    @Test
    void getOrderByIdAllowsCustomerSellerAndAdmin() {
        CustomerOrder order = buildOrder();
        when(customerOrderRepository.findById(500L)).thenReturn(Optional.of(order));
        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));

        OrderDTO customerView = orderService.getOrderById(500L, customer.getEmail());
        assertEquals(customer.getEmail(), customerView.getCustomerEmail());

        when(userRepository.findByEmail(seller.getEmail())).thenReturn(Optional.of(seller));
        OrderDTO sellerView = orderService.getOrderById(500L, seller.getEmail());
        assertEquals(1, sellerView.getItems().size());

        when(userRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
        OrderDTO adminView = orderService.getOrderById(500L, admin.getEmail());
        assertEquals(OrderStatus.PAID, adminView.getStatus());
    }

    @Test
    void getOrderByIdRejectsUnauthorizedActor() {
        CustomerOrder order = buildOrder();
        User stranger = new User();
        stranger.setEmail("stranger@shopflow.com");
        stranger.setRole(Role.CUSTOMER);

        when(customerOrderRepository.findById(500L)).thenReturn(Optional.of(order));
        when(userRepository.findByEmail(stranger.getEmail())).thenReturn(Optional.of(stranger));

        assertThrows(ForbiddenActionException.class,
                () -> orderService.getOrderById(500L, stranger.getEmail()));
    }

    @Test
    void getCustomerOrdersGetSellerOrdersAndGetAllOrdersMapDtos() {
        CustomerOrder order = buildOrder();
        when(customerOrderRepository.findByCustomerEmailOrderByCreatedAtDesc(customer.getEmail()))
                .thenReturn(List.of(order));
        when(customerOrderRepository.findDistinctByItemsSellerEmailOrderByCreatedAtDesc(seller.getEmail()))
                .thenReturn(List.of(order));
        when(customerOrderRepository.findAll()).thenReturn(List.of(order));

        assertEquals(1, orderService.getCustomerOrders(customer.getEmail()).size());
        assertEquals(1, orderService.getSellerOrders(seller.getEmail()).size());
        assertEquals(1, orderService.getAllOrders().size());
    }

    @Test
    void updateOrderStatusAllowsSellerAndSetsNewFlag() {
        CustomerOrder order = buildOrder();
        when(customerOrderRepository.findById(500L)).thenReturn(Optional.of(order));
        when(userRepository.findByEmail(seller.getEmail())).thenReturn(Optional.of(seller));
        when(customerOrderRepository.save(order)).thenReturn(order);

        OrderDTO result = orderService.updateOrderStatus(500L, seller.getEmail(), OrderStatus.SHIPPED);

        assertEquals(OrderStatus.SHIPPED, result.getStatus());
        assertTrue(result.isNew());
    }

    @Test
    void updateOrderStatusRejectsUnauthorizedActor() {
        CustomerOrder order = buildOrder();
        User stranger = new User();
        stranger.setEmail("stranger@shopflow.com");
        stranger.setRole(Role.CUSTOMER);

        when(customerOrderRepository.findById(500L)).thenReturn(Optional.of(order));
        when(userRepository.findByEmail(stranger.getEmail())).thenReturn(Optional.of(stranger));

        assertThrows(ForbiddenActionException.class,
                () -> orderService.updateOrderStatus(500L, stranger.getEmail(), OrderStatus.SHIPPED));
    }

    @Test
    void cancelOrderRefundsPaidOrder() {
        CustomerOrder order = buildOrder();
        when(customerOrderRepository.findById(500L)).thenReturn(Optional.of(order));
        when(customerOrderRepository.save(order)).thenReturn(order);

        OrderDTO result = orderService.cancelOrder(500L, customer.getEmail());

        assertEquals(OrderStatus.CANCELLED, result.getStatus());
        assertEquals(PaymentStatus.REFUNDED, result.getPaymentStatus());
        assertTrue(result.isRefunded());
        assertTrue(result.isNew());
    }

    @Test
    void cancelOrderRejectsWrongCustomer() {
        CustomerOrder order = buildOrder();
        when(customerOrderRepository.findById(500L)).thenReturn(Optional.of(order));

        assertThrows(ForbiddenActionException.class,
                () -> orderService.cancelOrder(500L, "other@shopflow.com"));
    }

    @Test
    void cancelOrderRejectsNonCancellableStatus() {
        CustomerOrder order = buildOrder();
        order.setStatus(OrderStatus.DELIVERED);
        when(customerOrderRepository.findById(500L)).thenReturn(Optional.of(order));

        assertThrows(BadRequestException.class,
                () -> orderService.cancelOrder(500L, customer.getEmail()));
    }

    private CustomerOrder buildOrder() {
        CustomerOrder order = CustomerOrder.builder()
                .id(500L)
                .customer(customer)
                .shippingAddress(address)
                .status(OrderStatus.PAID)
                .paymentStatus(PaymentStatus.PAID)
                .subtotalAmount(2400.0)
                .discountAmount(0.0)
                .shippingFee(0.0)
                .taxAmount(480.0)
                .totalAmount(2880.0)
                .orderNumber("ORD-2026-ABCDE")
                .paymentReference("PAY-1")
                .isNew(false)
                .refunded(false)
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        OrderItem orderItem = OrderItem.builder()
                .id(1L)
                .order(order)
                .product(product)
                .seller(seller)
                .quantity(2)
                .unitPrice(1200.0)
                .build();
        order.getItems().add(orderItem);
        return order;
    }
}
