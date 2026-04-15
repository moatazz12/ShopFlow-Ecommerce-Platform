package com.shopflow.service;

import com.shopflow.dto.CheckoutRequest;
import com.shopflow.dto.OrderDTO;
import com.shopflow.dto.OrderItemDTO;
import com.shopflow.entities.Address;
import com.shopflow.entities.Cart;
import com.shopflow.entities.CartItem;
import com.shopflow.entities.CustomerOrder;
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
import com.shopflow.exception.ResourceNotFoundException;
import com.shopflow.repository.AddressRepository;
import com.shopflow.repository.CartRepository;
import com.shopflow.repository.CustomerOrderRepository;
import com.shopflow.repository.ProductRepository;
import com.shopflow.repository.PromoCodeRepository;
import com.shopflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("null")
public class OrderServiceImpl implements OrderService {

    private final CustomerOrderRepository customerOrderRepository;
    private final AddressRepository addressRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PromoCodeRepository promoCodeRepository;

    @Override
    public OrderDTO checkout(String customerEmail, CheckoutRequest request) {
        User customer = getUserByEmail(customerEmail);
        if (customer.getRole() != Role.CUSTOMER) {
            throw new ForbiddenActionException("Seul un client peut passer une commande");
        }

        Cart cart = cartRepository.findByCustomerEmail(customerEmail)
                .orElseThrow(() -> new BadRequestException("Panier vide"));
        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Panier vide");
        }

        Address shippingAddress = addressRepository.findById(request.getShippingAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Adresse de livraison non trouvee"));
        if (!shippingAddress.getUser().getEmail().equals(customerEmail)) {
            throw new ForbiddenActionException("Adresse de livraison invalide pour cet utilisateur");
        }

        CustomerOrder order = CustomerOrder.builder()
                .customer(customer)
                .shippingAddress(shippingAddress)
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .orderNumber("ORD-" + java.time.LocalDate.now().getYear() + "-"
                        + UUID.randomUUID().toString().substring(0, 5).toUpperCase())
                .paymentReference("PAY-" + UUID.randomUUID())
                .isNew(true)
                .promoCode(cart.getPromoCode())
                .build();

        double totalAmount = 0.0;
        double subtotalAmount = 0.0;
        for (CartItem cartItem : cart.getItems()) {
            Product product = productRepository.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produit non trouve"));
            ProductVariant variant = cartItem.getVariant();

            if (cartItem.getQuantity() > getAvailableStock(product, variant)) {
                throw new BadRequestException("Stock insuffisant pour " + product.getNom());
            }

            double unitPrice = getUnitPrice(product, variant);
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .variant(variant)
                    .seller(product.getSeller())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(unitPrice)
                    .build();
            order.getItems().add(orderItem);
            subtotalAmount += unitPrice * cartItem.getQuantity();
        }

        double discountAmount = calculateDiscount(cart.getPromoCode(), subtotalAmount);
        double shippingFee = subtotalAmount >= 100.0 ? 0.0 : 10.0;
        double taxAmount = Math.max(subtotalAmount - discountAmount + shippingFee, 0.0) * 0.20;
        totalAmount = Math.max(subtotalAmount - discountAmount + shippingFee + taxAmount, 0.0);

        order.setSubtotalAmount(subtotalAmount);
        order.setDiscountAmount(discountAmount);
        order.setShippingFee(shippingFee);
        order.setTaxAmount(taxAmount);
        order.setTotalAmount(totalAmount);

        if (request.isPaymentSuccess()) {
            for (CartItem cartItem : cart.getItems()) {
                Product product = cartItem.getProduct();
                ProductVariant variant = cartItem.getVariant();
                if (variant != null) {
                    variant.setStockSupplementaire(getAvailableStock(product, variant) - cartItem.getQuantity());
                } else {
                    product.setStock(product.getStock() - cartItem.getQuantity());
                }
                productRepository.save(product);
            }
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.PAID);
            
            // Increment PromoCode usage if applicable
            if (cart.getPromoCode() != null) {
                PromoCode pc = cart.getPromoCode();
                pc.setUsagesActuels(pc.getUsagesActuels() + 1);
                promoCodeRepository.save(pc);
            }

            cart.getItems().clear();
            cart.setPromoCode(null);
            cartRepository.save(cart);
        } else {
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setStatus(OrderStatus.PENDING);
        }

