package com.shopflow.service;

import com.shopflow.dto.CouponDTO;
import com.shopflow.dto.CouponRequest;
import com.shopflow.entities.PromoCode;
import com.shopflow.exception.ResourceNotFoundException;
import com.shopflow.repository.PromoCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("null")
public class CouponServiceImpl implements CouponService {

    private final PromoCodeRepository promoCodeRepository;

    @Override
    public CouponDTO createCoupon(CouponRequest request) {
        PromoCode coupon = PromoCode.builder()
                .code(request.getCode())
                .discountType(request.getDiscountType())
                .value(request.getValue())
                .dateExpiration(request.getDateExpiration())
                .usagesMax(request.getUsagesMax())
                .active(request.isActive())
                .build();
        return toDto(promoCodeRepository.save(coupon));
    }

    @Override
    public CouponDTO updateCoupon(Long id, CouponRequest request) {
        PromoCode coupon = promoCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon non trouve"));
        coupon.setCode(request.getCode());
        coupon.setDiscountType(request.getDiscountType());
        coupon.setValue(request.getValue());
        coupon.setDateExpiration(request.getDateExpiration());
        coupon.setUsagesMax(request.getUsagesMax());
        coupon.setActive(request.isActive());
        return toDto(promoCodeRepository.save(coupon));
    }

    @Override
    public void deleteCoupon(Long id) {
        PromoCode coupon = promoCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon non trouve"));
        promoCodeRepository.delete(coupon);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponDTO validateCoupon(String code) {
        PromoCode coupon = promoCodeRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon non trouve"));
        return toDto(coupon);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CouponDTO> getAllCoupons() {
        return promoCodeRepository.findAll().stream().map(this::toDto).toList();
    }

    private CouponDTO toDto(PromoCode coupon) {
        boolean valid = coupon.isActive()
                && (coupon.getDateExpiration() == null || coupon.getDateExpiration().isAfter(LocalDateTime.now()))
                && (coupon.getUsagesMax() == null || coupon.getUsagesActuels() < coupon.getUsagesMax());

        return CouponDTO.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType())
                .value(coupon.getValue())
                .dateExpiration(coupon.getDateExpiration())
                .usagesMax(coupon.getUsagesMax())
                .usagesActuels(coupon.getUsagesActuels())
                .active(coupon.isActive())
                .valid(valid)
                .build();
    }
}
