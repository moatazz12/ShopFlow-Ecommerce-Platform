package com.shopflow.service;

import com.shopflow.dto.CouponDTO;
import com.shopflow.dto.CouponRequest;

import java.util.List;

public interface CouponService {
    CouponDTO createCoupon(CouponRequest request);

    CouponDTO updateCoupon(Long id, CouponRequest request);

    void deleteCoupon(Long id);

    CouponDTO validateCoupon(String code);

    List<CouponDTO> getAllCoupons();
}
