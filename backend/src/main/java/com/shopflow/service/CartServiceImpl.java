package com.shopflow.service;

import com.shopflow.dto.CartDTO;
import com.shopflow.dto.CartItemDTO;
import com.shopflow.dto.CartItemRequest;
import com.shopflow.entities.Cart;
import com.shopflow.entities.CartItem;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("null")
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final PromoCodeRepository promoCodeRepository;
    private final UserRepository userRepository;
    private final CustomerOrderRepository customerOrderRepository;

    @Override
    public CartDTO getCurrentCart(String customerEmail) {
        Cart cart = getOrCreateCart(customerEmail);
        return toDto(cart);
    }

    @Override
    public CartDTO addItem(String customerEmail, CartItemRequest request) {
        Cart cart = getOrCreateCart(customerEmail);
        Product product = getActiveProduct(request.getProductId());
        ProductVariant variant = getVariant(product, request.getVariantId());
        int availableStock = getAvailableStock(product, variant);

        if (request.getQuantity() > availableStock) {
            throw new ResponseStatusException(BAD_REQUEST, "Stock insuffisant");
        }

        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(product.getId())
                        && sameVariant(item.getVariant(), variant))
                .findFirst();

        if (existingItem.isPresent()) {
            int newQuantity = existingItem.get().getQuantity() + request.getQuantity();
            if (newQuantity > availableStock) {
                throw new ResponseStatusException(BAD_REQUEST, "Stock insuffisant");
            }
            existingItem.get().setQuantity(newQuantity);
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .variant(variant)
                    .quantity(request.getQuantity())
                    .build();
            cart.getItems().add(item);
        }

        return toDto(cartRepository.save(cart));
    }

    @Override
    public CartDTO updateItemQuantity(String customerEmail, Long itemId, Integer quantity) {
        if (quantity == null || quantity < 1) {
            throw new ResponseStatusException(BAD_REQUEST, "La quantite doit etre superieure a zero");
        }

        Cart cart = getOrCreateCart(customerEmail);
        CartItem item = cart.getItems().stream()
                .filter(cartItem -> cartItem.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Produit absent du panier"));
        Product product = getActiveProduct(item.getProduct().getId());

        if (quantity > getAvailableStock(product, item.getVariant())) {
            throw new ResponseStatusException(BAD_REQUEST, "Stock insuffisant");
        }

        item.setQuantity(quantity);
        return toDto(cartRepository.save(cart));
    }

    @Override
    public CartDTO applyPromoCode(String customerEmail, String code) {
        Cart cart = getOrCreateCart(customerEmail);
        PromoCode promoCode = promoCodeRepository.findByCodeIgnoreCaseAndActiveTrue(code)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Code promo introuvable"));

        if (promoCode.getDateExpiration() != null && promoCode.getDateExpiration().isBefore(java.time.LocalDateTime.now())) {
            throw new ResponseStatusException(BAD_REQUEST, "Ce code promo est expiré");
        }

        if (promoCode.getUsagesMax() != null && promoCode.getUsagesActuels() >= promoCode.getUsagesMax()) {
            throw new ResponseStatusException(BAD_REQUEST, "Ce code promo a atteint sa limite d'utilisation");
        }

        if (customerOrderRepository.existsByCustomerEmailAndPromoCode(customerEmail, promoCode)) {
            throw new ResponseStatusException(BAD_REQUEST, "Vous avez déjà utilisé ce code promo");
        }

        cart.setPromoCode(promoCode);
        return toDto(cartRepository.save(cart));
    }

    @Override
    public CartDTO removePromoCode(String customerEmail) {
        Cart cart = getOrCreateCart(customerEmail);
        cart.setPromoCode(null);
        return toDto(cartRepository.save(cart));
    }

    @Override
    public void removeItem(String customerEmail, Long itemId) {
        Cart cart = getOrCreateCart(customerEmail);
        boolean removed = cart.getItems().removeIf(item -> item.getId().equals(itemId));
        if (!removed) {
            throw new ResponseStatusException(NOT_FOUND, "Produit absent du panier");
        }
        cartRepository.save(cart);
    }

    @Override
    public void clearCart(String customerEmail) {
        Cart cart = getOrCreateCart(customerEmail);
        cart.getItems().clear();
        cart.setPromoCode(null);
        cartRepository.save(cart);
    }

    private Cart getOrCreateCart(String customerEmail) {
        return cartRepository.findByCustomerEmail(customerEmail)
                .orElseGet(() -> cartRepository.save(Cart.builder()
                        .customer(getCustomer(customerEmail))
                        .items(new ArrayList<>())
                        .build()));
    }

    private User getCustomer(String customerEmail) {
        User user = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur non trouve"));
        if (user.getRole() != Role.CUSTOMER) {
            throw new ResponseStatusException(FORBIDDEN, "Seul un client peut gerer un panier");
        }
        return user;
    }

    private Product getActiveProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Produit non trouve"));
        if (!product.isActif()) {
            throw new ResponseStatusException(BAD_REQUEST, "Produit inactif");
        }
        return product;
    }

    private ProductVariant getVariant(Product product, Long variantId) {
        if (variantId == null) {
            return null;
        }
        return product.getVariants().stream()
                .filter(variant -> variant.getId().equals(variantId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Variante introuvable"));
    }

    private int getAvailableStock(Product product, ProductVariant variant) {
        if (variant != null) {
            return variant.getStockSupplementaire() != null ? variant.getStockSupplementaire() : 0;
        }
        return product.getStock() != null ? product.getStock() : 0;
    }

    private boolean sameVariant(ProductVariant left, ProductVariant right) {
        if (left == null && right == null) {
            return true;
        }
        if (left == null || right == null) {
            return false;
        }
        return left.getId().equals(right.getId());
    }

    private double getUnitPrice(Product product, ProductVariant variant) {
        double basePrice = product.getPrixPromo() != null ? product.getPrixPromo() : product.getPrix();
        if (variant != null && variant.getPrixDelta() != null) {
            return basePrice + variant.getPrixDelta();
        }
        return basePrice;
    }

    private CartDTO toDto(Cart cart) {
        List<CartItemDTO> items = cart.getItems().stream()
                .map(item -> {
                    double unitPrice = getUnitPrice(item.getProduct(), item.getVariant());
                    return CartItemDTO.builder()
                            .id(item.getId())
                            .productId(item.getProduct().getId())
                            .variantId(item.getVariant() != null ? item.getVariant().getId() : null)
                            .productName(item.getProduct().getNom())
                            .variantLabel(item.getVariant() != null
                                    ? item.getVariant().getAttribut() + ": " + item.getVariant().getValeur()
                                    : null)
                            .productImage(!item.getProduct().getImages().isEmpty() ? item.getProduct().getImages().get(0) : null)
                            .quantity(item.getQuantity())
                            .unitPrice(unitPrice)
                            .lineTotal(unitPrice * item.getQuantity())
                            .build();
                })
                .toList();

        int totalItems = items.stream().mapToInt(CartItemDTO::getQuantity).sum();
        double subtotalAmount = items.stream().mapToDouble(CartItemDTO::getLineTotal).sum();
        double discountAmount = calculateDiscount(cart.getPromoCode(), subtotalAmount);
        double shippingFee = subtotalAmount >= 50.0 ? 0.0 : 10.0;
        double taxAmount = Math.max(subtotalAmount - discountAmount + shippingFee, 0.0) * 0.20;
        double totalAmount = Math.max(subtotalAmount - discountAmount + shippingFee + taxAmount, 0.0);

        return CartDTO.builder()
                .id(cart.getId())
                .customerEmail(cart.getCustomer().getEmail())
                .items(items)
                .totalItems(totalItems)
                .subtotalAmount(subtotalAmount)
                .discountAmount(discountAmount)
                .shippingFee(shippingFee)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .promoCode(cart.getPromoCode() != null ? cart.getPromoCode().getCode() : null)
                .build();
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