        return toDto(customerOrderRepository.save(order));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDTO getOrderById(Long orderId, String actorEmail) {
        CustomerOrder order = customerOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande non trouvee"));
        User actor = getUserByEmail(actorEmail);
        boolean isAdmin = actor.getRole() == Role.ADMIN;
        boolean isCustomer = order.getCustomer().getEmail().equals(actorEmail);
        boolean isSellerOnOrder = order.getItems().stream()
                .anyMatch(item -> item.getSeller().getEmail().equals(actorEmail));
        if (!isAdmin && !isCustomer && !isSellerOnOrder) {
            throw new ForbiddenActionException("Acces refuse a cette commande");
        }
        return toDto(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDTO> getCustomerOrders(String customerEmail) {
        return customerOrderRepository.findByCustomerEmailOrderByCreatedAtDesc(customerEmail).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDTO> getSellerOrders(String sellerEmail) {
        return customerOrderRepository.findDistinctByItemsSellerEmailOrderByCreatedAtDesc(sellerEmail).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDTO> getAllOrders() {
        return customerOrderRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public OrderDTO updateOrderStatus(Long orderId, String actorEmail, OrderStatus status) {
        CustomerOrder order = customerOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande non trouvee"));
        User actor = getUserByEmail(actorEmail);

        boolean isAdmin = actor.getRole() == Role.ADMIN;
        boolean isSellerOnOrder = order.getItems().stream()
                .anyMatch(item -> item.getSeller().getEmail().equals(actorEmail));

        if (!isAdmin && !isSellerOnOrder) {
            throw new ForbiddenActionException("Acces refuse a cette commande");
        }

        order.setStatus(status);
        order.setNew(true);
        return toDto(customerOrderRepository.save(order));
    }

    @Override
    public OrderDTO cancelOrder(Long orderId, String customerEmail) {
        CustomerOrder order = customerOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande non trouvee"));

        if (!order.getCustomer().getEmail().equals(customerEmail)) {
            throw new ForbiddenActionException("Acces refuse a cette commande");
        }

        if (!(order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.PAID)) {
            throw new BadRequestException("La commande ne peut plus etre annulee");
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            order.setPaymentStatus(PaymentStatus.REFUNDED);
            order.setRefunded(true);
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setNew(true);
        return toDto(customerOrderRepository.save(order));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouve"));
    }

    private OrderDTO toDto(CustomerOrder order) {
        List<OrderItemDTO> items = order.getItems().stream()
                .map(item -> OrderItemDTO.builder()
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getNom())
                        .variantId(item.getVariant() != null ? item.getVariant().getId() : null)
                        .variantLabel(item.getVariant() != null
                                ? item.getVariant().getAttribut() + ": " + item.getVariant().getValeur()
                                : null)
                        .sellerName(item.getSeller().getNom())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getUnitPrice() * item.getQuantity())
                        .build())
                .toList();

        return OrderDTO.builder()
                .id(order.getId())
                .customerEmail(order.getCustomer().getEmail())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .totalAmount(order.getTotalAmount())
                .subtotalAmount(order.getSubtotalAmount())
                .discountAmount(order.getDiscountAmount())
                .shippingFee(order.getShippingFee())
                .taxAmount(order.getTaxAmount())
                .orderNumber(order.getOrderNumber() != null ? order.getOrderNumber() : "ORD-PENDING")
                .paymentReference(order.getPaymentReference())
                .shippingAddressId(order.getShippingAddress() != null ? order.getShippingAddress().getId() : null)
                .isNew(order.isNew())
                .refunded(order.isRefunded())
                .createdAt(order.getCreatedAt())
                .items(items)
                .build();
    }

    private int getAvailableStock(Product product, ProductVariant variant) {
        if (variant != null) {
            return variant.getStockSupplementaire() != null ? variant.getStockSupplementaire() : 0;
        }
        return product.getStock() != null ? product.getStock() : 0;
    }

    private double getUnitPrice(Product product, ProductVariant variant) {
        double basePrice = product.getPrixPromo() != null ? product.getPrixPromo() : product.getPrix();
        if (variant != null && variant.getPrixDelta() != null) {
            return basePrice + variant.getPrixDelta();
        }
        return basePrice;
    }

    private double calculateDiscount(PromoCode promoCode, double subtotalAmount) {
        if (promoCode == null) {
            return 0.0;
        }
        return switch (promoCode.getDiscountType()) {
            case FIXED -> Math.min(promoCode.getValue(), subtotalAmount);
            case PERCENTAGE -> subtotalAmount * (promoCode.getValue() / 100.0);
        };
    }
}
