package com.shopflow.service;

import com.shopflow.dto.CouponDTO;
import com.shopflow.dto.CouponRequest;
import com.shopflow.entities.DiscountType;
import com.shopflow.entities.PromoCode;
import com.shopflow.exception.ResourceNotFoundException;
import com.shopflow.repository.PromoCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
@DisplayName("CouponService — Tests unitaires")
class CouponServiceTest {

    @Mock
    private PromoCodeRepository promoCodeRepository;

    @InjectMocks
    private CouponServiceImpl couponService;

    private PromoCode activeCoupon;
    private PromoCode expiredCoupon;
    private PromoCode exhaustedCoupon;
    private CouponRequest request;

    @BeforeEach
    void setUp() {
        activeCoupon = PromoCode.builder()
                .id(1L)
                .code("SUMMER25")
                .discountType(DiscountType.PERCENTAGE)
                .value(25.0)
                .dateExpiration(LocalDateTime.now().plusDays(30))
                .usagesMax(100)
                .usagesActuels(10)
                .active(true)
                .build();

        expiredCoupon = PromoCode.builder()
                .id(2L)
                .code("OLDCODE")
                .discountType(DiscountType.FIXED)
                .value(10.0)
                .dateExpiration(LocalDateTime.now().minusDays(1))
                .usagesMax(50)
                .usagesActuels(5)
                .active(true)
                .build();

        exhaustedCoupon = PromoCode.builder()
                .id(3L)
                .code("MAXED")
                .discountType(DiscountType.PERCENTAGE)
                .value(15.0)
                .dateExpiration(LocalDateTime.now().plusDays(10))
                .usagesMax(10)
                .usagesActuels(10)
                .active(true)
                .build();

        request = new CouponRequest();
        request.setCode("NEWCODE");
        request.setDiscountType(DiscountType.PERCENTAGE);
        request.setValue(15.0);
        request.setDateExpiration(LocalDateTime.now().plusDays(60));
        request.setUsagesMax(200);
        request.setActive(true);
    }

    // ── createCoupon ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("createCoupon — enregistre et retourne le nouveau coupon")
    void createCoupon_SavesAndReturnsDto() {
        PromoCode saved = PromoCode.builder()
                .id(10L).code("NEWCODE").discountType(DiscountType.PERCENTAGE)
                .value(15.0).dateExpiration(request.getDateExpiration())
                .usagesMax(200).usagesActuels(0).active(true).build();

        when(promoCodeRepository.save(any(PromoCode.class))).thenReturn(saved);

        CouponDTO result = couponService.createCoupon(request);

        assertNotNull(result);
        assertEquals("NEWCODE", result.getCode());
        assertEquals(15.0, result.getValue());
        assertTrue(result.isActive());
        verify(promoCodeRepository).save(any(PromoCode.class));
    }

    @Test
    @DisplayName("createCoupon — coupon FIXED créé avec la bonne valeur")
    void createCoupon_FixedType_SavesCorrectly() {
        request.setDiscountType(DiscountType.FIXED);
        request.setValue(20.0);

        PromoCode saved = PromoCode.builder()
                .id(11L).code("NEWCODE").discountType(DiscountType.FIXED)
                .value(20.0).usagesMax(200).usagesActuels(0).active(true).build();
        when(promoCodeRepository.save(any())).thenReturn(saved);

        CouponDTO result = couponService.createCoupon(request);

        assertEquals(DiscountType.FIXED, result.getDiscountType());
        assertEquals(20.0, result.getValue());
    }

    // ── updateCoupon ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateCoupon — met à jour tous les champs")
    void updateCoupon_UpdatesAllFields() {
        when(promoCodeRepository.findById(1L)).thenReturn(Optional.of(activeCoupon));
        when(promoCodeRepository.save(activeCoupon)).thenReturn(activeCoupon);

        CouponRequest updateRequest = new CouponRequest();
        updateRequest.setCode("UPDATED");
        updateRequest.setDiscountType(DiscountType.FIXED);
        updateRequest.setValue(30.0);
        updateRequest.setDateExpiration(LocalDateTime.now().plusDays(10));
        updateRequest.setUsagesMax(50);
        updateRequest.setActive(true);

        CouponDTO result = couponService.updateCoupon(1L, updateRequest);

        assertEquals("UPDATED", result.getCode());
        assertEquals(30.0, result.getValue());
        verify(promoCodeRepository).save(activeCoupon);
    }

    @Test
    @DisplayName("updateCoupon — lève ResourceNotFoundException si coupon introuvable")
    void updateCoupon_ThrowsWhenNotFound() {
        when(promoCodeRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> couponService.updateCoupon(999L, request));
    }

    // ── deleteCoupon ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteCoupon — supprime le coupon existant")
    void deleteCoupon_DeletesExistingCoupon() {
        when(promoCodeRepository.findById(1L)).thenReturn(Optional.of(activeCoupon));

        couponService.deleteCoupon(1L);

        verify(promoCodeRepository).delete(activeCoupon);
    }

