package com.shopflow.controller;

import com.shopflow.dto.AuthRegisterRequest;
import com.shopflow.dto.AuthLoginRequest;
import com.shopflow.dto.AuthResponse;
import com.shopflow.dto.PasswordResetConfirmRequest;
import com.shopflow.dto.PasswordResetRequest;
import com.shopflow.dto.UserDTO;
import com.shopflow.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "APIs d'inscription et de connexion")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Inscrire un nouvel utilisateur")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Utilisateur cree"),
            @ApiResponse(responseCode = "400", description = "Donnees invalides"),
            @ApiResponse(responseCode = "409", description = "Email deja utilise")
    })
    public ResponseEntity<UserDTO> register(@Valid @RequestBody AuthRegisterRequest request) {
        UserDTO userDTO = new UserDTO();
        userDTO.setEmail(request.getEmail());
        userDTO.setPrenom(request.getPrenom());
        userDTO.setNom(request.getNom());
        userDTO.setShopName(request.getShopName());
        userDTO.setShopLogo(request.getShopLogo());
        userDTO.setShopDescription(request.getShopDescription());
        userDTO.setRole(request.getRole());

        UserDTO createdUser = authService.register(userDTO, request.getPassword());
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdUser.getId())
                .toUri();

        return ResponseEntity.created(location).body(createdUser);
    }

    @PostMapping("/login")
    @Operation(summary = "Se connecter pour obtenir un Token JWT")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Token JWT retourne"),
            @ApiResponse(responseCode = "401", description = "Mot de passe incorrect"),
            @ApiResponse(responseCode = "404", description = "Utilisateur non trouve")
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthLoginRequest request) {
        return ResponseEntity.ok(authService.login(request.getEmail(), request.getPassword()));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Generer un nouvel access token a partir d'un refresh token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Nouveau token JWT retourne"),
            @ApiResponse(responseCode = "401", description = "Refresh token invalide"),
            @ApiResponse(responseCode = "404", description = "Utilisateur non trouve")
    })
    public ResponseEntity<String> refresh(@RequestParam String refreshToken) {
        return ResponseEntity.ok(authService.refreshAccessToken(refreshToken));
    }

    @PostMapping("/logout")
    @Operation(summary = "Invalider le refresh token")
    @ApiResponse(responseCode = "204", description = "Refresh token invalide")
    public ResponseEntity<Void> logout(@RequestParam String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Obtenir un refresh token apres authentification")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Refresh token retourne"),
            @ApiResponse(responseCode = "401", description = "Mot de passe incorrect"),
            @ApiResponse(responseCode = "404", description = "Utilisateur non trouve")
    })
    public ResponseEntity<String> getRefreshToken(@RequestParam String email, @RequestParam String password) {
        return ResponseEntity.ok(authService.generateRefreshToken(email, password));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Generer un token de reinitialisation de mot de passe")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Token de reinitialisation retourne"),
            @ApiResponse(responseCode = "404", description = "Utilisateur non trouve")
    })
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody PasswordResetRequest request) {
        return ResponseEntity.ok(authService.createPasswordResetToken(request.getEmail()));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reinitialiser le mot de passe via un token")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Mot de passe mis a jour"),
            @ApiResponse(responseCode = "401", description = "Token invalide ou expire"),
            @ApiResponse(responseCode = "404", description = "Token introuvable")
    })
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody PasswordResetConfirmRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.noContent().build();
    }
}
