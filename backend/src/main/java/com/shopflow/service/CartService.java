package com.shopflow.service;

import com.shopflow.dto.CartDTO;
import com.shopflow.dto.CartItemRequest;

public interface CartService {
    CartDTO getCurrentCart(String customerEmail);

    CartDTO addItem(String customerEmail, CartItemRequest request);

    CartDTO updateItemQuantity(String customerEmail, Long itemId, Integer quantity);

    CartDTO applyPromoCode(String customerEmail, String code);

    CartDTO removePromoCode(String customerEmail);

    void removeItem(String customerEmail, Long itemId);

    void clearCart(String customerEmail);
}
