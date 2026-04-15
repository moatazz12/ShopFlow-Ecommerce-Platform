package com.shopflow.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RefreshTokenStoreTest {

    @Test
    void revokeMarksTokenAsRevoked() {
        RefreshTokenStore store = new RefreshTokenStore();

        assertFalse(store.isRevoked("refresh-token"));

        store.revoke("refresh-token");

        assertTrue(store.isRevoked("refresh-token"));
    }
}
