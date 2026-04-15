package com.shopflow.service;

import com.shopflow.dto.CheckoutRequest;
import com.shopflow.dto.OrderDTO;
import com.shopflow.entities.OrderStatus;

import java.util.List;

public interface OrderService {
    OrderDTO checkout(String customerEmail, CheckoutRequest request);

    OrderDTO getOrderById(Long orderId, String actorEmail);

    List<OrderDTO> getCustomerOrders(String customerEmail);

    List<OrderDTO> getSellerOrders(String sellerEmail);

    List<OrderDTO> getAllOrders();

    OrderDTO updateOrderStatus(Long orderId, String actorEmail, OrderStatus status);

    OrderDTO cancelOrder(Long orderId, String customerEmail);
}