    @Test
    @DisplayName("deleteCoupon — lève ResourceNotFoundException si coupon introuvable")
    void deleteCoupon_ThrowsWhenNotFound() {
        when(promoCodeRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> couponService.deleteCoupon(404L));
        verify(promoCodeRepository, never()).delete(any());
    }

    // ── validateCoupon ────────────────────────────────────────────────────────

    @Test
    @DisplayName("validateCoupon — retourne valid=true pour un coupon actif non expiré")
    void validateCoupon_ActiveAndNotExpired_IsValid() {
        when(promoCodeRepository.findByCodeIgnoreCase("SUMMER25"))
                .thenReturn(Optional.of(activeCoupon));

        CouponDTO result = couponService.validateCoupon("SUMMER25");

        assertTrue(result.isValid());
        assertTrue(result.isActive());
    }

    @Test
    @DisplayName("validateCoupon — retourne valid=false pour un coupon expiré")
    void validateCoupon_Expired_IsNotValid() {
        when(promoCodeRepository.findByCodeIgnoreCase("OLDCODE"))
                .thenReturn(Optional.of(expiredCoupon));

        CouponDTO result = couponService.validateCoupon("OLDCODE");

        assertFalse(result.isValid(), "Un coupon expiré ne doit pas être valide");
    }

    @Test
    @DisplayName("validateCoupon — retourne valid=false pour un coupon épuisé")
    void validateCoupon_Exhausted_IsNotValid() {
        when(promoCodeRepository.findByCodeIgnoreCase("MAXED"))
                .thenReturn(Optional.of(exhaustedCoupon));

        CouponDTO result = couponService.validateCoupon("MAXED");

        assertFalse(result.isValid(), "Un coupon épuisé ne doit pas être valide");
    }

    @Test
    @DisplayName("validateCoupon — insensible à la casse du code")
    void validateCoupon_CaseInsensitive() {
        when(promoCodeRepository.findByCodeIgnoreCase("summer25"))
                .thenReturn(Optional.of(activeCoupon));

        CouponDTO result = couponService.validateCoupon("summer25");

        assertNotNull(result);
        assertEquals("SUMMER25", result.getCode());
    }

    @Test
    @DisplayName("validateCoupon — lève ResourceNotFoundException si code inexistant")
    void validateCoupon_ThrowsWhenCodeNotFound() {
        when(promoCodeRepository.findByCodeIgnoreCase("GHOST")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> couponService.validateCoupon("GHOST"));
    }

    // ── getAllCoupons ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getAllCoupons — retourne la liste complète")
    void getAllCoupons_ReturnsAll() {
        when(promoCodeRepository.findAll()).thenReturn(List.of(activeCoupon, expiredCoupon));

        List<CouponDTO> result = couponService.getAllCoupons();

        assertEquals(2, result.size());
    }

    @Test
    @DisplayName("getAllCoupons — retourne liste vide si aucun coupon")
    void getAllCoupons_EmptyList() {
        when(promoCodeRepository.findAll()).thenReturn(List.of());

        List<CouponDTO> result = couponService.getAllCoupons();

        assertTrue(result.isEmpty());
    }

    // ── Logique valid ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("toDto — valid=true si active + non expiré + pas épuisé")
    void toDto_ValidTrueForAllConditionsMet() {
        when(promoCodeRepository.findByCodeIgnoreCase("SUMMER25"))
                .thenReturn(Optional.of(activeCoupon));

        CouponDTO dto = couponService.validateCoupon("SUMMER25");

        assertTrue(dto.isActive());
        assertTrue(dto.isValid());
        assertEquals(10, dto.getUsagesActuels());
        assertEquals(100, dto.getUsagesMax());
    }

    @Test
    @DisplayName("toDto — valid=false si coupon inactif")
    void toDto_ValidFalseWhenInactive() {
        PromoCode inactive = PromoCode.builder()
                .id(99L).code("INACTIVE").discountType(DiscountType.FIXED)
                .value(5.0).usagesMax(100).usagesActuels(0).active(false).build();
        when(promoCodeRepository.findByCodeIgnoreCase("INACTIVE"))
                .thenReturn(Optional.of(inactive));

        CouponDTO result = couponService.validateCoupon("INACTIVE");

        assertFalse(result.isValid());
    }

    @Test
    @DisplayName("toDto — valid=true si usagesMax=null (illimité)")
    void toDto_ValidTrueWhenUnlimitedUsages() {
        activeCoupon.setUsagesMax(null);
        when(promoCodeRepository.findByCodeIgnoreCase("SUMMER25"))
                .thenReturn(Optional.of(activeCoupon));

        CouponDTO result = couponService.validateCoupon("SUMMER25");

        assertTrue(result.isValid());
    }
}
