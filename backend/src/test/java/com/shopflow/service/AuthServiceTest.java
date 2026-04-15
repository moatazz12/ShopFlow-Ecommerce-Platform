package com.shopflow.service;

import com.shopflow.dto.AuthResponse;
import com.shopflow.dto.UserDTO;
import com.shopflow.entities.PasswordResetToken;
import com.shopflow.entities.Role;
import com.shopflow.entities.User;
import com.shopflow.exception.ConflictException;
import com.shopflow.mapper.UserMapper;
import com.shopflow.repository.PasswordResetTokenRepository;
import com.shopflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private RefreshTokenStore refreshTokenStore;

    @InjectMocks
    private AuthService authService;

    private User user;
    private UserDTO userDTO;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("customer@test.com");
        user.setPassword("encoded");
        user.setRole(Role.CUSTOMER);
        user.setActif(true);

        userDTO = new UserDTO();
        userDTO.setEmail("customer@test.com");
        userDTO.setRole(Role.CUSTOMER);
    }

    @Test
    void registerEncodesPasswordAndSavesUser() {
        when(userRepository.findByEmail(userDTO.getEmail())).thenReturn(Optional.empty());
        when(userMapper.toEntity(userDTO)).thenReturn(user);
        when(passwordEncoder.encode("Secret123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toDto(user)).thenReturn(userDTO);

        UserDTO result = authService.register(userDTO, "Secret123");

        assertEquals("customer@test.com", result.getEmail());
        assertEquals("encoded", user.getPassword());
    }

    @Test
    void registerThrowsWhenEmailExists() {
        when(userRepository.findByEmail(userDTO.getEmail())).thenReturn(Optional.of(user));

        assertThrows(ConflictException.class, () -> authService.register(userDTO, "Secret123"));
    }

    @Test
    void registerSellerAttachesSellerProfile() {
        userDTO.setRole(Role.SELLER);
        userDTO.setShopName("Demo Shop");
        userDTO.setShopDescription("Description");
        userDTO.setShopLogo("logo.png");
        user.setRole(Role.SELLER);

        when(userRepository.findByEmail(userDTO.getEmail())).thenReturn(Optional.empty());
        when(userMapper.toEntity(userDTO)).thenReturn(user);
        when(passwordEncoder.encode("Secret123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userMapper.toDto(user)).thenReturn(userDTO);

        authService.register(userDTO, "Secret123");

        assertNotNull(user.getSellerProfile());
        assertEquals("Demo Shop", user.getSellerProfile().getNomBoutique());
    }

    @Test
    void loginReturnsAccessAndRefreshTokens() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Secret123", "encoded")).thenReturn(true);
        when(jwtService.generateToken(user.getEmail(), user.getRole())).thenReturn("access");
        when(jwtService.generateRefreshToken(user.getEmail())).thenReturn("refresh");

        AuthResponse result = authService.login(user.getEmail(), "Secret123");

        assertEquals("access", result.getAccessToken());
        assertEquals("refresh", result.getRefreshToken());
    }

    @Test
    void refreshAccessTokenReturnsNewAccessToken() {
        when(refreshTokenStore.isRevoked("refresh")).thenReturn(false);
        when(jwtService.extractUsernameFromRefreshToken("refresh")).thenReturn(user.getEmail());
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(jwtService.isRefreshTokenValid("refresh", user.getEmail())).thenReturn(true);
        when(jwtService.generateToken(user.getEmail(), user.getRole())).thenReturn("new-access");

        String result = authService.refreshAccessToken("refresh");

        assertEquals("new-access", result);
    }

    @Test
    void refreshAccessTokenThrowsWhenTokenRevoked() {
        when(refreshTokenStore.isRevoked("refresh")).thenReturn(true);

        assertThrows(ResponseStatusException.class, () -> authService.refreshAccessToken("refresh"));
    }

    @Test
    void generateRefreshTokenReturnsTokenWhenPasswordMatches() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Secret123", "encoded")).thenReturn(true);
        when(jwtService.generateRefreshToken(user.getEmail())).thenReturn("refresh");

        String result = authService.generateRefreshToken(user.getEmail(), "Secret123");

        assertEquals("refresh", result);
    }

    @Test
    void generateRefreshTokenThrowsWhenPasswordIncorrect() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("bad", "encoded")).thenReturn(false);

        assertThrows(ResponseStatusException.class, () -> authService.generateRefreshToken(user.getEmail(), "bad"));
    }

    @Test
    void logoutRevokesRefreshToken() {
        authService.logout("refresh");
        verify(refreshTokenStore).revoke("refresh");
    }

    @Test
    void createAndResetPasswordFlowWorks() {
        PasswordResetToken token = PasswordResetToken.builder()
                .token("RST-123")
                .user(user)
                .used(false)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordResetTokenRepository.findByToken("RST-123")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NewSecret123")).thenReturn("new-encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String generated = authService.createPasswordResetToken(user.getEmail());
        assertNotNull(generated);

        authService.resetPassword("RST-123", "NewSecret123");

        assertEquals("new-encoded", user.getPassword());
        assertTrue(token.isUsed());
    }

    @Test
    void loginThrowsWhenPasswordIncorrect() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("bad", "encoded")).thenReturn(false);

        assertThrows(ResponseStatusException.class, () -> authService.login(user.getEmail(), "bad"));
    }

    @Test
    void resetPasswordThrowsWhenTokenExpired() {
        PasswordResetToken token = PasswordResetToken.builder()
                .token("RST-EXPIRED")
                .user(user)
                .used(false)
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .build();
        when(passwordResetTokenRepository.findByToken("RST-EXPIRED")).thenReturn(Optional.of(token));

        assertThrows(ResponseStatusException.class,
                () -> authService.resetPassword("RST-EXPIRED", "NewSecret123"));
    }
}
