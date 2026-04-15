package com.shopflow.service;

import com.shopflow.dto.UserDTO;
import com.shopflow.dto.AuthResponse;
import com.shopflow.entities.Role;
import com.shopflow.entities.SellerProfile;
import com.shopflow.entities.User;
import com.shopflow.exception.ConflictException;
import com.shopflow.exception.ResourceNotFoundException;
import com.shopflow.mapper.UserMapper;
import com.shopflow.repository.PasswordResetTokenRepository;
import com.shopflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("null")
public class AuthService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenStore refreshTokenStore;

    public UserDTO register(UserDTO dto, String password) {
        // Normaliser l'email en minuscules pour éviter les doublons cachés
        String email = dto.getEmail().toLowerCase().trim();
        dto.setEmail(email);

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ConflictException("Un utilisateur avec cet email existe deja");
        }

        User user = userMapper.toEntity(dto);
        user.setPassword(passwordEncoder.encode(password));
        user.setActif(true);
        attachSellerProfileIfNeeded(user, dto);
        return userMapper.toDto(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(String email, String password) {
        // Normaliser aussi le login pour trouver l'utilisateur même si majuscules
        String normalizedEmail = email.toLowerCase().trim();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouve"));

        if (passwordEncoder.matches(password, user.getPassword())) {
            return AuthResponse.builder()
                    .accessToken(jwtService.generateToken(normalizedEmail, user.getRole()))
                    .refreshToken(jwtService.generateRefreshToken(normalizedEmail))
                    .build();
        }

        throw new ResponseStatusException(UNAUTHORIZED, "Mot de passe incorrect");
    }

    @Transactional(readOnly = true)
    public String refreshAccessToken(String refreshToken) {
        if (refreshTokenStore.isRevoked(refreshToken)) {
            throw new ResponseStatusException(UNAUTHORIZED, "Refresh token invalide");
        }
        String email = jwtService.extractUsernameFromRefreshToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouve"));

        if (!jwtService.isRefreshTokenValid(refreshToken, user.getEmail())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Refresh token invalide");
        }

        return jwtService.generateToken(user.getEmail(), user.getRole());
    }

    @Transactional(readOnly = true)
    public String generateRefreshToken(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouve"));

        if (passwordEncoder.matches(password, user.getPassword())) {
            return jwtService.generateRefreshToken(email);
        }

        throw new ResponseStatusException(UNAUTHORIZED, "Mot de passe incorrect");
    }

    public void logout(String refreshToken) {
        refreshTokenStore.revoke(refreshToken);
    }

    public String createPasswordResetToken(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouve"));

        String token = "RST-" + UUID.randomUUID();
        passwordResetTokenRepository.save(com.shopflow.entities.PasswordResetToken.builder()
                .token(token)
                .user(user)
                .used(false)
                .expiresAt(LocalDateTime.now().plusHours(2))
                .build());
        return token;
    }

    public void resetPassword(String token, String newPassword) {
        com.shopflow.entities.PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Token de reinitialisation introuvable"));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Token de reinitialisation invalide ou expire");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        resetToken.setUsed(true);
        userRepository.save(user);
        passwordResetTokenRepository.save(resetToken);
    }

    private void attachSellerProfileIfNeeded(User user, UserDTO dto) {
        if (user.getRole() == Role.SELLER) {
            user.setSellerProfile(SellerProfile.builder()
                    .user(user)
                    .nomBoutique(dto.getShopName())
                    .description(dto.getShopDescription())
                    .logo(dto.getShopLogo())
                    .note(0.0)
                    .build());
        }
    }
}
