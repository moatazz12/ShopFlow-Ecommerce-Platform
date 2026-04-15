package com.shopflow.entities;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customer_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipping_address_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Address shippingAddress;

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<OrderItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    private Double totalAmount;
    private Double subtotalAmount;
    private Double discountAmount;
    private Double shippingFee;
    private Double taxAmount;

    private String orderNumber;
    private String paymentReference;
    private boolean isNew;
    private boolean refunded;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promo_code_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private PromoCode promoCode;

    @jakarta.persistence.PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (subtotalAmount == null) {
            subtotalAmount = 0.0;
        }
        if (discountAmount == null) {
            discountAmount = 0.0;
        }
        if (shippingFee == null) {
            shippingFee = 0.0;
        }
        if (taxAmount == null) {
            taxAmount = 0.0;
        }
        if (totalAmount == null) {
            totalAmount = 0.0;
        }
    }

    @jakarta.persistence.Transient
    public String getNumeroCommande() {
        return orderNumber;
    }

    @jakarta.persistence.Transient
    public Address getAdresseLivraison() {
        return shippingAddress;
    }

    @jakarta.persistence.Transient
    public Double getSousTotal() {
        return subtotalAmount;
    }

    @jakarta.persistence.Transient
    public Double getFraisLivraison() {
        return shippingFee;
    }

    @jakarta.persistence.Transient
    public Double getTotalTTC() {
        return totalAmount;
    }

    @jakarta.persistence.Transient
    public LocalDateTime getDateCommande() {
        return createdAt;
    }
}
