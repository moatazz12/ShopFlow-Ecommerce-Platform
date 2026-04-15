package com.shopflow.service;

import com.shopflow.entities.Role;
import com.shopflow.entities.User;
import com.shopflow.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void loadUserByUsernameBuildsSpringSecurityUser() {
        User user = User.builder()
                .email("admin@shopflow.com")
                .password("encoded")
                .role(Role.ADMIN)
                .actif(true)
                .build();
        when(userRepository.findByEmail("admin@shopflow.com")).thenReturn(Optional.of(user));

        UserDetails details = customUserDetailsService.loadUserByUsername("admin@shopflow.com");

        assertEquals("admin@shopflow.com", details.getUsername());
        assertEquals("encoded", details.getPassword());
        assertTrue(details.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
        assertTrue(details.isEnabled());
    }

    @Test
    void loadUserByUsernameReturnsDisabledWhenAccountInactive() {
        User user = User.builder()
                .email("customer@shopflow.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .actif(false)
                .build();
        when(userRepository.findByEmail("customer@shopflow.com")).thenReturn(Optional.of(user));

        UserDetails details = customUserDetailsService.loadUserByUsername("customer@shopflow.com");

        assertFalse(details.isEnabled());
    }

    @Test
    void loadUserByUsernameThrowsWhenUserMissing() {
        when(userRepository.findByEmail("missing@shopflow.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> customUserDetailsService.loadUserByUsername("missing@shopflow.com"));
    }
}
