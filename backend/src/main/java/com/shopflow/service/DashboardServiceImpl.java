package com.shopflow.service;

import com.shopflow.dto.AdminDashboardDTO;
import com.shopflow.dto.CustomerDashboardDTO;
import com.shopflow.dto.SellerDashboardDTO;
import com.shopflow.entities.CustomerOrder;
import com.shopflow.entities.OrderStatus;

import com.shopflow.repository.CustomerOrderRepository;
import com.shopflow.repository.ProductRepository;
import com.shopflow.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

        private final CustomerOrderRepository customerOrderRepository;
        private final ProductRepository productRepository;
        private final ReviewRepository reviewRepository;

        @Override
        public AdminDashboardDTO getAdminDashboard() {
                List<CustomerOrder> orders = customerOrderRepository.findAll();

                double globalRevenue = orders.stream()
                                .filter(order -> order != null && order.getStatus() != null)
                                .filter(order -> order.getStatus() == OrderStatus.PAID
                                                || order.getStatus() == OrderStatus.DELIVERED
                                                || order.getStatus() == OrderStatus.SHIPPED)
                                .mapToDouble(order -> order.getTotalAmount() != null ? order.getTotalAmount() : 0.0)
                                .sum();

                List<String> topProducts = orders.stream()
                                .filter(o -> o != null && o.getItems() != null)
                                .flatMap(order -> order.getItems().stream())
                                .filter(item -> item != null && item.getProduct() != null
                                                && item.getProduct().getNom() != null)
                                .collect(Collectors.groupingBy(item -> item.getProduct().getNom(),
                                                Collectors.summingInt(item -> item.getQuantity())))
                                .entrySet().stream()
                                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                                .limit(5)
                                .map(entry -> entry.getKey() + " (" + entry.getValue() + ")")
                                .toList();

                List<String> topSellers = orders.stream()
                                .filter(o -> o != null && o.getItems() != null)
                                .flatMap(order -> order.getItems().stream())
                                .filter(item -> item != null && item.getSeller() != null
                                                && item.getSeller().getNom() != null)
                                .collect(Collectors.groupingBy(item -> item.getSeller().getNom(),
                                                Collectors.summingDouble(item -> (item.getUnitPrice() != null
                                                                ? item.getUnitPrice()
                                                                : 0.0) * item.getQuantity())))
                                .entrySet().stream()
                                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                                .limit(5)
                                .map(entry -> entry.getKey() + " (" + String.format("%.2f", entry.getValue()) + ")")
                                .toList();

                List<String> recentOrders = orders.stream()
                                .filter(o -> o != null)
                                .sorted(Comparator.comparing(
                                                (CustomerOrder o) -> o.getCreatedAt() != null ? o.getCreatedAt()
                                                                : java.time.LocalDateTime.MIN)
                                                .reversed())
                                .limit(10)
                                .map(order -> (order.getOrderNumber() != null ? order.getOrderNumber() : "N/A") + " - "
                                                + (order.getStatus() != null ? order.getStatus() : "INCONNU"))
                                .toList();

                return AdminDashboardDTO.builder()
                                .globalRevenue(globalRevenue)
                                .topProducts(topProducts)
                                .topSellers(topSellers)
                                .recentOrders(recentOrders)
                                .build();
        }

        @Override
        public SellerDashboardDTO getSellerDashboard(String sellerEmail) {
                List<CustomerOrder> orders = customerOrderRepository
                                .findDistinctByItemsSellerEmailOrderByCreatedAtDesc(sellerEmail);
                if (orders == null)
                        orders = List.of();

                double revenue = orders.stream()
                                .filter(o -> o != null && o.getItems() != null)
                                .flatMap(order -> order.getItems().stream())
                                .filter(item -> item != null && item.getSeller() != null
                                                && sellerEmail.equals(item.getSeller().getEmail()))
                                .mapToDouble(item -> (item.getUnitPrice() != null ? item.getUnitPrice() : 0.0)
                                                * item.getQuantity())
                                .sum();

                long pendingOrders = orders.stream()
                                .filter(o -> o != null && o.getStatus() != null)
                                .filter(order -> order.getStatus() == OrderStatus.PENDING
                                                || order.getStatus() == OrderStatus.PAID)
                                .count();

                List<String> lowStockAlerts = productRepository.findAll().stream()
                                .filter(product -> product != null && product.getSeller() != null
                                                && sellerEmail.equals(product.getSeller().getEmail()))
                                .filter(product -> product.isActif()) // Uniquement les produits actifs
                                .filter(product -> product.getStock() != null && product.getStock() <= 5)
                                .map(product -> (product.getNom() != null ? product.getNom() : "Inconnu") + " stock="
                                                + product.getStock())
                                .toList();

                return SellerDashboardDTO.builder()
                                .revenue(revenue)
                                .pendingOrders(pendingOrders)
                                .lowStockAlerts(lowStockAlerts)
                                .build();
        }

        @Override
        public CustomerDashboardDTO getCustomerDashboard(String customerEmail) {
                List<CustomerOrder> orders = customerOrderRepository
                                .findByCustomerEmailOrderByCreatedAtDesc(customerEmail);
                if (orders == null)
                        orders = List.of();

                List<String> currentOrders = orders.stream()
                                .filter(o -> o != null && o.getStatus() != null)
                                .filter(order -> order.getStatus() != OrderStatus.DELIVERED
                                                && order.getStatus() != OrderStatus.CANCELLED)
                                .map(order -> (order.getOrderNumber() != null ? order.getOrderNumber() : "CMD-TEMP")
                                                + " - " + order.getStatus())
                                .toList();

                List<com.shopflow.entities.Review> reviews = reviewRepository
                                .findByCustomerEmailOrderByCreatedAtDesc(customerEmail);
                if (reviews == null)
                        reviews = List.of();

                List<String> latestReviews = reviews.stream()
                                .filter(r -> r != null && r.getProduct() != null)
                                .limit(5)
                                .map(review -> (review.getProduct().getNom() != null ? review.getProduct().getNom()
                                                : "Produit") + " - " + review.getRating() + "/5")
                                .toList();

                return CustomerDashboardDTO.builder()
                                .currentOrders(currentOrders)
                                .latestReviews(latestReviews)
                                .build();
        }
}
