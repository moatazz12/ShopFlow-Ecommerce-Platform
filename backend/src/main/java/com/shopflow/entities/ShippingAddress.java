package com.shopflow.entities;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("SHIPPING")
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ShippingAddress extends Address {
}
