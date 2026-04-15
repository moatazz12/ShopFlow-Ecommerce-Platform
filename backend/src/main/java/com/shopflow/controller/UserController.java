package com.shopflow.controller;

import com.shopflow.dto.UserDTO;
import com.shopflow.repository.UserRepository;
import com.shopflow.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "APIs de profil et administration des utilisateurs")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    @Operation(summary = "Afficher le profil de l'utilisateur connecte")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO> getMyProfile(Authentication authentication) {
        Long userId = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur non trouve"))
                .getId();
        return ResponseEntity.ok(userService.getUserProfile(userId));
    }

    @PutMapping("/me")
    @Operation(summary = "Mettre a jour le profil de l'utilisateur connecte")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO> updateMyProfile(Authentication authentication,
            @RequestBody UserDTO dto) {
        Long userId = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur non trouve"))
                .getId();
        return ResponseEntity.ok(userService.updateProfile(userId, dto));
    }

    @GetMapping
    @Operation(summary = "Afficher tous les utilisateurs pour l'administrateur")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userRepository.findAll().stream()
                .map(user -> {
                    UserDTO dto = new UserDTO();
                    dto.setId(user.getId());
                    dto.setEmail(user.getEmail());
                    dto.setPrenom(user.getPrenom());
                    dto.setNom(user.getNom());
                    dto.setShopName(user.getShopName());
                    dto.setShopLogo(user.getShopLogo());
                    dto.setShopDescription(user.getShopDescription());
                    dto.setRole(user.getRole());
                    dto.setActif(user.isActif());
                    return dto;
                })
                .toList();
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/{id}/toggle-status")
    @Operation(summary = "Activer ou desactiver un utilisateur")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> toggleUserStatus(@PathVariable Long id) {
        userService.toggleUserStatus(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/role")
    @Operation(summary = "Mettre a jour le role d'un utilisateur")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateUserRole(@PathVariable Long id, @org.springframework.web.bind.annotation.RequestParam com.shopflow.entities.Role role) {
        userService.updateUserRole(id, role);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/me/password")
    @Operation(summary = "Changer le mot de passe de l'utilisateur connecte")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> changePassword(Authentication authentication, @Valid @RequestBody com.shopflow.dto.ChangePasswordRequest request) {
        Long userId = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur non trouve"))
                .getId();
        userService.changePassword(userId, request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.noContent().build();
    }
}
