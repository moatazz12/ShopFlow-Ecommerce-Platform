package com.shopflow.entities;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("BILLING")
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class BillingAddress extends Address {
}
