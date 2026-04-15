package com.shopflow.service;

import com.shopflow.dto.UserDTO;

public interface UserService {
    UserDTO registerUser(UserDTO userDTO, String password);

    UserDTO getUserProfile(Long id);

    UserDTO updateProfile(Long id, UserDTO dto);

    void toggleUserStatus(Long id); // Activation/Désactivation par l'ADMIN [cite: 30]

    void updateUserRole(Long id, com.shopflow.entities.Role role);

    void changePassword(Long userId, String oldPassword, String newPassword);
}