package com.shopflow.dto;

import com.shopflow.entities.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AuthRegisterRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$",
            message = "Le mot de passe doit contenir au moins 8 caracteres, une majuscule, une minuscule et un chiffre"
    )
    private String password;

    private String prenom;

    private String nom;

    private String shopName;
    private String shopLogo;
    private String shopDescription;

    @NotNull
    private Role role;
}
