package com.shopflow.dto;

import com.shopflow.entities.Role;
import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String email;
    private String prenom;
    private String nom;
    private String shopName;
    private String shopLogo;
    private String shopDescription;
    private Role role;
    private boolean actif;
}
