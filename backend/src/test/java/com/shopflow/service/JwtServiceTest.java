package com.shopflow.service;

import com.shopflow.entities.Role;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService();

    @Test
    void accessTokenContainsExpectedSubjectAndIsValid() {
        String token = jwtService.generateToken("seller@shopflow.com", Role.SELLER);

        assertNotNull(token);
        assertEquals("seller@shopflow.com", jwtService.extractUsername(token));
        assertTrue(jwtService.isTokenValid(token, "seller@shopflow.com"));
        assertFalse(jwtService.isTokenValid(token, "other@shopflow.com"));
    }

    @Test
    void refreshTokenContainsExpectedSubjectAndType() {
        String refreshToken = jwtService.generateRefreshToken("customer@shopflow.com");

        assertNotNull(refreshToken);
        assertEquals("customer@shopflow.com", jwtService.extractUsernameFromRefreshToken(refreshToken));
        assertTrue(jwtService.isRefreshTokenValid(refreshToken, "customer@shopflow.com"));
        assertFalse(jwtService.isRefreshTokenValid(refreshToken, "other@shopflow.com"));
    }
}
