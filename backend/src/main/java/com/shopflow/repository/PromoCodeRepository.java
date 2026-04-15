package com.shopflow.repository;

import com.shopflow.entities.PromoCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PromoCodeRepository extends JpaRepository<PromoCode, Long> {
    Optional<PromoCode> findByCodeIgnoreCaseAndActiveTrue(String code);

    Optional<PromoCode> findByCodeIgnoreCase(String code);
}
