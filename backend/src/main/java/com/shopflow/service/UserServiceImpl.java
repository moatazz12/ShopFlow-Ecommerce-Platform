package com.shopflow.service;

import com.shopflow.dto.UserDTO;
import com.shopflow.entities.Role;
import com.shopflow.entities.SellerProfile;
import com.shopflow.entities.User;
import com.shopflow.mapper.UserMapper;
import com.shopflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("null")
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDTO registerUser(UserDTO userDTO, String password) {
        if (userRepository.findByEmail(userDTO.getEmail()).isPresent()) {
            throw new ResponseStatusException(CONFLICT, "Un utilisateur avec cet email existe deja");
        }

        User user = userMapper.toEntity(userDTO);
        user.setPassword(passwordEncoder.encode(password));
        user.setActif(true);
        if (user.getRole() == Role.SELLER) {
            user.setSellerProfile(SellerProfile.builder()
                    .user(user)
                    .nomBoutique(userDTO.getShopName())
                    .description(userDTO.getShopDescription())
                    .logo(userDTO.getShopLogo())
                    .note(0.0)
                    .build());
        }

        User savedUser = userRepository.save(user);
        return userMapper.toDto(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO getUserProfile(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur non trouve"));
        return userMapper.toDto(user);
    }

    @Override
    public UserDTO updateProfile(Long id, UserDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur non trouve"));
        if (dto.getPrenom() != null)
            user.setPrenom(dto.getPrenom());
        if (dto.getNom() != null)
            user.setNom(dto.getNom());
        if (dto.getShopName() != null)
            user.setShopName(dto.getShopName());
        if (dto.getShopDescription() != null)
            user.setShopDescription(dto.getShopDescription());
        if (dto.getShopLogo() != null)
            user.setShopLogo(dto.getShopLogo());

        // Vendeur : mise à jour du profil boutique détaillé
        if (user.getRole() == Role.SELLER && user.getSellerProfile() != null) {
            if (dto.getShopName() != null)
                user.getSellerProfile().setNomBoutique(dto.getShopName());
            if (dto.getShopDescription() != null)
                user.getSellerProfile().setDescription(dto.getShopDescription());
            if (dto.getShopLogo() != null)
                user.getSellerProfile().setLogo(dto.getShopLogo());
        }
        return userMapper.toDto(userRepository.save(user));
    }

    @Override
    public void toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur non trouve"));
        user.setActif(!user.isActif());
        userRepository.save(user);
    }

    @Override
    public void updateUserRole(Long id, com.shopflow.entities.Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur non trouve"));
        
        user.setRole(role);
        
        if (role == com.shopflow.entities.Role.SELLER && user.getSellerProfile() == null) {
            com.shopflow.entities.SellerProfile profile = new com.shopflow.entities.SellerProfile();
            profile.setUser(user);
            profile.setNomBoutique(user.getPrenom() + " Shop");
            user.setSellerProfile(profile);
        }
        
        userRepository.save(user);
    }

    @Override
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur non trouve"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "L'ancien mot de passe est incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
