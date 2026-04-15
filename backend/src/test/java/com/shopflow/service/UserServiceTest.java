package com.shopflow.service;

import com.shopflow.dto.UserDTO;
import com.shopflow.entities.Role;
import com.shopflow.entities.SellerProfile;
import com.shopflow.entities.User;
import com.shopflow.mapper.UserMapper;
import com.shopflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
@DisplayName("UserService — Tests unitaires")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserMapper userMapper;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private User customerUser;
    private User sellerUser;
    private UserDTO customerDto;
    private UserDTO sellerDto;

    @BeforeEach
    void setUp() {
        customerUser = new User();
        customerUser.setId(1L);
        customerUser.setEmail("customer@shopflow.com");
        customerUser.setPrenom("Alice");
        customerUser.setNom("Martin");
        customerUser.setRole(Role.CUSTOMER);
        customerUser.setActif(true);

        sellerUser = new User();
        sellerUser.setId(2L);
        sellerUser.setEmail("seller@shopflow.com");
        sellerUser.setPrenom("Bob");
        sellerUser.setNom("Dupont");
        sellerUser.setRole(Role.SELLER);
        sellerUser.setActif(true);
        sellerUser.setSellerProfile(SellerProfile.builder()
                .id(1L).user(sellerUser)
                .nomBoutique("BoutiqueTest")
                .description("Ma boutique")
                .note(0.0).build());

        customerDto = new UserDTO();
        customerDto.setEmail("customer@shopflow.com");
        customerDto.setPrenom("Alice");
        customerDto.setNom("Martin");
        customerDto.setRole(Role.CUSTOMER);

        sellerDto = new UserDTO();
        sellerDto.setEmail("seller@shopflow.com");
        sellerDto.setPrenom("Bob");
        sellerDto.setNom("Dupont");
        sellerDto.setRole(Role.SELLER);
        sellerDto.setShopName("BoutiqueTest");
    }

    // ── registerUser ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("registerUser — client enregistré avec succès")
    void registerUser_Customer_Success() {
        when(userRepository.findByEmail("customer@shopflow.com")).thenReturn(Optional.empty());
        when(userMapper.toEntity(any(UserDTO.class))).thenReturn(customerUser);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPass");
        when(userRepository.save(any(User.class))).thenReturn(customerUser);
        when(userMapper.toDto(any(User.class))).thenReturn(customerDto);

        UserDTO result = userService.registerUser(customerDto, "password123");

        assertNotNull(result);
        assertEquals("customer@shopflow.com", result.getEmail());
        assertTrue(customerUser.isActif());
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("registerUser — vendeur enregistré avec profil boutique")
    void registerUser_Seller_CreatesBoutiqueProfile() {
        when(userRepository.findByEmail("seller@shopflow.com")).thenReturn(Optional.empty());
        when(userMapper.toEntity(any(UserDTO.class))).thenReturn(sellerUser);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(sellerUser);
        when(userMapper.toDto(any(User.class))).thenReturn(sellerDto);

        UserDTO result = userService.registerUser(sellerDto, "pass");

        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("registerUser — rejet si email déjà utilisé (CONFLICT 409)")
    void registerUser_Fails_WhenEmailAlreadyExists() {
        when(userRepository.findByEmail("customer@shopflow.com"))
                .thenReturn(Optional.of(customerUser));

        assertThrows(ResponseStatusException.class,
                () -> userService.registerUser(customerDto, "pass"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("registerUser — mot de passe encodé avant sauvegarde")
    void registerUser_EncodesPasswordBeforeSaving() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(userMapper.toEntity(any())).thenReturn(customerUser);
        when(passwordEncoder.encode("plainPass")).thenReturn("$bcrypt$...");
        when(userRepository.save(any())).thenReturn(customerUser);
        when(userMapper.toDto(any())).thenReturn(customerDto);

        userService.registerUser(customerDto, "plainPass");

        assertEquals("$bcrypt$...", customerUser.getPassword());
    }

    // ── getUserProfile ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getUserProfile — retourne le profil si utilisateur trouvé")
    void getUserProfile_ReturnsProfile_WhenUserExists() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(customerUser));
        when(userMapper.toDto(customerUser)).thenReturn(customerDto);

        UserDTO result = userService.getUserProfile(1L);

        assertNotNull(result);
        assertEquals("Alice", result.getPrenom());
    }

    @Test
    @DisplayName("getUserProfile — lève 404 si utilisateur introuvable")
    void getUserProfile_Throws404_WhenNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class,
                () -> userService.getUserProfile(999L));
    }

    // ── updateProfile ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateProfile — met à jour le prénom et le nom")
    void updateProfile_UpdatesFirstAndLastName() {
        UserDTO updateDto = new UserDTO();
        updateDto.setPrenom("Alice-Updated");
        updateDto.setNom("Nouveau");

        when(userRepository.findById(1L)).thenReturn(Optional.of(customerUser));
        when(userRepository.save(customerUser)).thenReturn(customerUser);
        when(userMapper.toDto(customerUser)).thenReturn(customerDto);

        userService.updateProfile(1L, updateDto);

        assertEquals("Alice-Updated", customerUser.getPrenom());
        assertEquals("Nouveau", customerUser.getNom());
        verify(userRepository).save(customerUser);
    }

    @Test
    @DisplayName("updateProfile — met à jour le profil boutique du vendeur")
    void updateProfile_UpdatesSellerBoutiqueProfile() {
        UserDTO updateDto = new UserDTO();
        updateDto.setShopName("Nouvelle Boutique");
        updateDto.setShopDescription("Nouvelle description");

        when(userRepository.findById(2L)).thenReturn(Optional.of(sellerUser));
        when(userRepository.save(sellerUser)).thenReturn(sellerUser);
        when(userMapper.toDto(sellerUser)).thenReturn(sellerDto);

        userService.updateProfile(2L, updateDto);

        assertEquals("Nouvelle Boutique", sellerUser.getSellerProfile().getNomBoutique());
        assertEquals("Nouvelle description", sellerUser.getSellerProfile().getDescription());
    }

    @Test
    @DisplayName("updateProfile — champ null ignoré (prénom inchangé)")
    void updateProfile_NullFieldsAreIgnored() {
        UserDTO updateDto = new UserDTO();
        updateDto.setPrenom(null);
        updateDto.setNom("Nouveau");

        when(userRepository.findById(1L)).thenReturn(Optional.of(customerUser));
        when(userRepository.save(customerUser)).thenReturn(customerUser);
        when(userMapper.toDto(customerUser)).thenReturn(customerDto);

        userService.updateProfile(1L, updateDto);

        assertEquals("Alice", customerUser.getPrenom(), "Prénom ne doit pas changer si null");
        assertEquals("Nouveau", customerUser.getNom());
    }

    @Test
    @DisplayName("updateProfile — lève 404 si utilisateur introuvable")
    void updateProfile_Throws404_WhenNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class,
                () -> userService.updateProfile(999L, new UserDTO()));
    }

    // ── toggleUserStatus ──────────────────────────────────────────────────────

    @Test
    @DisplayName("toggleUserStatus — désactive un compte actif")
    void toggleUserStatus_DeactivatesActiveUser() {
        customerUser.setActif(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(customerUser));

        userService.toggleUserStatus(1L);

        assertFalse(customerUser.isActif());
        verify(userRepository).save(customerUser);
    }

    @Test
    @DisplayName("toggleUserStatus — réactive un compte désactivé")
    void toggleUserStatus_ReactivatesInactiveUser() {
        customerUser.setActif(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(customerUser));

        userService.toggleUserStatus(1L);

        assertTrue(customerUser.isActif());
    }

    @Test
    @DisplayName("toggleUserStatus — lève 404 si utilisateur introuvable")
    void toggleUserStatus_Throws404_WhenNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class,
                () -> userService.toggleUserStatus(999L));
    }
}
